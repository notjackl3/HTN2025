# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## 🛠️ Development Commands

### Backend

```bash
# Start the backend server
cd backend
python main.py  # Runs on http://localhost:8000

# Install Python dependencies
pip install -r requirements.txt

# Run backend tests (if any)
pytest backend/tests/
```

### Frontend

```bash
# Start the development server
npm start  # Runs on http://localhost:3000

# Run tests
npm test

# Build for production
npm run build
```

### Quick Start Scripts
```bash
# Start backend with virtual environment
./start_backend.sh

# Start frontend with dependencies
./start_frontend.sh
```

## 🏗️ Architecture Overview

### Backend Architecture

The backend is built with FastAPI and follows this structure:
- Computer Vision Pipeline: OpenCV + MediaPipe for face/object detection
- AI Integration: Cohere/Gemini for quest generation and betting lines
- Database: DynamoDB for user data, quests, and bets
- Real-time Analytics: Live updates for dashboard metrics

Key Components:
1. Detection System
   - Face Detection: MediaPipe + OpenCV
   - Object Detection: YOLO + MobileNet SSD
   - Sponsor Category Classification

2. AI Content Generation
   - Quest Generation System
   - Betting Line Generation
   - Conversation Starter Generation

3. Financial System
   - Token Management
   - Betting Mechanics
   - Reward Distribution

### Frontend Architecture

React-based frontend with modern patterns:
- Component Library: shadcn/ui with Radix UI primitives
- Styling: Tailwind CSS
- Real-time Updates: WebSocket/polling for live data
- Camera Integration: WebRTC for external webcam support

Key Features:
1. Dual Mode Interface
   - Serious Mode (Networking)
   - Fun Mode (Betting)

2. Advanced Dashboard
   - Real-time Analytics
   - Leaderboards
   - Financial Tracking
   - Quest Progress
   - Activity Feed

### Data Flow
1. Camera Feed → Computer Vision Pipeline
2. Detection Results → AI Processing
3. Generated Content → User Interface
4. User Actions → Financial System
5. Analytics → Dashboard Updates

## Database Schema

Three main tables in DynamoDB:

1. Users Table
```json
{
  "user_id": "string",
  "balance": "number",
  "created_at": "string",
  "total_quests_completed": "number",
  "total_bets_placed": "number"
}
```

2. Quests Table
```json
{
  "quest_id": "string",
  "user_id": "string",
  "description": "string",
  "reward": "number",
  "status": "string",
  "completed_at": "string"
}
```

3. Bets Table
```json
{
  "bet_id": "string",
  "user_id": "string",
  "betting_line": "string",
  "stake": "number",
  "status": "string",
  "created_at": "string",
  "resolved_at": "string"
}
```