import React, { useState, useEffect } from 'react';
import { NarrationSettings, UserProfile } from '../types';
import { speechService } from '../services/speechService';
import { 
  loadSettings, 
  saveNarrationSettings, 
  deleteAllProgress, 
  deleteProfile,
  getStorageInfo,
  loadProfile 
} from '../services/storageService';
import { clearAudioCache, getCacheStats } from '../utils/audioCache';
import ProfileSetup from './ProfileSetup';

interface SettingsProps {
  onClose: () => void;
  onProfileDeleted?: () => void;
  onProfileUpdated?: (profile: UserProfile) => void;
}

const Settings: React.FC<SettingsProps> = ({ onClose, onProfileDeleted, onProfileUpdated }) => {
  const [narration, setNarration] = useState<NarrationSettings>(loadSettings().narration);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [storageInfo, setStorageInfo] = useState(getStorageInfo());
  const [cacheInfo, setCacheInfo] = useState({ entryCount: 0, oldestEntry: null, newestEntry: null });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<'progress' | 'profile' | null>(null);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showEditWarning, setShowEditWarning] = useState(false);

  useEffect(() => {
    // Load available voices
    const availableVoices = speechService.getAvailableVoices();
    setVoices(availableVoices);

    // If no voice selected, set default
    if (!narration.voiceURI && availableVoices.length > 0) {
      const defaultVoice = speechService.getDefaultVoice();
      if (defaultVoice) {
        setNarration(prev => ({
          ...prev,
          voiceURI: defaultVoice.voiceURI,
          voiceName: defaultVoice.name,
        }));
      }
    }

    // Load cache stats
    getCacheStats().then(setCacheInfo);
  }, []);

  const handleNarrationToggle = () => {
    const updated = { ...narration, enabled: !narration.enabled };
    setNarration(updated);
    saveNarrationSettings(updated);
  };

  const handleVoiceChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const voiceURI = event.target.value;
    const voice = voices.find(v => v.voiceURI === voiceURI);
    
    if (voice) {
      const updated = { ...narration, voiceURI: voice.voiceURI, voiceName: voice.name };
      setNarration(updated);
      saveNarrationSettings(updated);
    }
  };

  const handleSpeedChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const speed = parseFloat(event.target.value);
    const updated = { ...narration, speed };
    setNarration(updated);
    saveNarrationSettings(updated);
  };

  const handleTestVoice = () => {
    const testText = "This is how the narrator will sound when reading the story.";
    speechService.speak(testText, narration);
  };

  const handleClearProgress = () => {
    deleteAllProgress();
    setStorageInfo(getStorageInfo());
    setShowDeleteConfirm(null);
  };

  const handleDeleteProfile = () => {
    deleteProfile();
    deleteAllProgress();
    setStorageInfo(getStorageInfo());
    setShowDeleteConfirm(null);
    if (onProfileDeleted) {
      onProfileDeleted();
    }
  };

  const handleClearAudioCache = async () => {
    await clearAudioCache();
    const stats = await getCacheStats();
    setCacheInfo(stats);
  };

  const handleEditProfile = () => {
    // Check if user has any story progress
    if (storageInfo.storiesWithProgress.length > 0) {
      setShowEditWarning(true);
    } else {
      setShowEditProfile(true);
    }
  };

  const handleEditWarningConfirm = () => {
    deleteAllProgress(); // Clear all progress before editing
    setStorageInfo(getStorageInfo());
    setShowEditWarning(false);
    setShowEditProfile(true);
  };

  const handleProfileUpdate = (profile: UserProfile) => {
    setShowEditProfile(false);
    if (onProfileUpdated) {
      onProfileUpdated(profile);
    }
    // Update storage info after profile change
    setStorageInfo(getStorageInfo());
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-stone-200 p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-stone-800 font-serif">Settings</h2>
            <button
              onClick={onClose}
              className="text-stone-500 hover:text-stone-700 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Profile Management */}
          {storageInfo.hasProfile && (
            <section>
              <h3 className="text-lg font-bold text-stone-800 mb-4">Profile</h3>
              <div className="flex items-center justify-between p-4 bg-stone-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <img src={loadProfile()?.avatarUrl} alt="Profile" className="w-12 h-12 rounded-full" />
                  <div>
                    <p className="font-semibold text-stone-800">{loadProfile()?.name}</p>
                    <p className="text-sm text-stone-600">Character: {loadProfile()?.description}</p>
                  </div>
                </div>
                <button
                  onClick={handleEditProfile}
                  className="bg-amber-500 hover:bg-amber-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                >
                  Edit Profile
                </button>
              </div>
            </section>
          )}

          {/* Narration Settings */}
          <section>
            <h3 className="text-lg font-bold text-stone-800 mb-4">Narration</h3>
            
            {!speechService.constructor.isSupported() && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                <p className="text-amber-800 text-sm">
                  Voice narration is not supported in your browser. Please use a modern browser like Chrome, Safari, or Edge.
                </p>
              </div>
            )}

            <div className="space-y-4">
              {/* Enable Narration */}
              <div className="flex items-center justify-between">
                <label className="text-stone-700 font-semibold">Enable Narration</label>
                <button
                  onClick={handleNarrationToggle}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    narration.enabled ? 'bg-amber-500' : 'bg-stone-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      narration.enabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Voice Selection */}
              <div>
                <label className="block text-stone-700 font-semibold mb-2">Narrator Voice</label>
                <select
                  value={narration.voiceURI}
                  onChange={handleVoiceChange}
                  disabled={!narration.enabled || voices.length === 0}
                  className="w-full border border-stone-300 rounded-lg px-4 py-2 text-stone-700 focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:bg-stone-100 disabled:cursor-not-allowed"
                >
                  {voices.map(voice => (
                    <option key={voice.voiceURI} value={voice.voiceURI}>
                      {voice.name} ({voice.lang})
                    </option>
                  ))}
                </select>
              </div>

              {/* Speed Control */}
              <div>
                <label className="block text-stone-700 font-semibold mb-2">Narration Speed</label>
                <select
                  value={narration.speed}
                  onChange={handleSpeedChange}
                  disabled={!narration.enabled}
                  className="w-full border border-stone-300 rounded-lg px-4 py-2 text-stone-700 focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:bg-stone-100 disabled:cursor-not-allowed"
                >
                  <option value="0.75">0.75x (Slower)</option>
                  <option value="1.0">1.0x (Normal)</option>
                  <option value="1.25">1.25x (Faster)</option>
                  <option value="1.5">1.5x (Much Faster)</option>
                </select>
              </div>

              {/* Test Voice */}
              <button
                onClick={handleTestVoice}
                disabled={!narration.enabled || voices.length === 0}
                className="w-full bg-stone-700 hover:bg-stone-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:bg-stone-300 disabled:cursor-not-allowed"
              >
                Test Voice
              </button>
            </div>
          </section>

          {/* Storage Info */}
          <section className="border-t border-stone-200 pt-6">
            <h3 className="text-lg font-bold text-stone-800 mb-4">Storage</h3>
            
            <div className="bg-stone-50 rounded-lg p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-stone-600">Profile saved:</span>
                <span className="font-semibold text-stone-800">
                  {storageInfo.hasProfile ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-600">Stories in progress:</span>
                <span className="font-semibold text-stone-800">
                  {storageInfo.storiesWithProgress.length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-600">Storage used:</span>
                <span className="font-semibold text-stone-800">{storageInfo.estimatedSize}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-600">Audio cache entries:</span>
                <span className="font-semibold text-stone-800">{cacheInfo.entryCount}</span>
              </div>
            </div>
          </section>

          {/* Data Management */}
          <section className="border-t border-stone-200 pt-6">
            <h3 className="text-lg font-bold text-stone-800 mb-4">Data Management</h3>
            
            <div className="space-y-3">
              {/* Clear Audio Cache */}
              <button
                onClick={handleClearAudioCache}
                className="w-full bg-stone-600 hover:bg-stone-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                Clear Audio Cache ({cacheInfo.entryCount} entries)
              </button>

              {/* Clear Progress */}
              {showDeleteConfirm === 'progress' ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-800 text-sm mb-3">
                    Are you sure? All story progress will be lost.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={handleClearProgress}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                    >
                      Yes, Clear All
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(null)}
                      className="flex-1 bg-stone-300 hover:bg-stone-400 text-stone-800 font-semibold py-2 px-4 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowDeleteConfirm('progress')}
                  disabled={storageInfo.storiesWithProgress.length === 0}
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:bg-stone-300 disabled:cursor-not-allowed"
                >
                  Clear All Story Progress
                </button>
              )}

              {/* Delete Profile */}
              {showDeleteConfirm === 'profile' ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-800 text-sm mb-3">
                    <strong>Warning:</strong> This will delete your profile and all story progress permanently.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={handleDeleteProfile}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                    >
                      Yes, Delete Everything
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(null)}
                      className="flex-1 bg-stone-300 hover:bg-stone-400 text-stone-800 font-semibold py-2 px-4 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowDeleteConfirm('profile')}
                  disabled={!storageInfo.hasProfile}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:bg-stone-300 disabled:cursor-not-allowed"
                >
                  Delete Profile & All Data
                </button>
              )}
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-stone-50 border-t border-stone-200 p-4 rounded-b-2xl">
          <button
            onClick={onClose}
            className="w-full bg-stone-800 hover:bg-stone-700 text-white font-bold py-3 px-4 rounded-lg transition-colors"
          >
            Done
          </button>
        </div>
      </div>

      {/* Edit Profile Warning Modal */}
      {showEditWarning && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-stone-800 mb-4">Warning</h3>
            <p className="text-stone-600 mb-6">
              All progress will be lost. Are you sure you want to edit your profile?
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleEditWarningConfirm}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                Yes, Continue
              </button>
              <button
                onClick={() => setShowEditWarning(false)}
                className="flex-1 bg-stone-300 hover:bg-stone-400 text-stone-800 font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {showEditProfile && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-stone-200 p-4 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-stone-800">Edit Profile</h3>
                <button
                  onClick={() => setShowEditProfile(false)}
                  className="text-stone-500 hover:text-stone-700 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-4">
              <ProfileSetup
                isEditMode={true}
                onProfileUpdate={handleProfileUpdate}
                onProfileCreate={() => {}} // Not used in edit mode
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;

