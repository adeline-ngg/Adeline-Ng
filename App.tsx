import React, { useState } from 'react';
import { GameStage, UserProfile, Story } from './types';
import ProfileSetup from './components/ProfileSetup';
import StorySelect from './components/StorySelect';
import StoryPlayer from './components/StoryPlayer';

const App: React.FC = () => {
  const [gameStage, setGameStage] = useState<GameStage>(GameStage.PROFILE_SETUP);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);

  const handleProfileCreate = (profile: UserProfile) => {
    setUserProfile(profile);
    setGameStage(GameStage.STORY_SELECT);
  };

  const handleStorySelect = (story: Story) => {
    setSelectedStory(story);
    setGameStage(GameStage.STORY_PLAYER);
  };

  const handleExitStory = () => {
    setSelectedStory(null);
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
        return <StorySelect userProfile={userProfile} onStorySelect={handleStorySelect} />;
      case GameStage.STORY_PLAYER:
        if (!userProfile || !selectedStory) {
            setGameStage(userProfile ? GameStage.STORY_SELECT : GameStage.PROFILE_SETUP);
            return null;
        }
        return <StoryPlayer userProfile={userProfile} story={selectedStory} onExit={handleExitStory} />;
      default:
        return <div>Loading...</div>;
    }
  };

  return <div className="App">{renderContent()}</div>;
};

export default App;