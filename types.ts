export enum GameStage {
  PROFILE_SETUP = 'PROFILE_SETUP',
  STORY_SELECT = 'STORY_SELECT',
  STORY_PLAYER = 'STORY_PLAYER',
}

export interface UserProfile {
  name: string;
  avatarUrl: string;
  description: string;
}

export interface Story {
  id: string;
  title: string;
  description: string;
  initialPrompt: string;
  coverImage: string;
  bibleReference?: BibleReference;
}

export interface StorySegment {
  type: 'narrator' | 'user' | 'lesson' | 'question' | 'answer';
  text: string;
  imageUrl?: string;
  choices?: string[];
  isLoadingImage?: boolean;
}

export interface GeminiStoryResponse {
    narrative: string;
    imagePrompt: string;
    choices: string[];
    lesson: string | null;
    isComplete?: boolean;
}

// Narration and Audio Types
export interface NarrationSettings {
  enabled: boolean;
  voiceURI: string;
  voiceName: string;
  speed: number; // 1.0, 1.25, 1.5
  autoPlay: boolean;
}

export interface AudioCacheEntry {
  text: string;
  audioBlob: Blob;
  voiceURI: string;
  speed: number;
  timestamp: number;
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
}

export interface SavedProgress {
  [storyId: string]: StoryProgress;
}

export interface AppSettings {
  narration: NarrationSettings;
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