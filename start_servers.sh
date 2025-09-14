#!/bin/bash

# Activate virtual environment
source venv/bin/activate

# Start the main API server
echo "Starting main API server on port 8000..."
cd backend && python main.py &

# Start the WebSocket server
echo "Starting WebSocket server on port 8001..."
cd backend && python websocket_server.py &

# Wait for both processes
wait
