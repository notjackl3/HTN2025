import React, { useRef, useState, useEffect } from 'react';
import { seriousModeDetection, funModeDetection, completeQuest, placeBet, resolveBet } from '../services/api';

const CameraView = ({ mode, onQuestComplete, onBetPlaced }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectionResults, setDetectionResults] = useState(null);
  const [error, setError] = useState(null);
  const [boundingBoxes, setBoundingBoxes] = useState([]);
  const [isRealTimeDetection, setIsRealTimeDetection] = useState(true);
  const [detectionInterval, setDetectionInterval] = useState(null);
  const [showBoundingBoxes, setShowBoundingBoxes] = useState(true);

  useEffect(() => {
    startCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (detectionInterval) {
        clearInterval(detectionInterval);
      }
    };
  }, []);

  // Redraw bounding boxes when video loads or resizes
  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      const handleLoadedMetadata = () => {
        if (detectionResults?.detections && showBoundingBoxes) {
          setTimeout(() => drawBoundingBoxes(), 100);
        }
      };
      
      video.addEventListener('loadedmetadata', handleLoadedMetadata);
      return () => video.removeEventListener('loadedmetadata', handleLoadedMetadata);
    }
  }, [detectionResults, showBoundingBoxes]);

  // Redraw bounding boxes when toggle changes
  useEffect(() => {
    if (showBoundingBoxes && boundingBoxes.length > 0) {
      setTimeout(() => drawBoundingBoxes(), 100);
    } else if (!showBoundingBoxes) {
      clearBoundingBoxes();
    }
  }, [showBoundingBoxes, boundingBoxes]);

  // Real-time detection effect
  useEffect(() => {
    if (isRealTimeDetection && stream) {
      const interval = setInterval(() => {
        performRealTimeDetection();
      }, 500); // Detect every 500ms for smoother real-time experience
      
      setDetectionInterval(interval);
      
      return () => {
        if (interval) {
          clearInterval(interval);
        }
      };
    } else if (detectionInterval) {
      clearInterval(detectionInterval);
      setDetectionInterval(null);
    }
  }, [isRealTimeDetection, stream]);

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
        // Start real-time detection immediately
        setIsRealTimeDetection(true);
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

  const performRealTimeDetection = async () => {
    if (!videoRef.current || isDetecting) return;

    try {
      // Create a canvas to capture video frame
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      
      // Set canvas size to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw current video frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Convert canvas to blob
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.8));
      if (!blob) return;

      const formData = new FormData();
      formData.append('file', blob, 'frame.jpg');

      let response;
      if (mode === 'serious') {
        response = await seriousModeDetection(formData);
      } else {
        response = await funModeDetection(formData);
      }

      // Filter detections with 50%+ confidence for better detection
      const highConfidenceDetections = response.detections?.filter(
        detection => detection.confidence >= 0.5
      ) || [];

      console.log('🔍 Detection results:', {
        totalDetections: response.detections?.length || 0,
        highConfidenceDetections: highConfidenceDetections.length,
        detections: highConfidenceDetections
      });

      if (highConfidenceDetections.length > 0) {
        setBoundingBoxes(highConfidenceDetections);
        if (showBoundingBoxes) {
          setTimeout(() => drawBoundingBoxes(), 50);
        }
      } else {
        // Clear boxes if no high confidence detections
        setBoundingBoxes([]);
        if (showBoundingBoxes) {
          clearBoundingBoxes();
        }
      }
    } catch (err) {
      console.error('Real-time detection error:', err);
    }
  };

  const clearBoundingBoxes = () => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);
  };


  const drawBoundingBoxes = () => {
    if (!videoRef.current || !boundingBoxes.length) {
      console.log('🚫 Cannot draw bounding boxes:', {
        hasVideo: !!videoRef.current,
        boundingBoxesCount: boundingBoxes.length
      });
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    // Set canvas size to match video display size (not video dimensions)
    canvas.width = video.clientWidth;
    canvas.height = video.clientHeight;

    console.log('🎨 Drawing bounding boxes:', {
      videoSize: { width: video.videoWidth, height: video.videoHeight },
      videoClientSize: { width: video.clientWidth, height: video.clientHeight },
      canvasSize: { width: canvas.width, height: canvas.height },
      boundingBoxesCount: boundingBoxes.length,
      boundingBoxes: boundingBoxes
    });

    // Clear previous drawings
    context.clearRect(0, 0, canvas.width, canvas.height);

    // Draw bounding boxes
    boundingBoxes.forEach((detection, index) => {
      const { x, y, width, height, label, confidence } = detection;
      
      console.log(`📦 Drawing box ${index}:`, {
        original: { x, y, width, height },
        label,
        confidence
      });

      // Calculate scale factors from video dimensions to display dimensions
      const scaleX = video.clientWidth / video.videoWidth;
      const scaleY = video.clientHeight / video.videoHeight;
      
      const scaledX = x * scaleX;
      const scaledY = y * scaleY;
      const scaledWidth = width * scaleX;
      const scaledHeight = height * scaleY;

      console.log(`📏 Scaled coordinates:`, {
        scaled: { x: scaledX, y: scaledY, width: scaledWidth, height: scaledHeight },
        scaleFactors: { scaleX, scaleY }
      });

      // Ensure coordinates are within canvas bounds
      const clampedX = Math.max(0, Math.min(scaledX, canvas.width - scaledWidth));
      const clampedY = Math.max(0, Math.min(scaledY, canvas.height - scaledHeight));
      const clampedWidth = Math.min(scaledWidth, canvas.width - clampedX);
      const clampedHeight = Math.min(scaledHeight, canvas.height - clampedY);

      console.log(`🎯 Final coordinates:`, {
        clamped: { x: clampedX, y: clampedY, width: clampedWidth, height: clampedHeight }
      });

      // Generate a more vibrant color
      const hue = (index * 137.5) % 360;
      const color = `hsl(${hue}, 85%, 55%)`;
      const darkColor = `hsl(${hue}, 85%, 25%)`;

      // Draw rectangle with thinner border and shadow
      context.shadowColor = 'rgba(0, 0, 0, 0.6)';
      context.shadowBlur = 3;
      context.shadowOffsetX = 1;
      context.shadowOffsetY = 1;
      
      context.strokeStyle = color;
      context.lineWidth = 3;
      context.strokeRect(clampedX, clampedY, clampedWidth, clampedHeight);

      // Reset shadow
      context.shadowColor = 'transparent';
      context.shadowBlur = 0;
      context.shadowOffsetX = 0;
      context.shadowOffsetY = 0;

      // Draw label background with better contrast
      const labelText = `${label}: ${(confidence * 100).toFixed(0)}%`;
      context.font = 'bold 20px Arial';
      const textMetrics = context.measureText(labelText);
      const textWidth = textMetrics.width;
      const textHeight = 30;

      // Position label above the box, or below if not enough space
      const labelY = clampedY - textHeight - 6 > 0 ? clampedY - 6 : clampedY + clampedHeight + textHeight + 6;
      
      // Background with border
      context.fillStyle = darkColor;
      context.fillRect(clampedX, labelY - textHeight, textWidth + 20, textHeight + 10);
      
      // Border
      context.strokeStyle = color;
      context.lineWidth = 2;
      context.strokeRect(clampedX, labelY - textHeight, textWidth + 20, textHeight + 10);

      // Draw label text
      context.fillStyle = 'white';
      context.font = 'bold 20px Arial';
      context.fillText(labelText, clampedX + 10, labelY - 6);

      console.log(`✅ Drew box ${index} at:`, { x: clampedX, y: clampedY, width: clampedWidth, height: clampedHeight });
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
      
      // Draw bounding boxes if detections exist and toggle is on
      if (response.detections && response.detections.length > 0) {
        setBoundingBoxes(response.detections);
        if (showBoundingBoxes) {
          setTimeout(() => drawBoundingBoxes(), 100);
        }
      }
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
      {/* Camera View - Full Screen */}
      <div className="flex-1 relative h-screen">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          style={{ zIndex: 5 }}
        />
        
        {/* Control Panel */}
        <div className="absolute top-4 left-4 z-20 space-y-2">
          {/* Bounding Box Toggle */}
          <div className="bg-black bg-opacity-70 rounded-lg p-3">
            <div className="flex items-center space-x-3">
              <label className="text-white text-sm font-medium">Show Bounding Boxes:</label>
              <button
                onClick={() => setShowBoundingBoxes(!showBoundingBoxes)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  showBoundingBoxes 
                    ? 'bg-green-500 hover:bg-green-600 text-white' 
                    : 'bg-gray-500 hover:bg-gray-600 text-white'
                }`}
              >
                {showBoundingBoxes ? 'ON' : 'OFF'}
              </button>
            </div>
            <div className="text-xs text-gray-300 mt-1">
              {showBoundingBoxes ? 'Boxes will appear around detected objects' : 'Bounding boxes are hidden'}
            </div>
          </div>

        </div>

        {/* Status Panel - Show detection info */}
        <div className="absolute top-4 right-4 z-20 bg-black bg-opacity-70 rounded-lg p-3">
          <div className="text-white text-sm">
            <div className="font-bold text-green-400">
              Detected: {boundingBoxes.length}
              {!showBoundingBoxes && <span className="text-yellow-400 ml-2">(Hidden)</span>}
            </div>
            <div className="text-xs mt-1 text-gray-300">
              Mode: {mode === 'serious' ? 'People Detection' : 'Object Detection'} • {isRealTimeDetection ? 'Real-time' : 'Manual'}
            </div>
            {boundingBoxes.length > 0 && (
              <div className="text-xs mt-2 max-h-32 overflow-y-auto">
                {boundingBoxes.map((box, i) => (
                  <div key={i} className="text-green-300 flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full`} style={{ backgroundColor: `hsl(${(i * 137.5) % 360}, 85%, 55%)` }}></div>
                    <span>{box.label} ({(box.confidence * 100).toFixed(0)}%)</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>


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
