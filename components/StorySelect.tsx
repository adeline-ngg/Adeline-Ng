
import React from 'react';
import { UserProfile, Story } from '../types';
import { STORIES } from '../constants';
import ChevronRightIcon from './icons/ChevronRightIcon';

interface StorySelectProps {
  userProfile: UserProfile;
  onStorySelect: (story: Story) => void;
}

const StorySelect: React.FC<StorySelectProps> = ({ userProfile, onStorySelect }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-100 to-orange-200 p-4 sm:p-6 md:p-8">
      <header className="max-w-4xl mx-auto flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-stone-800 font-serif">Welcome, {userProfile.name}!</h1>
          <p className="text-stone-600 mt-1">Choose a story to begin your interactive experience.</p>
        </div>
        <img src={userProfile.avatarUrl} alt="User Avatar" className="w-16 h-16 rounded-full border-4 border-white shadow-lg" />
      </header>
      
      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {STORIES.map((story) => (
          <div key={story.id} className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-lg overflow-hidden border border-white/30 flex flex-col group transition-all duration-300 hover:shadow-2xl hover:-translate-y-1">
            <img src={story.coverImage} alt={story.title} className="w-full h-48 object-cover"/>
            <div className="p-6 flex flex-col flex-grow">
              <h2 className="text-2xl font-bold font-serif text-stone-800">{story.title}</h2>
              <p className="text-stone-600 mt-2 mb-4 flex-grow">{story.description}</p>
              <button 
                onClick={() => onStorySelect(story)}
                className="mt-auto w-full bg-stone-800 hover:bg-stone-700 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline transition-colors duration-200 flex items-center justify-center gap-2 group-hover:bg-amber-600"
                >
                Experience This Story <ChevronRightIcon />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StorySelect;
