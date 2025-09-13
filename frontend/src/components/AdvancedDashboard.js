import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import RealTimeAnalytics from './RealTimeAnalytics';
import SponsorLeaderboard from './SponsorLeaderboard';
import { getMoneyStats, getUserBalance, getUserQuests, getUserBets } from '../services/api';

const AdvancedDashboard = ({ onBack, onQuestComplete }) => {
  const [userBalance, setUserBalance] = useState(100);
  const [moneyStats, setMoneyStats] = useState(null);
  const [userQuests, setUserQuests] = useState([]);
  const [userBets, setUserBets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      const [balance, stats, quests, bets] = await Promise.all([
        getUserBalance(),
        getMoneyStats(),
        getUserQuests(),
        getUserBets()
      ]);
      
      setUserBalance(balance.balance || 100);
      setMoneyStats(stats.stats);
      setUserQuests(quests.quests || []);
      setUserBets(bets.bets || []);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const completedQuests = userQuests.filter(quest => quest.status === 'completed');
  const activeQuests = userQuests.filter(quest => quest.status === 'active');
  const activeBets = userBets.filter(bet => bet.status === 'active');
  const completedBets = userBets.filter(bet => bet.status === 'won' || bet.status === 'lost');
  const wonBets = completedBets.filter(bet => bet.status === 'won');

  const getSponsorColor = (sponsor) => {
    const colors = {
      'Tech Giants': 'bg-blue-500',
      'Food Delivery': 'bg-orange-500',
      'Transportation': 'bg-green-500',
      'Sports & Fitness': 'bg-red-500',
      'Fashion & Lifestyle': 'bg-purple-500',
      'Home & Office': 'bg-gray-500',
      'General': 'bg-slate-500'
    };
    return colors[sponsor] || 'bg-slate-500';
  };

  const getWinRate = () => {
    if (completedBets.length === 0) return 0;
    return Math.round((wonBets.length / completedBets.length) * 100);
  };

  const getTopSponsor = () => {
    if (!moneyStats?.sponsor_breakdown) return null;
    return Object.entries(moneyStats.sponsor_breakdown)
      .sort(([,a], [,b]) => b.net_profit - a.net_profit)[0];
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-white text-xl">Loading advanced dashboard...</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white">GooseTokens Command Center</h1>
            <p className="text-slate-300">Advanced analytics and real-time tracking</p>
          </div>
          <button
            onClick={onBack}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
          >
            ← Back to Modes
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-slate-800/50 rounded-lg p-1">
          {['overview', 'analytics', 'sponsors', 'leaderboard', 'history'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'bg-white text-slate-900'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-gradient-to-br from-blue-600 to-blue-700 border-blue-500/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-blue-100 text-sm font-medium">Total Balance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-white">{userBalance}</div>
                  <p className="text-blue-200 text-xs">GooseTokens</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-600 to-green-700 border-green-500/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-green-100 text-sm font-medium">Net Profit</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-3xl font-bold ${(moneyStats?.net_profit || 0) >= 0 ? 'text-white' : 'text-red-200'}`}>
                    {moneyStats?.net_profit >= 0 ? '+' : ''}{moneyStats?.net_profit || 0}
                  </div>
                  <p className="text-green-200 text-xs">Total P&L</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-600 to-purple-700 border-purple-500/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-purple-100 text-sm font-medium">Win Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-white">{getWinRate()}%</div>
                  <p className="text-purple-200 text-xs">Betting Success</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-orange-600 to-orange-700 border-orange-500/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-orange-100 text-sm font-medium">Active Bets</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-white">{activeBets.length}</div>
                  <p className="text-orange-200 text-xs">In Progress</p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Recent Quests</CardTitle>
                  <CardDescription className="text-slate-400">Latest networking achievements</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {completedQuests.slice(0, 3).map((quest, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                        <div>
                          <p className="text-white text-sm font-medium">{quest.description || 'Networking Quest'}</p>
                          <p className="text-green-400 text-xs">+{quest.reward || 10} tokens</p>
                        </div>
                        <Badge variant="success">Completed</Badge>
                      </div>
                    ))}
                    {completedQuests.length === 0 && (
                      <p className="text-slate-400 text-sm text-center py-4">No completed quests yet</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Recent Bets</CardTitle>
                  <CardDescription className="text-slate-400">Latest betting activity</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {completedBets.slice(0, 3).map((bet, index) => (
                      <div key={index} className={`flex items-center justify-between p-3 rounded-lg border ${
                        bet.status === 'won' 
                          ? 'bg-green-500/10 border-green-500/20' 
                          : 'bg-red-500/10 border-red-500/20'
                      }`}>
                        <div>
                          <p className="text-white text-sm font-medium truncate">{bet.betting_line || 'Betting Line'}</p>
                          <p className={`text-xs ${bet.status === 'won' ? 'text-green-400' : 'text-red-400'}`}>
                            {bet.status === 'won' ? `+${bet.winnings || 0}` : `-${bet.stake || 0}`} tokens
                          </p>
                        </div>
                        <Badge variant={bet.status === 'won' ? 'success' : 'destructive'}>
                          {bet.status === 'won' ? 'Won' : 'Lost'}
                        </Badge>
                      </div>
                    ))}
                    {completedBets.length === 0 && (
                      <p className="text-slate-400 text-sm text-center py-4">No completed bets yet</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <RealTimeAnalytics 
              userBalance={userBalance}
              moneyStats={moneyStats}
              userBets={userBets}
              userQuests={userQuests}
            />
          </div>
        )}

        {activeTab === 'leaderboard' && (
          <div className="space-y-6">
            <SponsorLeaderboard 
              moneyStats={moneyStats}
              userBets={userBets}
            />
          </div>
        )}

        {activeTab === 'sponsors' && (
          <div className="space-y-6">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Sponsor Performance</CardTitle>
                <CardDescription className="text-slate-400">Breakdown by sponsor category</CardDescription>
              </CardHeader>
              <CardContent>
                {moneyStats?.sponsor_breakdown && Object.keys(moneyStats.sponsor_breakdown).length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-slate-300">Sponsor</TableHead>
                        <TableHead className="text-slate-300">Bets</TableHead>
                        <TableHead className="text-slate-300">Win Rate</TableHead>
                        <TableHead className="text-slate-300">Net Profit</TableHead>
                        <TableHead className="text-slate-300">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Object.entries(moneyStats.sponsor_breakdown).map(([sponsor, stats]) => {
                        const winRate = stats.bets_placed > 0 ? Math.round((stats.bets_won / stats.bets_placed) * 100) : 0;
                        return (
                          <TableRow key={sponsor}>
                            <TableCell className="text-white font-medium">{sponsor}</TableCell>
                            <TableCell className="text-slate-300">{stats.bets_placed}</TableCell>
                            <TableCell className="text-slate-300">{winRate}%</TableCell>
                            <TableCell className={stats.net_profit >= 0 ? 'text-green-400' : 'text-red-400'}>
                              {stats.net_profit >= 0 ? '+' : ''}{stats.net_profit}
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant={stats.net_profit >= 0 ? 'success' : 'destructive'}
                                className={getSponsorColor(sponsor)}
                              >
                                {stats.net_profit >= 0 ? 'Profitable' : 'Loss'}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-slate-400 text-center py-8">No sponsor data available yet</p>
                )}
              </CardContent>
            </Card>

            {getTopSponsor() && (
              <Card className="bg-gradient-to-br from-yellow-600 to-orange-600 border-yellow-500/20">
                <CardHeader>
                  <CardTitle className="text-yellow-100">🏆 Top Performing Sponsor</CardTitle>
                  <CardDescription className="text-yellow-200">Your most profitable sponsor category</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-white mb-2">{getTopSponsor()[0]}</div>
                    <div className="text-yellow-200 text-lg">+{getTopSponsor()[1].net_profit} tokens profit</div>
                    <div className="text-yellow-300 text-sm mt-2">
                      {getTopSponsor()[1].bets_won}/{getTopSponsor()[1].bets_placed} wins
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-6">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Betting History</CardTitle>
                <CardDescription className="text-slate-400">Complete betting activity log</CardDescription>
              </CardHeader>
              <CardContent>
                {userBets.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-slate-300">Bet</TableHead>
                        <TableHead className="text-slate-300">Sponsor</TableHead>
                        <TableHead className="text-slate-300">Stake</TableHead>
                        <TableHead className="text-slate-300">Status</TableHead>
                        <TableHead className="text-slate-300">Result</TableHead>
                        <TableHead className="text-slate-300">Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {userBets.map((bet) => (
                        <TableRow key={bet.bet_id}>
                          <TableCell className="text-white text-sm max-w-xs truncate">
                            {bet.betting_line || 'Betting Line'}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={getSponsorColor(bet.sponsor || 'General')}>
                              {bet.sponsor || 'General'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-slate-300">{bet.stake || 0}</TableCell>
                          <TableCell>
                            <Badge 
                              variant={bet.status === 'won' ? 'success' : bet.status === 'lost' ? 'destructive' : 'secondary'}
                            >
                              {bet.status}
                            </Badge>
                          </TableCell>
                          <TableCell className={bet.status === 'won' ? 'text-green-400' : bet.status === 'lost' ? 'text-red-400' : 'text-slate-300'}>
                            {bet.status === 'won' ? `+${bet.winnings || 0}` : bet.status === 'lost' ? `-${bet.stake || 0}` : 'Pending'}
                          </TableCell>
                          <TableCell className="text-slate-400 text-sm">
                            {bet.created_at ? new Date(bet.created_at).toLocaleDateString() : 'N/A'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-slate-400 text-center py-8">No betting history available</p>
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
