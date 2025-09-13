from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
import os
from dotenv import load_dotenv

from detect import detect_objects_enhanced, detect_faces
from llm import create_sponsor_betting_lines, create_networking_prompt
from db import DatabaseManager

load_dotenv()

app = FastAPI(title="GooseTokens API", version="1.0.0")

# CORS middleware for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database
db = DatabaseManager()

@app.get("/")
async def root():
    return {"message": "GooseTokens API is running!"}

@app.post("/serious-mode")
async def serious_mode(file: UploadFile = File(...)):
    """Detect faces and provide networking quest suggestions"""
    try:
        image_bytes = await file.read()
        
        # Detect faces in the image
        faces_detected = detect_faces(image_bytes)
        
        if not faces_detected:
            return {"message": "No faces detected. Try getting closer to people!", "quests": []}
        
        # Generate networking quest suggestions
        quests = []
        for i, face in enumerate(faces_detected):
            quest_prompt = create_networking_prompt(face)
            quests.append({
                "id": f"quest_{i}",
                "type": "networking",
                "description": quest_prompt,
                "target": f"Person {i+1}",
                "reward": 10
            })
        
        return {
            "faces_detected": len(faces_detected),
            "quests": quests,
            "message": f"Found {len(faces_detected)} people to network with!"
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/fun-mode")
async def fun_mode(file: UploadFile = File(...)):
    """Detect objects and create sponsor-specific betting lines"""
    try:
        image_bytes = await file.read()
        
        # Enhanced object detection with sponsor categorization
        detection_result = detect_objects_enhanced(image_bytes)
        
        if not detection_result.get("objects"):
            return {
                "message": "No objects detected. Try pointing at something interesting!", 
                "betting_lines": [],
                "sponsor_categories": [],
                "total_objects": 0
            }
        
        # Generate sponsor-specific betting lines
        betting_lines = create_sponsor_betting_lines(detection_result)
        
        return {
            "objects_detected": detection_result["objects"],
            "sponsor_categories": detection_result["sponsor_categories"],
            "betting_opportunities": detection_result["betting_opportunities"],
            "betting_lines": betting_lines,
            "total_objects": detection_result["total_objects"],
            "message": f"Found {detection_result['total_objects']} objects with {len(detection_result['sponsor_categories'])} sponsor categories!"
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/complete-quest")
async def complete_quest(quest_id: str, user_id: str = "default_user"):
    """Complete a quest and award GooseTokens"""
    try:
        # Award tokens for completing quest
        tokens_awarded = 10
        new_balance = await db.award_tokens(user_id, tokens_awarded)
        
        # Mark quest as completed
        await db.complete_quest(quest_id, user_id)
        
        return {
            "success": True,
            "tokens_awarded": tokens_awarded,
            "new_balance": new_balance,
            "message": f"Quest completed! You earned {tokens_awarded} GooseTokens!"
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/place-bet")
async def place_bet(bet_data: dict):
    """Place a bet on a betting line with sponsor-specific multipliers"""
    try:
        user_id = bet_data.get("user_id", "default_user")
        betting_line = bet_data.get("betting_line")
        stake = bet_data.get("stake", 5)
        sponsor = bet_data.get("sponsor", "General")
        multiplier = bet_data.get("multiplier", 1.0)
        
        # Check if user has enough tokens
        user_balance = await db.get_user_balance(user_id)
        if user_balance < stake:
            raise HTTPException(status_code=400, detail="Insufficient GooseTokens!")
        
        # Calculate potential winnings
        potential_winnings = int(stake * multiplier)
        
        # Create bet with enhanced data
        bet_id = await db.create_enhanced_bet(
            user_id, 
            betting_line, 
            stake, 
            sponsor, 
            multiplier, 
            potential_winnings
        )
        
        # Deduct tokens
        new_balance = await db.deduct_tokens(user_id, stake)
        
        return {
            "success": True,
            "bet_id": bet_id,
            "new_balance": new_balance,
            "stake": stake,
            "sponsor": sponsor,
            "multiplier": multiplier,
            "potential_winnings": potential_winnings,
            "message": f"Bet placed! You wagered {stake} GooseTokens on: {betting_line} (Sponsored by {sponsor})"
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/resolve-bet")
async def resolve_bet(bet_id: str, won: bool, user_id: str = "default_user"):
    """Resolve a bet and calculate winnings/losses"""
    try:
        # Resolve the bet
        bet_result = await db.resolve_bet(bet_id, won)
        
        if not bet_result:
            raise HTTPException(status_code=404, detail="Bet not found")
        
        # Get updated balance
        new_balance = await db.get_user_balance(user_id)
        
        # Calculate money won/lost
        money_result = {
            "bet_id": bet_id,
            "won": won,
            "stake": bet_result.get("stake", 0),
            "sponsor": bet_result.get("sponsor", "General"),
            "multiplier": bet_result.get("multiplier", 1.0),
            "winnings": bet_result.get("winnings", 0) if won else 0,
            "net_result": bet_result.get("winnings", 0) - bet_result.get("stake", 0) if won else -bet_result.get("stake", 0),
            "new_balance": new_balance
        }
        
        return {
            "success": True,
            "result": money_result,
            "message": f"Bet {'won' if won else 'lost'}! {'+' if won else '-'}{abs(money_result['net_result'])} GooseTokens"
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/user/{user_id}/money-stats")
async def get_money_stats(user_id: str):
    """Get user's money tracking statistics"""
    try:
        stats = await db.get_money_stats(user_id)
        return {
            "user_id": user_id,
            "stats": stats
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/user/{user_id}/balance")
async def get_user_balance(user_id: str):
    """Get user's GooseToken balance"""
    try:
        balance = await db.get_user_balance(user_id)
        return {"user_id": user_id, "balance": balance}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/user/{user_id}/quests")
async def get_user_quests(user_id: str):
    """Get user's active and completed quests"""
    try:
        quests = await db.get_user_quests(user_id)
        return {"user_id": user_id, "quests": quests}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/user/{user_id}/bets")
async def get_user_bets(user_id: str):
    """Get user's active and completed bets"""
    try:
        bets = await db.get_user_bets(user_id)
        return {"user_id": user_id, "bets": bets}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
