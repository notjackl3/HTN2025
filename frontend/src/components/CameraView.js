import React, { useRef, useState, useEffect } from 'react';
import { seriousModeDetection, funModeDetection, completeQuest, placeBet, resolveBet } from '../services/api';

const CameraView = ({ mode, onQuestComplete, onBetPlaced }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectionResults, setDetectionResults] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    startCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        }
      });
      
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      setError('Camera access denied. Please allow camera access to use this feature.');
      console.error('Camera error:', err);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return null;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);

    return new Promise((resolve) => {
      canvas.toBlob(resolve, 'image/jpeg', 0.8);
    });
  };

  const handleDetection = async () => {
    if (isDetecting) return;

    setIsDetecting(true);
    setError(null);

    try {
      const photoBlob = await capturePhoto();
      if (!photoBlob) {
        throw new Error('Failed to capture photo');
      }

      const formData = new FormData();
      formData.append('file', photoBlob, 'photo.jpg');

      let response;
      if (mode === 'serious') {
        response = await seriousModeDetection(formData);
      } else {
        response = await funModeDetection(formData);
      }

      setDetectionResults(response);
    } catch (err) {
      setError(err.message || 'Detection failed. Please try again.');
      console.error('Detection error:', err);
    } finally {
      setIsDetecting(false);
    }
  };

  const handleQuestComplete = async (questId) => {
    try {
      const response = await completeQuest(questId);
      onQuestComplete(questId);
      setDetectionResults(prev => ({
        ...prev,
        message: response.message
      }));
    } catch (err) {
      setError('Failed to complete quest. Please try again.');
    }
  };

  const handleBetPlaced = async (betData) => {
    try {
      const response = await placeBet({
        betting_line: betData.line,
        stake: betData.base_stake,
        sponsor: betData.sponsor,
        multiplier: betData.multiplier
      });
      
      onBetPlaced({
        bet_id: response.bet_id,
        betting_line: betData.line,
        stake: betData.base_stake,
        sponsor: betData.sponsor,
        multiplier: betData.multiplier,
        potential_winnings: response.potential_winnings,
        status: 'active',
        created_at: new Date().toISOString()
      });
      
      setDetectionResults(prev => ({
        ...prev,
        message: response.message
      }));
    } catch (err) {
      setError('Failed to place bet. Please try again.');
    }
  };

  const handleBetResolved = async (betId, won) => {
    try {
      const response = await resolveBet(betId, won);
      setDetectionResults(prev => ({
        ...prev,
        message: response.message
      }));
    } catch (err) {
      setError('Failed to resolve bet. Please try again.');
    }
  };

  return (
    <div className="h-full flex flex-col bg-black">
      {/* Header */}
      <div className="bg-white bg-opacity-10 backdrop-blur-lg p-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => window.history.back()}
            className="text-white hover:text-blue-200 transition-colors"
          >
            ← Back
          </button>
          <h2 className="text-xl font-bold text-white">
            {mode === 'serious' ? '🎯 Serious Mode' : '🎲 Fun Mode'}
          </h2>
        </div>
        <button
          onClick={handleDetection}
          disabled={isDetecting}
          className={`px-6 py-2 rounded-lg font-semibold transition-all ${
            isDetecting
              ? 'bg-gray-500 cursor-not-allowed'
              : 'bg-blue-500 hover:bg-blue-600 text-white'
          }`}
        >
          {isDetecting ? 'Detecting...' : 'Detect & Analyze'}
        </button>
      </div>

      {/* Camera View */}
      <div className="flex-1 relative">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />
        <canvas
          ref={canvasRef}
          className="hidden"
        />
        
        {/* Overlay */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-4 left-4 bg-black bg-opacity-50 rounded-lg p-3">
            <div className="text-white text-sm">
              {mode === 'serious' ? 'Point camera at people to detect networking opportunities' : 'Point camera at objects to create betting lines'}
            </div>
          </div>
        </div>

        {/* Detection Results */}
        {detectionResults && (
          <div className="absolute bottom-0 left-0 right-0 bg-white bg-opacity-95 backdrop-blur-lg p-6 max-h-96 overflow-y-auto">
            <div className="space-y-4">
              <div className="text-lg font-bold text-gray-800">
                {detectionResults.message}
              </div>

              {mode === 'serious' && detectionResults.quests && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-700">Networking Quests:</h3>
                  {detectionResults.quests.map((quest, index) => (
                    <div key={quest.id || index} className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="font-medium text-gray-800 mb-2">
                            Quest: {quest.description}
                          </div>
                          <div className="text-sm text-gray-600">
                            Target: {quest.target} • Reward: {quest.reward} tokens
                          </div>
                        </div>
                        <button
                          onClick={() => handleQuestComplete(quest.id)}
                          className="ml-4 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                        >
                          Complete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {mode === 'fun' && detectionResults.betting_lines && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-700">
                    Detected Objects: {detectionResults.objects_detected?.join(', ')}
                  </h3>
                  {detectionResults.sponsor_categories && detectionResults.sponsor_categories.length > 0 && (
                    <div className="text-sm text-blue-600 mb-2">
                      Sponsor Categories: {detectionResults.sponsor_categories.join(', ')}
                    </div>
                  )}
                  <div className="space-y-2">
                    {detectionResults.betting_lines.map((bet, index) => (
                      <div key={index} className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="font-medium text-gray-800 mb-1">
                              {bet.line}
                            </div>
                            <div className="text-sm text-gray-600 mb-2">
                              Odds: {bet.odds} • Stake: {bet.base_stake} tokens
                            </div>
                            <div className="text-xs text-blue-600 mb-2">
                              Sponsored by: {bet.sponsor} • Multiplier: {bet.multiplier}x
                            </div>
                            <div className="text-xs text-green-600 font-semibold">
                              Potential Win: {bet.max_potential_win} tokens
                            </div>
                          </div>
                          <button
                            onClick={() => handleBetPlaced(bet)}
                            className="ml-4 bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                          >
                            Bet {bet.base_stake} Tokens
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-red-500 text-white p-4 rounded-lg max-w-md text-center">
            {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default CameraView;
