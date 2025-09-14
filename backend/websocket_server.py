import asyncio
import json
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

app = FastAPI()

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Store active connections by room
class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[str, list[WebSocket]] = {}
        self.room_members: dict[str, list[dict]] = {}
        self.room_quests: dict[str, dict] = {}

    async def connect(self, websocket: WebSocket, room_id: str, user_id: str, user_name: str = None):
        await websocket.accept()
        if room_id not in self.active_connections:
            self.active_connections[room_id] = []
            self.room_members[room_id] = []
            self.room_quests[room_id] = {
                "pendingQuests": [],
                "activeQuests": [],
                "completedQuests": []
            }
        
        self.active_connections[room_id].append(websocket)
        
        # Add member to room
        member = {"userId": user_id, "name": user_name or f"User {user_id[-4:]}", "isHost": len(self.room_members[room_id]) == 0}
        self.room_members[room_id].append(member)
        
        print(f"User {user_id} joined room {room_id}")
        
        # Broadcast updated room state
        await self.broadcast_room_update(room_id)

    def disconnect(self, websocket: WebSocket, room_id: str, user_id: str):
        if room_id in self.active_connections:
            self.active_connections[room_id].remove(websocket)
            # Remove member from room
            self.room_members[room_id] = [m for m in self.room_members[room_id] if m["userId"] != user_id]
            
            if not self.active_connections[room_id]:
                del self.active_connections[room_id]
                del self.room_members[room_id]
                del self.room_quests[room_id]
            else:
                # Broadcast updated room state
                asyncio.create_task(self.broadcast_room_update(room_id))
        
        print(f"User {user_id} left room {room_id}")

    async def broadcast_room_update(self, room_id: str):
        if room_id in self.room_members:
            message = {
                "type": "room-updated",
                "members": self.room_members[room_id],
                "pendingQuests": self.room_quests[room_id]["pendingQuests"],
                "activeQuests": self.room_quests[room_id]["activeQuests"],
                "completedQuests": self.room_quests[room_id]["completedQuests"]
            }
            await self.broadcast_to_room(room_id, message)

    async def broadcast_to_room(self, room_id: str, message: dict):
        if room_id in self.active_connections:
            for connection in self.active_connections[room_id]:
                try:
                    await connection.send_text(json.dumps(message))
                except:
                    # Remove broken connections
                    self.active_connections[room_id].remove(connection)

manager = ConnectionManager()

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    room_id = None
    user_id = None
    
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            
            if message["type"] == "join-room":
                room_id = message["roomId"]
                user_id = message["userId"]
                user_name = message.get("userName")
                await manager.connect(websocket, room_id, user_id, user_name)
                
            elif message["type"] == "quest-accepted":
                room_id = message["roomId"]
                quest_id = message["questId"]
                user_id = message["userId"]
                
                # Move quest from pending to active
                if room_id in manager.room_quests:
                    quest = next((q for q in manager.room_quests[room_id]["pendingQuests"] if q["id"] == quest_id), None)
                    if quest:
                        quest["status"] = "active"
                        quest["assignedTo"] = user_id
                        manager.room_quests[room_id]["pendingQuests"].remove(quest)
                        manager.room_quests[room_id]["activeQuests"].append(quest)
                        await manager.broadcast_room_update(room_id)
                
            elif message["type"] == "quest-completed":
                room_id = message["roomId"]
                quest_id = message["questId"]
                user_id = message["userId"]
                
                # Move quest from active to completed
                if room_id in manager.room_quests:
                    quest = next((q for q in manager.room_quests[room_id]["activeQuests"] if q["id"] == quest_id), None)
                    if quest:
                        quest["status"] = "completed"
                        quest["completedBy"] = user_id
                        manager.room_quests[room_id]["activeQuests"].remove(quest)
                        manager.room_quests[room_id]["completedQuests"].append(quest)
                        await manager.broadcast_room_update(room_id)
                
            elif message["type"] == "quest-assigned":
                room_id = message["roomId"]
                quest_id = message["questId"]
                assigned_to = message["assignedTo"]
                
                # Assign quest to specific user
                if room_id in manager.room_quests:
                    quest = next((q for q in manager.room_quests[room_id]["pendingQuests"] if q["id"] == quest_id), None)
                    if quest:
                        quest["assignedTo"] = assigned_to
                        quest["assignedBy"] = user_id
                        await manager.broadcast_room_update(room_id)
                
            elif message["type"] == "quest-generated":
                room_id = message["roomId"]
                quests = message["quests"]
                
                # Add new quests to room
                if room_id in manager.room_quests:
                    manager.room_quests[room_id]["pendingQuests"].extend(quests)
                    await manager.broadcast_room_update(room_id)
                
    except WebSocketDisconnect:
        if room_id and user_id:
            manager.disconnect(websocket, room_id, user_id)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001)
