import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import ChevronRightIcon from './icons/ChevronRightIcon';
import { generateAvatarImage } from '../services/geminiService';
import { loadProfile, saveProfile } from '../services/storageService';
import LoadingSpinner from './LoadingSpinner';

interface ProfileSetupProps {
  onProfileCreate: (profile: UserProfile) => void;
  isEditMode?: boolean;
  onProfileUpdate?: (profile: UserProfile) => void;
}

const ProfileSetup: React.FC<ProfileSetupProps> = ({ onProfileCreate, isEditMode = false, onProfileUpdate }) => {
  const [name, setName] = useState('');
  const [avatarDescription, setAvatarDescription] = useState('A young shepherd with kind eyes');
  const [generatedAvatarUrl, setGeneratedAvatarUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  // Load existing profile on mount
  useEffect(() => {
    const existingProfile = loadProfile();
    if (existingProfile) {
      setName(existingProfile.name);
      setAvatarDescription(existingProfile.description);
      setGeneratedAvatarUrl(existingProfile.avatarUrl);
    }
  }, []);

  const handleGenerateAvatar = async () => {
    if (!avatarDescription.trim() || isGenerating) return;
    setIsGenerating(true);
    setGeneratedAvatarUrl(null);
    setAvatarError(null);
    try {
      const imageUrl = await generateAvatarImage(avatarDescription);
      setGeneratedAvatarUrl(imageUrl);
    } catch (error) {
      console.error("Failed to generate avatar:", error);
      if (error instanceof Error) {
        setAvatarError(error.message);
      } else {
        setAvatarError("An unknown error occurred while generating the avatar.");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && generatedAvatarUrl) {
      const profile: UserProfile = { 
        name: name.trim(), 
        avatarUrl: generatedAvatarUrl, 
        description: avatarDescription 
      };
      
      // Save profile to localStorage
      saveProfile(profile);
      
      if (isEditMode && onProfileUpdate) {
        onProfileUpdate(profile);
      } else {
        onProfileCreate(profile);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-100 to-orange-200 p-4">
      <div className="w-full max-w-md bg-white/50 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-white/30">
        <h1 className="text-4xl font-bold text-stone-800 text-center mb-2 font-serif">Biblical Journeys</h1>
        <p className="text-center text-stone-600 mb-8">
          {isEditMode ? 'Edit your profile details.' : 'Create your profile to begin your adventure.'}
        </p>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-stone-700 text-sm font-bold mb-2">
              Your Character's Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Daniel, Esther, John"
              className="shadow-inner appearance-none border border-stone-300 rounded-lg w-full py-3 px-4 text-stone-700 leading-tight focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white/70"
              required
            />
          </div>

          <div>
            <label htmlFor="avatar-desc" className="block text-stone-700 text-sm font-bold mb-2">
              Describe Your Character
            </label>
            <textarea
              id="avatar-desc"
              rows={2}
              value={avatarDescription}
              onChange={(e) => {
                setAvatarDescription(e.target.value);
                setAvatarError(null);
              }}
              placeholder="e.g., A wise carpenter with a kind smile"
              className="shadow-inner appearance-none border border-stone-300 rounded-lg w-full py-3 px-4 text-stone-700 leading-tight focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white/70"
            />
          </div>
          
          <div className="flex flex-col items-center gap-4">
             <div className="w-40 h-40 rounded-full bg-stone-200 flex items-center justify-center overflow-hidden border-4 border-white/50 shadow-lg">
                {isGenerating && <LoadingSpinner />}
                {!isGenerating && generatedAvatarUrl && (
                    <img src={generatedAvatarUrl} alt="Generated Avatar" className="w-full h-full object-cover" />
                )}
                {!isGenerating && !generatedAvatarUrl && (
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-16 h-16 text-stone-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                 )}
            </div>
            <button
                type="button"
                onClick={handleGenerateAvatar}
                disabled={!avatarDescription.trim() || isGenerating}
                className="bg-amber-500 hover:bg-amber-600 text-white font-bold py-2 px-6 rounded-lg focus:outline-none focus:shadow-outline transition-all duration-200 ease-in-out disabled:bg-amber-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
                {isGenerating ? 'Generating...' : 'Generate Avatar'}
            </button>
            {avatarError && (
              <p className="text-red-600 text-sm mt-2 text-center max-w-xs">{avatarError}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={!name.trim() || !generatedAvatarUrl || isGenerating}
            className="w-full bg-stone-800 hover:bg-stone-700 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:shadow-outline transition-transform duration-200 ease-in-out disabled:bg-stone-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
{isEditMode ? 'Update Profile' : 'Begin Journey'} <ChevronRightIcon />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProfileSetup;