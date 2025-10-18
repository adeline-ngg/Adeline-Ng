import { NarrationSettings } from '../types';

/**
 * Speech Service using Web Speech API
 * Provides text-to-speech functionality with voice selection and playback controls
 */
class SpeechService {
  private synth: SpeechSynthesis;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private voices: SpeechSynthesisVoice[] = [];
  private voicesLoaded = false;

  constructor() {
    this.synth = window.speechSynthesis;
    this.loadVoices();
    
    // Voice list is loaded asynchronously in some browsers
    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = () => {
        this.loadVoices();
      };
    }
  }

  private loadVoices() {
    this.voices = this.synth.getVoices();
    this.voicesLoaded = this.voices.length > 0;
  }

  /**
   * Get all available voices
   */
  public getAvailableVoices(): SpeechSynthesisVoice[] {
    if (!this.voicesLoaded) {
      this.loadVoices();
    }
    return this.voices;
  }

  /**
   * Get default voice based on language preference
   */
  public getDefaultVoice(): SpeechSynthesisVoice | null {
    const voices = this.getAvailableVoices();
    
    // Try to find English voices first
    const englishVoice = voices.find(voice => voice.lang.startsWith('en'));
    if (englishVoice) return englishVoice;
    
    // Fallback to default voice
    return voices[0] || null;
  }

  /**
   * Get voice by URI
   */
  public getVoiceByURI(voiceURI: string): SpeechSynthesisVoice | null {
    return this.getAvailableVoices().find(voice => voice.voiceURI === voiceURI) || null;
  }

  /**
   * Speak text with given settings
   */
  public speak(
    text: string,
    settings: NarrationSettings,
    onEnd?: () => void,
    onError?: (error: Error) => void
  ): void {
    // Cancel any ongoing speech
    this.stop();

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Set voice
    const voice = this.getVoiceByURI(settings.voiceURI);
    if (voice) {
      utterance.voice = voice;
    }

    // Set speech rate (speed)
    utterance.rate = settings.speed;
    
    // Set other properties
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    // Event handlers
    utterance.onend = () => {
      this.currentUtterance = null;
      if (onEnd) onEnd();
    };

    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event);
      this.currentUtterance = null;
      if (onError) {
        onError(new Error(`Speech synthesis error: ${event.error}`));
      }
    };

    this.currentUtterance = utterance;
    this.synth.speak(utterance);
  }

  /**
   * Pause current speech
   */
  public pause(): void {
    if (this.synth.speaking && !this.synth.paused) {
      this.synth.pause();
    }
  }

  /**
   * Resume paused speech
   */
  public resume(): void {
    if (this.synth.paused) {
      this.synth.resume();
    }
  }

  /**
   * Stop current speech
   */
  public stop(): void {
    this.synth.cancel();
    this.currentUtterance = null;
  }

  /**
   * Check if currently speaking
   */
  public isSpeaking(): boolean {
    return this.synth.speaking;
  }

  /**
   * Check if currently paused
   */
  public isPaused(): boolean {
    return this.synth.paused;
  }

  /**
   * Check if Web Speech API is supported
   */
  public static isSupported(): boolean {
    return 'speechSynthesis' in window;
  }
}

// Export singleton instance
export const speechService = new SpeechService();

/**
 * Get default narration settings
 */
export const getDefaultNarrationSettings = (): NarrationSettings => {
  const defaultVoice = speechService.getDefaultVoice();
  return {
    enabled: false, // User must opt-in
    voiceURI: defaultVoice?.voiceURI || '',
    voiceName: defaultVoice?.name || 'Default',
    speed: 1.0,
    autoPlay: false,
    provider: 'webspeech',
  };
};

