import { SpeechifyClient } from '@speechify/api';
import { SpeechifySettings, SpeechifyVoice } from '../types';
import { SPEECHIFY_VOICES } from '../constants';

/**
 * Speechify Service for high-quality text-to-speech
 * Provides speech synthesis using Speechify API as a fallback to ElevenLabs
 */
class SpeechifyService {
  private client: SpeechifyClient | null = null;
  private apiKey: string | null = null;

  constructor() {
    this.initializeClient();
  }

  private initializeClient() {
    // Get API key from environment variable or use hardcoded fallback
    const envApiKey = import.meta.env.VITE_SPEECHIFY_API_KEY;
    const hardcodedKey = 'YIyShAr01-zKPuSfla8lY_7TN6Bh6YVLppHTGNlF1d8=';
    
    // Debug: Check environment variable loading
    console.log('Speechify env key loaded:', envApiKey ? 'YES' : 'NO');
    console.log('Using API key source:', envApiKey ? 'environment variable' : 'hardcoded fallback');
    
    const apiKey = envApiKey || hardcodedKey;
    
    if (apiKey) {
      this.apiKey = apiKey;
      this.client = new SpeechifyClient({
        token: apiKey,
      });
      console.log('Speechify service initialized successfully');
    } else {
      // Initialize without API key - will be set later via setApiKey()
      this.apiKey = null;
      this.client = null;
      console.log('Speechify service initialized without API key');
    }
  }

  /**
   * Initialize client with custom API key
   */
  public setApiKey(apiKey: string): void {
    if (apiKey && apiKey.trim()) {
      // User-provided API key takes precedence
      this.apiKey = apiKey.trim();
      this.client = new SpeechifyClient({
        token: apiKey.trim(),
      });
      console.log('Speechify API key updated via setApiKey()');
    } else {
      // If empty key, try to use environment variable or hardcoded fallback
      const envApiKey = import.meta.env.VITE_SPEECHIFY_API_KEY;
      const hardcodedKey = 'YIyShAr01-zKPuSfla8lY_7TN6Bh6YVLppHTGNlF1d8=';
      const fallbackKey = envApiKey || hardcodedKey;
      
      if (fallbackKey) {
        this.apiKey = fallbackKey;
        this.client = new SpeechifyClient({
          token: fallbackKey,
        });
        console.log('Speechify API key set to fallback:', envApiKey ? 'environment variable' : 'hardcoded');
      } else {
        this.apiKey = null;
        this.client = null;
        console.log('Speechify API key cleared');
      }
    }
  }

  /**
   * Check if Speechify is configured
   */
  public isConfigured(): boolean {
    // Check if we have a stored API key override first (user-provided takes precedence)
    const hasStoredKey = this.apiKey !== null && this.apiKey !== '';
    
    // If no stored key, check environment variable or hardcoded fallback
    const envApiKey = import.meta.env.VITE_SPEECHIFY_API_KEY;
    const hardcodedKey = 'YIyShAr01-zKPuSfla8lY_7TN6Bh6YVLppHTGNlF1d8=';
    const hasFallbackKey = envApiKey || hardcodedKey;
    
    // Check if we have a client initialized
    const hasClient = this.client !== null;
    
    const isConfigured = (hasStoredKey || hasFallbackKey) && hasClient;
    console.log('Speechify isConfigured check:', { hasStoredKey, hasFallbackKey, hasClient, isConfigured });
    
    return isConfigured;
  }

  /**
   * Get available voices
   */
  public getAvailableVoices(): SpeechifyVoice[] {
    return SPEECHIFY_VOICES;
  }

  /**
   * Get voice by ID
   */
  public getVoiceById(voiceId: string): SpeechifyVoice | null {
    return SPEECHIFY_VOICES.find(voice => voice.id === voiceId) || null;
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
      throw new Error('Speechify not configured. Please set your API key.');
    }

    if (!text.trim()) {
      throw new Error('Text cannot be empty');
    }

    try {
      // Call Speechify TTS API
      const response = await this.client.tts.audio.speech({
        input: text,
        voiceId: voiceId,
      });

      // Convert Base64 audio data to blob
      if (response && response.audioData) {
        // Convert Base64 to binary
        const binaryString = atob(response.audioData);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        
        // Determine MIME type based on audio format
        const mimeType = response.audioFormat === 'mp3' ? 'audio/mpeg' : 
                        response.audioFormat === 'wav' ? 'audio/wav' : 
                        response.audioFormat === 'ogg' ? 'audio/ogg' : 'audio/mpeg';
        
        return new Blob([bytes], { type: mimeType });
      } else {
        throw new Error('No audio data received from Speechify API');
      }
    } catch (error) {
      console.error('Speechify synthesis error:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      
      if (error instanceof Error) {
        // Log the full error message for debugging
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        
        if (error.message.includes('401') || error.message.includes('Unauthorized')) {
          throw new Error('Invalid Speechify API key. Please check your configuration.');
        } else if (error.message.includes('429') || error.message.includes('rate limit')) {
          throw new Error('Speechify rate limit exceeded. Please try again later.');
        } else if (error.message.includes('402') || error.message.includes('Payment Required') || error.message.includes('credits')) {
          throw new Error('Speechify credits exhausted. Please add credits to your account.');
        } else if (error.message.includes('voice')) {
          throw new Error('Selected voice is not available. Please choose a different voice.');
        }
        
        // Re-throw with original error message for better debugging
        throw new Error(`Speechify API error: ${error.message}`);
      }
      
      throw new Error('Failed to generate speech with Speechify. Please try again.');
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
  public getDefaultSettings(): SpeechifySettings {
    return {
      enabled: false,
      selectedVoiceId: 'jesse', // Default to Jesse voice
    };
  }
}

// Export singleton instance
export const speechifyService = new SpeechifyService();
