import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Story, UserProfile, StorySegment, GeminiStoryResponse, NarrationSettings, ElevenLabsSettings, SpeechifySettings } from '../types';
import { generateStorySegment, generateSceneImageWithCharacters, generateClarification, generateLessonTitle } from '../services/geminiService';
import { speechService } from '../services/speechService';
import { elevenLabsService, QuotaExceededError } from '../services/elevenLabsService';
import { speechifyService } from '../services/speechifyService';
import { falService, QuotaExceededError as FalQuotaExceededError, TimeoutError as FalTimeoutError, FalConfigurationError } from '../services/falService';
import { loadSettings, saveStoryProgress, loadStoryProgress, loadElevenLabsSettings, loadSpeechifySettings, loadFalSettings, saveFalSettings, isStorageNearQuota, forceCleanupStorage } from '../services/storageService';
import { trackChoice, isMemoryAvailable } from '../services/memoryService';
import { formatNarrative, addDropCap, NARRATIVE_TYPOGRAPHY, HEADER_TYPOGRAPHY } from '../utils/textFormatting';
import { getCachedAudioBlob, cacheAudioBlob } from '../utils/audioCache';
import { ELEVENLABS_VOICES } from '../constants';
import LoadingSpinner from './LoadingSpinner';
import BibleTextModal from './BibleTextModal';

interface StoryPlayerProps {
  userProfile: UserProfile;
  story: Story;
  shouldContinue: boolean;
  isReplayMode?: boolean;
  onExit: () => void;
}

const StoryPlayer: React.FC<StoryPlayerProps> = ({ userProfile, story, shouldContinue, isReplayMode = false, onExit }) => {
  const [segments, setSegments] = useState<StorySegment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [choices, setChoices] = useState<string[]>([]);
  const [question, setQuestion] = useState('');
  const [isAnswering, setIsAnswering] = useState(false);
  const [narrationSettings, setNarrationSettings] = useState<NarrationSettings>(loadSettings().narration);
  const [elevenLabsSettings, setElevenLabsSettings] = useState<ElevenLabsSettings>(loadElevenLabsSettings());
  const [speechifySettings, setSpeechifySettings] = useState<SpeechifySettings>(loadSpeechifySettings());
  
  // Debug: Log narration settings on component mount and when they change
  useEffect(() => {
    console.log('StoryPlayer: Narration settings loaded:', narrationSettings);
    console.log('StoryPlayer: Narration enabled:', narrationSettings.enabled);
    console.log('StoryPlayer: Narration provider:', narrationSettings.provider);
  }, [narrationSettings]);

  // Refresh settings when component becomes visible (user returns from Settings)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('StoryPlayer: Refreshing settings after returning from Settings');
        const updatedSettings = loadSettings();
        setNarrationSettings(updatedSettings.narration);
        setElevenLabsSettings(loadElevenLabsSettings());
        setSpeechifySettings(loadSpeechifySettings());
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);
  const [currentlyPlayingIndex, setCurrentlyPlayingIndex] = useState<number | null>(null);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentAudioElement, setCurrentAudioElement] = useState<HTMLAudioElement | null>(null);
  const [characterDescriptions, setCharacterDescriptions] = useState<string>('');
  const [currentEnvironment, setCurrentEnvironment] = useState<string>('');
  const [userChoiceCount, setUserChoiceCount] = useState(0);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [showBibleModal, setShowBibleModal] = useState(false);
  const [expandedLessons, setExpandedLessons] = useState<Set<string>>(new Set());
  const [lessonTitles, setLessonTitles] = useState<Map<string, string>>(new Map());
  const [lessonTitlesLoading, setLessonTitlesLoading] = useState<Set<string>>(new Set());
  const [showStorageWarning, setShowStorageWarning] = useState(false);
  const [gifError, setGifError] = useState<string | null>(null);
  const [fallbackNotification, setFallbackNotification] = useState<string | null>(null);
  const [gifGeneratedCount, setGifGeneratedCount] = useState(0); // Track GIFs generated per story
  const storyHistory = useRef<string[]>([]);
  const endOfMessagesRef = useRef<HTMLDivElement>(null);
  const isGeneratingRef = useRef(false); // Prevent concurrent API calls

  const scrollToBottom = () => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const toggleLessonExpansion = (lessonId: string) => {
    setExpandedLessons(prev => {
      const newSet = new Set(prev);
      if (newSet.has(lessonId)) {
        newSet.delete(lessonId);
      } else {
        newSet.add(lessonId);
      }
      return newSet;
    });
  };

  const generateLessonTitleIfNeeded = async (lessonId: string, lessonText: string) => {
    // Check if title already exists or is being generated
    if (lessonTitles.has(lessonId) || lessonTitlesLoading.has(lessonId)) {
      return;
    }

    // Mark as loading
    setLessonTitlesLoading(prev => new Set(prev).add(lessonId));

    try {
      const title = await generateLessonTitle(lessonText);
      setLessonTitles(prev => new Map(prev).set(lessonId, title));
    } catch (error) {
      console.error('Error generating lesson title:', error);
      // Fallback to first sentence
      const fallbackTitle = lessonText.split('.')[0].substring(0, 50) + (lessonText.split('.')[0].length > 50 ? '...' : '');
      setLessonTitles(prev => new Map(prev).set(lessonId, fallbackTitle));
    } finally {
      // Remove from loading set
      setLessonTitlesLoading(prev => {
        const newSet = new Set(prev);
        newSet.delete(lessonId);
        return newSet;
      });
    }
  };

  const scrollToNewSegment = (segmentIndex: number) => {
    // Scroll to the new segment with proper timing and header offset
    setTimeout(() => {
      const segmentElement = document.querySelector(`[data-segment-index="${segmentIndex}"]`);
      if (segmentElement) {
        // Calculate the header height to account for sticky header
        const header = document.querySelector('header');
        const headerHeight = header ? header.offsetHeight : 0;
        
        // Get the element's position relative to the document
        const elementRect = segmentElement.getBoundingClientRect();
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const elementTop = elementRect.top + scrollTop;
        
        // Calculate the target scroll position (element top minus header height plus small padding)
        const targetScrollTop = elementTop - headerHeight - 20; // 20px padding
        
        // Smooth scroll to the calculated position
        window.scrollTo({
          top: targetScrollTop,
          behavior: 'smooth'
        });
      }
    }, 300); // Increased delay to ensure DOM is fully rendered
  };

  // Calculate progress percentage based on user choice count and completion status
  const calculateProgress = (choiceCount: number, isCompleted: boolean): number => {
    // If story is completed, show 100%
    if (isCompleted) return 100;
    
    // More gradual progression that allows for variable story lengths
    if (choiceCount <= 3) return Math.round((choiceCount / 3) * 30);
    if (choiceCount <= 8) return Math.round(30 + ((choiceCount - 3) / 5) * 40);
    if (choiceCount <= 12) return Math.round(70 + ((choiceCount - 8) / 4) * 25);
    return 95; // Cap at 95% until AI marks story complete
  };

  // Check if story is completed by looking at the latest segments or showCompletionModal state
  const isStoryCompleted = showCompletionModal || segments.some(segment => segment.type === 'narrator' && segment.text.toLowerCase().includes('story is complete'));
  const progressPercentage = calculateProgress(userChoiceCount, isStoryCompleted);

  // Generate character descriptions for consistency across all story images
  const generateCharacterDescriptions = useCallback((userProfile: UserProfile, storyContext: string): string => {
    const userCharacter = `${userProfile.name}, who is described as: "${userProfile.description}"`;
    
    // Extract biblical characters from story context if present
    const biblicalCharacterMatch = storyContext.match(/(?:Jesus|Moses|David|Noah|Abraham|Mary|Joseph|Peter|Paul|John|Elijah|Daniel|Samson|Ruth|Esther|Joshua|Samuel|Solomon|Isaiah|Jeremiah)/gi);
    const biblicalCharacters = biblicalCharacterMatch ? biblicalCharacterMatch.join(', ') : '';
    
    return biblicalCharacters 
      ? `${userCharacter}, and biblical characters: ${biblicalCharacters}`
      : userCharacter;
  }, []);

  // Match AI location to predefined environment zones or store dynamic description
  const updateEnvironmentFromLocation = useCallback((location: string | null): void => {
    if (!location) return;
    
    // Check if location matches any predefined environment zones
    if (story.environmentZones) {
      const matchingZone = story.environmentZones.find(zone => 
        zone.id.toLowerCase().includes(location.toLowerCase()) ||
        zone.name.toLowerCase().includes(location.toLowerCase()) ||
        location.toLowerCase().includes(zone.id.toLowerCase()) ||
        location.toLowerCase().includes(zone.name.toLowerCase())
      );
      
      if (matchingZone) {
        setCurrentEnvironment(matchingZone.description);
        return;
      }
    }
    
    // If no predefined zone matches, store the location as dynamic environment
    setCurrentEnvironment(location);
  }, [story.environmentZones]);

  // Detect when AI is stuck in repetitive loops
  const detectRepetitiveContent = (narrative: string): boolean => {
    const repetitivePhrases = [
      'What is your final choice',
      'What is your final question', 
      'What is your final thought',
      'The story is complete',
      'The story is done',
      'The story is finished',
      'The story is ending',
      'The story is concluding'
    ];
    
    const repetitiveCount = repetitivePhrases.reduce((count, phrase) => {
      return count + (narrative.toLowerCase().includes(phrase.toLowerCase()) ? 1 : 0);
    }, 0);
    
    // If 3 or more repetitive phrases detected, likely stuck in loop
    return repetitiveCount >= 3;
  };

  useEffect(() => {
    // Only auto-scroll to new narrator segment during active story play, not in replay mode
    if (!isReplayMode && segments.length > 0) {
      const lastSegment = segments[segments.length - 1];
      // Only scroll to narrator segments (which have images and story text), not lesson/user/answer segments
      if (lastSegment.type === 'narrator') {
        const newSegmentIndex = segments.length - 1;
        scrollToNewSegment(newSegmentIndex);
      }
    }
  }, [segments, isReplayMode]);

  // Load progress or start new story
  useEffect(() => {
    let isMounted = true; // Prevent duplicate calls in React StrictMode
    
    // Handle replay mode - load completed story segments
    if (isReplayMode) {
      const progress = loadStoryProgress(story.id);
      console.log('Replay mode - loading progress:', progress);
      
      if (progress && progress.isCompleted) {
        // Clean segments for replay mode - ensure no loading states and all images are present
        const cleanedSegments = progress.segments.map(segment => {
          if (segment.type === 'narrator') {
            return {
              ...segment,
              isLoadingImage: false,
              isLoadingGif: false,
              // Ensure there's always an image, use fallback if none exists
              imageUrl: segment.imageUrl || 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1280&h=720&fit=crop'
            };
          }
          return segment;
        });
        
        console.log('Replay mode - cleaned segments:', cleanedSegments);
        setSegments(cleanedSegments);
        setUserChoiceCount(progress.userChoiceCount || 0);
        setCurrentEnvironment(progress.currentEnvironment || '');
        storyHistory.current = progress.storyHistory;
        setIsLoading(false);
        return;
      } else {
        console.log('Replay mode - no completed progress found');
        setIsLoading(false);
        return;
      }
    }
    
    if (shouldContinue) {
      const progress = loadStoryProgress(story.id);
      if (progress) {
        setSegments(progress.segments);
        setChoices(progress.currentChoices);
        setUserChoiceCount(progress.userChoiceCount || 0);
        setCurrentEnvironment(progress.currentEnvironment || '');
        storyHistory.current = progress.storyHistory;
        setIsLoading(false);
        return;
      }
    }
    
    // Only start new story if not already started and not in replay mode
    if (segments.length === 0 && isMounted && !isReplayMode) {
      const initialPrompt = story.initialPrompt
          .replace('{userName}', userProfile.name)
          .replace('{userAvatarDescription}', userProfile.description);
      
      // Generate character descriptions for the story
      const characterDesc = generateCharacterDescriptions(userProfile, story.initialPrompt);
      setCharacterDescriptions(characterDesc);
      
      fetchNextSegment(initialPrompt);
    }
    
    return () => {
      isMounted = false;
    };
  }, [story.id, isReplayMode]); // Add isReplayMode to dependencies

  // Auto-save progress whenever segments or choices change (skip in replay mode)
  useEffect(() => {
    if (segments.length > 0 && !isLoading && !isReplayMode) {
      // Check storage quota before saving
      if (isStorageNearQuota()) {
        setShowStorageWarning(true);
        // Force cleanup to free up space
        forceCleanupStorage();
      }
      
      saveStoryProgress(story.id, {
        segments,
        currentChoices: choices,
        storyHistory: storyHistory.current,
        userChoiceCount,
        isCompleted: false,
        currentEnvironment,
      });
    }
  }, [segments, choices, userChoiceCount, story.id, isLoading, isReplayMode, currentEnvironment]);

  const fetchNextSegment = useCallback(async (prompt: string) => {
    // Prevent concurrent calls
    if (isGeneratingRef.current) {
      console.log('Already generating story, skipping duplicate call');
      return;
    }
    
    isGeneratingRef.current = true;
    setIsLoading(true);
    setChoices([]);
    storyHistory.current.push(`PROMPT: ${prompt}`);
    
    console.log('fetchNextSegment called, segments count:', segments.length);

    try {
      const response: GeminiStoryResponse = await generateStorySegment(prompt);
      
      // If this is a fallback response, don't add it to history and handle as error
      if (response.isFallback) {
        // Remove the prompt we just added
        storyHistory.current.pop();
        
        // Show error segment
        const errorSegment: StorySegment = {
          type: 'narrator',
          text: response.narrative,
          isLoadingImage: false,
        };
        setSegments(prev => [...prev, errorSegment]);
        setChoices(response.choices);
        setIsLoading(false);
        isGeneratingRef.current = false;
        return;
      }
      
      // Only add successful responses to history
      storyHistory.current.push(`RESPONSE: ${JSON.stringify(response)}`);

      // Update environment based on AI location response
      if (response.location) {
        updateEnvironmentFromLocation(response.location);
      }

      const newNarratorSegment: StorySegment = {
        type: 'narrator',
        text: response.narrative,
        isLoadingImage: true,
      };

      // Clear any previous GIF errors and fallback notifications for new segments
      setGifError(null);
      setFallbackNotification(null);

      // Check for completion - remove arbitrary choice count requirement and add loop detection
      if (response.isComplete || detectRepetitiveContent(response.narrative)) {
        setShowCompletionModal(true);
        // Mark story as completed in storage
        saveStoryProgress(story.id, {
          segments: [...segments, newNarratorSegment],
          currentChoices: [],
          storyHistory: storyHistory.current,
          userChoiceCount,
          isCompleted: true,
          completionDate: Date.now(),
          currentEnvironment,
        });
        return;
      }

      // Add segments (narrator + optional lessons) immediately
      setSegments(prev => {
          const newSegments = [...prev, newNarratorSegment];
          if (response.lessons && response.lessons.length > 0) {
              // Store all lessons as a single segment with JSON string
              newSegments.push({
                  type: 'lesson',
                  text: JSON.stringify(response.lessons),
              });
          }
          return newSegments;
      });

      // Auto-play narration if enabled
      if (narrationSettings.enabled && narrationSettings.autoPlay) {
        const segmentIndex = segments.length; // Index of the new narrator segment
        setTimeout(() => {
          handlePlayNarration(response.narrative, segmentIndex);
        }, 100); // Small delay to ensure segment is rendered
      }
      
      // Show choices immediately so user doesn't wait for image
      setChoices(response.choices);
      setIsLoading(false);

      // Generate GIF or static image based on importance and quota
      (async () => {
          try {
              const falSettings = loadFalSettings();
              const shouldGenerateGif = response.isImportantScene && 
                                      falSettings.enabled && 
                                      falSettings.currentSessionCount < falSettings.sessionLimit &&
                                      falService.isConfigured() &&
                                      gifGeneratedCount < 2; // Limit to max 2 GIFs per story
              
              // Add comprehensive debug logging
              console.log('Scene importance check:', {
                  isImportantScene: response.isImportantScene,
                  falEnabled: falSettings.enabled,
                  quotaRemaining: falSettings.sessionLimit - falSettings.currentSessionCount,
                  falConfigured: falService.isConfigured(),
                  gifGeneratedCount: gifGeneratedCount,
                  shouldGenerateGif: shouldGenerateGif
              });
              
              if (shouldGenerateGif) {
                  console.log('Generating GIF for important scene...');
                  setGifError(null); // Clear any previous errors
                  
                  setSegments(prev => {
                      const newSegments = [...prev];
                      const lastNarratorIndex = newSegments.findLastIndex(s => s.type === 'narrator');
                      if (lastNarratorIndex !== -1) {
                          newSegments[lastNarratorIndex] = { 
                              ...newSegments[lastNarratorIndex], 
                              isLoadingGif: true 
                          };
                      }
                      return newSegments;
                  });
                  
                  try {
                      const gifUrl = await falService.generateGIF(response.imagePrompt, 6); // 5-7 seconds
                      
                      // Increment session count
                      falSettings.currentSessionCount += 1;
                      saveFalSettings(falSettings);
                      
                      // Increment GIF counter for this story
                      setGifGeneratedCount(prev => prev + 1);
                      
                      setSegments(prev => {
                          const newSegments = [...prev];
                          const lastNarratorIndex = newSegments.findLastIndex(s => s.type === 'narrator');
                          if (lastNarratorIndex !== -1) {
                              newSegments[lastNarratorIndex] = {
                                  ...newSegments[lastNarratorIndex],
                                  gifUrl,
                                  isLoadingGif: false,
                                  isLoadingImage: false
                              };
                          }
                          return newSegments;
                      });
                      return; // Skip static image generation
                  } catch (error) {
                      console.error('GIF generation failed, falling back to static image:', error);
                      
                      // Determine user-friendly error message for 2-step process
                      let errorMessage = 'Animation generation failed (image→video pipeline). Using static image instead.';
                      if (error instanceof Error) {
                          if (error.message.includes('quota') || error.message.includes('credit')) {
                              errorMessage = 'Animation generation failed: Insufficient credits. Check your fal.ai account.';
                          } else if (error.message.includes('API key') || error.message.includes('authentication')) {
                              errorMessage = 'Animation generation failed: API key issue. Check Settings.';
                          } else if (error.message.includes('timeout')) {
                              errorMessage = 'Animation generation timed out. Using static image instead.';
                          } else if (error.message.includes('configuration')) {
                              errorMessage = 'Animation generation failed: Configuration issue. Check Settings.';
                          } else if (error.message.includes('base image')) {
                              errorMessage = 'Animation generation failed: Could not generate base image. Using static image instead.';
                          } else if (error.message.includes('image-to-video')) {
                              errorMessage = 'Animation generation failed: Could not convert image to video. Using static image instead.';
                          }
                      }
                      
                      setGifError(errorMessage);
                      
                      // Update segment to show error state
                      setSegments(prev => {
                          const newSegments = [...prev];
                          const lastNarratorIndex = newSegments.findLastIndex(s => s.type === 'narrator');
                          if (lastNarratorIndex !== -1) {
                              newSegments[lastNarratorIndex] = {
                                  ...newSegments[lastNarratorIndex],
                                  isLoadingGif: false,
                                  // Keep isLoadingImage: true so static image generation continues
                              };
                          }
                          return newSegments;
                      });
                      
                      // Fall through to static image generation
                  }
              }
              
              // Generate static image with fallback logic
              console.log('Starting background image generation...');
              let imageUrl: string;
              let imageSource = 'gemini'; // Track which service generated the image
              
              try {
                  // Try Gemini first
                  imageUrl = await generateSceneImageWithCharacters(response.imagePrompt, characterDescriptions, currentEnvironment);
                  console.log('Image generated successfully with Gemini');
              } catch (geminiError) {
                  console.error("Gemini image generation failed:", geminiError);
                  
                  // Check if fal fallback is enabled
                  const falSettings = loadFalSettings();
                  if (falSettings.useFalFallback && falService.isConfigured()) {
                      console.log('Trying fal.ai as fallback for static image...');
                      try {
                          imageUrl = await falService.generateFallbackImage(response.imagePrompt);
                          imageSource = 'fal';
                          console.log('Image generated successfully with fal.ai fallback');
                          setFallbackNotification('Image generated using fal.ai fallback (Gemini failed)');
                      } catch (falError) {
                          console.error("fal.ai fallback also failed:", falError);
                          // Both services failed, use placeholder
                          imageUrl = 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1280&h=720&fit=crop';
                          imageSource = 'placeholder';
                          setFallbackNotification('Both Gemini and fal.ai failed - using placeholder image');
                      }
                  } else {
                      // fal fallback disabled or not configured, use placeholder
                      console.log('fal.ai fallback disabled or not configured, using placeholder');
                      imageUrl = 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1280&h=720&fit=crop';
                      imageSource = 'placeholder';
                      if (!falService.isConfigured()) {
                          setFallbackNotification('Gemini failed - fal.ai not configured (using placeholder)');
                      } else {
                          setFallbackNotification('Gemini failed - fal.ai fallback disabled in Settings (using placeholder)');
                      }
                  }
              }
              
              // Update segment with generated image
              setSegments(prev => {
                  const newSegments = [...prev];
                  for (let i = newSegments.length - 1; i >= 0; i--) {
                      if (newSegments[i].type === 'narrator' && newSegments[i].isLoadingImage) {
                          newSegments[i] = { ...newSegments[i], imageUrl, isLoadingImage: false };
                          // Trigger scroll to show the loaded image
                          setTimeout(() => {
                            scrollToNewSegment(i);
                          }, 100);
                          break;
                      }
                  }
                  return newSegments;
              });
              
              // Log image source for debugging
              console.log(`Image displayed from: ${imageSource}`);
          } catch (error) {
              console.error("Unexpected error in image generation:", error);
              console.error("Error details:", error instanceof Error ? error.message : String(error));
              
              // Set fallback image
              setSegments(prev => {
                  const newSegments = [...prev];
                  for (let i = newSegments.length - 1; i >= 0; i--) {
                      if (newSegments[i].type === 'narrator' && newSegments[i].isLoadingImage) {
                          console.log('Setting fallback image for segment', i);
                          newSegments[i] = { ...newSegments[i], imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1280&h=720&fit=crop', isLoadingImage: false };
                          // Trigger scroll to show the loaded fallback image
                          setTimeout(() => {
                            scrollToNewSegment(i);
                          }, 100);
                          break;
                      }
                  }
                  return newSegments;
              });
          }
      })();
    } catch (error) {
      console.error("Error generating story segment:", error);
      setIsLoading(false);
      isGeneratingRef.current = false;
      
      // DON'T add error response to story history
      // Remove the last prompt that failed
      storyHistory.current.pop();
      
      // Show error state with a retry option
      const errorSegment: StorySegment = {
        type: 'narrator',
        text: 'The story seems to have paused. Please try continuing or reload the page.',
        isLoadingImage: false,
      };
      setSegments(prev => [...prev, errorSegment]);
      setChoices(['Try again']);
    } finally {
      isGeneratingRef.current = false;
    }
  }, [userProfile.name, userProfile.description]);

  const handleChoice = async (choice: string) => {
    // Prevent multiple calls while loading
    if (isLoading) {
      console.log('Already loading, ignoring choice');
      return;
    }
    
    const userSegment: StorySegment = {
      type: 'user',
      text: choice,
    };
    setSegments(prev => [...prev, userSegment]);
    setChoices([]);
    setUserChoiceCount(prev => prev + 1);

    // Scroll to show the user's choice
    setTimeout(() => {
      scrollToNewSegment(segments.length); // Scroll to the newly added user segment
    }, 100);

    // Track choice with Mem0
    if (isMemoryAvailable()) {
      const context = storyHistory.current[storyHistory.current.length - 2] || 'story context';
      await trackChoice(userProfile.name, story.id, choice, context).catch(console.error);
    }

    const context = storyHistory.current.join('\n');
    const nextPrompt = `The story has unfolded as follows:\n${context}\n\nThe user, ${userProfile.name}, who looks like "${userProfile.description}", chose to: "${choice}".\n\nContinue the story based on this choice. If a biblical character is present, have them respond to the user's choice in their dialogue. The user's new choices should allow for further conversation or interaction. IMPORTANT: While the user can influence conversations, the major events, outcomes, and timeline of the story MUST strictly adhere to the biblical narrative. The core biblical events are unchangeable. Generate the next narrative segment, a vivid image prompt that includes the user's character, 2-3 new choices, and specify the current location/setting where this scene takes place. Additionally, generate 0-3 detailed biblical lessons based on the significance of this moment. Each lesson should be comprehensive with theological depth, biblical connections, and practical spiritual applications. Lessons should connect specifically to the events in this segment and can be multi-paragraph when appropriate.`;
    
    // Update character descriptions if new biblical characters are introduced
    const updatedCharacterDesc = generateCharacterDescriptions(userProfile, nextPrompt);
    setCharacterDescriptions(updatedCharacterDesc);
    
    fetchNextSegment(nextPrompt);
  };

  const handleAskQuestion = async () => {
    if (!question.trim() || isLoading || isAnswering) return;

    setIsAnswering(true);
    const userQuestion = question;
    setQuestion('');

    const questionSegment: StorySegment = { type: 'question', text: userQuestion };
    setSegments(prev => [...prev, questionSegment]);

    const context = storyHistory.current.join('\n');
    const answerText = await generateClarification(context, userQuestion);

    const answerSegment: StorySegment = { type: 'answer', text: answerText };
    setSegments(prev => [...prev, answerSegment]);
    setIsAnswering(false);
  };

  const handlePlayNarration = async (text: string, index: number) => {
    // If clicking on the currently playing segment
    if (currentlyPlayingIndex === index) {
      if (isPaused) {
        // Resume narration
        if ((narrationSettings.provider === 'elevenlabs' || narrationSettings.provider === 'speechify') && currentAudioElement) {
          currentAudioElement.play();
          setIsPaused(false);
        } else {
          speechService.resume();
          setIsPaused(false);
        }
        return;
      } else {
        // Pause narration
        if ((narrationSettings.provider === 'elevenlabs' || narrationSettings.provider === 'speechify') && currentAudioElement) {
          currentAudioElement.pause();
          setIsPaused(true);
        } else {
          speechService.pause();
          setIsPaused(true);
        }
        return;
      }
    }

    // Stop any current narration and start new one
    speechService.stop();
    if (currentAudioElement) {
      currentAudioElement.pause();
      setCurrentAudioElement(null);
    }
    setCurrentlyPlayingIndex(index);
    setIsPaused(false);

    if (narrationSettings.provider === 'elevenlabs') {
      await handleElevenLabsNarration(text, index);
    } else if (narrationSettings.provider === 'speechify') {
      await handleSpeechifyNarration(text, index);
    } else {
      speechService.speak(
        text,
        narrationSettings,
        () => {
          setCurrentlyPlayingIndex(null);
          setIsPaused(false);
        },
        (error) => {
          console.error('Narration error:', error);
          setCurrentlyPlayingIndex(null);
          setIsPaused(false);
        }
      );
    }
  };

  const handleElevenLabsNarration = async (text: string, index: number) => {
    if (!elevenLabsService.isConfigured()) {
      console.error('ElevenLabs not configured');
      setCurrentlyPlayingIndex(null);
      return;
    }

    setIsGeneratingAudio(true);
    
    try {
      // Check cache first
      const cachedAudio = await getCachedAudioBlob(
        text, 
        elevenLabsSettings.selectedVoiceId, 
        1.0, // ElevenLabs doesn't use speed parameter
        'elevenlabs'
      );

      let audioBlob: Blob;
      if (cachedAudio) {
        audioBlob = cachedAudio;
      } else {
        // Generate new audio
        audioBlob = await elevenLabsService.synthesizeSpeech(text, elevenLabsSettings.selectedVoiceId);
        
        // Cache the audio
        await cacheAudioBlob(
          text,
          audioBlob,
          elevenLabsSettings.selectedVoiceId,
          1.0,
          'elevenlabs'
        );
      }

      // Play the audio
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      // Store reference for pause/resume functionality
      setCurrentAudioElement(audio);
      
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        setCurrentlyPlayingIndex(null);
        setIsPaused(false);
        setCurrentAudioElement(null);
      };

      audio.onerror = () => {
        console.error('Audio playback error');
        URL.revokeObjectURL(audioUrl);
        setCurrentlyPlayingIndex(null);
        setIsPaused(false);
        setCurrentAudioElement(null);
      };

      audio.play();
    } catch (error) {
      console.error('ElevenLabs narration error:', error);
      
      // Check if it's a quota exceeded error and fallback to Speechify
      if (error instanceof QuotaExceededError) {
        console.log('ElevenLabs quota exceeded, falling back to Speechify');
        // Show notification to user
        alert('ElevenLabs quota exceeded. Using Speechify as fallback.');
        
        // Fallback to Speechify
        await handleSpeechifyNarration(text, index);
        return;
      }
      
      setCurrentlyPlayingIndex(null);
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  const handleSpeechifyNarration = async (text: string, index: number) => {
    if (!speechifyService.isConfigured()) {
      console.error('Speechify not configured');
      setCurrentlyPlayingIndex(null);
      return;
    }

    setIsGeneratingAudio(true);
    
    try {
      // Check cache first
      const cachedAudio = await getCachedAudioBlob(
        text, 
        speechifySettings.selectedVoiceId, 
        1.0, // Speechify doesn't use speed parameter
        'speechify'
      );

      let audioBlob: Blob;
      if (cachedAudio) {
        audioBlob = cachedAudio;
      } else {
        // Generate new audio
        audioBlob = await speechifyService.synthesizeSpeech(text, speechifySettings.selectedVoiceId);
        
        // Cache the audio
        await cacheAudioBlob(
          text,
          audioBlob,
          speechifySettings.selectedVoiceId,
          1.0,
          'speechify'
        );
      }

      // Play the audio
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      // Store reference for pause/resume functionality
      setCurrentAudioElement(audio);
      
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        setCurrentlyPlayingIndex(null);
        setIsPaused(false);
        setCurrentAudioElement(null);
      };

      audio.onerror = () => {
        console.error('Audio playback error');
        URL.revokeObjectURL(audioUrl);
        setCurrentlyPlayingIndex(null);
        setIsPaused(false);
        setCurrentAudioElement(null);
      };

      audio.play();
    } catch (error) {
      console.error('Speechify narration error:', error);
      setCurrentlyPlayingIndex(null);
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  const handleViewBibleText = () => {
    setShowBibleModal(true);
  };

  const stopAllNarration = () => {
    // Stop Web Speech API narration
    speechService.stop();
    
    // Stop ElevenLabs audio if playing
    if (currentAudioElement) {
      currentAudioElement.pause();
      setCurrentAudioElement(null);
    }
    
    // Reset all narration state
    setCurrentlyPlayingIndex(null);
    setIsPaused(false);
    setCurrentAudioElement(null);
  };

  const handleCompletionModalClose = () => {
    stopAllNarration();
    setShowCompletionModal(false);
    onExit(); // Return to story select
  };

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col">
      <header className="bg-white/80 backdrop-blur-sm shadow-md p-3 md:p-4 sticky top-0 z-10 border-b">
        <div className="flex justify-between items-center mb-2 md:mb-3">
          <h1 className="text-lg md:text-2xl font-bold font-script text-stone-800 truncate flex-1 mr-3">
            {story.title}
            {isReplayMode && <span className="ml-2 md:ml-3 text-xs md:text-sm bg-green-100 text-green-800 px-1 md:px-2 py-1 rounded-full">Replay</span>}
          </h1>
          <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
            <button 
              onClick={() => {
                stopAllNarration();
                onExit();
              }} 
              className="bg-stone-200 hover:bg-stone-300 text-stone-700 font-semibold py-2 px-3 md:px-4 rounded-lg transition-colors text-sm md:text-base"
            >
              <span className="hidden md:inline">Exit Story</span>
              <span className="md:hidden">Exit</span>
            </button>
          </div>
        </div>
        {/* Progress Bar - Hidden in replay mode */}
        {!isReplayMode && (
          <div className="w-full">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs md:text-sm font-semibold text-stone-600">Progress</span>
              <span className="text-xs md:text-sm font-semibold text-stone-600">{progressPercentage}%</span>
            </div>
            <div className="w-full bg-stone-200 rounded-full h-1.5 md:h-2">
              <div 
                className="bg-amber-500 h-1.5 md:h-2 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
          </div>
        )}
      </header>

      <main className="flex-grow p-4 md:p-6 space-y-4 md:space-y-6 overflow-y-auto">
        {segments.map((segment, index) => (
          <div key={index} data-segment-index={index} className={`max-w-4xl mx-auto w-full flex flex-col ${segment.type === 'user' || segment.type === 'question' ? 'items-end' : 'items-start'}`}>
            {segment.type === 'narrator' && (
              <div className="w-full bg-white rounded-2xl shadow-lg border border-stone-200/50 overflow-hidden">
                <div className="w-full aspect-video bg-stone-200 flex items-center justify-center">
                  {segment.isLoadingGif ? (
                    <div className="text-center">
                      <LoadingSpinner />
                      <p className="text-sm text-stone-600 mt-2">Creating animated scene...</p>
                      {gifError && (
                        <div className="mt-2 p-2 bg-yellow-100 border border-yellow-300 rounded text-xs text-yellow-800">
                          {gifError}
                        </div>
                      )}
                      {fallbackNotification && (
                        <div className="mt-2 p-2 bg-blue-100 border border-blue-300 rounded text-xs text-blue-800">
                          {fallbackNotification}
                        </div>
                      )}
                    </div>
                  ) : segment.isLoadingImage ? (
                    <div className="text-center">
                      <LoadingSpinner />
                      {gifError && (
                        <div className="mt-2 p-2 bg-yellow-100 border border-yellow-300 rounded text-xs text-yellow-800">
                          {gifError}
                        </div>
                      )}
                      {fallbackNotification && (
                        <div className="mt-2 p-2 bg-blue-100 border border-blue-300 rounded text-xs text-blue-800">
                          {fallbackNotification}
                        </div>
                      )}
                    </div>
                  ) : segment.gifUrl ? (
                    <img src={segment.gifUrl} alt="Animated Scene" className="w-full h-full object-cover" />
                  ) : segment.imageUrl ? (
                    <div className="relative w-full h-full">
                      <img src={segment.imageUrl} alt="Scene" className="w-full h-full object-cover" />
                      {gifError && (
                        <div className="absolute bottom-2 left-2 right-2 p-2 bg-yellow-100/90 border border-yellow-300 rounded text-xs text-yellow-800">
                          {gifError}
                        </div>
                      )}
                      {fallbackNotification && (
                        <div className="absolute bottom-2 left-2 right-2 p-2 bg-blue-100/90 border border-blue-300 rounded text-xs text-blue-800">
                          {fallbackNotification}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-stone-400">No media available</div>
                  )}
                </div>
                <div className="p-4 md:p-6 parchment-bg border-l-4 border-amber-300 shadow-lg">
                  <div className="flex items-start justify-between gap-4">
                    <div 
                      className={`flex-grow ${NARRATIVE_TYPOGRAPHY.textColor} ${NARRATIVE_TYPOGRAPHY.lineHeight} ${NARRATIVE_TYPOGRAPHY.fontSize} ${NARRATIVE_TYPOGRAPHY.fontFamily}`}
                      dangerouslySetInnerHTML={{ 
                        __html: '<p>' + addDropCap(formatNarrative(segment.text)).replace(/\n\n/g, '</p><p class="' + NARRATIVE_TYPOGRAPHY.paragraphSpacing + '">') + '</p>'
                      }}
                    />
                    {narrationSettings.enabled && (
                      <button
                        onClick={() => handlePlayNarration(segment.text, index)}
                        disabled={isGeneratingAudio && currentlyPlayingIndex === index}
                        className={`flex-shrink-0 p-2 rounded-lg transition-colors ${
                          currentlyPlayingIndex === index 
                            ? 'bg-amber-500 text-white' 
                            : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                        title={
                          isGeneratingAudio && currentlyPlayingIndex === index 
                            ? 'Generating audio...' 
                            : currentlyPlayingIndex === index 
                              ? (isPaused ? 'Resume narration' : 'Pause narration')
                              : 'Play narration'
                        }
                      >
                        {isGeneratingAudio && currentlyPlayingIndex === index ? (
                          <LoadingSpinner className="w-5 h-5" />
                        ) : currentlyPlayingIndex === index ? (
                          isPaused ? (
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                          )
                        ) : (
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                          </svg>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
            {segment.type === 'user' && (
              <div className="bg-amber-50 border-2 border-amber-300 text-stone-800 p-4 rounded-xl shadow-lg max-w-lg relative ornate-border">
                <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-amber-100/50 to-transparent pointer-events-none"></div>
                <p className="font-serif text-lg leading-relaxed relative z-10">{segment.text}</p>
              </div>
            )}
            {segment.type === 'question' && (
              <div className="bg-sky-500 text-white p-3 rounded-2xl rounded-br-none shadow-md max-w-lg">
                <p className="font-semibold">{segment.text}</p>
              </div>
            )}
            {segment.type === 'answer' && (
              <div className="bg-stone-200 border-l-4 border-stone-400 text-stone-800 p-4 rounded-r-lg shadow-md max-w-lg">
                <p><strong className="font-serif">Answer:</strong> {segment.text}</p>
              </div>
            )}
            {segment.type === 'lesson' && (() => {
              let lessons;
              try {
                lessons = JSON.parse(segment.text);
                if (!Array.isArray(lessons)) {
                  // If not an array, treat as single lesson
                  lessons = [segment.text];
                }
              } catch (error) {
                console.error('Error parsing lesson JSON:', error);
                // Fallback: treat the text as a single lesson
                lessons = [segment.text];
              }
              const segmentId = `${segments.indexOf(segment)}`;
              
              return (
                <div className="w-full max-w-5xl mx-auto lesson-entrance">
                  <div className="bg-white rounded-3xl shadow-2xl border-4 border-amber-300 overflow-hidden ornate-border">
                    {/* Decorative header */}
                    <div className="bg-gradient-to-r from-amber-100 to-orange-100 p-4 border-b-2 border-amber-200">
                      <div className="flex items-center justify-center space-x-3">
                        <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                        <h3 className="text-2xl font-bold text-amber-800 font-script">
                          Divine Lesson{lessons.length > 1 ? 's' : ''}
                        </h3>
                        <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                      </div>
                    </div>
                    
                    {/* Lessons content */}
                    <div className="parchment-bg p-6 space-y-4">
                      {lessons.map((lesson: string, index: number) => {
                        const lessonId = `${segmentId}-${index}`;
                        const isExpanded = expandedLessons.has(lessonId);
                        const isLoadingTitle = lessonTitlesLoading.has(lessonId);
                        const title = lessonTitles.get(lessonId);
                        
                        // Generate title if needed (this will be called on each render but has internal caching)
                        generateLessonTitleIfNeeded(lessonId, lesson);
                        
                        return (
                          <div key={lessonId} className="border border-amber-200 rounded-xl overflow-hidden bg-amber-50/50">
                            {/* Lesson header with expand/collapse */}
                            <button
                              onClick={() => toggleLessonExpansion(lessonId)}
                              className="w-full p-4 text-left hover:bg-amber-100/50 transition-colors"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  {/* Lesson title */}
                                  <h4 className="text-lg font-bold text-amber-900 mb-1">
                                    {isLoadingTitle ? (
                                      <span className="flex items-center space-x-2">
                                        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        <span>Generating title...</span>
                                      </span>
                                    ) : (
                                      title || (lesson.length > 50 ? lesson.substring(0, 50) + '...' : lesson) || `Lesson ${index + 1}`
                                    )}
                                  </h4>
                                  {/* Click to expand text */}
                                  <p className="text-sm text-gray-600">
                                    {isExpanded ? 'Click to collapse' : 'Click to expand'}
                                  </p>
                                </div>
                                <svg 
                                  className={`w-5 h-5 text-amber-600 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                                  fill="none" 
                                  stroke="currentColor" 
                                  viewBox="0 0 24 24"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                              </div>
                            </button>
                            
                            {/* Full lesson content (collapsible) */}
                            {isExpanded && (
                              <div className="px-4 pb-4 animate-fadeIn">
                                <div className="border-t border-amber-200 pt-3">
                                  <p className="text-amber-900 leading-relaxed text-lg font-script" 
                                     dangerouslySetInnerHTML={{ 
                                       __html: '<p>' + formatNarrative(lesson).replace(/\n\n/g, '</p><p class="mt-4">') + '</p>'
                                     }} />
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    
                    {/* Decorative footer */}
                    <div className="bg-gradient-to-r from-amber-200 to-orange-200 p-3">
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-3 h-3 bg-amber-600 rounded-full"></div>
                        <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                        <div className="w-3 h-3 bg-amber-600 rounded-full"></div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        ))}

        <div ref={endOfMessagesRef} />
      </main>

      <footer className="bg-white/80 backdrop-blur-sm p-4 sticky bottom-0 border-t">
        <div className="max-w-4xl mx-auto">
          {isLoading && (
            <div className="flex items-center justify-center gap-3 text-stone-600">
              <LoadingSpinner className="w-6 h-6" />
              <span>The story unfolds...</span>
            </div>
          )}
          {!isLoading && choices.length > 0 && !isReplayMode && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-3">
                {choices.map((choice, index) => (
                  <button
                    key={index}
                    onClick={() => handleChoice(choice)}
                    className="w-full text-left bg-white hover:bg-amber-100 border border-stone-300 text-stone-700 font-medium md:font-semibold py-2 md:py-3 px-3 md:px-4 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md hover:border-amber-400 active:scale-[0.98] text-sm md:text-base"
                  >
                    {choice}
                  </button>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-stone-200">
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAskQuestion()}
                    placeholder="Have a question about the scene?"
                    className="flex-grow shadow-inner appearance-none border border-stone-300 rounded-lg w-full py-2 px-4 text-stone-700 leading-tight focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white/70"
                    disabled={isLoading || isAnswering}
                  />
                  <button
                    onClick={handleAskQuestion}
                    disabled={!question.trim() || isLoading || isAnswering}
                    className={`bg-stone-700 hover:bg-stone-600 text-white font-bold py-2 px-5 rounded-lg focus:outline-none focus:shadow-outline transition-all duration-200 disabled:bg-stone-400 active:scale-95 ${
                        (question.trim() && !isLoading && !isAnswering) ? 'animate-pulse-gentle' : ''
                    }`}
                  >
                    {isAnswering ? <LoadingSpinner className="w-5 h-5" /> : 'Ask'}
                  </button>
                </div>
              </div>
            </>
          )}
          {isReplayMode && !isLoading && (
            <div className="text-center py-4">
              <p className="text-sm text-stone-600 mb-4">Replaying completed story - scroll up to review your journey!</p>
              {story.bibleReference && (
                <button
                  onClick={handleViewBibleText}
                  className="bg-amber-500 hover:bg-amber-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                >
                  Read Original Bible Story
                </button>
              )}
            </div>
          )}
        </div>
      </footer>

      {/* Completion Modal */}
      {showCompletionModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 text-center">
            <div className="mb-4">
              <div className="w-16 h-16 bg-amber-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-stone-800 mb-2">Story Complete!</h3>
              <p className="text-stone-600 mb-6">
                Congratulations! You've completed "{story.title}". You can now read the original biblical account.
              </p>
            </div>
            <div className="space-y-3">
              <button
                onClick={handleViewBibleText}
                className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
              >
                Read Original Bible Story
              </button>
              <button
                onClick={handleCompletionModalClose}
                className="w-full bg-stone-300 hover:bg-stone-400 text-stone-800 font-semibold py-3 px-4 rounded-lg transition-colors"
              >
                Return to Story Select
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bible Text Modal */}
      {story.bibleReference && (
        <BibleTextModal
          isOpen={showBibleModal}
          onClose={() => setShowBibleModal(false)}
          storyTitle={story.title}
          bibleReference={story.bibleReference}
        />
      )}

      {/* Storage Warning Modal */}
      {showStorageWarning && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 text-center">
            <div className="mb-4">
              <div className="w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-stone-800 mb-2">Storage Almost Full</h3>
              <p className="text-stone-600 mb-6">
                Your story progress is taking up a lot of space. We've cleaned up old data to make room, but you may want to complete or delete some stories to free up more space.
              </p>
            </div>
            <div className="space-y-3">
              <button
                onClick={() => setShowStorageWarning(false)}
                className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
              >
                Continue Story
              </button>
              <button
                onClick={() => {
                  setShowStorageWarning(false);
                  onExit(); // Return to story select to manage stories
                }}
                className="w-full bg-stone-300 hover:bg-stone-400 text-stone-800 font-semibold py-3 px-4 rounded-lg transition-colors"
              >
                Manage Stories
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StoryPlayer;
