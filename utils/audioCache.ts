import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { AudioCacheEntry } from '../types';

interface AudioCacheDB extends DBSchema {
  audioCache: {
    key: string;
    value: AudioCacheEntry;
    indexes: { 'by-timestamp': number };
  };
}

const DB_NAME = 'biblical-journeys-audio';
const STORE_NAME = 'audioCache';
const DB_VERSION = 1;
const MAX_CACHE_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const MAX_CACHE_ENTRIES = 100;

/**
 * Initialize and get the IndexedDB database
 */
async function getDB(): Promise<IDBPDatabase<AudioCacheDB>> {
  return openDB<AudioCacheDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME);
        store.createIndex('by-timestamp', 'timestamp');
      }
    },
  });
}

/**
 * Generate cache key from text, voice, speed, and provider
 */
function generateCacheKey(text: string, voiceURI: string, speed: number, provider: 'webspeech' | 'elevenlabs'): string {
  const normalized = text.trim().toLowerCase();
  return `${provider}:${voiceURI}:${speed}:${normalized}`;
}

/**
 * Store audio blob in cache
 */
export async function cacheAudioBlob(
  text: string,
  audioBlob: Blob,
  voiceURI: string,
  speed: number,
  provider: 'webspeech' | 'elevenlabs'
): Promise<void> {
  try {
    const db = await getDB();
    const key = generateCacheKey(text, voiceURI, speed, provider);
    
    const entry: AudioCacheEntry = {
      text,
      audioBlob,
      voiceURI,
      speed,
      timestamp: Date.now(),
      provider,
    };

    await db.put(STORE_NAME, entry, key);
    
    // Clean up old entries if cache is too large
    await cleanupCache(db);
  } catch (error) {
    console.error('Error caching audio blob:', error);
  }
}

/**
 * Retrieve audio blob from cache
 */
export async function getCachedAudioBlob(
  text: string,
  voiceURI: string,
  speed: number,
  provider: 'webspeech' | 'elevenlabs'
): Promise<Blob | null> {
  try {
    const db = await getDB();
    const key = generateCacheKey(text, voiceURI, speed, provider);
    const entry = await db.get(STORE_NAME, key);

    if (!entry) {
      return null;
    }

    // Check if entry is expired
    const age = Date.now() - entry.timestamp;
    if (age > MAX_CACHE_AGE_MS) {
      await db.delete(STORE_NAME, key);
      return null;
    }

    return entry.audioBlob;
  } catch (error) {
    console.error('Error retrieving cached audio blob:', error);
    return null;
  }
}

/**
 * Clean up old cache entries
 */
async function cleanupCache(db: IDBPDatabase<AudioCacheDB>): Promise<void> {
  try {
    const allEntries = await db.getAllFromIndex(STORE_NAME, 'by-timestamp');
    
    // Remove expired entries
    const now = Date.now();
    for (const entry of allEntries) {
      if (now - entry.timestamp > MAX_CACHE_AGE_MS) {
        const key = generateCacheKey(entry.text, entry.voiceURI, entry.speed, entry.provider);
        await db.delete(STORE_NAME, key);
      }
    }

    // If still over limit, remove oldest entries
    const remainingEntries = await db.getAllFromIndex(STORE_NAME, 'by-timestamp');
    if (remainingEntries.length > MAX_CACHE_ENTRIES) {
      const entriesToRemove = remainingEntries.length - MAX_CACHE_ENTRIES;
      for (let i = 0; i < entriesToRemove; i++) {
        const entry = remainingEntries[i];
        const key = generateCacheKey(entry.text, entry.voiceURI, entry.speed, entry.provider);
        await db.delete(STORE_NAME, key);
      }
    }
  } catch (error) {
    console.error('Error cleaning up cache:', error);
  }
}

/**
 * Clear all audio cache
 */
export async function clearAudioCache(): Promise<void> {
  try {
    const db = await getDB();
    await db.clear(STORE_NAME);
  } catch (error) {
    console.error('Error clearing audio cache:', error);
  }
}

/**
 * Get cache statistics
 */
export async function getCacheStats(): Promise<{
  entryCount: number;
  oldestEntry: number | null;
  newestEntry: number | null;
}> {
  try {
    const db = await getDB();
    const allEntries = await db.getAllFromIndex(STORE_NAME, 'by-timestamp');
    
    if (allEntries.length === 0) {
      return { entryCount: 0, oldestEntry: null, newestEntry: null };
    }

    return {
      entryCount: allEntries.length,
      oldestEntry: allEntries[0].timestamp,
      newestEntry: allEntries[allEntries.length - 1].timestamp,
    };
  } catch (error) {
    console.error('Error getting cache stats:', error);
    return { entryCount: 0, oldestEntry: null, newestEntry: null };
  }
}

