import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';
import { ElevenLabsSettings, ElevenLabsVoice } from '../types';
import { ELEVENLABS_VOICES } from '../constants';

/**
 * Custom error class for ElevenLabs quota exceeded errors
 */
export class QuotaExceededError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'QuotaExceededError';
  }
}

/**
 * ElevenLabs Service for high-quality text-to-speech
 * Provides speech synthesis using ElevenLabs API
 */
class ElevenLabsService {
  private client: ElevenLabsClient | null = null;
  private apiKey: string | null = null;

  constructor() {
    this.initializeClient();
  }

  private initializeClient() {
    // Get API key from environment variable
    const envApiKey = import.meta.env.VITE_ELEVENLABS_API_KEY;
    if (envApiKey) {
      this.apiKey = envApiKey;
      this.client = new ElevenLabsClient({
        apiKey: envApiKey,
      });
    } else {
      // Initialize without API key - will be set later via setApiKey()
      this.apiKey = null;
      this.client = null;
    }
  }

  /**
   * Initialize client with custom API key
   */
  public setApiKey(apiKey: string): void {
    if (apiKey && apiKey.trim()) {
      // User-provided API key takes precedence
      this.apiKey = apiKey.trim();
      this.client = new ElevenLabsClient({
        apiKey: apiKey.trim(),
      });
    } else {
      // If empty key, try to use environment variable as fallback
      const envApiKey = import.meta.env.VITE_ELEVENLABS_API_KEY;
      if (envApiKey) {
        this.apiKey = envApiKey;
        this.client = new ElevenLabsClient({
          apiKey: envApiKey,
        });
      } else {
        this.apiKey = null;
        this.client = null;
      }
    }
  }

  /**
   * Check if ElevenLabs is configured
   */
  public isConfigured(): boolean {
    // Check if we have a stored API key override first (user-provided takes precedence)
    const hasStoredKey = this.apiKey !== null && this.apiKey !== '';
    
    // If no stored key, check environment variable
    const envApiKey = import.meta.env.VITE_ELEVENLABS_API_KEY;
    
    // Check if we have a client initialized
    const hasClient = this.client !== null;
    
    return (hasStoredKey || envApiKey) && hasClient;
  }

  /**
   * Get available voices
   */
  public getAvailableVoices(): ElevenLabsVoice[] {
    return ELEVENLABS_VOICES;
  }

  /**
   * Get voice by ID
   */
  public getVoiceById(voiceId: string): ElevenLabsVoice | null {
    return ELEVENLABS_VOICES.find(voice => voice.id === voiceId) || null;
  }

  /**
   * Synthesize speech from text
   */
  public async synthesizeSpeech(
    text: string, 
    voiceId: string,
    onProgress?: (progress: number) => void
  ): Promise<Blob> {
    if (!this.client) {
      throw new Error('ElevenLabs not configured. Please set your API key.');
    }

    if (!text.trim()) {
      throw new Error('Text cannot be empty');
    }

    try {
      const audio = await this.client.textToSpeech.convert(voiceId, {
        text: text,
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.5,
          style: 0.0,
          use_speaker_boost: true
        }
      });

      // Convert stream to blob
      const chunks: Uint8Array[] = [];
      const reader = audio.getReader();
      
      let totalLength = 0;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        chunks.push(value);
        totalLength += value.length;
        
        if (onProgress) {
          onProgress(totalLength);
        }
      }

      const audioData = new Uint8Array(totalLength);
      let offset = 0;
      for (const chunk of chunks) {
        audioData.set(chunk, offset);
        offset += chunk.length;
      }

      return new Blob([audioData], { type: 'audio/mpeg' });
    } catch (error) {
      console.error('ElevenLabs synthesis error:', error);
      
      if (error instanceof Error) {
        // Check for quota exceeded error specifically
        if (error.message.includes('quota_exceeded') || 
            (error.message.includes('401') && error.message.includes('quota'))) {
          throw new QuotaExceededError('ElevenLabs quota exceeded. Please try again later or use a different voice provider.');
        } else if (error.message.includes('401')) {
          throw new Error('Invalid ElevenLabs API key. Please check your configuration.');
        } else if (error.message.includes('429')) {
          throw new Error('ElevenLabs rate limit exceeded. Please try again later.');
        } else if (error.message.includes('voice')) {
          throw new Error('Selected voice is not available. Please choose a different voice.');
        }
      }
      
      throw new Error('Failed to generate speech. Please try again.');
    }
  }

  /**
   * Test voice with sample text
   */
  public async testVoice(voiceId: string): Promise<Blob> {
    const sampleText = "This is how the narrator will sound when reading the story.";
    return this.synthesizeSpeech(sampleText, voiceId);
  }

  /**
   * Get default settings
   */
  public getDefaultSettings(): ElevenLabsSettings {
    return {
      enabled: false,
      selectedVoiceId: ELEVENLABS_VOICES[0].id, // David
      autoPlay: false,
    };
  }
}

// Export singleton instance
export const elevenLabsService = new ElevenLabsService();
