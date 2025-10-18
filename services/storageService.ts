import { UserProfile, SavedProfile, StoryProgress, SavedProgress, AppSettings, NarrationSettings, ElevenLabsSettings, SpeechifySettings, StoryLesson, TutorialCompletion } from '../types';
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

function getDefaultSettings(): AppSettings {
  return {
    narration: getDefaultNarrationSettings(),
    elevenLabs: elevenLabsService.getDefaultSettings(),
    speechify: speechifyService.getDefaultSettings(),
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

