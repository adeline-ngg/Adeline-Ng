import React, { useState, useEffect } from 'react';
import { NarrationSettings, UserProfile, ElevenLabsSettings, SpeechifySettings } from '../types';
import { speechService } from '../services/speechService';
import { elevenLabsService } from '../services/elevenLabsService';
import { speechifyService } from '../services/speechifyService';
import { 
  loadSettings, 
  saveNarrationSettings, 
  saveElevenLabsSettings,
  loadElevenLabsSettings,
  saveSpeechifySettings,
  loadSpeechifySettings,
  deleteAllProgress, 
  deleteProfile,
  getStorageInfo,
  loadProfile 
} from '../services/storageService';
import { clearAudioCache, getCacheStats } from '../utils/audioCache';
import { ELEVENLABS_VOICES, SPEECHIFY_VOICES } from '../constants';
import ProfileSetup from './ProfileSetup';

interface SettingsProps {
  onClose: () => void;
  onProfileDeleted?: () => void;
  onProfileUpdated?: (profile: UserProfile) => void;
}

const Settings: React.FC<SettingsProps> = ({ onClose, onProfileDeleted, onProfileUpdated }) => {
  const [narration, setNarration] = useState<NarrationSettings>(() => {
    const settings = loadSettings();
    // Ensure speed is a number
    const speed = typeof settings.narration.speed === 'string' 
      ? parseFloat(settings.narration.speed) 
      : settings.narration.speed;
    
    return {
      ...settings.narration,
      speed: isNaN(speed) ? 1.0 : speed
    };
  });
  const [elevenLabs, setElevenLabs] = useState<ElevenLabsSettings>(loadElevenLabsSettings());
  const [speechify, setSpeechify] = useState<SpeechifySettings>(loadSpeechifySettings());
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [storageInfo, setStorageInfo] = useState(getStorageInfo());
  const [cacheInfo, setCacheInfo] = useState({ entryCount: 0, oldestEntry: null, newestEntry: null });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<'progress' | 'profile' | null>(null);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showEditWarning, setShowEditWarning] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [showSpeechifyApiKey, setShowSpeechifyApiKey] = useState(false);
  const [testVoiceLoading, setTestVoiceLoading] = useState(false);
  const [testSpeechifyVoiceLoading, setTestSpeechifyVoiceLoading] = useState(false);

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

    // Initialize ElevenLabs service with stored API key if available
    if (elevenLabs.apiKey) {
      elevenLabsService.setApiKey(elevenLabs.apiKey);
    }

    // Initialize Speechify service with stored API key if available
    if (speechify.apiKey) {
      speechifyService.setApiKey(speechify.apiKey);
    }

    // Load cache stats
    getCacheStats().then(setCacheInfo);
  }, []);


  const handleNarrationToggle = () => {
    const updated = { ...narration, enabled: !narration.enabled };
    console.log('Settings: Toggling narration enabled to:', updated.enabled);
    setNarration(updated);
    saveNarrationSettings(updated);
    console.log('Settings: Saved narration settings to localStorage');
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


  const handleProviderChange = (provider: 'webspeech' | 'elevenlabs' | 'speechify') => {
    const updated = { ...narration, provider };
    console.log('Settings: Changing provider to:', provider);
    setNarration(updated);
    saveNarrationSettings(updated);
    console.log('Settings: Saved provider change to localStorage');
  };

  const handleElevenLabsToggle = () => {
    const updated = { ...elevenLabs, enabled: !elevenLabs.enabled };
    setElevenLabs(updated);
    saveElevenLabsSettings(updated);
  };

  const handleElevenLabsVoiceChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const voiceId = event.target.value;
    const updated = { ...elevenLabs, selectedVoiceId: voiceId };
    setElevenLabs(updated);
    saveElevenLabsSettings(updated);
  };

  const handleElevenLabsAutoPlayToggle = () => {
    const updated = { ...elevenLabs, autoPlay: !elevenLabs.autoPlay };
    setElevenLabs(updated);
    saveElevenLabsSettings(updated);
  };

  const handleApiKeyChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const apiKey = event.target.value;
    const updated = { ...elevenLabs, apiKey };
    setElevenLabs(updated);
    saveElevenLabsSettings(updated);
    
    // Update ElevenLabs service with new API key (handles empty values too)
    elevenLabsService.setApiKey(apiKey);
  };

  const handleTestElevenLabsVoice = async () => {
    if (!elevenLabsService.isConfigured()) {
      alert('Please configure your ElevenLabs API key first.');
      return;
    }

    setTestVoiceLoading(true);
    try {
      const audioBlob = await elevenLabsService.testVoice(elevenLabs.selectedVoiceId);
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audio.play();
      
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
      };
    } catch (error) {
      console.error('Error testing voice:', error);
      alert('Failed to test voice. Please check your API key and try again.');
    } finally {
      setTestVoiceLoading(false);
    }
  };

  const handleSpeechifyApiKeyChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const apiKey = event.target.value;
    const updated = { ...speechify, apiKey };
    setSpeechify(updated);
    saveSpeechifySettings(updated);
    
    // Update Speechify service with new API key (handles empty values too)
    speechifyService.setApiKey(apiKey);
  };

  const handleSpeechifyVoiceChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const voiceId = event.target.value;
    const updated = { ...speechify, selectedVoiceId: voiceId };
    setSpeechify(updated);
    saveSpeechifySettings(updated);
  };

  const handleTestSpeechifyVoice = async () => {
    if (!speechifyService.isConfigured()) {
      alert('Please configure your Speechify API key first.');
      return;
    }

    setTestSpeechifyVoiceLoading(true);
    try {
      const audioBlob = await speechifyService.testVoice(speechify.selectedVoiceId);
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audio.play();
      
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
      };
    } catch (error) {
      console.error('Error testing Speechify voice:', error);
      alert('Failed to test voice. Please check your API key and try again.');
    } finally {
      setTestSpeechifyVoiceLoading(false);
    }
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
    // Close the Settings modal after successful profile update
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-stone-200 p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-stone-800 font-script">Settings</h2>
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
              <h3 className="text-lg font-bold text-stone-800 font-script mb-4">Profile</h3>
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
                  className="bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 px-6 rounded-xl transition-colors"
                >
                  Edit Profile
                </button>
              </div>
            </section>
          )}

          {/* Narration Settings */}
          <section>
            <h3 className="text-lg font-bold text-stone-800 font-script mb-4">Narration</h3>
            
            {!speechService.constructor.isSupported() && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                <p className="text-amber-800 text-sm">
                  Voice narration is not supported in your browser. Please use a modern browser like Chrome, Safari, or Edge.
                </p>
              </div>
            )}

            <div className="space-y-4">
              {/* Voice Provider Selection */}
              <div>
                <label className="block text-stone-700 font-semibold mb-3">Voice Provider</label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="provider"
                      value="webspeech"
                      checked={narration.provider === 'webspeech'}
                      onChange={() => handleProviderChange('webspeech')}
                      className="mr-3"
                    />
                    <span className="text-stone-700">Web Speech API (Built-in)</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="provider"
                      value="elevenlabs"
                      checked={narration.provider === 'elevenlabs'}
                      onChange={() => handleProviderChange('elevenlabs')}
                      className="mr-3"
                    />
                    <span className="text-stone-700">ElevenLabs (High Quality)</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="provider"
                      value="speechify"
                      checked={narration.provider === 'speechify'}
                      onChange={() => handleProviderChange('speechify')}
                      className="mr-3"
                    />
                    <span className="text-stone-700">Speechify (Fallback)</span>
                  </label>
                </div>
              </div>

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

              {/* Web Speech Settings */}
              {narration.provider === 'webspeech' && (
                <>
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
                      <option value={0.75}>0.75x (Slower)</option>
                      <option value={1.0}>1.0x (Normal)</option>
                      <option value={1.25}>1.25x (Faster)</option>
                      <option value={1.5}>1.5x (Much Faster)</option>
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
                </>
              )}

              {/* ElevenLabs Settings */}
              {narration.provider === 'elevenlabs' && (
                <>
                  {/* ElevenLabs Status */}
                  <div className={`p-3 rounded-lg ${elevenLabsService.isConfigured() ? 'bg-green-50 border border-green-200' : 'bg-amber-50 border border-amber-200'}`}>
                    <p className={`text-sm ${elevenLabsService.isConfigured() ? 'text-green-800' : 'text-amber-800'}`}>
                      {elevenLabsService.isConfigured() 
                        ? '✓ ElevenLabs configured and ready' 
                        : '⚠ ElevenLabs API key not configured. Please set your API key below.'}
                    </p>
                  </div>

                  {/* API Key Configuration */}
                  <div>
                    <label className="block text-stone-700 font-semibold mb-2">API Key (Optional Override)</label>
                    <div className="relative">
                      <input
                        type={showApiKey ? 'text' : 'password'}
                        value={elevenLabs.apiKey || ''}
                        onChange={handleApiKeyChange}
                        placeholder="Leave empty to use environment variable"
                        className="w-full border border-stone-300 rounded-lg px-4 py-2 pr-10 text-stone-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-stone-500 hover:text-stone-700"
                      >
                        {showApiKey ? (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-stone-500 mt-1">
                      Set VITE_ELEVENLABS_API_KEY environment variable or enter API key above
                    </p>
                  </div>

                  {/* Voice Selection */}
                  <div>
                    <label className="block text-stone-700 font-semibold mb-2">ElevenLabs Voice</label>
                    <select
                      value={elevenLabs.selectedVoiceId}
                      onChange={handleElevenLabsVoiceChange}
                      disabled={!narration.enabled}
                      className="w-full border border-stone-300 rounded-lg px-4 py-2 text-stone-700 focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:bg-stone-100 disabled:cursor-not-allowed"
                    >
                      {ELEVENLABS_VOICES.map(voice => (
                        <option key={voice.id} value={voice.id}>
                          {voice.name} - {voice.description}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Auto-play Toggle */}
                  <div className="flex items-center justify-between">
                    <label className="text-stone-700 font-semibold">Auto-play Narration</label>
                    <button
                      onClick={handleElevenLabsAutoPlayToggle}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        elevenLabs.autoPlay ? 'bg-amber-500' : 'bg-stone-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          elevenLabs.autoPlay ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Test Voice */}
                  <button
                    onClick={handleTestElevenLabsVoice}
                    disabled={!narration.enabled || !elevenLabsService.isConfigured() || testVoiceLoading}
                    className="w-full bg-stone-700 hover:bg-stone-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:bg-stone-300 disabled:cursor-not-allowed"
                  >
                    {testVoiceLoading ? 'Generating...' : 'Test ElevenLabs Voice'}
                  </button>
                </>
              )}

              {/* Speechify Settings */}
              {narration.provider === 'speechify' && (
                <>
                  {/* Speechify Status */}
                  <div className={`p-3 rounded-lg ${speechifyService.isConfigured() ? 'bg-green-50 border border-green-200' : 'bg-amber-50 border border-amber-200'}`}>
                    <p className={`text-sm ${speechifyService.isConfigured() ? 'text-green-800' : 'text-amber-800'}`}>
                      {speechifyService.isConfigured() 
                        ? '✓ Speechify configured and ready' 
                        : '⚠ Speechify API key not configured. Please set your API key below.'}
                    </p>
                  </div>

                  {/* API Key Configuration */}
                  <div>
                    <label className="block text-stone-700 font-semibold mb-2">API Key (Optional Override)</label>
                    <div className="relative">
                      <input
                        type={showSpeechifyApiKey ? 'text' : 'password'}
                        value={speechify.apiKey || ''}
                        onChange={handleSpeechifyApiKeyChange}
                        placeholder="Leave empty to use environment variable"
                        className="w-full border border-stone-300 rounded-lg px-4 py-2 pr-10 text-stone-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowSpeechifyApiKey(!showSpeechifyApiKey)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-stone-500 hover:text-stone-700"
                      >
                        {showSpeechifyApiKey ? (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-stone-500 mt-1">
                      Set VITE_SPEECHIFY_API_KEY environment variable or enter API key above
                    </p>
                  </div>

                  {/* Voice Selection */}
                  <div>
                    <label className="block text-stone-700 font-semibold mb-2">Speechify Voice</label>
                    <select
                      value={speechify.selectedVoiceId}
                      onChange={handleSpeechifyVoiceChange}
                      disabled={!narration.enabled}
                      className="w-full border border-stone-300 rounded-lg px-4 py-2 text-stone-700 focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:bg-stone-100 disabled:cursor-not-allowed"
                    >
                      {SPEECHIFY_VOICES.map(voice => (
                        <option key={voice.id} value={voice.id}>
                          {voice.name} - {voice.description}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Test Voice */}
                  <button
                    onClick={handleTestSpeechifyVoice}
                    disabled={!narration.enabled || !speechifyService.isConfigured() || testSpeechifyVoiceLoading}
                    className="w-full bg-stone-700 hover:bg-stone-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:bg-stone-300 disabled:cursor-not-allowed"
                  >
                    {testSpeechifyVoiceLoading ? 'Generating...' : 'Test Speechify Voice'}
                  </button>
                </>
              )}
            </div>
          </section>

          {/* Storage Info */}
          <section className="border-t border-stone-200 pt-6">
            <h3 className="text-lg font-bold text-stone-800 font-script mb-4">Storage</h3>
            
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
            <h3 className="text-lg font-bold text-stone-800 font-script mb-4">Data Management</h3>
            
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
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 px-6 rounded-xl transition-colors disabled:bg-stone-300 disabled:cursor-not-allowed"
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
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-xl transition-colors disabled:bg-stone-300 disabled:cursor-not-allowed"
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
            className="w-full bg-stone-800 hover:bg-stone-700 text-white font-bold py-3 px-6 rounded-xl transition-colors"
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

