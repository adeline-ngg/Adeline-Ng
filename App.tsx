import React, { useState, useEffect } from 'react';
import { GameStage, UserProfile, Story } from './types';
import ProfileSetup from './components/ProfileSetup';
import StorySelect from './components/StorySelect';
import StoryPlayer from './components/StoryPlayer';
import LessonsSummary from './components/LessonsSummary';
import TutorialGuide from './components/TutorialGuide';
import { loadProfile, hasProfile, migrateLessonFormat } from './services/storageService';
import { initializeMemory } from './services/memoryService';
import { tutorialService } from './services/tutorialService';

const App: React.FC = () => {
  const [gameStage, setGameStage] = useState<GameStage>(GameStage.PROFILE_SETUP);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [shouldContinueStory, setShouldContinueStory] = useState(false);
  const [isReplayMode, setIsReplayMode] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [isFirstTimeUser, setIsFirstTimeUser] = useState(false);

  // Check for saved profile on mount
  useEffect(() => {
    // Initialize Mem0 (optional, will gracefully degrade if not configured)
    initializeMemory().catch(console.error);

    // Run data migration for lesson format
    migrateLessonFormat();

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
    setIsFirstTimeUser(true);
    setGameStage(GameStage.STORY_SELECT);
    
    // Show tutorial for first-time users
    if (tutorialService.shouldShowTutorial()) {
      setShowTutorial(true);
    }
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

  const handleViewLessonsSummary = () => {
    setGameStage(GameStage.LESSONS_SUMMARY);
  };

  const handleOpenTutorial = () => {
    setShowTutorial(true);
  };

  const handleTutorialComplete = () => {
    setShowTutorial(false);
    setIsFirstTimeUser(false);
  };

  const handleBackFromLessons = () => {
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
            onTutorialClick={handleOpenTutorial}
            onLessonsSummaryClick={handleViewLessonsSummary}
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
      case GameStage.LESSONS_SUMMARY:
        return (
          <LessonsSummary 
            onBack={handleBackFromLessons}
          />
        );
      default:
        return <div>Loading...</div>;
    }
  };

  return (
    <div className="App">
      {renderContent()}
      
      {/* Tutorial Guide Modal */}
      {showTutorial && (
        <TutorialGuide
          isOpen={showTutorial}
          onClose={() => setShowTutorial(false)}
          onComplete={handleTutorialComplete}
        />
      )}
    </div>
  );
};

export default App;