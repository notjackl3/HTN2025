import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';

const MobileRoomPage = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [userId, setUserId] = useState(null);
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [roomMembers, setRoomMembers] = useState([]);
  const [pendingQuests, setPendingQuests] = useState([]);
  const [activeQuests, setActiveQuests] = useState([]);
  const [completedQuests, setCompletedQuests] = useState([]);

  // Generate or get user ID
  useEffect(() => {
    let storedUserId = localStorage.getItem('mobileUserId');
    if (!storedUserId) {
      storedUserId = 'mobile_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('mobileUserId', storedUserId);
    }
    setUserId(storedUserId);
  }, []);

  // Initialize socket connection
  useEffect(() => {
    if (!roomId || !userId) return;

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

    return () => {
      newSocket.disconnect();
    };
  }, [roomId, userId]);

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

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-800">Quest Room</h1>
            <p className="text-sm text-gray-600">Room: {roomId}</p>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-xs text-gray-600">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>
      </div>

      {/* Room Members */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
        <h2 className="text-lg font-semibold text-gray-800 mb-2">Room Members</h2>
        <div className="flex flex-wrap gap-2">
          {roomMembers.map((member, index) => (
            <div key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
              {member.name || `User ${index + 1}`}
            </div>
          ))}
        </div>
      </div>

      {/* Pending Quests */}
      {pendingQuests.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Pending Quests</h2>
          <div className="space-y-3">
            {pendingQuests.map((quest) => (
              <div key={quest.id} className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800 mb-1">{quest.description}</p>
                    <div className="flex items-center space-x-4 text-xs text-gray-600">
                      <span>Type: {quest.type}</span>
                      <span>Reward: {quest.reward} tokens</span>
                    </div>
                  </div>
                  <button
                    onClick={() => acceptQuest(quest.id)}
                    className="ml-3 bg-yellow-600 text-white px-3 py-1 rounded text-sm hover:bg-yellow-700 transition-colors"
                  >
                    Accept
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Quests */}
      {activeQuests.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Active Quests</h2>
          <div className="space-y-3">
            {activeQuests.map((quest) => (
              <div key={quest.id} className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800 mb-1">{quest.description}</p>
                    <div className="flex items-center space-x-4 text-xs text-gray-600">
                      <span>Type: {quest.type}</span>
                      <span>Reward: {quest.reward} tokens</span>
                    </div>
                  </div>
                  <button
                    onClick={() => completeQuest(quest.id)}
                    className="ml-3 bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
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
        <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Completed Quests</h2>
          <div className="space-y-3">
            {completedQuests.map((quest) => (
              <div key={quest.id} className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800 mb-1 line-through">{quest.description}</p>
                    <div className="flex items-center space-x-4 text-xs text-gray-600">
                      <span>Type: {quest.type}</span>
                      <span className="text-green-600 font-medium">Reward: {quest.reward} tokens ✓</span>
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
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <div className="text-gray-400 text-4xl mb-2">📋</div>
          <p className="text-gray-600">No quests available yet</p>
          <p className="text-sm text-gray-500">The host will generate quests soon!</p>
        </div>
      )}

      {/* Back button */}
      <div className="mt-6">
        <button
          onClick={() => navigate('/')}
          className="w-full bg-gray-600 text-white px-4 py-3 rounded-lg hover:bg-gray-700 transition-colors"
        >
          Back to Main App
        </button>
      </div>
    </div>
  );
};

export default MobileRoomPage;
