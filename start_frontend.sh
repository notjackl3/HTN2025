#!/bin/bash

# GooseTokens Frontend Startup Script

echo "🦆 Starting GooseTokens Frontend..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16+ first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

# Install dependencies
echo "📥 Installing dependencies..."
npm install

# Start the development server
echo "🚀 Starting React development server..."
npm start
