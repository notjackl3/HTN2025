import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';

const RealTimeAnalytics = ({ userBalance, moneyStats, userBets, userQuests }) => {
  const [liveStats, setLiveStats] = useState({
    totalBets: 0,
    activeBets: 0,
    completedQuests: 0,
    winRate: 0,
    netProfit: 0,
    topSponsor: null,
    recentActivity: []
  });

  const [isLive, setIsLive] = useState(true);

  useEffect(() => {
    if (!isLive) return;

    const updateLiveStats = () => {
      const activeBets = userBets.filter(bet => bet.status === 'active');
      const completedBets = userBets.filter(bet => bet.status === 'won' || bet.status === 'lost');
      const wonBets = completedBets.filter(bet => bet.status === 'won');
      const completedQuests = userQuests.filter(quest => quest.status === 'completed');
      
      const winRate = completedBets.length > 0 ? Math.round((wonBets.length / completedBets.length) * 100) : 0;
      
      // Get top sponsor
      let topSponsor = null;
      if (moneyStats?.sponsor_breakdown) {
        const sponsors = Object.entries(moneyStats.sponsor_breakdown);
        if (sponsors.length > 0) {
          topSponsor = sponsors.sort(([,a], [,b]) => b.net_profit - a.net_profit)[0];
        }
      }

      // Generate recent activity
      const recentActivity = [
        ...completedBets.slice(0, 2).map(bet => ({
          type: 'bet',
          action: bet.status === 'won' ? 'won' : 'lost',
          amount: bet.status === 'won' ? bet.winnings : -bet.stake,
          description: bet.betting_line?.substring(0, 30) + '...',
          timestamp: new Date()
        })),
        ...completedQuests.slice(0, 2).map(quest => ({
          type: 'quest',
          action: 'completed',
          amount: quest.reward || 10,
          description: quest.description?.substring(0, 30) + '...',
          timestamp: new Date()
        }))
      ].sort((a, b) => b.timestamp - a.timestamp).slice(0, 5);

      setLiveStats({
        totalBets: userBets.length,
        activeBets: activeBets.length,
        completedQuests: completedQuests.length,
        winRate,
        netProfit: moneyStats?.net_profit || 0,
        topSponsor,
        recentActivity
      });
    };

    updateLiveStats();
    const interval = setInterval(updateLiveStats, 2000); // Update every 2 seconds

    return () => clearInterval(interval);
  }, [userBalance, moneyStats, userBets, userQuests, isLive]);

  const getActivityIcon = (type, action) => {
    if (type === 'bet') {
      return action === 'won' ? '🎉' : '😞';
    }
    return '✅';
  };

  const getActivityColor = (type, action) => {
    if (type === 'bet') {
      return action === 'won' ? 'text-green-400' : 'text-red-400';
    }
    return 'text-blue-400';
  };

  return (
    <div className="space-y-4">
      {/* Live Status Indicator */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${isLive ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`}></div>
          <span className="text-sm text-slate-300">
            {isLive ? 'Live Analytics' : 'Paused'}
          </span>
        </div>
        <button
          onClick={() => setIsLive(!isLive)}
          className="text-xs px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded text-slate-300"
        >
          {isLive ? 'Pause' : 'Resume'}
        </button>
      </div>

      {/* Live Metrics Grid */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-xs">Active Bets</p>
                <p className="text-2xl font-bold text-white">{liveStats.activeBets}</p>
              </div>
              <div className="text-2xl">🎲</div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-xs">Win Rate</p>
                <p className="text-2xl font-bold text-white">{liveStats.winRate}%</p>
              </div>
              <div className="text-2xl">📊</div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-xs">Quests Done</p>
                <p className="text-2xl font-bold text-white">{liveStats.completedQuests}</p>
              </div>
              <div className="text-2xl">🎯</div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-xs">Net Profit</p>
                <p className={`text-2xl font-bold ${liveStats.netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {liveStats.netProfit >= 0 ? '+' : ''}{liveStats.netProfit}
                </p>
              </div>
              <div className="text-2xl">💰</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Sponsor Performance */}
      {liveStats.topSponsor && (
        <Card className="bg-gradient-to-r from-yellow-600/20 to-orange-600/20 border-yellow-500/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-yellow-100 text-sm">🏆 Top Sponsor</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-semibold">{liveStats.topSponsor[0]}</p>
                <p className="text-yellow-200 text-sm">
                  +{liveStats.topSponsor[1].net_profit} profit
                </p>
              </div>
              <div className="text-right">
                <p className="text-yellow-300 text-sm">
                  {liveStats.topSponsor[1].bets_won}/{liveStats.topSponsor[1].bets_placed} wins
                </p>
                <div className="w-20 bg-yellow-500/20 rounded-full h-2 mt-1">
                  <div 
                    className="bg-yellow-500 h-2 rounded-full transition-all duration-500"
                    style={{ 
                      width: `${liveStats.topSponsor[1].bets_placed > 0 
                        ? (liveStats.topSponsor[1].bets_won / liveStats.topSponsor[1].bets_placed) * 100 
                        : 0}%` 
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Live Activity Feed */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-white text-sm">⚡ Live Activity</CardTitle>
          <CardDescription className="text-slate-400 text-xs">Real-time updates</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {liveStats.recentActivity.length > 0 ? (
              liveStats.recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center space-x-3 p-2 bg-slate-700/30 rounded-lg">
                  <div className="text-lg">{getActivityIcon(activity.type, activity.action)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm truncate">{activity.description}</p>
                    <p className="text-slate-400 text-xs">
                      {activity.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                  <div className={`text-sm font-semibold ${getActivityColor(activity.type, activity.action)}`}>
                    {activity.amount >= 0 ? '+' : ''}{activity.amount}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-slate-400 text-sm text-center py-4">No recent activity</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Performance Trends */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-white text-sm">📈 Performance Trends</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-300">Betting Success</span>
                <span className="text-white">{liveStats.winRate}%</span>
              </div>
              <Progress value={liveStats.winRate} className="h-2" />
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-300">Quest Completion</span>
                <span className="text-white">
                  {userQuests.length > 0 ? Math.round((liveStats.completedQuests / userQuests.length) * 100) : 0}%
                </span>
              </div>
              <Progress 
                value={userQuests.length > 0 ? (liveStats.completedQuests / userQuests.length) * 100 : 0} 
                className="h-2" 
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RealTimeAnalytics;
