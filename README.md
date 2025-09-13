# 🦆 GooseTokens - Advanced Hackathon Platform

A sophisticated mobile/web application that combines computer vision, AI, and real-time analytics to revolutionize hackathon networking and create engaging betting experiences with sponsor integration.

## 🚀 Advanced Features

### 🎯 Serious Mode - Enhanced Networking
- **External Webcam Integration**: Optimized for shirt-clip webcam setup
- **Advanced Face Detection**: MediaPipe + OpenCV for superior accuracy
- **AI-Powered Quest Generation**: Gemini/Cohere integration for personalized suggestions
- **Real-time Quest Tracking**: Live progress monitoring and completion rewards
- **Smart Conversation Starters**: Context-aware networking prompts

### 🎲 Fun Mode - Sponsor-Integrated Betting
- **Enhanced Object Detection**: YOLO + MobileNet SSD with sponsor categorization
- **6 Sponsor Categories**: Tech Giants, Food Delivery, Transportation, Sports & Fitness, Fashion & Lifestyle, Home & Office
- **Dynamic Multipliers**: Sponsor-specific betting odds (1.1x to 2.2x)
- **AI-Generated Betting Lines**: Gemini-powered creative content with sponsor branding
- **Real-time Money Tracking**: Comprehensive financial analytics and performance metrics

### 📊 Advanced Dashboard (Federato-Style)
- **Real-time Analytics**: Live updates every 2 seconds with performance trends
- **Sponsor Leaderboards**: Interactive rankings with detailed performance metrics
- **Financial Tracking**: Complete P&L analysis with sponsor breakdown
- **Quest Progress**: Visual progress tracking and achievement system
- **Live Activity Feed**: Real-time updates of all user actions
- **Performance Insights**: AI-powered recommendations and trend analysis

## 🛠️ Tech Stack

### Backend
- **FastAPI**: Python web framework for API endpoints
- **OpenCV**: Computer vision for object detection
- **MediaPipe**: Face detection and analysis
- **Cohere/OpenAI**: LLM integration for quest suggestions and betting lines
- **DynamoDB**: Database for users, quests, and bets
- **Boto3**: AWS SDK for database operations

### Frontend
- **React 18**: Modern UI framework with hooks and context
- **shadcn/ui**: Professional component library with Radix UI primitives
- **Tailwind CSS**: Utility-first CSS with custom design system
- **Real-time Updates**: Live data synchronization and analytics
- **WebRTC**: Advanced camera integration for external webcam support

## 📦 Installation

### Prerequisites
- Python 3.8+
- Node.js 16+
- AWS Account (for DynamoDB) or use local DynamoDB
- Cohere API key (optional, has fallbacks)

### Backend Setup

1. **Install Python dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

2. **Set up environment variables**:
   ```bash
   cp backend/env_example.txt backend/.env
   # Edit backend/.env with your API keys
   ```

3. **Download OpenCV model files** (optional, has fallbacks):
   ```bash
   cd backend
   wget https://github.com/opencv/opencv/raw/master/samples/dnn/face_detector/opencv_face_detector_uint8.pb
   wget https://github.com/opencv/opencv/raw/master/samples/dnn/face_detector/opencv_face_detector.pbtxt
   ```

4. **Start the backend server**:
   ```bash
   cd backend
   python main.py
   ```
   Server will run on `http://localhost:8000`

### Frontend Setup

1. **Install Node.js dependencies**:
   ```bash
   npm install
   ```

2. **Start the React development server**:
   ```bash
   npm start
   ```
   App will run on `http://localhost:3000`

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the backend directory:

```env
# Cohere API Key for LLM features
COHERE_API_KEY=your_cohere_api_key_here

# AWS Credentials for DynamoDB
AWS_ACCESS_KEY_ID=your_aws_access_key_here
AWS_SECRET_ACCESS_KEY=your_aws_secret_key_here
AWS_REGION=us-east-1

# Optional: OpenAI API Key (alternative to Cohere)
OPENAI_API_KEY=your_openai_api_key_here
```

### API Keys Setup

1. **Cohere API** (recommended):
   - Sign up at [cohere.ai](https://cohere.ai)
   - Get your API key from the dashboard
   - Add to `.env` file

2. **OpenAI API** (alternative):
   - Sign up at [openai.com](https://openai.com)
   - Get your API key from the dashboard
   - Add to `.env` file

3. **AWS DynamoDB** (optional):
   - Set up AWS account
   - Create DynamoDB tables (or use local DynamoDB)
   - Add credentials to `.env` file

## 🎮 Usage

### Getting Started

1. **Open the app** in your browser at `http://localhost:3000`
2. **Allow camera access** when prompted
3. **Choose your mode**:
   - **Serious Mode**: For networking and professional connections
   - **Fun Mode**: For betting and social gaming

### Serious Mode - Networking

1. Point your camera at people around you
2. Click "Detect & Analyze" to find networking opportunities
3. Complete the suggested quests to earn GooseTokens
4. Track your progress in the dashboard

### Fun Mode - Betting

1. Point your camera at interesting objects
2. Click "Detect & Analyze" to generate betting lines
3. Place bets with your GooseTokens
4. Win 2x your stake when you're right!

## 📊 Database Schema

### Users Table
```json
{
  "user_id": "string",
  "balance": "number",
  "created_at": "string",
  "total_quests_completed": "number",
  "total_bets_placed": "number"
}
```

### Quests Table
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

### Bets Table
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

## 🔌 API Endpoints

### Detection Endpoints
- `POST /serious-mode` - Detect faces and generate networking quests
- `POST /fun-mode` - Detect objects and create betting lines

### Quest Management
- `POST /complete-quest` - Complete a quest and award tokens
- `GET /user/{user_id}/quests` - Get user's quests

### Betting Management
- `POST /place-bet` - Place a bet on a betting line
- `GET /user/{user_id}/bets` - Get user's bets

### User Data
- `GET /user/{user_id}/balance` - Get user's token balance

## 🚀 Deployment

### Backend Deployment
1. Deploy to AWS Lambda, Google Cloud Functions, or Heroku
2. Set up DynamoDB tables in your AWS account
3. Configure environment variables

### Frontend Deployment
1. Build the React app: `npm run build`
2. Deploy to Vercel, Netlify, or AWS S3
3. Update API URL in environment variables

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🎯 Future Enhancements

- **Real-time multiplayer**: WebSocket integration for live betting
- **Advanced AI**: More sophisticated quest generation
- **Mobile app**: React Native version
- **Hardware integration**: Raspberry Pi, QNX, Groq integration
- **Blockchain**: Real cryptocurrency integration
- **Analytics**: User behavior tracking and insights

## 🐛 Troubleshooting

### Common Issues

1. **Camera not working**: Ensure you're using HTTPS or localhost
2. **Detection failing**: Check if OpenCV model files are downloaded
3. **API errors**: Verify your API keys are correct
4. **Database errors**: Check AWS credentials and table permissions

### Getting Help

- Check the console for error messages
- Verify all dependencies are installed
- Ensure all environment variables are set
- Check network connectivity

## 🏆 Hackathon Notes

This project was built for HTN 2025 with the following goals:
- **Innovation**: Novel use of computer vision for social interaction
- **Technical Excellence**: Clean architecture and modern tech stack
- **User Experience**: Intuitive interface and engaging gameplay
- **Scalability**: Designed to handle multiple users and real-time interactions

Built with ❤️ for the hackathon community!