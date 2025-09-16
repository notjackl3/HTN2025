# 🦆 GooseGoGeese

**A Hackathon Networking & Betting Platform**

GooseGoGeese gamifies hackathon networking through computer vision and AI. Point your camera at people for networking quests or at objects for sponsor-specific betting lines.

## 🎯 What It Does

### 🎯 Serious Mode - AI Networking
- **Face Detection**: Detects people using MediaPipe + OpenCV
- **Smart Quests**: AI generates personalized networking challenges
- **Token Rewards**: Earn GooseGoGeese tokens for completing quests
- **Example**: "Introduce yourself and ask about their project"

### 🎲 Fun Mode - Sponsor Betting
- **Object Detection**: YOLO v8 detects objects in real-time
- **Sponsor Mapping**: Objects mapped to sponsor categories (Tech Giants, Food & Beverage, etc.)
- **AI Betting Lines**: Hilarious hackathon-themed betting opportunities
- **Example**: "Someone will spill coffee on their laptop in the next hour" (Tech Giants, 1.5x multiplier)

### 🏠 Room Collaboration
- **QR Code Sharing**: Create rooms and share via QR codes
- **Real-time Sync**: Live updates across all devices via WebSockets
- **Mobile-Optimized**: Touch-friendly interface for mobile users

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- Node.js 16+
- Camera access

### Installation

1. **Start Backend**
   ```bash
   ./start_backend.sh
   ```
   Runs on `http://localhost:8000`

2. **Start Frontend**
   ```bash
   ./start_frontend.sh
   ```
   Runs on `http://localhost:3000`

3. **Open App**
   - Go to `http://localhost:3000`
   - Allow camera access
   - Choose Serious Mode (networking) or Fun Mode (betting)

### Optional: Enhanced AI
Add to `backend/.env`:
```env
COHERE_API_KEY=your_key_here
GEMINI_API_KEY=your_key_here
```

## 🏗️ Tech Stack

- **Backend**: FastAPI + Python, OpenCV, MediaPipe, YOLO v8
- **Frontend**: React + Tailwind CSS, shadcn/ui
- **AI**: Cohere, Google Gemini
- **Database**: DynamoDB (with in-memory fallback)
- **Real-time**: WebSocket server

## 🎮 How to Use

1. **Open App** → Choose mode
2. **Point Camera** → At people (Serious) or objects (Fun)
3. **Complete Actions** → Follow quests or place bets
4. **Earn Tokens** → Accumulate GooseGoGeese tokens
5. **Track Progress** → Monitor stats in dashboard

## 📱 Mobile Support

- Responsive design for all screen sizes
- QR code scanning for room joining
- Touch-optimized interface
- Native camera access

## 🔧 Key API Endpoints

- `POST /serious-mode` - Face detection & networking quests
- `POST /fun-mode` - Object detection & betting lines
- `POST /complete-quest` - Complete quests for tokens
- `POST /place-bet` - Place bets with sponsor multipliers
- `POST /api/rooms/create` - Create collaboration rooms

## 🛠️ Development

```bash
# Backend
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python main.py

# Frontend
cd frontend
npm install
npm start
```

## 📊 Features

- **Computer Vision**: Face & object detection with confidence scoring
- **AI Content**: Quest generation and betting line creation
- **Token Economy**: Complete financial system with rewards
- **Real-time**: Live collaboration via WebSockets
- **Mobile-First**: Optimized for mobile devices

---

**🦆 GooseGoGeese - Making Hackathon Networking Fun Again!**