import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import AdvancedDashboard from './components/AdvancedDashboard';
import CameraView from './components/CameraView';
import ModeSelector from './components/ModeSelector';
import TestModeSelector from './components/TestModeSelector';
import { getUserBalance, getUserQuests, getUserBets } from './services/api';

function App() {
  const [currentMode, setCurrentMode] = useState(null);
  const [userBalance, setUserBalance] = useState(100);
  const [userQuests, setUserQuests] = useState([]);
  const [userBets, setUserBets] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [useAdvancedDashboard, setUseAdvancedDashboard] = useState(true);
  const [useTestMode, setUseTestMode] = useState(true);

  const userId = 'default_user'; // In a real app, this would come from authentication

  useEffect(() => {
    loadUserData();
    
    // Fallback timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      if (isLoading) {
        console.log('Loading timeout reached, setting loading to false');
        setIsLoading(false);
      }
    }, 5000); // 5 second timeout
    
    return () => clearTimeout(timeout);
  }, []);

  const loadUserData = async () => {
    try {
      setIsLoading(true);
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

  const handleBetPlaced = (betData) => {
    // Update local state optimistically
    setUserBets(prev => [...prev, betData]);
    loadUserData(); // Refresh to get updated balance
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-xl">Loading GooseTokens...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-800">
      {!currentMode ? (
        useTestMode ? (
          <TestModeSelector 
            onModeSelect={handleModeSelect}
            userBalance={userBalance}
          />
        ) : (
          <ModeSelector 
            onModeSelect={handleModeSelect}
            userBalance={userBalance}
          />
        )
      ) : (
        <div className="flex h-screen">
          <div className="w-1/3 bg-white bg-opacity-10 backdrop-blur-lg">
            {useAdvancedDashboard ? (
              <AdvancedDashboard 
                onBack={handleBackToModeSelect}
                onQuestComplete={handleQuestComplete}
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
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
