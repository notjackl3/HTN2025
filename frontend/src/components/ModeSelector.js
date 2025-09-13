import React from 'react';

const ModeSelector = ({ onModeSelect, userBalance }) => {
  const handleModeClick = (mode) => {
    console.log('ModeSelector: Mode clicked:', mode);
    console.log('ModeSelector: onModeSelect function:', onModeSelect);
    if (onModeSelect) {
      onModeSelect(mode);
    } else {
      console.error('onModeSelect function is not provided!');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="text-center max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-12 fade-in">
          <h1 className="text-6xl font-bold text-white mb-4">
            🦆 GooseTokens
          </h1>
          <p className="text-xl text-blue-100 mb-8">
            Hackathon Networking & Betting Platform
          </p>
          <div className="bg-white bg-opacity-20 rounded-lg p-4 inline-block">
            <div className="text-2xl font-bold text-yellow-300">
              {userBalance} GooseTokens
            </div>
            <div className="text-sm text-blue-100">Your Balance</div>
          </div>
        </div>

        {/* Mode Selection */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Serious Mode */}
          <div 
            className="bg-white bg-opacity-20 backdrop-blur-lg rounded-2xl p-8 cursor-pointer hover:bg-opacity-30 transition-all duration-300 transform hover:scale-105 slide-in"
            onClick={() => handleModeClick('serious')}
          >
            <div className="text-6xl mb-4">🎯</div>
            <h2 className="text-3xl font-bold text-white mb-4">Serious Mode</h2>
            <p className="text-blue-100 mb-6">
              Network with fellow hackers! Use face detection to find networking opportunities and complete quests to earn GooseTokens.
            </p>
            <div className="space-y-2 text-left">
              <div className="flex items-center text-green-200">
                <span className="mr-2">✓</span>
                <span>Face detection for networking</span>
              </div>
              <div className="flex items-center text-green-200">
                <span className="mr-2">✓</span>
                <span>AI-powered conversation starters</span>
              </div>
              <div className="flex items-center text-green-200">
                <span className="mr-2">✓</span>
                <span>Quest completion rewards</span>
              </div>
            </div>
            <div className="mt-6 bg-green-500 bg-opacity-30 rounded-lg p-3">
              <div className="text-sm text-green-200">Earn 10+ tokens per quest</div>
            </div>
          </div>

          {/* Fun Mode */}
          <div 
            className="bg-white bg-opacity-20 backdrop-blur-lg rounded-2xl p-8 cursor-pointer hover:bg-opacity-30 transition-all duration-300 transform hover:scale-105 slide-in"
            onClick={() => handleModeClick('fun')}
          >
            <div className="text-6xl mb-4">🎲</div>
            <h2 className="text-3xl font-bold text-white mb-4">Fun Mode</h2>
            <p className="text-blue-100 mb-6">
              Bet on objects around you! Use object detection to create funny betting lines and wager GooseTokens with friends.
            </p>
            <div className="space-y-2 text-left">
              <div className="flex items-center text-yellow-200">
                <span className="mr-2">✓</span>
                <span>Object detection & recognition</span>
              </div>
              <div className="flex items-center text-yellow-200">
                <span className="mr-2">✓</span>
                <span>AI-generated betting lines</span>
              </div>
              <div className="flex items-center text-yellow-200">
                <span className="mr-2">✓</span>
                <span>Real-time betting with friends</span>
              </div>
            </div>
            <div className="mt-6 bg-yellow-500 bg-opacity-30 rounded-lg p-3">
              <div className="text-sm text-yellow-200">Win 2x your stake!</div>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-white bg-opacity-10 rounded-lg p-6 max-w-2xl mx-auto">
          <h3 className="text-xl font-bold text-white mb-4">How to Get Started</h3>
          <div className="grid md:grid-cols-2 gap-4 text-left text-blue-100">
            <div>
              <div className="font-semibold mb-2">1. Choose Your Mode</div>
              <div className="text-sm">Select Serious Mode for networking or Fun Mode for betting</div>
            </div>
            <div>
              <div className="font-semibold mb-2">2. Allow Camera Access</div>
              <div className="text-sm">Grant permission to use your camera for detection</div>
            </div>
            <div>
              <div className="font-semibold mb-2">3. Complete Actions</div>
              <div className="text-sm">Follow quests or place bets to earn tokens</div>
            </div>
            <div>
              <div className="font-semibold mb-2">4. Track Progress</div>
              <div className="text-sm">Monitor your balance and achievements</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-blue-200 text-sm">
          Built for HTN 2025 • Powered by OpenCV & AI
        </div>
      </div>
    </div>
  );
};

export default ModeSelector;
