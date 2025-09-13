import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';

const SponsorLeaderboard = ({ moneyStats, userBets }) => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [sortBy, setSortBy] = useState('net_profit');
  const [sortOrder, setSortOrder] = useState('desc');

  useEffect(() => {
    if (moneyStats?.sponsor_breakdown) {
      const sponsors = Object.entries(moneyStats.sponsor_breakdown).map(([name, stats]) => ({
        name,
        ...stats,
        winRate: stats.bets_placed > 0 ? Math.round((stats.bets_won / stats.bets_placed) * 100) : 0
      }));

      const sorted = sponsors.sort((a, b) => {
        const aValue = a[sortBy];
        const bValue = b[sortBy];
        
        if (sortOrder === 'desc') {
          return bValue - aValue;
        } else {
          return aValue - bValue;
        }
      });

      setLeaderboard(sorted);
    }
  }, [moneyStats, sortBy, sortOrder]);

  const getSponsorIcon = (sponsor) => {
    const icons = {
      'Tech Giants': '💻',
      'Food Delivery': '🍕',
      'Transportation': '🚗',
      'Sports & Fitness': '⚽',
      'Fashion & Lifestyle': '👗',
      'Home & Office': '🏠',
      'General': '📊'
    };
    return icons[sponsor] || '📊';
  };

  const getSponsorColor = (sponsor) => {
    const colors = {
      'Tech Giants': 'from-blue-500 to-blue-600',
      'Food Delivery': 'from-orange-500 to-orange-600',
      'Transportation': 'from-green-500 to-green-600',
      'Sports & Fitness': 'from-red-500 to-red-600',
      'Fashion & Lifestyle': 'from-purple-500 to-purple-600',
      'Home & Office': 'from-gray-500 to-gray-600',
      'General': 'from-slate-500 to-slate-600'
    };
    return colors[sponsor] || 'from-slate-500 to-slate-600';
  };

  const getRankIcon = (index) => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return `#${index + 1}`;
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const getSortIcon = (field) => {
    if (sortBy !== field) return '↕️';
    return sortOrder === 'desc' ? '↓' : '↑';
  };

  if (!moneyStats?.sponsor_breakdown || Object.keys(moneyStats.sponsor_breakdown).length === 0) {
    return (
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">🏆 Sponsor Leaderboard</CardTitle>
          <CardDescription className="text-slate-400">Performance rankings by sponsor</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-slate-400 text-center py-8">No sponsor data available yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top 3 Podium */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {leaderboard.slice(0, 3).map((sponsor, index) => (
          <Card 
            key={sponsor.name} 
            className={`bg-gradient-to-br ${getSponsorColor(sponsor.name)} border-opacity-30 ${
              index === 0 ? 'ring-2 ring-yellow-400 ring-opacity-50' : ''
            }`}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="text-2xl">{getRankIcon(index)}</div>
                <div className="text-3xl">{getSponsorIcon(sponsor.name)}</div>
              </div>
              <CardTitle className="text-white text-lg">{sponsor.name}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-white/80 text-sm">Profit:</span>
                  <span className={`font-bold ${sponsor.net_profit >= 0 ? 'text-green-200' : 'text-red-200'}`}>
                    {sponsor.net_profit >= 0 ? '+' : ''}{sponsor.net_profit}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/80 text-sm">Win Rate:</span>
                  <span className="text-white font-semibold">{sponsor.winRate}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/80 text-sm">Bets:</span>
                  <span className="text-white font-semibold">{sponsor.bets_placed}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Full Leaderboard Table */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">📊 Complete Rankings</CardTitle>
          <CardDescription className="text-slate-400">Detailed sponsor performance metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-slate-300">Rank</TableHead>
                <TableHead className="text-slate-300">Sponsor</TableHead>
                <TableHead 
                  className="text-slate-300 cursor-pointer hover:text-white"
                  onClick={() => handleSort('bets_placed')}
                >
                  Bets {getSortIcon('bets_placed')}
                </TableHead>
                <TableHead 
                  className="text-slate-300 cursor-pointer hover:text-white"
                  onClick={() => handleSort('winRate')}
                >
                  Win Rate {getSortIcon('winRate')}
                </TableHead>
                <TableHead 
                  className="text-slate-300 cursor-pointer hover:text-white"
                  onClick={() => handleSort('total_wagered')}
                >
                  Wagered {getSortIcon('total_wagered')}
                </TableHead>
                <TableHead 
                  className="text-slate-300 cursor-pointer hover:text-white"
                  onClick={() => handleSort('net_profit')}
                >
                  Net Profit {getSortIcon('net_profit')}
                </TableHead>
                <TableHead className="text-slate-300">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leaderboard.map((sponsor, index) => (
                <TableRow key={sponsor.name} className="hover:bg-slate-700/30">
                  <TableCell className="text-white font-semibold">
                    <div className="flex items-center space-x-2">
                      <span>{getRankIcon(index)}</span>
                      <span className="text-2xl">{getSponsorIcon(sponsor.name)}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-white font-medium">{sponsor.name}</TableCell>
                  <TableCell className="text-slate-300">{sponsor.bets_placed}</TableCell>
                  <TableCell className="text-slate-300">
                    <div className="flex items-center space-x-2">
                      <span>{sponsor.winRate}%</span>
                      <div className="w-16 bg-slate-600 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${sponsor.winRate}%` }}
                        ></div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-slate-300">{sponsor.total_wagered}</TableCell>
                  <TableCell className={sponsor.net_profit >= 0 ? 'text-green-400' : 'text-red-400'}>
                    <span className="font-semibold">
                      {sponsor.net_profit >= 0 ? '+' : ''}{sponsor.net_profit}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={sponsor.net_profit >= 0 ? 'success' : 'destructive'}
                      className={getSponsorColor(sponsor.name)}
                    >
                      {sponsor.net_profit >= 0 ? 'Profitable' : 'Loss'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Performance Insights */}
      <Card className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-blue-500/30">
        <CardHeader>
          <CardTitle className="text-blue-100">💡 Performance Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {leaderboard.length > 0 && (
              <div className="flex items-center justify-between p-3 bg-blue-500/10 rounded-lg">
                <span className="text-blue-200">Best Performing Sponsor:</span>
                <span className="text-white font-semibold">
                  {leaderboard[0].name} (+{leaderboard[0].net_profit})
                </span>
              </div>
            )}
            
            {leaderboard.length > 1 && (
              <div className="flex items-center justify-between p-3 bg-orange-500/10 rounded-lg">
                <span className="text-orange-200">Highest Win Rate:</span>
                <span className="text-white font-semibold">
                  {leaderboard.sort((a, b) => b.winRate - a.winRate)[0].name} ({leaderboard.sort((a, b) => b.winRate - a.winRate)[0].winRate}%)
                </span>
              </div>
            )}

            <div className="flex items-center justify-between p-3 bg-green-500/10 rounded-lg">
              <span className="text-green-200">Total Active Sponsors:</span>
              <span className="text-white font-semibold">{leaderboard.length}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SponsorLeaderboard;
