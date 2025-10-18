import { UserProfile, SavedProfile, StoryProgress, SavedProgress, AppSettings, NarrationSettings } from '../types';
import { getDefaultNarrationSettings } from './speechService';

// Storage keys
const PROFILE_KEY = 'biblical-journeys-profile';
const PROGRESS_KEY = 'biblical-journeys-progress';
const SETTINGS_KEY = 'biblical-journeys-settings';

/**
 * Profile Storage
 */

export function saveProfile(profile: UserProfile): void {
  try {
    const savedProfile: SavedProfile = {
      profile,
      timestamp: Date.now(),
    };
    localStorage.setItem(PROFILE_KEY, JSON.stringify(savedProfile));
  } catch (error) {
    console.error('Error saving profile:', error);
    throw new Error('Failed to save profile. Storage may be full.');
  }
}

export function loadProfile(): UserProfile | null {
  try {
    const saved = localStorage.getItem(PROFILE_KEY);
    if (!saved) return null;
    
    const savedProfile: SavedProfile = JSON.parse(saved);
    return savedProfile.profile;
  } catch (error) {
    console.error('Error loading profile:', error);
    return null;
  }
}

export function deleteProfile(): void {
  try {
    localStorage.removeItem(PROFILE_KEY);
  } catch (error) {
    console.error('Error deleting profile:', error);
  }
}

export function hasProfile(): boolean {
  return localStorage.getItem(PROFILE_KEY) !== null;
}

/**
 * Story Progress Storage
 */

export function saveStoryProgress(storyId: string, progress: Omit<StoryProgress, 'storyId' | 'lastUpdated'>): void {
  try {
    const allProgress = loadAllProgress();
    
    const storyProgress: StoryProgress = {
      storyId,
      ...progress,
      lastUpdated: Date.now(),
    };
    
    allProgress[storyId] = storyProgress;
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(allProgress));
  } catch (error) {
    console.error('Error saving story progress:', error);
    // Don't throw - progress save failures shouldn't break the app
  }
}

export function loadStoryProgress(storyId: string): StoryProgress | null {
  try {
    const allProgress = loadAllProgress();
    return allProgress[storyId] || null;
  } catch (error) {
    console.error('Error loading story progress:', error);
    return null;
  }
}

export function loadAllProgress(): SavedProgress {
  try {
    const saved = localStorage.getItem(PROGRESS_KEY);
    if (!saved) return {};
    
    return JSON.parse(saved);
  } catch (error) {
    console.error('Error loading all progress:', error);
    return {};
  }
}

export function deleteStoryProgress(storyId: string): void {
  try {
    const allProgress = loadAllProgress();
    delete allProgress[storyId];
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(allProgress));
  } catch (error) {
    console.error('Error deleting story progress:', error);
  }
}

export function deleteAllProgress(): void {
  try {
    localStorage.removeItem(PROGRESS_KEY);
  } catch (error) {
    console.error('Error deleting all progress:', error);
  }
}

export function hasStoryProgress(storyId: string): boolean {
  const progress = loadStoryProgress(storyId);
  return progress !== null && progress.segments.length > 0;
}

export function isStoryCompleted(storyId: string): boolean {
  const progress = loadStoryProgress(storyId);
  return progress !== null && progress.isCompleted;
}

export function getUserChoiceCount(storyId: string): number {
  const progress = loadStoryProgress(storyId);
  return progress?.userChoiceCount || 0;
}

/**
 * Settings Storage
 */

export function saveSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Error saving settings:', error);
  }
}

export function loadSettings(): AppSettings {
  try {
    const saved = localStorage.getItem(SETTINGS_KEY);
    if (!saved) {
      return getDefaultSettings();
    }
    
    const settings: AppSettings = JSON.parse(saved);
    
    // Merge with defaults to handle new settings fields
    return {
      ...getDefaultSettings(),
      ...settings,
      narration: {
        ...getDefaultSettings().narration,
        ...settings.narration,
      },
    };
  } catch (error) {
    console.error('Error loading settings:', error);
    return getDefaultSettings();
  }
}

export function saveNarrationSettings(narration: NarrationSettings): void {
  const settings = loadSettings();
  settings.narration = narration;
  saveSettings(settings);
}

function getDefaultSettings(): AppSettings {
  return {
    narration: getDefaultNarrationSettings(),
  };
}

/**
 * Storage Management
 */

export function clearAllData(): void {
  try {
    deleteProfile();
    deleteAllProgress();
    // Keep settings as they're user preferences
  } catch (error) {
    console.error('Error clearing all data:', error);
  }
}

export function getStorageInfo(): {
  hasProfile: boolean;
  storiesWithProgress: string[];
  estimatedSize: string;
} {
  const hasProf = hasProfile();
  const allProgress = loadAllProgress();
  const storyIds = Object.keys(allProgress);
  
  // Rough estimate of storage size
  let totalSize = 0;
  try {
    const profileStr = localStorage.getItem(PROFILE_KEY);
    const progressStr = localStorage.getItem(PROGRESS_KEY);
    const settingsStr = localStorage.getItem(SETTINGS_KEY);
    
    totalSize = (profileStr?.length || 0) + (progressStr?.length || 0) + (settingsStr?.length || 0);
  } catch (error) {
    console.error('Error calculating storage size:', error);
  }
  
  // Convert to KB
  const sizeInKB = (totalSize / 1024).toFixed(2);
  
  return {
    hasProfile: hasProf,
    storiesWithProgress: storyIds,
    estimatedSize: `${sizeInKB} KB`,
  };
}

/**
 * Export/Import functionality for backup
 */

export function exportData(): string {
  const data = {
    profile: loadProfile(),
    progress: loadAllProgress(),
    settings: loadSettings(),
    exportDate: new Date().toISOString(),
  };
  return JSON.stringify(data, null, 2);
}

export function importData(jsonString: string): boolean {
  try {
    const data = JSON.parse(jsonString);
    
    if (data.profile) {
      saveProfile(data.profile);
    }
    
    if (data.progress) {
      localStorage.setItem(PROGRESS_KEY, JSON.stringify(data.progress));
    }
    
    if (data.settings) {
      saveSettings(data.settings);
    }
    
    return true;
  } catch (error) {
    console.error('Error importing data:', error);
    return false;
  }
}

