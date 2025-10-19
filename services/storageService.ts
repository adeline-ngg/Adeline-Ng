import { UserProfile, SavedProfile, StoryProgress, SavedProgress, AppSettings, NarrationSettings, ElevenLabsSettings, SpeechifySettings, FalSettings, StoryLesson, TutorialCompletion } from '../types';
import { getDefaultNarrationSettings } from './speechService';
import { elevenLabsService } from './elevenLabsService';
import { speechifyService } from './speechifyService';

// Storage keys
const PROFILE_KEY = 'biblical-journeys-profile';
const PROGRESS_KEY = 'biblical-journeys-progress';
const SETTINGS_KEY = 'biblical-journeys-settings';
const TUTORIAL_KEY = 'biblical-journeys-tutorial';

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
    
    // Try to save the full progress data
    const progressData = JSON.stringify(allProgress);
    
    try {
      localStorage.setItem(PROGRESS_KEY, progressData);
    } catch (quotaError) {
      if (quotaError instanceof DOMException && quotaError.name === 'QuotaExceededError') {
        console.warn('Storage quota exceeded, attempting to compress data...');
        
        // Try to save with compressed data
        const compressedData = compressProgressData(allProgress);
        try {
          localStorage.setItem(PROGRESS_KEY, compressedData);
          console.log('Successfully saved compressed progress data');
        } catch (compressedError) {
          console.error('Even compressed data exceeds quota, cleaning up old data...');
          
          // Clean up old data and try again
          const cleanedData = cleanupOldProgressData(allProgress);
          const cleanedCompressed = compressProgressData(cleanedData);
          localStorage.setItem(PROGRESS_KEY, cleanedCompressed);
          console.log('Successfully saved after cleanup');
        }
      } else {
        throw quotaError;
      }
    }
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
    
    // Try to parse as regular JSON first
    try {
      return JSON.parse(saved);
    } catch (parseError) {
      // If parsing fails, try to decompress
      console.log('Attempting to decompress progress data...');
      return decompressProgressData(saved);
    }
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
  return progress !== null && progress.segments && progress.segments.length > 0;
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
      console.log('Storage: No saved settings found, returning defaults');
      return getDefaultSettings();
    }
    
    const settings: AppSettings = JSON.parse(saved);
    console.log('Storage: Loaded settings from localStorage:', settings);
    
    // Merge with defaults to handle new settings fields
    const mergedSettings = {
      ...getDefaultSettings(),
      ...settings,
      narration: {
        ...getDefaultSettings().narration,
        ...settings.narration,
      },
      elevenLabs: {
        ...getDefaultSettings().elevenLabs,
        ...settings.elevenLabs,
      },
      speechify: {
        ...getDefaultSettings().speechify,
        ...settings.speechify,
      },
      fal: {
        ...getDefaultSettings().fal,
        ...settings.fal,
      },
    };
    
    console.log('Storage: Merged settings:', mergedSettings);
    return mergedSettings;
  } catch (error) {
    console.error('Error loading settings:', error);
    return getDefaultSettings();
  }
}

export function saveNarrationSettings(narration: NarrationSettings): void {
  console.log('Storage: Saving narration settings:', narration);
  const settings = loadSettings();
  settings.narration = narration;
  saveSettings(settings);
  console.log('Storage: Narration settings saved successfully');
}

export function saveElevenLabsSettings(elevenLabs: ElevenLabsSettings): void {
  const settings = loadSettings();
  settings.elevenLabs = elevenLabs;
  saveSettings(settings);
}

export function loadElevenLabsSettings(): ElevenLabsSettings {
  const settings = loadSettings();
  return settings.elevenLabs;
}

export function saveSpeechifySettings(speechify: SpeechifySettings): void {
  const settings = loadSettings();
  settings.speechify = speechify;
  saveSettings(settings);
}

export function loadSpeechifySettings(): SpeechifySettings {
  const settings = loadSettings();
  return settings.speechify;
}

export function saveFalSettings(fal: FalSettings): void {
  const settings = loadSettings();
  settings.fal = fal;
  saveSettings(settings);
}

export function loadFalSettings(): FalSettings {
  const settings = loadSettings();
  return settings.fal;
}

function getDefaultSettings(): AppSettings {
  return {
    narration: getDefaultNarrationSettings(),
    elevenLabs: elevenLabsService.getDefaultSettings(),
    speechify: speechifyService.getDefaultSettings(),
    fal: {
      enabled: false, // Disabled by default for cost control - user can enable in Settings
      sessionLimit: 10,
      currentSessionCount: 0,
      useFalFallback: true, // Enabled by default - user can disable if concerned about costs
    },
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
  quotaUsed: string;
  quotaAvailable: string;
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
  
  // Estimate quota usage (localStorage is typically 5-10MB)
  const estimatedQuota = 5 * 1024 * 1024; // 5MB in bytes
  const quotaUsedPercent = ((totalSize / estimatedQuota) * 100).toFixed(1);
  const quotaAvailable = Math.max(0, estimatedQuota - totalSize);
  const quotaAvailableKB = (quotaAvailable / 1024).toFixed(2);
  
  return {
    hasProfile: hasProf,
    storiesWithProgress: storyIds,
    estimatedSize: `${sizeInKB} KB`,
    quotaUsed: `${quotaUsedPercent}%`,
    quotaAvailable: `${quotaAvailableKB} KB`,
  };
}

// Check if storage is approaching quota limit
export function isStorageNearQuota(): boolean {
  const info = getStorageInfo();
  const quotaUsedPercent = parseFloat(info.quotaUsed);
  return quotaUsedPercent > 80; // Warn when 80% of estimated quota is used
}

// Force cleanup of old data when storage is full
export function forceCleanupStorage(): void {
  try {
    const allProgress = loadAllProgress();
    const cleanedData = cleanupOldProgressData(allProgress);
    const compressedData = compressProgressData(cleanedData);
    localStorage.setItem(PROGRESS_KEY, compressedData);
    console.log('Storage cleanup completed successfully');
  } catch (error) {
    console.error('Error during storage cleanup:', error);
  }
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

/**
 * Tutorial Completion Storage
 */

export function saveTutorialCompletion(completion: TutorialCompletion): void {
  try {
    localStorage.setItem(TUTORIAL_KEY, JSON.stringify(completion));
  } catch (error) {
    console.error('Error saving tutorial completion:', error);
  }
}

export function loadTutorialCompletion(): TutorialCompletion {
  try {
    const saved = localStorage.getItem(TUTORIAL_KEY);
    if (!saved) {
      return {
        hasCompletedTutorial: false,
        skippedTutorial: false,
      };
    }
    return JSON.parse(saved);
  } catch (error) {
    console.error('Error loading tutorial completion:', error);
    return {
      hasCompletedTutorial: false,
      skippedTutorial: false,
    };
  }
}

/**
 * Data Compression and Cleanup Functions
 */

// Simple compression by removing unnecessary whitespace and shortening keys
function compressProgressData(progressData: SavedProgress): string {
  const compressed = Object.entries(progressData).reduce((acc, [storyId, progress]) => {
    // Remove unnecessary fields and compress text content
    const compressedProgress = {
      s: progress.segments?.map(segment => ({
        t: segment.type,
        txt: segment.text,
        img: segment.imageUrl,
        gif: segment.gifUrl,
        // Remove loading states as they're not needed in storage
      })) || [],
      c: progress.currentChoices || [],
      h: progress.storyHistory?.slice(-50) || [], // Keep only last 50 history entries
      u: progress.userChoiceCount || 0,
      comp: progress.isCompleted || false,
      env: progress.currentEnvironment || '',
      cd: progress.completionDate,
      lu: progress.lastUpdated
    };
    
    acc[storyId] = compressedProgress;
    return acc;
  }, {} as any);
  
  return JSON.stringify(compressed);
}

// Decompress data back to original format
function decompressProgressData(compressedData: string): SavedProgress {
  try {
    const compressed = JSON.parse(compressedData);
    const decompressed = Object.entries(compressed).reduce((acc, [storyId, progress]: [string, any]) => {
      const decompressedProgress: StoryProgress = {
        storyId,
        segments: progress.s?.map((segment: any) => ({
          type: segment.t,
          text: segment.txt,
          imageUrl: segment.img,
          gifUrl: segment.gif,
          isLoadingImage: false, // Always false when loaded from storage
          isLoadingGif: false,
        })) || [],
        currentChoices: progress.c || [],
        storyHistory: progress.h || [],
        userChoiceCount: progress.u || 0,
        isCompleted: progress.comp || false,
        currentEnvironment: progress.env || '',
        completionDate: progress.cd,
        lastUpdated: progress.lu || Date.now()
      };
      
      acc[storyId] = decompressedProgress;
      return acc;
    }, {} as SavedProgress);
    
    return decompressed;
  } catch (error) {
    console.error('Error decompressing progress data:', error);
    return {};
  }
}

// Clean up old data to free up space
function cleanupOldProgressData(progressData: SavedProgress): SavedProgress {
  const cleaned = Object.entries(progressData).reduce((acc, [storyId, progress]) => {
    // Keep only essential data for completed stories
    if (progress.isCompleted) {
      const cleanedProgress: StoryProgress = {
        ...progress,
        // Keep only the last 20 segments for completed stories
        segments: progress.segments?.slice(-20) || [],
        // Keep only the last 20 history entries
        storyHistory: progress.storyHistory?.slice(-20) || [],
        // Remove current choices for completed stories
        currentChoices: [],
      };
      acc[storyId] = cleanedProgress;
    } else {
      // For incomplete stories, keep more data but still clean up
      const cleanedProgress: StoryProgress = {
        ...progress,
        // Keep only the last 30 segments for incomplete stories
        segments: progress.segments?.slice(-30) || [],
        // Keep only the last 30 history entries
        storyHistory: progress.storyHistory?.slice(-30) || [],
      };
      acc[storyId] = cleanedProgress;
    }
    return acc;
  }, {} as SavedProgress);
  
  return cleaned;
}

/**
 * Data Migration Functions
 */

export function migrateLessonFormat(): void {
  try {
    const allProgress = loadAllProgress();
    let migrationNeeded = false;
    
    Object.entries(allProgress).forEach(([storyId, progress]) => {
      if (progress.segments) {
        progress.segments.forEach((segment) => {
          if (segment.type === 'lesson' && segment.text) {
            try {
              // Try to parse as JSON array (new format)
              JSON.parse(segment.text);
              // If parsing succeeds, it's already in new format
            } catch {
              // If parsing fails, it's in old format - convert it
              const oldLesson = segment.text;
              segment.text = JSON.stringify([oldLesson]); // Convert to array format
              migrationNeeded = true;
            }
          }
        });
        
        if (migrationNeeded) {
          saveStoryProgress(storyId, progress);
        }
      }
    });
    
    if (migrationNeeded) {
      console.log('Lesson format migration completed successfully');
    }
  } catch (error) {
    console.error('Error during lesson format migration:', error);
  }
}

/**
 * Lessons Summary Storage
 */

export function getAllStoryLessons(): StoryLesson[] {
  try {
    const allProgress = loadAllProgress();
    const lessons: StoryLesson[] = [];
    
    Object.entries(allProgress).forEach(([storyId, progress]) => {
      if (progress.isCompleted && progress.segments) {
        // Find story title from constants (we'll need to import STORIES)
        const storyTitle = getStoryTitle(storyId);
        
        progress.segments.forEach((segment, index) => {
          if (segment.type === 'lesson' && segment.text) {
            try {
              // Try to parse as JSON array (new format)
              const lessonsArray = JSON.parse(segment.text);
              if (Array.isArray(lessonsArray)) {
                lessonsArray.forEach((lessonText, lessonIndex) => {
                  lessons.push({
                    storyId,
                    storyTitle,
                    lesson: lessonText,
                    completionDate: progress.completionDate || progress.lastUpdated,
                    segmentIndex: index,
                    lessonIndex: lessonIndex,
                  });
                });
              }
            } catch {
              // If parsing fails, treat as single lesson (old format)
              lessons.push({
                storyId,
                storyTitle,
                lesson: segment.text,
                completionDate: progress.completionDate || progress.lastUpdated,
                segmentIndex: index,
                lessonIndex: 0,
              });
            }
          }
        });
      }
    });
    
    // Sort by completion date (most recent first)
    return lessons.sort((a, b) => b.completionDate - a.completionDate);
  } catch (error) {
    console.error('Error getting all story lessons:', error);
    return [];
  }
}

// Helper function to get story title by ID
function getStoryTitle(storyId: string): string {
  // This will be imported from constants in the actual implementation
  const storyTitles: { [key: string]: string } = {
    'moses-red-sea': 'Moses and the Red Sea',
    'david-goliath': 'David and Goliath',
    'daniel-lions': 'Daniel in the Lion\'s Den',
    'noahs-ark': 'Noah\'s Ark',
    'nativity': 'The Nativity',
    'resurrection': 'The Resurrection',
  };
  return storyTitles[storyId] || 'Unknown Story';
}

