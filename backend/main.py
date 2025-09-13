from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, HTMLResponse
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
            "detections": detection_result.get("detections", []),
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

@app.get("/admin", response_class=HTMLResponse)
async def admin_panel():
    """Admin panel for monitoring the GooseTokens system"""
    html_content = """
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>GooseTokens Admin Panel</title>
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                margin: 0;
                padding: 20px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: #333;
                min-height: 100vh;
            }
            .container {
                max-width: 1200px;
                margin: 0 auto;
                background: white;
                border-radius: 15px;
                box-shadow: 0 20px 40px rgba(0,0,0,0.1);
                overflow: hidden;
            }
            .header {
                background: linear-gradient(135deg, #ff6b6b, #ffa500);
                color: white;
                padding: 30px;
                text-align: center;
            }
            .header h1 {
                margin: 0;
                font-size: 2.5em;
                text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
            }
            .header p {
                margin: 10px 0 0 0;
                font-size: 1.2em;
                opacity: 0.9;
            }
            .content {
                padding: 30px;
            }
            .stats-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                gap: 20px;
                margin-bottom: 30px;
            }
            .stat-card {
                background: #f8f9fa;
                padding: 25px;
                border-radius: 10px;
                text-align: center;
                border-left: 5px solid #ff6b6b;
                transition: transform 0.3s ease;
            }
            .stat-card:hover {
                transform: translateY(-5px);
            }
            .stat-number {
                font-size: 2.5em;
                font-weight: bold;
                color: #ff6b6b;
                margin-bottom: 10px;
            }
            .stat-label {
                color: #666;
                font-size: 1.1em;
            }
            .section {
                margin-bottom: 30px;
            }
            .section h2 {
                color: #333;
                border-bottom: 3px solid #ff6b6b;
                padding-bottom: 10px;
                margin-bottom: 20px;
            }
            .endpoint-list {
                background: #f8f9fa;
                padding: 20px;
                border-radius: 10px;
                border: 1px solid #e9ecef;
            }
            .endpoint {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 15px;
                margin: 10px 0;
                background: white;
                border-radius: 8px;
                border-left: 4px solid #28a745;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .method {
                background: #28a745;
                color: white;
                padding: 5px 12px;
                border-radius: 20px;
                font-weight: bold;
                font-size: 0.9em;
            }
            .method.post {
                background: #007bff;
            }
            .method.get {
                background: #28a745;
            }
            .status-indicator {
                display: inline-block;
                width: 12px;
                height: 12px;
                border-radius: 50%;
                background: #28a745;
                margin-right: 8px;
                animation: pulse 2s infinite;
            }
            @keyframes pulse {
                0% { opacity: 1; }
                50% { opacity: 0.5; }
                100% { opacity: 1; }
            }
            .footer {
                background: #f8f9fa;
                padding: 20px;
                text-align: center;
                color: #666;
                border-top: 1px solid #e9ecef;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🦆 GooseTokens Admin Panel</h1>
                <p>Real-time monitoring and management dashboard</p>
            </div>
            
            <div class="content">
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-number">2</div>
                        <div class="stat-label">Detection Models</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">9</div>
                        <div class="stat-label">API Endpoints</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">2</div>
                        <div class="stat-label">Game Modes</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">100%</div>
                        <div class="stat-label">System Status</div>
                    </div>
                </div>

                <div class="section">
                    <h2><span class="status-indicator"></span>System Status</h2>
                    <div class="endpoint-list">
                        <div style="padding: 15px; background: #d4edda; border-radius: 8px; border-left: 4px solid #28a745;">
                            <strong>✅ Backend Server:</strong> Running on port 8000<br>
                            <strong>✅ Object Detection:</strong> YOLO + MobileNet SSD models loaded<br>
                            <strong>✅ Face Detection:</strong> MediaPipe face recognition active<br>
                            <strong>⚠️ Database:</strong> Using in-memory storage (DynamoDB credentials needed)<br>
                            <strong>⚠️ LLM Services:</strong> Using fallback mode (API keys needed)
                        </div>
                    </div>
                </div>

                <div class="section">
                    <h2>🔗 Available API Endpoints</h2>
                    <div class="endpoint-list">
                        <div class="endpoint">
                            <div>
                                <div class="endpoint-path">GET /</div>
                                <div class="endpoint-desc">API health check and status</div>
                            </div>
                            <span class="method get">GET</span>
                        </div>
                        <div class="endpoint">
                            <div>
                                <div class="endpoint-path">POST /serious-mode</div>
                                <div class="endpoint-desc">Face detection and networking quests</div>
                            </div>
                            <span class="method post">POST</span>
                        </div>
                        <div class="endpoint">
                            <div>
                                <div class="endpoint-path">POST /fun-mode</div>
                                <div class="endpoint-desc">Object detection and betting lines</div>
                            </div>
                            <span class="method post">POST</span>
                        </div>
                        <div class="endpoint">
                            <div>
                                <div class="endpoint-path">POST /complete-quest</div>
                                <div class="endpoint-desc">Complete a quest and earn tokens</div>
                            </div>
                            <span class="method post">POST</span>
                        </div>
                        <div class="endpoint">
                            <div>
                                <div class="endpoint-path">POST /place-bet</div>
                                <div class="endpoint-desc">Place a bet with sponsor multipliers</div>
                            </div>
                            <span class="method post">POST</span>
                        </div>
                        <div class="endpoint">
                            <div>
                                <div class="endpoint-path">POST /resolve-bet</div>
                                <div class="endpoint-desc">Resolve bets and calculate winnings</div>
                            </div>
                            <span class="method post">POST</span>
                        </div>
                        <div class="endpoint">
                            <div>
                                <div class="endpoint-path">GET /user/{user_id}/balance</div>
                                <div class="endpoint-desc">Get user's GooseToken balance</div>
                            </div>
                            <span class="method get">GET</span>
                        </div>
                        <div class="endpoint">
                            <div>
                                <div class="endpoint-path">GET /user/{user_id}/quests</div>
                                <div class="endpoint-desc">Get user's active and completed quests</div>
                            </div>
                            <span class="method get">GET</span>
                        </div>
                        <div class="endpoint">
                            <div>
                                <div class="endpoint-path">GET /user/{user_id}/bets</div>
                                <div class="endpoint-desc">Get user's betting history</div>
                            </div>
                            <span class="method get">GET</span>
                        </div>
                    </div>
                </div>

                <div class="section">
                    <h2>🧪 Quick Test</h2>
                    <div class="endpoint-list">
                        <div style="padding: 15px; background: #e3f2fd; border-radius: 8px; border-left: 4px solid #2196f3;">
                            <strong>Test the API:</strong><br>
                            <code>curl -X POST http://localhost:8000/fun-mode -F "file=@/dev/null"</code><br>
                            <code>curl -X POST http://localhost:8000/serious-mode -F "file=@/dev/null"</code>
                        </div>
                    </div>
                </div>
            </div>

            <div class="footer">
                <p>🦆 GooseTokens Admin Panel | Built with FastAPI | Real-time monitoring dashboard</p>
            </div>
        </div>
    </body>
    </html>
    """
    return HTMLResponse(content=html_content)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
