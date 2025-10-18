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
}

export interface StorySegment {
  type: 'narrator' | 'user' | 'lesson' | 'question' | 'answer';
  text: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  choices?: string[];
  isLoadingMedia?: boolean;
}

export interface GeminiStoryResponse {
    narrative: string;
    imagePrompt: string;
    choices: string[];
    lesson: string | null;
}