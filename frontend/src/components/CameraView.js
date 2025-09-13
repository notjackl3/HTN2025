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
        if (detectionResults?.detections) {
          setTimeout(() => drawBoundingBoxes(), 100);
        }
      };
      
      video.addEventListener('loadedmetadata', handleLoadedMetadata);
      return () => video.removeEventListener('loadedmetadata', handleLoadedMetadata);
    }
  }, [detectionResults]);

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

      // Filter detections with 80%+ confidence
      const highConfidenceDetections = response.detections?.filter(
        detection => detection.confidence >= 0.8
      ) || [];

      if (highConfidenceDetections.length > 0) {
        setBoundingBoxes(highConfidenceDetections);
        setTimeout(() => drawBoundingBoxes(), 50);
      } else {
        // Clear boxes if no high confidence detections
        setBoundingBoxes([]);
        clearBoundingBoxes();
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
    if (!videoRef.current || !boundingBoxes.length) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Clear previous drawings
    context.clearRect(0, 0, canvas.width, canvas.height);

    // Draw bounding boxes
    boundingBoxes.forEach((detection, index) => {
      const { x, y, width, height, label, confidence } = detection;
      
      // Calculate scale factors
      const scaleX = video.videoWidth / video.clientWidth;
      const scaleY = video.videoHeight / video.clientHeight;
      
      const scaledX = x * scaleX;
      const scaledY = y * scaleY;
      const scaledWidth = width * scaleX;
      const scaledHeight = height * scaleY;

      // Draw rectangle with thicker border
      context.strokeStyle = `hsl(${(index * 137.5) % 360}, 80%, 60%)`;
      context.lineWidth = 4;
      context.strokeRect(scaledX, scaledY, scaledWidth, scaledHeight);

      // Draw label background with better contrast
      const labelText = `${label}: ${(confidence * 100).toFixed(0)}%`;
      const textMetrics = context.measureText(labelText);
      const textWidth = textMetrics.width;
      const textHeight = 24;

      // Background with border
      context.fillStyle = `hsl(${(index * 137.5) % 360}, 80%, 20%)`;
      context.fillRect(scaledX, scaledY - textHeight - 2, textWidth + 12, textHeight + 4);
      
      // Border
      context.strokeStyle = `hsl(${(index * 137.5) % 360}, 80%, 60%)`;
      context.lineWidth = 2;
      context.strokeRect(scaledX, scaledY - textHeight - 2, textWidth + 12, textHeight + 4);

      // Draw label text
      context.fillStyle = 'white';
      context.font = 'bold 16px Arial';
      context.fillText(labelText, scaledX + 6, scaledY - 6);
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
      
      // Draw bounding boxes if detections exist
      if (response.detections && response.detections.length > 0) {
        setBoundingBoxes(response.detections);
        setTimeout(() => drawBoundingBoxes(), 100);
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
        
        {/* Minimal Status - Only show when objects are detected */}
        {boundingBoxes.length > 0 && (
          <div className="absolute top-4 right-4 z-20 bg-black bg-opacity-70 rounded-lg p-3">
            <div className="text-white text-sm">
              <div className="font-bold text-green-400">Objects: {boundingBoxes.length}</div>
              <div className="text-xs mt-1">
                {boundingBoxes.map((box, i) => (
                  <div key={i} className="text-green-300">
                    {box.label} ({(box.confidence * 100).toFixed(0)}%)
                  </div>
                ))}
              </div>
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
