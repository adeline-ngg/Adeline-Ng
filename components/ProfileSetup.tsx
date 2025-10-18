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
  const [showPageFlip, setShowPageFlip] = useState(false);

  // Load existing profile on mount and trigger page flip animation
  useEffect(() => {
    const existingProfile = loadProfile();
    if (existingProfile) {
      setName(existingProfile.name);
      setAvatarDescription(existingProfile.description);
      setGeneratedAvatarUrl(existingProfile.avatarUrl);
    }
    
    // Trigger page flip animation after component mounts
    setTimeout(() => {
      setShowPageFlip(true);
    }, 100);
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
    <div className="min-h-screen flex items-center justify-center leather-bg p-4">
      <div className={`w-full max-w-lg bg-gradient-to-br from-amber-50/95 to-orange-100/95 backdrop-blur-sm rounded-3xl shadow-2xl p-10 ornate-border decorative-corners ${showPageFlip ? 'page-flip' : ''}`}>
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-stone-800 mb-3 font-script embossed-text">Biblical Journeys</h1>
          <div className="w-24 h-1 bg-gradient-to-r from-amber-500 to-orange-500 mx-auto rounded-full mb-4"></div>
          <p className="text-center text-stone-700 text-lg font-serif italic">
            {isEditMode ? 'Edit your profile details.' : 'Create your character to begin your divine adventure.'}
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Decorative divider */}
          <div className="flex items-center justify-center">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-amber-300 to-transparent"></div>
            <div className="mx-4 w-3 h-3 bg-amber-500 rounded-full"></div>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-amber-300 to-transparent"></div>
          </div>

          <div>
            <label htmlFor="name" className="block text-stone-800 text-lg font-bold mb-3 font-script">
              Your Character's Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Daniel, Esther, John"
              className="shadow-inner appearance-none border-2 border-amber-300 rounded-xl w-full py-4 px-5 text-stone-800 leading-tight focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white/90 font-serif text-lg placeholder-stone-400"
              required
            />
          </div>

          {/* Decorative divider */}
          <div className="flex items-center justify-center">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-amber-300 to-transparent"></div>
            <div className="mx-4 w-3 h-3 bg-amber-500 rounded-full"></div>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-amber-300 to-transparent"></div>
          </div>

          <div>
            <label htmlFor="avatar-desc" className="block text-stone-800 text-lg font-bold mb-3 font-script">
              Describe Your Character
            </label>
            <textarea
              id="avatar-desc"
              rows={3}
              value={avatarDescription}
              onChange={(e) => {
                setAvatarDescription(e.target.value);
                setAvatarError(null);
              }}
              placeholder="e.g., A wise carpenter with a kind smile"
              className="shadow-inner appearance-none border-2 border-amber-300 rounded-xl w-full py-4 px-5 text-stone-800 leading-relaxed focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white/90 font-serif text-lg placeholder-stone-400 resize-none"
            />
          </div>
          
          {/* Decorative divider */}
          <div className="flex items-center justify-center">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-amber-300 to-transparent"></div>
            <div className="mx-4 w-3 h-3 bg-amber-500 rounded-full"></div>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-amber-300 to-transparent"></div>
          </div>

          <div className="flex flex-col items-center gap-6">
             <div className="w-48 h-48 rounded-full bg-gradient-to-br from-amber-100 to-orange-200 flex items-center justify-center overflow-hidden border-4 border-amber-300 shadow-2xl relative">
                {/* Ornate frame around avatar */}
                <div className="absolute inset-0 rounded-full border-2 border-amber-400 opacity-60"></div>
                {isGenerating && <LoadingSpinner />}
                {!isGenerating && generatedAvatarUrl && (
                    <img src={generatedAvatarUrl} alt="Generated Avatar" className="w-full h-full object-cover" />
                )}
                {!isGenerating && !generatedAvatarUrl && (
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-20 h-20 text-amber-600" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                 )}
            </div>
            <button
                type="button"
                onClick={handleGenerateAvatar}
                disabled={!avatarDescription.trim() || isGenerating}
                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold py-3 px-8 rounded-xl focus:outline-none focus:shadow-outline transition-all duration-200 ease-in-out disabled:from-amber-300 disabled:to-orange-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg shadow-lg hover:shadow-xl"
            >
                {isGenerating ? 'Generating...' : 'Generate Avatar'}
            </button>
            {avatarError && (
              <p className="text-red-600 text-sm mt-2 text-center max-w-xs font-serif">{avatarError}</p>
            )}
          </div>

          {/* Decorative divider */}
          <div className="flex items-center justify-center">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-amber-300 to-transparent"></div>
            <div className="mx-4 w-3 h-3 bg-amber-500 rounded-full"></div>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-amber-300 to-transparent"></div>
          </div>

          <button
            type="submit"
            disabled={!name.trim() || !generatedAvatarUrl || isGenerating}
            className="w-full bg-gradient-to-r from-stone-800 to-stone-900 hover:from-stone-700 hover:to-stone-800 text-white font-bold py-4 px-6 rounded-xl focus:outline-none focus:shadow-outline transition-all duration-200 ease-in-out disabled:from-stone-400 disabled:to-stone-500 disabled:cursor-not-allowed flex items-center justify-center gap-3 text-xl shadow-2xl hover:shadow-3xl hover:-translate-y-1"
          >
            {isEditMode ? 'Update Profile' : 'Begin Divine Journey'} <ChevronRightIcon />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProfileSetup;