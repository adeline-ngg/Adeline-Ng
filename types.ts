export enum GameStage {
  PROFILE_SETUP = 'PROFILE_SETUP',
  STORY_SELECT = 'STORY_SELECT',
  STORY_PLAYER = 'STORY_PLAYER',
  LESSONS_SUMMARY = 'LESSONS_SUMMARY',
}

export interface UserProfile {
  name: string;
  avatarUrl: string;
  description: string;
}

export interface EnvironmentZone {
  id: string;
  name: string;
  description: string;
}

export interface Story {
  id: string;
  title: string;
  description: string;
  initialPrompt: string;
  coverImage: string;
  bibleReference?: BibleReference;
  environmentZones?: EnvironmentZone[];
}

export interface StorySegment {
  type: 'narrator' | 'user' | 'lesson' | 'question' | 'answer';
  text: string;
  imageUrl?: string;
  gifUrl?: string; // New field for animated GIF
  isLoadingImage?: boolean;
  isLoadingGif?: boolean; // New field for loading state
  isImportantScene?: boolean; // Flag from AI to determine GIF generation
  choices?: string[];
}

export interface GeminiStoryResponse {
    narrative: string;
    imagePrompt: string;
    choices: string[];
    lessons: string[];
    isComplete?: boolean;
    isFallback?: boolean;  // Add this field
    location?: string | null;  // Add location field
    isImportantScene?: boolean; // New field for AI to flag major plot points
}

// Narration and Audio Types
export interface NarrationSettings {
  enabled: boolean;
  voiceURI: string;
  voiceName: string;
  speed: number; // 1.0, 1.25, 1.5
  autoPlay: boolean;
  provider: 'webspeech' | 'elevenlabs' | 'speechify';
}

export interface ElevenLabsSettings {
  enabled: boolean;
  selectedVoiceId: string;
  autoPlay: boolean;
  apiKey?: string; // Optional override
}

export interface SpeechifySettings {
  enabled: boolean;
  selectedVoiceId: string;
  apiKey?: string;
}

export interface FalSettings {
  enabled: boolean;
  sessionLimit: number; // Max GIFs per session
  currentSessionCount: number;
  useFalFallback: boolean; // Use fal.ai as fallback when Gemini Imagen fails
  apiKey?: string; // Stored in environment variable
}

export interface SpeechifyVoice {
  id: string;
  name: string;
  description: string;
  language: string;
}

export interface AudioCacheEntry {
  text: string;
  audioBlob: Blob;
  voiceURI: string;
  speed: number;
  timestamp: number;
  provider: 'webspeech' | 'elevenlabs' | 'speechify';
}

export interface MediaCacheEntry {
  prompt: string;
  mediaBlob: Blob;
  model: string;
  duration: number;
  timestamp: number;
  mediaType: 'gif' | 'video' | 'image';
}

// Storage and Save State Types
export interface SavedProfile {
  profile: UserProfile;
  timestamp: number;
}

export interface StoryProgress {
  storyId: string;
  segments: StorySegment[];
  currentChoices: string[];
  storyHistory: string[];
  lastUpdated: number;
  userChoiceCount: number; // Track user choices only
  isCompleted: boolean;
  completionDate?: number;
  currentEnvironment?: string; // Current environment zone ID or description
}

export interface SavedProgress {
  [storyId: string]: StoryProgress;
}

export interface AppSettings {
  narration: NarrationSettings;
  elevenLabs: ElevenLabsSettings;
  speechify: SpeechifySettings;
  fal: FalSettings;
}

// Mem0 Memory Types
export interface UserPreferences {
  choicePatterns: string[];
  favoriteThemes: string[];
  interactionStyle: string;
}

export interface MemoryContext {
  userId: string;
  preferences: UserPreferences;
}

export interface BibleReference {
  book: string;
  chapters: string;
  verses?: string;
  text?: string; // For future: full text
  externalLink?: string; // For future: Bible Gateway link
}

// Bible Text Display Types
export interface BibleVerse {
  book: string;
  chapter: number;
  verse: number;
  text: string;
  translation: string;
}

export interface BibleChapter {
  book: string;
  chapter: number;
  verses: BibleVerse[];
  translation: string;
}

export interface BibleTextModalProps {
  isOpen: boolean;
  onClose: () => void;
  storyTitle: string;
  bibleReference: BibleReference;
}

// Tutorial and Lessons Summary Types
export interface TutorialStep {
  id: string;
  title: string;
  description: string;
  selector?: string; // CSS selector for element to highlight
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
}

export interface StoryLesson {
  storyId: string;
  storyTitle: string;
  lesson: string;
  completionDate: number;
  segmentIndex: number; // Index of lesson in story segments
  lessonIndex?: number; // Index of lesson within the segment (0, 1, or 2)
}

export interface TutorialCompletion {
  hasCompletedTutorial: boolean;
  lastCompletedDate?: number;
  skippedTutorial: boolean;
}