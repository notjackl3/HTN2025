import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { generateQuestBatch, getPendingQuests, acceptQuest, rejectQuest } from '../services/api';

const QuestBatch = ({ onQuestAccepted, onBatchComplete }) => {
  const [pendingQuests, setPendingQuests] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    loadPendingQuests();
  }, []);

  const loadPendingQuests = async () => {
    try {
      setIsLoading(true);
      const response = await getPendingQuests();
      setPendingQuests(response.quests || []);
    } catch (error) {
      console.error('Error loading pending quests:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateNewBatch = async () => {
    try {
      setIsGenerating(true);
      const response = await generateQuestBatch();
      setPendingQuests(response.quests || []);
    } catch (error) {
      console.error('Error generating quest batch:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAcceptQuest = async (questId) => {
    try {
      const response = await acceptQuest(questId);
      if (response.success) {
        // Remove from pending quests
        setPendingQuests(prev => prev.filter(quest => quest.quest_id !== questId));
        
        // Notify parent component
        if (onQuestAccepted) {
          onQuestAccepted(response.quest);
        }
        
        // Show success message (optional - could add a toast notification here)
        console.log('Quest added to ongoing tasks!');
      }
    } catch (error) {
      console.error('Error accepting quest:', error);
    }
  };

  const handleRejectQuest = async (questId) => {
    try {
      const response = await rejectQuest(questId);
      if (response.success) {
        // Remove from pending quests
        setPendingQuests(prev => prev.filter(quest => quest.quest_id !== questId));
      }
    } catch (error) {
      console.error('Error rejecting quest:', error);
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-500';
      case 'medium': return 'bg-yellow-500';
      case 'hard': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'networking': return '🤝';
      case 'technical': return '💻';
      case 'social': return '👥';
      case 'creative': return '🎨';
      default: return '📋';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-white text-lg">Loading quest batch...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">🎯 Quest Batch</h2>
          <p className="text-slate-300">
            {pendingQuests.length > 0 
              ? `Choose which quests to add to your ongoing tasks (${pendingQuests.length} remaining)`
              : 'No pending quests. Generate a new batch!'
            }
          </p>
        </div>
        
        <button
          onClick={generateNewBatch}
          disabled={isGenerating || pendingQuests.length > 0}
          className={`px-6 py-3 rounded-lg font-medium transition-colors ${
            isGenerating || pendingQuests.length > 0
              ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {isGenerating ? 'Generating...' : 'New Batch'}
        </button>
      </div>

      {/* Quest Cards */}
      {pendingQuests.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pendingQuests.map((quest) => (
            <Card key={quest.quest_id} className="bg-slate-300 border-2 border-slate-400">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">{getTypeIcon(quest.type)}</span>
                    <CardTitle className="text-black text-lg capitalize">
                      {quest.type}
                    </CardTitle>
                  </div>
                  <Badge className={`${getDifficultyColor(quest.difficulty)} text-white`}>
                    {quest.difficulty}
                  </Badge>
                </div>
                <CardDescription className="text-slate-700">
                  Reward: {quest.reward} tokens
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <p className="text-black text-sm leading-relaxed">
                  {quest.description}
                </p>
                
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleAcceptQuest(quest.quest_id)}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    Add to Ongoing
                  </button>
                  <button
                    onClick={() => handleRejectQuest(quest.quest_id)}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    Remove
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="bg-slate-300 border-2 border-slate-400">
          <CardContent className="p-8 text-center">
            <div className="text-6xl mb-4">🎯</div>
            <h3 className="text-xl font-semibold text-black mb-2">Ready for New Challenges?</h3>
            <p className="text-slate-700 mb-6">
              Generate a fresh batch of 5 random quests to choose from!
            </p>
            <button
              onClick={generateNewBatch}
              disabled={isGenerating}
              className={`px-8 py-3 rounded-lg font-medium transition-colors ${
                isGenerating
                  ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {isGenerating ? 'Generating...' : 'Generate Quest Batch'}
            </button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default QuestBatch;
