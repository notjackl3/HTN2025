import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import AdvancedDashboard from './components/AdvancedDashboard';
import CameraView from './components/CameraView';
import ModeSelector from './components/ModeSelector';
import TestModeSelector from './components/TestModeSelector';
// import RoomCollaboration from './components/RoomCollaboration'; // Used in AdvancedDashboard
import MobileRoomPage from './components/MobileRoomPage';
import MobileJoinPage from './components/MobileJoinPage';
import { getUserBalance, getUserQuests, getUserBets, healthCheck } from './services/api';

function App() {
  const [currentMode, setCurrentMode] = useState(null);
  const [userBalance, setUserBalance] = useState(100);
  const [userQuests, setUserQuests] = useState([]);
  const [userBets, setUserBets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [backendStatus, setBackendStatus] = useState('checking');
  const [useAdvancedDashboard] = useState(true);
  const [useTestMode] = useState(true);

  const userId = 'default_user'; // In a real app, this would come from authentication

  useEffect(() => {
    checkBackendAndLoadData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const checkBackendAndLoadData = async () => {
    try {
      await healthCheck();
      setBackendStatus('connected');
      console.log('✅ Backend is connected');
      await loadUserData();
    } catch (error) {
      console.error('❌ Backend connection failed:', error);
      setBackendStatus('disconnected');
      setUserBalance(100);
      setUserQuests([]);
      setUserBets([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadUserData = async () => {
    try {
      console.log('Loading user data...');
      
      // Try to load data, but don't fail if backend is not available
      const [balance, quests, bets] = await Promise.allSettled([
        getUserBalance(userId),
        getUserQuests(userId),
        getUserBets(userId)
      ]);
      
      // Set data with fallbacks if API calls fail
      setUserBalance(balance.status === 'fulfilled' ? (balance.value.balance || 100) : 100);
      setUserQuests(quests.status === 'fulfilled' ? (quests.value.quests || []) : []);
      setUserBets(bets.status === 'fulfilled' ? (bets.value.bets || []) : []);
      
      console.log('User data loaded successfully');
    } catch (error) {
      console.error('Error loading user data:', error);
      // Set fallback values
      setUserBalance(100);
      setUserQuests([]);
      setUserBets([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleModeSelect = (mode) => {
    console.log('Mode selected:', mode);
    setCurrentMode(mode);
  };

  const handleBackToModeSelect = () => {
    setCurrentMode(null);
    loadUserData(); // Refresh data when returning
  };

  const handleQuestComplete = (questId) => {
    // Update local state optimistically
    setUserQuests(prev => 
      prev.map(quest => 
        quest.quest_id === questId 
          ? { ...quest, status: 'completed' }
          : quest
      )
    );
    loadUserData(); // Refresh to get updated balance
  };

  const handleQuestUpdate = (questData) => {
    // Update quests from room collaboration
    setUserQuests(prev => {
      const activeQuests = questData.activeQuests || [];
      const completedQuests = questData.completedQuests || [];
      const pendingQuests = questData.pendingQuests || [];
      
      // Merge all quests, prioritizing active and completed
      const allQuests = [...activeQuests, ...completedQuests, ...pendingQuests];
      return allQuests;
    });
  };

  const handleBetPlaced = (betData) => {
    // Update local state optimistically
    setUserBets(prev => [...prev, betData]);
    loadUserData(); // Refresh to get updated balance
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-800">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">🦆</div>
          <div className="text-white text-2xl font-bold mb-2">Loading GooseTokens...</div>
          <div className="text-blue-200 text-sm">Connecting to backend...</div>
          <div className="mt-4 w-64 bg-white bg-opacity-20 rounded-full h-2">
            <div className="bg-yellow-400 h-2 rounded-full animate-pulse" style={{width: '60%'}}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* Mobile Room Pages */}
        <Route path="/room/:roomId" element={<MobileRoomPage />} />
        <Route path="/join/:roomId" element={<MobileJoinPage />} />
        
        {/* Main App */}
        <Route path="/*" element={
          <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-800 relative">
            {/* Backend Status Indicator */}
            {!currentMode ? (
              useTestMode ? (
                <TestModeSelector 
                  onModeSelect={handleModeSelect}
                  userBalance={userBalance}
                  backendStatus={backendStatus}
                />
              ) : (
                <ModeSelector 
                  onModeSelect={handleModeSelect}
                  userBalance={userBalance}
                  backendStatus={backendStatus}
                />
              )
            ) : (
              <div className="flex h-screen">
                <div className="w-1/3 bg-white bg-opacity-10 backdrop-blur-lg">
                  {useAdvancedDashboard ? (
                    <AdvancedDashboard 
                      onBack={handleBackToModeSelect}
                      onQuestComplete={handleQuestComplete}
                      onQuestUpdate={handleQuestUpdate}
                      userBalance={userBalance}
                      userQuests={userQuests}
                      userBets={userBets}
                    />
                  ) : (
                    <Dashboard 
                      userBalance={userBalance}
                      userQuests={userQuests}
                      userBets={userBets}
                      onBack={handleBackToModeSelect}
                      onQuestComplete={handleQuestComplete}
                    />
                  )}
                </div>
                <div className="w-2/3">
                  <CameraView 
                    mode={currentMode}
                    onQuestComplete={handleQuestComplete}
                    onBetPlaced={handleBetPlaced}
                    backendStatus={backendStatus}
                  />
                </div>
              </div>
            )}
          </div>
        } />
      </Routes>
    </Router>
  );
}

export default App;
