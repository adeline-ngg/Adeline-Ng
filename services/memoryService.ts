import { UserPreferences, MemoryContext } from '../types';

/**
 * Memory Service using Mem0
 * Tracks user preferences and interaction patterns
 * Note: This is optional and will gracefully degrade if Mem0 is not configured
 */

let memoryClient: any = null;
let isInitialized = false;

/**
 * Initialize Mem0 client
 * Call this early in app lifecycle
 */
export async function initializeMemory(apiKey?: string): Promise<boolean> {
  if (isInitialized) return true;

  try {
    // Check if API key is available
    const key = apiKey || import.meta.env.VITE_MEMO_API_KEY || import.meta.env.VITE_MEM0_API_KEY;
    
    if (!key) {
      console.info('Mem0 API key not found. Memory features will be disabled (this is optional).');
      return false;
    }

    // Dynamically import mem0ai to avoid issues if not configured
    const { MemoryClient } = await import('mem0ai');
    memoryClient = new MemoryClient({ apiKey: key });
    isInitialized = true;
    console.log('Mem0 memory service initialized');
    return true;
  } catch (error) {
    // Check for CORS or network-related errors
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    if (errorMessage.includes('CORS') || 
        errorMessage.includes('Failed to fetch') || 
        errorMessage.includes('net::ERR_FAILED') ||
        errorMessage.includes('blocked by CORS policy')) {
      console.info('Mem0 API is not accessible from browser (CORS restrictions). Memory features will be disabled (this is optional).');
    } else if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
      console.warn('Invalid Mem0 API key. Memory features will be disabled.');
    } else if (errorMessage.includes('403') || errorMessage.includes('Forbidden')) {
      console.warn('Mem0 API access denied. Memory features will be disabled.');
    } else {
      console.warn('Mem0 initialization failed. Memory features will be disabled (this is optional):', errorMessage);
    }
    
    memoryClient = null;
    isInitialized = false;
    return false;
  }
}

/**
 * Check if memory service is available
 */
export function isMemoryAvailable(): boolean {
  return isInitialized && memoryClient !== null;
}

/**
 * Store a memory about user's choice or preference
 */
export async function storeUserMemory(
  userId: string,
  memory: string,
  metadata?: Record<string, any>
): Promise<boolean> {
  if (!isMemoryAvailable()) return false;

  try {
    await memoryClient!.add(memory, { 
      user_id: userId,
      ...metadata 
    });
    return true;
  } catch (error) {
    console.error('Error storing memory:', error);
    return false;
  }
}

/**
 * Track a story choice
 */
export async function trackChoice(
  userId: string,
  storyId: string,
  choice: string,
  context: string
): Promise<void> {
  if (!isMemoryAvailable()) return;

  const memory = `In the story "${storyId}", when ${context}, the user chose to: "${choice}"`;
  
  await storeUserMemory(userId, memory, {
    type: 'choice',
    story_id: storyId,
    choice,
  });
}

/**
 * Track user interaction style
 */
export async function trackInteractionStyle(
  userId: string,
  style: 'conversational' | 'decisive' | 'exploratory' | 'cautious'
): Promise<void> {
  if (!isMemoryAvailable()) return;

  const memory = `The user has a ${style} interaction style when experiencing stories`;
  
  await storeUserMemory(userId, memory, {
    type: 'style',
    style,
  });
}

/**
 * Track preferred themes
 */
export async function trackThemePreference(
  userId: string,
  theme: string
): Promise<void> {
  if (!isMemoryAvailable()) return;

  const memory = `The user is interested in ${theme} themes in biblical stories`;
  
  await storeUserMemory(userId, memory, {
    type: 'theme',
    theme,
  });
}

/**
 * Search memories for context
 */
export async function searchMemories(
  userId: string,
  query: string,
  limit: number = 5
): Promise<string[]> {
  if (!isMemoryAvailable()) return [];

  try {
    const results = await memoryClient!.search(query, { 
      user_id: userId,
      limit 
    });
    
    // Extract memory text from results
    return results.map((result: any) => result.memory || result.text || '').filter(Boolean);
  } catch (error) {
    console.error('Error searching memories:', error);
    return [];
  }
}

/**
 * Get all memories for a user
 */
export async function getUserMemories(userId: string): Promise<string[]> {
  if (!isMemoryAvailable()) return [];

  try {
    const results = await memoryClient!.getAll({ user_id: userId });
    return results.map((result: any) => result.memory || result.text || '').filter(Boolean);
  } catch (error) {
    console.error('Error getting user memories:', error);
    return [];
  }
}

/**
 * Analyze user preferences from memories
 */
export async function analyzeUserPreferences(userId: string): Promise<UserPreferences> {
  const defaultPreferences: UserPreferences = {
    choicePatterns: [],
    favoriteThemes: [],
    interactionStyle: 'exploratory',
  };

  if (!isMemoryAvailable()) return defaultPreferences;

  try {
    // Search for different types of memories
    const choiceMemories = await searchMemories(userId, 'user chose', 10);
    const themeMemories = await searchMemories(userId, 'interested in', 5);
    const styleMemories = await searchMemories(userId, 'interaction style', 1);

    // Extract patterns from memories
    const choicePatterns = extractPatterns(choiceMemories);
    const favoriteThemes = extractThemes(themeMemories);
    const interactionStyle = extractStyle(styleMemories);

    return {
      choicePatterns,
      favoriteThemes,
      interactionStyle,
    };
  } catch (error) {
    console.error('Error analyzing user preferences:', error);
    return defaultPreferences;
  }
}

/**
 * Get memory-enhanced story prompt
 * Adds user preferences to story generation
 */
export async function enhancePromptWithMemory(
  userId: string,
  basePrompt: string,
  storyContext: string
): Promise<string> {
  if (!isMemoryAvailable()) return basePrompt;

  try {
    // Search for relevant memories
    const relevantMemories = await searchMemories(userId, storyContext, 3);
    
    if (relevantMemories.length === 0) {
      return basePrompt;
    }

    // Add memory context to prompt
    const memoryContext = relevantMemories.join('. ');
    const enhancedPrompt = `${basePrompt}\n\nUser context (consider these preferences subtly): ${memoryContext}`;
    
    return enhancedPrompt;
  } catch (error) {
    console.error('Error enhancing prompt:', error);
    return basePrompt;
  }
}

/**
 * Clear all memories for a user
 */
export async function clearUserMemories(userId: string): Promise<boolean> {
  if (!isMemoryAvailable()) return false;

  try {
    await memoryClient!.deleteAll({ user_id: userId });
    return true;
  } catch (error) {
    console.error('Error clearing memories:', error);
    return false;
  }
}

// Helper functions for analyzing memories

function extractPatterns(memories: string[]): string[] {
  const patterns: string[] = [];
  
  for (const memory of memories) {
    // Extract choice patterns using simple text analysis
    if (memory.includes('peaceful') || memory.includes('kind')) {
      patterns.push('peaceful');
    }
    if (memory.includes('brave') || memory.includes('courageous')) {
      patterns.push('courageous');
    }
    if (memory.includes('wise') || memory.includes('thoughtful')) {
      patterns.push('thoughtful');
    }
    if (memory.includes('help') || memory.includes('assist')) {
      patterns.push('helpful');
    }
  }
  
  // Return unique patterns
  return [...new Set(patterns)];
}

function extractThemes(memories: string[]): string[] {
  const themes: string[] = [];
  
  for (const memory of memories) {
    // Extract common biblical themes
    if (memory.includes('faith')) themes.push('faith');
    if (memory.includes('courage')) themes.push('courage');
    if (memory.includes('redemption')) themes.push('redemption');
    if (memory.includes('wisdom')) themes.push('wisdom');
    if (memory.includes('mercy')) themes.push('mercy');
    if (memory.includes('justice')) themes.push('justice');
  }
  
  return [...new Set(themes)];
}

function extractStyle(memories: string[]): string {
  if (memories.length === 0) return 'exploratory';
  
  const lastStyle = memories[0];
  
  if (lastStyle.includes('conversational')) return 'conversational';
  if (lastStyle.includes('decisive')) return 'decisive';
  if (lastStyle.includes('cautious')) return 'cautious';
  
  return 'exploratory';
}

