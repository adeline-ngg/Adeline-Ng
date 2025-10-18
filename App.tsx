import React, { useState, useEffect } from 'react';
import { GameStage, UserProfile, Story } from './types';
import ProfileSetup from './components/ProfileSetup';
import StorySelect from './components/StorySelect';
import StoryPlayer from './components/StoryPlayer';
import { loadProfile, hasProfile } from './services/storageService';
import { initializeMemory } from './services/memoryService';

const App: React.FC = () => {
  const [gameStage, setGameStage] = useState<GameStage>(GameStage.PROFILE_SETUP);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [shouldContinueStory, setShouldContinueStory] = useState(false);
  const [isReplayMode, setIsReplayMode] = useState(false);

  // Check for saved profile on mount
  useEffect(() => {
    // Initialize Mem0 (optional, will gracefully degrade if not configured)
    initializeMemory().catch(console.error);

    // Load existing profile if available
    if (hasProfile()) {
      const profile = loadProfile();
      if (profile) {
        setUserProfile(profile);
        setGameStage(GameStage.STORY_SELECT);
      }
    }
  }, []);

  const handleProfileCreate = (profile: UserProfile) => {
    setUserProfile(profile);
    setGameStage(GameStage.STORY_SELECT);
  };

  const handleStorySelect = (story: Story, shouldContinue: boolean = false, isReplayMode: boolean = false) => {
    setSelectedStory(story);
    setShouldContinueStory(shouldContinue);
    setIsReplayMode(isReplayMode);
    setGameStage(GameStage.STORY_PLAYER);
  };

  const handleExitStory = () => {
    setSelectedStory(null);
    setShouldContinueStory(false);
    setIsReplayMode(false);
    setGameStage(GameStage.STORY_SELECT);
  };

  const handleProfileDeleted = () => {
    setUserProfile(null);
    setSelectedStory(null);
    setGameStage(GameStage.PROFILE_SETUP);
  };

  const handleProfileUpdated = (profile: UserProfile) => {
    setUserProfile(profile);
    setGameStage(GameStage.STORY_SELECT);
  };

  const renderContent = () => {
    switch (gameStage) {
      case GameStage.PROFILE_SETUP:
        return <ProfileSetup onProfileCreate={handleProfileCreate} />;
      case GameStage.STORY_SELECT:
        if (!userProfile) {
            setGameStage(GameStage.PROFILE_SETUP);
            return null; 
        }
        return (
          <StorySelect 
            userProfile={userProfile} 
            onStorySelect={handleStorySelect}
            onProfileDeleted={handleProfileDeleted}
            onProfileUpdated={handleProfileUpdated}
          />
        );
      case GameStage.STORY_PLAYER:
        if (!userProfile || !selectedStory) {
            setGameStage(userProfile ? GameStage.STORY_SELECT : GameStage.PROFILE_SETUP);
            return null;
        }
        return (
          <StoryPlayer 
            userProfile={userProfile} 
            story={selectedStory} 
            shouldContinue={shouldContinueStory}
            isReplayMode={isReplayMode}
            onExit={handleExitStory} 
          />
        );
      default:
        return <div>Loading...</div>;
    }
  };

  return <div className="App">{renderContent()}</div>;
};

export default App;