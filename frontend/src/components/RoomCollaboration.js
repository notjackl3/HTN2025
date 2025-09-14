import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { io } from 'socket.io-client';

const RoomCollaboration = ({ userId, onQuestUpdate }) => {
  const [roomId, setRoomId] = useState(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [isHost, setIsHost] = useState(false);
  const [roomMembers, setRoomMembers] = useState([]);
  const [pendingQuests, setPendingQuests] = useState([]);
  const [activeQuests, setActiveQuests] = useState([]);
  const [completedQuests, setCompletedQuests] = useState([]);
  const [selectedQuests, setSelectedQuests] = useState([]);
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [showJoinForm, setShowJoinForm] = useState(false);

  // Generate room ID and QR code
  const createRoom = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/rooms/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hostId: userId })
      });
      
      const data = await response.json();
      const newRoomId = data.roomId;
      setRoomId(newRoomId);
      setIsHost(true);
      
      // Generate QR code for mobile join page
      const qrDataUrl = await QRCode.toDataURL(
        `${window.location.origin}/join/${newRoomId}`,
        { 
          width: 200,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        }
      );
      setQrCodeDataUrl(qrDataUrl);
      
      // Initialize socket connection
      initializeSocket(newRoomId);
      
    } catch (error) {
      console.error('Error creating room:', error);
    }
  };

  // Join existing room
  const joinRoom = async () => {
    if (!joinCode.trim()) return;
    
    try {
      const response = await fetch(`http://localhost:8000/api/rooms/${joinCode}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      
      if (response.ok) {
        setRoomId(joinCode);
        setIsHost(false);
        initializeSocket(joinCode);
        setShowJoinForm(false);
      } else {
        alert('Invalid room code');
      }
    } catch (error) {
      console.error('Error joining room:', error);
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
      
      // Notify parent component of quest updates
      if (onQuestUpdate) {
        onQuestUpdate({
          pendingQuests: data.pendingQuests || [],
          activeQuests: data.activeQuests || [],
          completedQuests: data.completedQuests || []
        });
      }
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });

    setSocket(newSocket);
  };

  // Mark quest as completed
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

  // Accept quest from pending
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

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Room Collaboration</h3>
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className="text-sm text-gray-600">
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>

      {!roomId ? (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={createRoom}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Room
            </button>
            <button
              onClick={() => setShowJoinForm(!showJoinForm)}
              className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              Join Room
            </button>
          </div>

          {showJoinForm && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter room code"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={joinRoom}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Join
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Room Info */}
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Room Code:</span>
              <span className="font-mono text-lg font-bold text-blue-600">{roomId}</span>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Members:</span>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">{roomMembers.length}</span>
                <div className="flex -space-x-1">
                  {roomMembers.slice(0, 3).map((member, index) => (
                    <div key={index} className="w-6 h-6 bg-blue-500 rounded-full border-2 border-white flex items-center justify-center text-xs text-white font-bold">
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                  ))}
                  {roomMembers.length > 3 && (
                    <div className="w-6 h-6 bg-gray-400 rounded-full border-2 border-white flex items-center justify-center text-xs text-white font-bold">
                      +{roomMembers.length - 3}
                    </div>
                  )}
                </div>
              </div>
            </div>
            {isHost && (
              <div className="text-xs text-green-600 font-medium">
                👑 You are the host
              </div>
            )}
          </div>

          {/* Room sharing options */}
          {isHost && qrCodeDataUrl && (
            <div className="text-center space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-2">Share this QR code to invite others:</p>
                <img src={qrCodeDataUrl} alt="Room QR Code" className="mx-auto border rounded-lg" />
              </div>
              
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">Or share this link:</p>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={`${window.location.origin}/join/${roomId}`}
                    readOnly
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white"
                  />
                  <button
                    onClick={() => navigator.clipboard.writeText(`${window.location.origin}/join/${roomId}`)}
                    className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors"
                  >
                    Copy
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Pending Quests */}
          {pendingQuests.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-md font-semibold text-gray-800">Pending Quests</h4>
                {!isHost && selectedQuests.length > 0 && (
                  <button
                    onClick={assignQuestsToHost}
                    className="bg-purple-600 text-white px-3 py-1 rounded text-sm hover:bg-purple-700 transition-colors"
                  >
                    Assign to Host ({selectedQuests.length})
                  </button>
                )}
              </div>
              <div className="space-y-2">
                {pendingQuests.map((quest) => (
                  <div key={quest.id} className={`border rounded-lg p-3 ${selectedQuests.includes(quest.id) ? 'bg-purple-50 border-purple-300' : 'bg-yellow-50 border-yellow-200'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-800">{quest.description}</p>
                        <p className="text-xs text-gray-600">Reward: {quest.reward} tokens</p>
                        {quest.assignedTo && (
                          <p className="text-xs text-blue-600">Assigned to: {quest.assignedTo === 'host' ? 'Host' : quest.assignedTo}</p>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        {!isHost && !quest.assignedTo && (
                          <button
                            onClick={() => toggleQuestSelection(quest.id)}
                            className={`px-2 py-1 rounded text-xs transition-colors ${
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
                          className="bg-yellow-600 text-white px-3 py-1 rounded text-sm hover:bg-yellow-700 transition-colors"
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
            <div>
              <h4 className="text-md font-semibold text-gray-800 mb-2">Active Quests</h4>
              <div className="space-y-2">
                {activeQuests.map((quest) => (
                  <div key={quest.id} className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-800">{quest.description}</p>
                        <p className="text-xs text-gray-600">Reward: {quest.reward} tokens</p>
                      </div>
                      <button
                        onClick={() => completeQuest(quest.id)}
                        className="ml-2 bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
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
            <div>
              <h4 className="text-md font-semibold text-gray-800 mb-2">Completed Quests</h4>
              <div className="space-y-2">
                {completedQuests.map((quest) => (
                  <div key={quest.id} className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-800 line-through">{quest.description}</p>
                        <p className="text-xs text-gray-600">Reward: {quest.reward} tokens ✓</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Leave Room */}
          <button
            onClick={() => {
              if (socket) socket.disconnect();
              setRoomId(null);
              setRoomMembers([]);
              setPendingQuests([]);
              setActiveQuests([]);
              setCompletedQuests([]);
            }}
            className="w-full bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Leave Room
          </button>
        </div>
      )}
    </div>
  );
};

export default RoomCollaboration;
