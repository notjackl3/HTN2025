import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';

const MobileJoinPage = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [userId, setUserId] = useState(null);
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [roomMembers, setRoomMembers] = useState([]);
  const [pendingQuests, setPendingQuests] = useState([]);
  const [activeQuests, setActiveQuests] = useState([]);
  const [completedQuests, setCompletedQuests] = useState([]);
  const [isJoining, setIsJoining] = useState(false);
  const [joinError, setJoinError] = useState('');
  const [selectedQuests, setSelectedQuests] = useState([]);

  // Generate or get user ID
  useEffect(() => {
    let storedUserId = localStorage.getItem('mobileUserId');
    if (!storedUserId) {
      storedUserId = 'mobile_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('mobileUserId', storedUserId);
    }
    setUserId(storedUserId);
  }, []);

  // Join room when component mounts
  useEffect(() => {
    if (roomId && userId && !isJoining) {
      joinRoom();
    }
  }, [roomId, userId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Join room function
  const joinRoom = async () => {
    if (!roomId || !userId) return;
    
    setIsJoining(true);
    setJoinError('');
    
    try {
      const response = await fetch(`http://localhost:8000/api/rooms/${roomId}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      
      if (response.ok) {
        // Initialize socket connection
        initializeSocket(roomId);
      } else {
        setJoinError('Failed to join room. Please check the room code.');
      }
    } catch (error) {
      console.error('Error joining room:', error);
      setJoinError('Network error. Please try again.');
    } finally {
      setIsJoining(false);
    }
  };

  // Initialize socket connection
  const initializeSocket = (roomId) => {
    const newSocket = io('http://localhost:8001');
    
    newSocket.on('connect', () => {
      setIsConnected(true);
      newSocket.emit('join-room', { roomId, userId });
    });

    newSocket.on('room-updated', (data) => {
      setRoomMembers(data.members || []);
      setPendingQuests(data.pendingQuests || []);
      setActiveQuests(data.activeQuests || []);
      setCompletedQuests(data.completedQuests || []);
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });

    setSocket(newSocket);
  };

  // Complete quest
  const completeQuest = async (questId) => {
    if (!socket) return;
    
    try {
      const response = await fetch(`http://localhost:8000/api/user/${userId}/quest/${questId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        socket.emit('quest-completed', { roomId, questId, userId });
      }
    } catch (error) {
      console.error('Error completing quest:', error);
    }
  };

  // Accept quest
  const acceptQuest = async (questId) => {
    if (!socket) return;
    
    try {
      const response = await fetch(`http://localhost:8000/api/user/${userId}/quest/${questId}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        socket.emit('quest-accepted', { roomId, questId, userId });
      }
    } catch (error) {
      console.error('Error accepting quest:', error);
    }
  };

  // Toggle quest selection for assignment
  const toggleQuestSelection = (questId) => {
    setSelectedQuests(prev => 
      prev.includes(questId) 
        ? prev.filter(id => id !== questId)
        : [...prev, questId]
    );
  };

  // Assign selected quests to host
  const assignQuestsToHost = () => {
    if (!socket || selectedQuests.length === 0) return;
    
    selectedQuests.forEach(questId => {
      socket.emit('quest-assigned', { 
        roomId, 
        questId, 
        assignedTo: 'host',
        assignedBy: userId 
      });
    });
    
    setSelectedQuests([]);
  };

  // Cleanup socket on unmount
  useEffect(() => {
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [socket]);

  if (isJoining) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 text-center max-w-sm w-full">
          <div className="text-6xl mb-4 animate-bounce">🦆</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Joining Room...</h1>
          <p className="text-gray-600 mb-4">Room: {roomId}</p>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{width: '60%'}}></div>
          </div>
        </div>
      </div>
    );
  }

  if (joinError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-600 to-pink-700 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 text-center max-w-sm w-full">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Join Failed</h1>
          <p className="text-gray-600 mb-4">{joinError}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-red-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-700 p-4">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-xl p-6 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Quest Room</h1>
            <p className="text-gray-600">Room: {roomId}</p>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm text-gray-600">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>
      </div>

      {/* Room Members */}
      <div className="bg-white rounded-2xl shadow-xl p-6 mb-4">
        <h2 className="text-xl font-bold text-gray-800 mb-3">Room Members</h2>
        <div className="flex flex-wrap gap-2">
          {roomMembers.map((member, index) => (
            <div key={index} className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium">
              {member.name || `User ${index + 1}`}
            </div>
          ))}
        </div>
      </div>

      {/* Pending Quests */}
      {pendingQuests.length > 0 && (
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">Pending Quests</h2>
            {selectedQuests.length > 0 && (
              <button
                onClick={assignQuestsToHost}
                className="bg-purple-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-purple-700 transition-colors"
              >
                Assign to Host ({selectedQuests.length})
              </button>
            )}
          </div>
          <div className="space-y-4">
            {pendingQuests.map((quest) => (
              <div key={quest.id} className={`border-2 rounded-xl p-4 ${selectedQuests.includes(quest.id) ? 'bg-purple-50 border-purple-300' : 'bg-yellow-50 border-yellow-200'}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800 mb-2">{quest.description}</p>
                    <div className="flex items-center space-x-4 text-xs text-gray-600 mb-2">
                      <span className="bg-yellow-200 px-2 py-1 rounded-full">{quest.type}</span>
                      <span className="font-medium">{quest.reward} tokens</span>
                    </div>
                    {quest.assignedTo && (
                      <p className="text-xs text-blue-600 font-medium">Assigned to: {quest.assignedTo === 'host' ? 'Host' : quest.assignedTo}</p>
                    )}
                  </div>
                  <div className="flex flex-col space-y-2">
                    {!quest.assignedTo && (
                      <button
                        onClick={() => toggleQuestSelection(quest.id)}
                        className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                          selectedQuests.includes(quest.id) 
                            ? 'bg-purple-600 text-white' 
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        {selectedQuests.includes(quest.id) ? 'Selected' : 'Select'}
                      </button>
                    )}
                    <button
                      onClick={() => acceptQuest(quest.id)}
                      className="bg-yellow-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-yellow-700 transition-colors"
                    >
                      Accept
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Quests */}
      {activeQuests.length > 0 && (
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-4">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Active Quests</h2>
          <div className="space-y-4">
            {activeQuests.map((quest) => (
              <div key={quest.id} className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800 mb-2">{quest.description}</p>
                    <div className="flex items-center space-x-4 text-xs text-gray-600">
                      <span className="bg-blue-200 px-2 py-1 rounded-full">{quest.type}</span>
                      <span className="font-medium">{quest.reward} tokens</span>
                    </div>
                  </div>
                  <button
                    onClick={() => completeQuest(quest.id)}
                    className="ml-3 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                  >
                    Complete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Completed Quests */}
      {completedQuests.length > 0 && (
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-4">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Completed Quests</h2>
          <div className="space-y-4">
            {completedQuests.map((quest) => (
              <div key={quest.id} className="bg-green-50 border-2 border-green-200 rounded-xl p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800 mb-2 line-through">{quest.description}</p>
                    <div className="flex items-center space-x-4 text-xs text-gray-600">
                      <span className="bg-green-200 px-2 py-1 rounded-full">{quest.type}</span>
                      <span className="font-medium text-green-600">{quest.reward} tokens ✓</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No quests message */}
      {pendingQuests.length === 0 && activeQuests.length === 0 && completedQuests.length === 0 && (
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="text-gray-400 text-6xl mb-4">📋</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">No Quests Yet</h2>
          <p className="text-gray-600">The host will generate quests soon!</p>
        </div>
      )}

      {/* Back button */}
      <div className="mt-6">
        <button
          onClick={() => navigate('/')}
          className="w-full bg-gray-600 text-white px-6 py-4 rounded-2xl font-semibold hover:bg-gray-700 transition-colors"
        >
          Back to Main App
        </button>
      </div>
    </div>
  );
};

export default MobileJoinPage;
