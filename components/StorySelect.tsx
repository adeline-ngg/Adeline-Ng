
import React, { useState } from 'react';
import { UserProfile, Story } from '../types';
import { STORIES } from '../constants';
import ChevronRightIcon from './icons/ChevronRightIcon';
import { hasStoryProgress, deleteStoryProgress, isStoryCompleted, getUserChoiceCount } from '../services/storageService';
import Settings from './Settings';

interface StorySelectProps {
  userProfile: UserProfile;
  onStorySelect: (story: Story, shouldContinue?: boolean, isReplayMode?: boolean) => void;
  onProfileDeleted?: () => void;
  onProfileUpdated?: (profile: UserProfile) => void;
}

const StorySelect: React.FC<StorySelectProps> = ({ userProfile, onStorySelect, onProfileDeleted, onProfileUpdated }) => {
  const [showSettings, setShowSettings] = useState(false);
  const [showRestartConfirm, setShowRestartConfirm] = useState<string | null>(null);

  const handleStoryClick = (story: Story, shouldContinue: boolean, isReplayMode: boolean = false) => {
    onStorySelect(story, shouldContinue, isReplayMode);
  };

  const handleRestart = (storyId: string) => {
    deleteStoryProgress(storyId);
    setShowRestartConfirm(null);
    const story = STORIES.find(s => s.id === storyId);
    if (story) {
      handleStoryClick(story, false);
    }
  };

  const handleProfileDeleted = () => {
    setShowSettings(false);
    if (onProfileDeleted) {
      onProfileDeleted();
    }
  };

  // Calculate progress percentage based on user choice count
  const calculateProgress = (choiceCount: number): number => {
    if (choiceCount <= 3) return Math.round((choiceCount / 3) * 20);
    if (choiceCount <= 10) return Math.round(20 + ((choiceCount - 3) / 7) * 50);
    if (choiceCount <= 14) return Math.round(70 + ((choiceCount - 10) / 4) * 25);
    return 100;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-100 to-orange-200 p-4 sm:p-6 md:p-8">
      <header className="max-w-4xl mx-auto flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-stone-800 font-serif">Welcome, {userProfile.name}!</h1>
          <p className="text-stone-600 mt-1">Choose a story to begin your interactive experience.</p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowSettings(true)}
            className="p-2 hover:bg-white/50 rounded-lg transition-colors"
            title="Settings"
          >
            <svg className="w-8 h-8 text-stone-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
          <img src={userProfile.avatarUrl} alt="User Avatar" className="w-16 h-16 rounded-full border-4 border-white shadow-lg" />
        </div>
      </header>
      
      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {STORIES.map((story) => {
          const hasProgress = hasStoryProgress(story.id);
          const isCompleted = isStoryCompleted(story.id);
          const userChoiceCount = getUserChoiceCount(story.id);
          const progressPercentage = calculateProgress(userChoiceCount);
          const isConfirmingRestart = showRestartConfirm === story.id;

          return (
            <div key={story.id} className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-lg overflow-hidden border border-white/30 flex flex-col group transition-all duration-300 hover:shadow-2xl hover:-translate-y-1">
              <div className="relative">
                <img src={story.coverImage} alt={story.title} className="w-full h-48 object-cover"/>
                {isCompleted && (
                  <div className="absolute top-2 right-2 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                    Completed
                  </div>
                )}
                {hasProgress && !isCompleted && (
                  <div className="absolute top-2 right-2 bg-amber-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                    {progressPercentage}%
                  </div>
                )}
              </div>
              <div className="p-6 flex flex-col flex-grow">
                <h2 className="text-2xl font-bold font-serif text-stone-800">{story.title}</h2>
                <p className="text-stone-600 mt-2 mb-4 flex-grow">{story.description}</p>
                
                {isConfirmingRestart ? (
                  <div className="mt-auto space-y-2">
                    <p className="text-sm text-red-600 font-semibold">Restart and lose progress?</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleRestart(story.id)}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                      >
                        Yes, Restart
                      </button>
                      <button
                        onClick={() => setShowRestartConfirm(null)}
                        className="flex-1 bg-stone-300 hover:bg-stone-400 text-stone-800 font-bold py-2 px-4 rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : isCompleted ? (
                  <div className="mt-auto space-y-2">
                    <button 
                      onClick={() => handleStoryClick(story, false, true)}
                      className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline transition-colors duration-200 flex items-center justify-center gap-2"
                    >
                      Replay Story <ChevronRightIcon />
                    </button>
                  </div>
                ) : hasProgress ? (
                  <div className="mt-auto space-y-2">
                    <button 
                      onClick={() => handleStoryClick(story, true)}
                      className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline transition-colors duration-200 flex items-center justify-center gap-2"
                    >
                      Continue Story <ChevronRightIcon />
                    </button>
                    <button
                      onClick={() => setShowRestartConfirm(story.id)}
                      className="w-full bg-stone-200 hover:bg-stone-300 text-stone-700 font-semibold py-2 px-4 rounded-lg transition-colors text-sm"
                    >
                      Restart from Beginning
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => handleStoryClick(story, false)}
                    className="mt-auto w-full bg-stone-800 hover:bg-stone-700 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline transition-colors duration-200 flex items-center justify-center gap-2 group-hover:bg-amber-600"
                  >
                    Experience This Story <ChevronRightIcon />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {showSettings && (
        <Settings 
          onClose={() => setShowSettings(false)} 
          onProfileDeleted={handleProfileDeleted}
          onProfileUpdated={onProfileUpdated}
        />
      )}
    </div>
  );
};

export default StorySelect;
