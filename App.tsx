import React, { useState, useEffect } from 'react';
import { GameStage, UserProfile, Story } from './types';
import ProfileSetup from './components/ProfileSetup';
import StorySelect from './components/StorySelect';
import StoryPlayer from './components/StoryPlayer';
import LoadingSpinner from './components/LoadingSpinner';

declare global {
  // Fix: Replaced inline object with a named interface to resolve declaration conflicts.
  // This allows TypeScript to correctly merge this definition with other global
  // declarations of `window.aistudio` that may exist in the environment.
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }
  interface Window {
    aistudio: AIStudio;
  }
}

const ApiKeyScreen = ({ onSelectKey }: { onSelectKey: () => void }) => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-100 to-orange-200 p-4">
    <div className="w-full max-w-md bg-white/50 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-white/30 text-center">
      <h1 className="text-3xl font-bold text-stone-800 mb-4 font-serif">Welcome to Biblical Journeys</h1>
      <p className="text-stone-600 mb-6">
        This experience uses advanced AI to generate videos, which requires an API key. Please select your key to continue.
      </p>
      <button
        onClick={onSelectKey}
        className="w-full bg-stone-800 hover:bg-stone-700 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:shadow-outline transition-transform duration-200 ease-in-out"
      >
        Select API Key
      </button>
      <p className="text-xs text-stone-500 mt-4">
        For information on billing, please visit{' '}
        <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="underline hover:text-stone-800">
          ai.google.dev/gemini-api/docs/billing
        </a>.
      </p>
    </div>
  </div>
);

const App: React.FC = () => {
  const [stage, setStage] = useState<GameStage>(GameStage.PROFILE_SETUP);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [isApiKeyReady, setIsApiKeyReady] = useState(false);
  const [isCheckingApiKey, setIsCheckingApiKey] = useState(true);

  useEffect(() => {
    const checkKey = async () => {
      try {
        if (window.aistudio && await window.aistudio.hasSelectedApiKey()) {
          setIsApiKeyReady(true);
        }
      } catch (e) {
        console.error("Error checking for API key:", e);
      } finally {
        setIsCheckingApiKey(false);
      }
    };
    // aistudio might not be available immediately
    setTimeout(checkKey, 100);
  }, []);

  const handleSelectKey = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      // Assume success to avoid race conditions and immediately allow app access.
      setIsApiKeyReady(true);
    }
  };

  const handleProfileCreate = (profile: UserProfile) => {
    setUserProfile(profile);
    setStage(GameStage.STORY_SELECT);
  };

  const handleStorySelect = (story: Story) => {
    setSelectedStory(story);
    setStage(GameStage.STORY_PLAYER);
  };
  
  const handleExitStory = () => {
    setSelectedStory(null);
    setStage(GameStage.STORY_SELECT);
  };

  const renderContent = () => {
    switch (stage) {
      case GameStage.PROFILE_SETUP:
        return <ProfileSetup onProfileCreate={handleProfileCreate} />;
      case GameStage.STORY_SELECT:
        if (userProfile) {
          return <StorySelect userProfile={userProfile} onStorySelect={handleStorySelect} />;
        }
        // Fallback if profile is somehow null
        setStage(GameStage.PROFILE_SETUP);
        return null;
      case GameStage.STORY_PLAYER:
        if (userProfile && selectedStory) {
          return <StoryPlayer userProfile={userProfile} story={selectedStory} onExit={handleExitStory} />;
        }
        // Fallback if something is missing
        setStage(GameStage.STORY_SELECT);
        return null;
      default:
        return <ProfileSetup onProfileCreate={handleProfileCreate} />;
    }
  };

  if (isCheckingApiKey) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-amber-50">
        <LoadingSpinner className="w-12 h-12" />
      </div>
    );
  }

  if (!isApiKeyReady) {
    return <ApiKeyScreen onSelectKey={handleSelectKey} />;
  }

  return <div className="font-sans">{renderContent()}</div>;
};

export default App;
