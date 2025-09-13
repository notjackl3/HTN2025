import React from 'react';

const TestModeSelector = ({ onModeSelect, userBalance }) => {
  const handleModeClick = (mode) => {
    console.log('TestModeSelector: Mode clicked:', mode);
    if (onModeSelect) {
      onModeSelect(mode);
    } else {
      console.error('onModeSelect function is not provided!');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-800">
      <div className="text-center max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-12">
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
          <button 
            className="bg-white bg-opacity-20 backdrop-blur-lg rounded-2xl p-8 cursor-pointer hover:bg-opacity-30 transition-all duration-300 transform hover:scale-105"
            onClick={() => handleModeClick('serious')}
          >
            <div className="text-6xl mb-4">🎯</div>
            <h2 className="text-3xl font-bold text-white mb-4">Serious Mode</h2>
            <p className="text-blue-100 mb-6">
              Network with fellow hackers! Use face detection to find networking opportunities and complete quests to earn GooseTokens.
            </p>
            <div className="text-sm text-green-200">Click to start networking</div>
          </button>

          {/* Fun Mode */}
          <button 
            className="bg-white bg-opacity-20 backdrop-blur-lg rounded-2xl p-8 cursor-pointer hover:bg-opacity-30 transition-all duration-300 transform hover:scale-105"
            onClick={() => handleModeClick('fun')}
          >
            <div className="text-6xl mb-4">🎲</div>
            <h2 className="text-3xl font-bold text-white mb-4">Fun Mode</h2>
            <p className="text-blue-100 mb-6">
              Bet on objects around you! Use object detection to create funny betting lines and wager GooseTokens with friends.
            </p>
            <div className="text-sm text-yellow-200">Click to start betting</div>
          </button>
        </div>

        {/* Debug Info */}
        <div className="bg-red-500 bg-opacity-20 rounded-lg p-4 max-w-2xl mx-auto">
          <h3 className="text-red-200 font-bold mb-2">Debug Info</h3>
          <div className="text-red-100 text-sm text-left">
            <div>onModeSelect function: {onModeSelect ? '✅ Provided' : '❌ Missing'}</div>
            <div>userBalance: {userBalance}</div>
            <div>Click a mode button above to test</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestModeSelector;
