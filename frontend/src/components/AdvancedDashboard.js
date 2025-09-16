import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import QuestBatch from './QuestBatch';
import RoomCollaboration from './RoomCollaboration';
import { getUserBalance, getUserQuests, completeQuest } from '../services/api';

const AdvancedDashboard = ({ onBack, onQuestComplete, onQuestUpdate }) => {
  const [userBalance, setUserBalance] = useState(100);
  const [userQuests, setUserQuests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      const [balance, quests] = await Promise.all([
        getUserBalance(),
        getUserQuests()
      ]);
      
      setUserBalance(balance.balance || 100);
      setUserQuests(quests.quests || []);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const completedQuests = userQuests.filter(quest => quest.status === 'completed');
  const activeQuests = userQuests.filter(quest => quest.status === 'active');

  const handleQuestAccepted = (quest) => {
    // Add the accepted quest to the user's quest list
    setUserQuests(prev => [...prev, quest]);
  };

  const handleQuestComplete = async (questId) => {
    try {
      // Call the backend API to complete the quest
      const response = await completeQuest(questId);
      
      if (response.success) {
        // Update local state to mark quest as completed
        setUserQuests(prev => 
          prev.map(quest => 
            quest.quest_id === questId 
              ? { ...quest, status: 'completed' }
              : quest
          )
        );
        
        // Update user balance if provided
        if (response.new_balance) {
          setUserBalance(response.new_balance);
        }
        
        // Notify parent component if needed
        if (onQuestComplete) {
          onQuestComplete(questId);
        }
        
        console.log('Quest completed successfully!');
      }
    } catch (error) {
      console.error('Error completing quest:', error);
    }
  };



  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-white text-xl">Loading advanced dashboard...</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-200">
      <button
        onClick={onBack}
        className="px-4 py-2 bg-slate-500 hover:bg-slate-600 text-white transition-colors"
      >
        ← Back to Modes
      </button>
      {/* Header */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center justify-center mb-6">
          <div>
            <h1 className="text-5xl m-5 font-bold text-black text-center">Command Center</h1>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="overflow-x-auto no-scrollbar flex justify-center space-x-1 bg-transparent border-2 border-slate-400 rounded-lg p-1">
          {['overview', 'quests', 'history'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'bg-white text-black'
                  : 'text-slate-300 hover:text-white hover:bg-slate-400'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-gradient-to-br from-blue-600 to-blue-700 border-blue-500/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-blue-100 text-sm font-medium">Total Balance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-white">{userBalance}</div>
                  <p className="text-blue-200 text-xs">GooseGoGeese Tokens</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-600 to-green-700 border-green-500/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-green-100 text-sm font-medium">Active Quests</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-white">{activeQuests.length}</div>
                  <p className="text-green-200 text-xs">In Progress</p>
                </CardContent>
              </Card>
            </div>

            {/* Task Management */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-slate-300 border-2 border-slate-400">
                <CardHeader>
                  <CardTitle className="text-black">Ongoing Tasks</CardTitle>
                  <CardDescription className="text-slate-700">Active quests in progress</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {/* Active Quests */}
                    {activeQuests.map((quest, index) => (
                      <div key={`quest-${index}`} className="flex items-center justify-between p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="text-lg">🎯</span>
                            <p className="text-blue-900 text-sm font-medium">{quest.description || 'Networking Quest'}</p>
                          </div>
                          <p className="text-blue-800 text-xs">+{quest.reward || 10} tokens</p>
                        </div>
                        <button
                          onClick={() => handleQuestComplete(quest.quest_id)}
                          className="ml-4 bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
                        >
                          Complete
                        </button>
                      </div>
                    ))}
                    
                    {activeQuests.length === 0 && (
                      <p className="text-slate-400 text-sm text-center">No ongoing tasks. Start a quest from the Quest tab!</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-300 border-2 border-slate-400">
                <CardHeader>
                  <CardTitle className="text-black">Completed Tasks</CardTitle>
                  <CardDescription className="text-slate-700">Finished quests</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {/* Completed Quests */}
                    {completedQuests.slice(0, 5).map((quest, index) => (
                      <div key={`completed-quest-${index}`} className="flex items-center justify-between p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="text-lg">🎯</span>
                            <p className="text-green-900 text-sm font-medium">{quest.description || 'Networking Quest'}</p>
                          </div>
                          <p className="text-green-800 text-xs">+{quest.reward || 10} tokens</p>
                        </div>
                        <Badge variant="success">Completed</Badge>
                      </div>
                    ))}
                    
                    {completedQuests.length === 0 && (
                      <p className="text-slate-400 text-sm text-center">No completed tasks yet</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'quests' && (
          <div className="space-y-6">
            <QuestBatch 
              onQuestAccepted={handleQuestAccepted}
            />
            <RoomCollaboration 
              userId="default_user"
              onQuestUpdate={onQuestUpdate}
            />
          </div>
        )}



        {activeTab === 'history' && (
          <div className="space-y-6">
            <Card className="bg-slate-300 border-2 border-slate-400">
              <CardHeader>
                <CardTitle className="text-black">Quest History</CardTitle>
                <CardDescription className="text-slate-700">Complete quest activity log</CardDescription>
              </CardHeader>
              <CardContent>
                {userQuests.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-slate-300">Quest</TableHead>
                        <TableHead className="text-slate-300">Type</TableHead>
                        <TableHead className="text-slate-300">Reward</TableHead>
                        <TableHead className="text-slate-300">Status</TableHead>
                        <TableHead className="text-slate-300">Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {userQuests.map((quest) => (
                        <TableRow key={quest.quest_id}>
                          <TableCell className="text-black text-sm max-w-xs truncate">
                            {quest.description || 'Quest Description'}
                          </TableCell>
                          <TableCell className="text-slate-300 capitalize">{quest.type || 'General'}</TableCell>
                          <TableCell className="text-slate-300">+{quest.reward || 0} tokens</TableCell>
                          <TableCell>
                            <Badge 
                              variant={quest.status === 'completed' ? 'success' : quest.status === 'active' ? 'secondary' : 'outline'}
                            >
                              {quest.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-slate-400 text-sm">
                            {quest.created_at ? new Date(quest.created_at).toLocaleDateString() : 'N/A'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-slate-400 text-center py-8">No quest history available</p>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdvancedDashboard;
