import React, { useState, useEffect } from 'react';
import { getMoneyStats } from '../services/api';

const Dashboard = ({ userBalance, userQuests, userBets, onBack, onQuestComplete }) => {
  const [moneyStats, setMoneyStats] = useState(null);
  
  const completedQuests = userQuests.filter(quest => quest.status === 'completed');
  const activeQuests = userQuests.filter(quest => quest.status === 'active');
  const activeBets = userBets.filter(bet => bet.status === 'active');
  const completedBets = userBets.filter(bet => bet.status === 'won' || bet.status === 'lost');

  useEffect(() => {
    loadMoneyStats();
  }, []);

  const loadMoneyStats = async () => {
    try {
      const stats = await getMoneyStats();
      setMoneyStats(stats.stats);
    } catch (error) {
      console.error('Error loading money stats:', error);
    }
  };

  return (
    <div className="h-full flex flex-col bg-white bg-opacity-10 backdrop-blur-lg">
      {/* Header */}
      <div className="p-6 border-b border-white border-opacity-20">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <button
            onClick={onBack}
            className="text-white hover:text-blue-200 transition-colors"
          >
            ← Back to Modes
          </button>
        </div>
        
        {/* Balance Display */}
        <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-lg p-4 text-center">
          <div className="text-3xl font-bold text-gray-800">
            {userBalance} 🦆
          </div>
          <div className="text-sm text-gray-700">GooseGoGeese Tokens</div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Quests Section */}
        <div>
          <h2 className="text-xl font-bold text-white mb-4 flex items-center">
            🎯 Quests
            <span className="ml-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
              {completedQuests.length} completed
            </span>
          </h2>
          
          {activeQuests.length > 0 ? (
            <div className="space-y-3">
              {activeQuests.map((quest, index) => (
                <div key={quest.quest_id || index} className="bg-white bg-opacity-20 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="font-medium text-white mb-1">
                        {quest.description || 'Networking Quest'}
                      </div>
                      <div className="text-sm text-blue-200">
                        Reward: {quest.reward || 10} tokens
                      </div>
                    </div>
                    <button
                      onClick={() => onQuestComplete(quest.quest_id)}
                      className="ml-4 bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
                    >
                      Complete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-blue-200 text-sm">
              No active quests. Use camera detection to find networking opportunities!
            </div>
          )}
        </div>

        {/* Bets Section */}
        <div>
          <h2 className="text-xl font-bold text-white mb-4 flex items-center">
            🎲 Bets
            <span className="ml-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded-full">
              {activeBets.length} active
            </span>
          </h2>
          
          {activeBets.length > 0 ? (
            <div className="space-y-3">
              {activeBets.map((bet, index) => (
                <div key={bet.bet_id || index} className="bg-white bg-opacity-20 rounded-lg p-4">
                  <div className="font-medium text-white mb-1">
                    {bet.betting_line || 'Betting Line'}
                  </div>
                  <div className="text-sm text-blue-200">
                    Stake: {bet.stake || 0} tokens • Status: {bet.status}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-blue-200 text-sm">
              No active bets. Use Fun Mode to create betting lines!
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div>
          <h2 className="text-xl font-bold text-white mb-4">📊 Recent Activity</h2>
          
          <div className="space-y-2">
            {completedQuests.slice(0, 3).map((quest, index) => (
              <div key={index} className="bg-green-500 bg-opacity-20 rounded-lg p-3">
                <div className="text-sm text-green-200">
                  ✓ Completed quest: {quest.description || 'Networking Quest'}
                </div>
                <div className="text-xs text-green-300">
                  +{quest.reward || 10} tokens
                </div>
              </div>
            ))}
            
            {completedBets.slice(0, 3).map((bet, index) => (
              <div key={index} className={`rounded-lg p-3 ${
                bet.status === 'won' 
                  ? 'bg-green-500 bg-opacity-20' 
                  : 'bg-red-500 bg-opacity-20'
              }`}>
                <div className={`text-sm ${
                  bet.status === 'won' ? 'text-green-200' : 'text-red-200'
                }`}>
                  {bet.status === 'won' ? '✓' : '✗'} Bet: {bet.betting_line || 'Betting Line'}
                </div>
                <div className={`text-xs ${
                  bet.status === 'won' ? 'text-green-300' : 'text-red-300'
                }`}>
                  {bet.status === 'won' ? `+${bet.stake * 2}` : `-${bet.stake}`} tokens
                </div>
              </div>
            ))}
            
            {completedQuests.length === 0 && completedBets.length === 0 && (
              <div className="text-blue-200 text-sm text-center py-4">
                No recent activity. Start using the app to see your progress!
              </div>
            )}
          </div>
        </div>

        {/* Money Stats */}
        {moneyStats && (
          <div>
            <h2 className="text-xl font-bold text-white mb-4">💰 Money Tracking</h2>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-green-500 bg-opacity-20 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-200">
                  +{moneyStats.total_won || 0}
                </div>
                <div className="text-sm text-green-300">Total Won</div>
              </div>
              <div className="bg-red-500 bg-opacity-20 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-red-200">
                  -{moneyStats.total_lost || 0}
                </div>
                <div className="text-sm text-red-300">Total Lost</div>
              </div>
            </div>
            <div className="bg-white bg-opacity-20 rounded-lg p-4 text-center mb-4">
              <div className={`text-2xl font-bold ${(moneyStats.net_profit || 0) >= 0 ? 'text-green-200' : 'text-red-200'}`}>
                {moneyStats.net_profit >= 0 ? '+' : ''}{moneyStats.net_profit || 0}
              </div>
              <div className="text-sm text-blue-200">Net Profit</div>
            </div>
            
            {/* Sponsor Breakdown */}
            {moneyStats.sponsor_breakdown && Object.keys(moneyStats.sponsor_breakdown).length > 0 && (
              <div className="mb-4">
                <h3 className="text-lg font-bold text-white mb-2">🏢 Sponsor Performance</h3>
                <div className="space-y-2">
                  {Object.entries(moneyStats.sponsor_breakdown).map(([sponsor, stats]) => (
                    <div key={sponsor} className="bg-white bg-opacity-10 rounded-lg p-3">
                      <div className="flex justify-between items-center">
                        <div className="font-medium text-white">{sponsor}</div>
                        <div className="text-sm text-blue-200">
                          {stats.bets_won}/{stats.bets_placed} wins • 
                          <span className={stats.net_profit >= 0 ? 'text-green-200' : 'text-red-200'}>
                            {stats.net_profit >= 0 ? '+' : ''}{stats.net_profit}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white bg-opacity-20 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-white">
              {completedQuests.length}
            </div>
            <div className="text-sm text-blue-200">Quests Completed</div>
          </div>
          <div className="bg-white bg-opacity-20 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-white">
              {completedBets.filter(bet => bet.status === 'won').length}
            </div>
            <div className="text-sm text-blue-200">Bets Won</div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-6 border-t border-white border-opacity-20">
        <div className="text-center text-blue-200 text-sm">
          🦆 GooseGoGeese • HTN 2025
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
