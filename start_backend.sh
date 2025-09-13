#!/bin/bash

# GooseTokens Backend Startup Script

echo "🦆 Starting GooseTokens Backend..."

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.8+ first."
    exit 1
fi

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "📥 Installing dependencies..."
pip install -r requirements.txt

# Check for .env file
if [ ! -f "backend/.env" ]; then
    echo "⚠️  No .env file found. Creating from example..."
    cp backend/env_example.txt backend/.env
    echo "📝 Please edit backend/.env with your API keys before running again."
    echo "   You can run the app without API keys (with limited functionality)."
fi

# Start the server
echo "🚀 Starting FastAPI server..."
cd backend
python main.py
