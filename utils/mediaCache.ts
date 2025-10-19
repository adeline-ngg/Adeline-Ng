import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { MediaCacheEntry } from '../types';

interface MediaCacheDB extends DBSchema {
  mediaCache: {
    key: string;
    value: MediaCacheEntry;
    indexes: { 'by-timestamp': number };
  };
}

const DB_NAME = 'biblical-journeys-media';
const STORE_NAME = 'mediaCache';
const DB_VERSION = 1;
const MAX_CACHE_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const MAX_CACHE_ENTRIES = 50; // Videos are larger than audio files

/**
 * Initialize and get the IndexedDB database
 */
async function getDB(): Promise<IDBPDatabase<MediaCacheDB>> {
  return openDB<MediaCacheDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME);
        store.createIndex('by-timestamp', 'timestamp');
      }
    },
  });
}

/**
 * Generate cache key from prompt, model, duration, and media type
 */
function generateCacheKey(
  prompt: string, 
  model: string, 
  duration: number, 
  mediaType: 'gif' | 'video' | 'image'
): string {
  // Normalize prompt for consistent caching
  const normalizedPrompt = prompt.trim().toLowerCase();
  return `${mediaType}:${model}:${duration}:${normalizedPrompt}`;
}

/**
 * Store media blob in cache
 */
export async function cacheMediaBlob(
  prompt: string,
  mediaBlob: Blob,
  model: string,
  duration: number,
  mediaType: 'gif' | 'video' | 'image'
): Promise<void> {
  try {
    const db = await getDB();
    const key = generateCacheKey(prompt, model, duration, mediaType);
    
    const entry: MediaCacheEntry = {
      prompt,
      mediaBlob,
      model,
      duration,
      timestamp: Date.now(),
      mediaType,
    };

    await db.put(STORE_NAME, entry, key);
    
    // Clean up old entries if cache is too large
    await cleanupCache(db);
  } catch (error) {
    console.error('Error caching media blob:', error);
  }
}

/**
 * Retrieve media blob from cache
 */
export async function getCachedMediaBlob(
  prompt: string,
  model: string,
  duration: number,
  mediaType: 'gif' | 'video' | 'image'
): Promise<Blob | null> {
  try {
    const db = await getDB();
    const key = generateCacheKey(prompt, model, duration, mediaType);
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

    return entry.mediaBlob;
  } catch (error) {
    console.error('Error retrieving cached media blob:', error);
    return null;
  }
}

/**
 * Clean up old cache entries
 */
async function cleanupCache(db: IDBPDatabase<MediaCacheDB>): Promise<void> {
  try {
    const allEntries = await db.getAllFromIndex(STORE_NAME, 'by-timestamp');
    
    // Remove expired entries
    const now = Date.now();
    for (const entry of allEntries) {
      if (now - entry.timestamp > MAX_CACHE_AGE_MS) {
        const key = generateCacheKey(entry.prompt, entry.model, entry.duration, entry.mediaType);
        await db.delete(STORE_NAME, key);
      }
    }

    // If still over limit, remove oldest entries
    const remainingEntries = await db.getAllFromIndex(STORE_NAME, 'by-timestamp');
    if (remainingEntries.length > MAX_CACHE_ENTRIES) {
      const entriesToRemove = remainingEntries.length - MAX_CACHE_ENTRIES;
      for (let i = 0; i < entriesToRemove; i++) {
        const entry = remainingEntries[i];
        const key = generateCacheKey(entry.prompt, entry.model, entry.duration, entry.mediaType);
        await db.delete(STORE_NAME, key);
      }
    }
  } catch (error) {
    console.error('Error cleaning up cache:', error);
  }
}

/**
 * Clear all media cache
 */
export async function clearMediaCache(): Promise<void> {
  try {
    const db = await getDB();
    await db.clear(STORE_NAME);
  } catch (error) {
    console.error('Error clearing media cache:', error);
  }
}

/**
 * Get cache statistics
 */
export async function getMediaCacheStats(): Promise<{
  entryCount: number;
  oldestEntry: number | null;
  newestEntry: number | null;
  totalSizeEstimate: number; // Rough estimate in bytes
}> {
  try {
    const db = await getDB();
    const allEntries = await db.getAllFromIndex(STORE_NAME, 'by-timestamp');
    
    if (allEntries.length === 0) {
      return { entryCount: 0, oldestEntry: null, newestEntry: null, totalSizeEstimate: 0 };
    }

    // Estimate total size (rough calculation)
    let totalSizeEstimate = 0;
    for (const entry of allEntries) {
      totalSizeEstimate += entry.mediaBlob.size;
    }

    return {
      entryCount: allEntries.length,
      oldestEntry: allEntries[0].timestamp,
      newestEntry: allEntries[allEntries.length - 1].timestamp,
      totalSizeEstimate,
    };
  } catch (error) {
    console.error('Error getting media cache stats:', error);
    return { entryCount: 0, oldestEntry: null, newestEntry: null, totalSizeEstimate: 0 };
  }
}

/**
 * Format bytes to human readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
