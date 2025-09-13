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
    <div className="min-h-screen flex items-center justify-center p-8 bg-white">
      <div className="text-center max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-9xl font-bold text-black mb-4 px-8 py-6 bg-slate-200">
            GooseTokens
          </h1>
          <p className="text-xl text-black mb-8">
            Hackathon Networking & Betting Platform
          </p>
          <div className="bg-transparent border-2 border-black p-4 inline-block">
            <div className="text-sm text-black">You have:</div>
            <div className="text-2xl font-bold text-black-300">
              {userBalance} GooseTokens
            </div>
          </div>
        </div>

        {/* Mode Selection */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Serious Mode */}
          <button 
            className="bg-transparent border-4 border-black backdrop-blur-lg rounded-2xl p-8 cursor-pointer hover:bg-opacity-30 transition-all duration-300 transform hover:scale-105"
            onClick={() => handleModeClick('serious')}
          >
            <h2 className="text-3xl font-bold text-black mb-4">Serious Mode 💀</h2>
            <p className="text-black mb-6">
              Network with fellow hackers! Use face detection to find networking opportunities and complete quests to earn GooseTokens.
            </p>
            <div className="text-sm text-black-200">(Click to start networking)</div>
          </button>

          {/* Fun Mode */}
          <button 
            className="bg-transparent border-4 border-black rounded-2xl p-8 cursor-pointer transition-all duration-300 transform hover:scale-105"
            onClick={() => handleModeClick('fun')}
          >
            <h2 className="text-3xl font-bold text-black mb-4">Fun Mode 🤪</h2>
            <p className="text-black mb-6">
              Bet on objects around you! Use object detection to create funny betting lines and wager GooseTokens with friends.
            </p>
            <div className="text-sm text-black-200">(Click to start betting)</div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default TestModeSelector;
