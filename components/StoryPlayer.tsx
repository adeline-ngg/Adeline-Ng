import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Story, UserProfile, StorySegment, GeminiStoryResponse, NarrationSettings } from '../types';
import { generateStorySegment, generateSceneImageWithCharacters, generateClarification } from '../services/geminiService';
import { speechService } from '../services/speechService';
import { loadSettings, saveStoryProgress, loadStoryProgress } from '../services/storageService';
import { trackChoice, isMemoryAvailable } from '../services/memoryService';
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
  const [currentlyPlayingIndex, setCurrentlyPlayingIndex] = useState<number | null>(null);
  const [characterDescriptions, setCharacterDescriptions] = useState<string>('');
  const [userChoiceCount, setUserChoiceCount] = useState(0);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [showBibleModal, setShowBibleModal] = useState(false);
  const storyHistory = useRef<string[]>([]);
  const endOfMessagesRef = useRef<HTMLDivElement>(null);
  const isGeneratingRef = useRef(false); // Prevent concurrent API calls

  const scrollToBottom = () => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Calculate progress percentage based on user choice count
  const calculateProgress = (choiceCount: number): number => {
    // More gradual progression that allows for variable story lengths
    if (choiceCount <= 3) return Math.round((choiceCount / 3) * 30);
    if (choiceCount <= 8) return Math.round(30 + ((choiceCount - 3) / 5) * 40);
    if (choiceCount <= 12) return Math.round(70 + ((choiceCount - 8) / 4) * 25);
    return 95; // Cap at 95% until AI marks story complete
  };

  const progressPercentage = calculateProgress(userChoiceCount);

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
    scrollToBottom();
  }, [segments]);

  // Load progress or start new story
  useEffect(() => {
    let isMounted = true; // Prevent duplicate calls in React StrictMode
    
    // Handle replay mode - load completed story segments
    if (isReplayMode) {
      const progress = loadStoryProgress(story.id);
      if (progress && progress.isCompleted) {
        setSegments(progress.segments);
        setUserChoiceCount(progress.userChoiceCount || 0);
        storyHistory.current = progress.storyHistory;
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
      saveStoryProgress(story.id, {
        segments,
        currentChoices: choices,
        storyHistory: storyHistory.current,
        userChoiceCount,
        isCompleted: false,
      });
    }
  }, [segments, choices, userChoiceCount, story.id, isLoading, isReplayMode]);

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
      
      storyHistory.current.push(`RESPONSE: ${JSON.stringify(response)}`);

      const newNarratorSegment: StorySegment = {
        type: 'narrator',
        text: response.narrative,
        isLoadingImage: true,
      };

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
        });
        return;
      }

      // Add segments (narrator + optional lesson) immediately
      setSegments(prev => {
          const newSegments = [...prev, newNarratorSegment];
          if (response.lesson) {
              newSegments.push({
                  type: 'lesson',
                  text: response.lesson,
              });
          }
          return newSegments;
      });
      
      // Show choices immediately so user doesn't wait for image
      setChoices(response.choices);
      setIsLoading(false);

      // Generate static image in background with character consistency
      (async () => {
          try {
              console.log('Starting background image generation...');
              const imageUrl = await generateSceneImageWithCharacters(response.imagePrompt, characterDescriptions);
              console.log('Image generated successfully');
              
              setSegments(prev => {
                  const newSegments = [...prev];
                  for (let i = newSegments.length - 1; i >= 0; i--) {
                      if (newSegments[i].type === 'narrator' && newSegments[i].isLoadingImage) {
                          newSegments[i] = { ...newSegments[i], imageUrl, isLoadingImage: false };
                          break;
                      }
                  }
                  return newSegments;
              });
          } catch (error) {
              console.error("Failed to generate scene image:", error);
              console.error("Error details:", error instanceof Error ? error.message : String(error));
              
              // Set fallback image
              setSegments(prev => {
                  const newSegments = [...prev];
                  for (let i = newSegments.length - 1; i >= 0; i--) {
                      if (newSegments[i].type === 'narrator' && newSegments[i].isLoadingImage) {
                          console.log('Setting fallback image for segment', i);
                          newSegments[i] = { ...newSegments[i], imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1280&h=720&fit=crop', isLoadingImage: false };
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

    // Track choice with Mem0
    if (isMemoryAvailable()) {
      const context = storyHistory.current[storyHistory.current.length - 2] || 'story context';
      await trackChoice(userProfile.name, story.id, choice, context).catch(console.error);
    }

    const context = storyHistory.current.join('\n');
    const nextPrompt = `The story has unfolded as follows:\n${context}\n\nThe user, ${userProfile.name}, who looks like "${userProfile.description}", chose to: "${choice}".\n\nContinue the story based on this choice. If a biblical character is present, have them respond to the user's choice in their dialogue. The user's new choices should allow for further conversation or interaction. IMPORTANT: While the user can influence conversations, the major events, outcomes, and timeline of the story MUST strictly adhere to the biblical narrative. The core biblical events are unchangeable. Generate the next narrative segment, a vivid image prompt that includes the user's character, 2-3 new choices, and a potential bible lesson.`;
    
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

  const handlePlayNarration = (text: string, index: number) => {
    if (currentlyPlayingIndex === index && speechService.isSpeaking()) {
      speechService.stop();
      setCurrentlyPlayingIndex(null);
    } else {
      speechService.stop();
      setCurrentlyPlayingIndex(index);
      speechService.speak(
        text,
        narrationSettings,
        () => setCurrentlyPlayingIndex(null),
        (error) => {
          console.error('Narration error:', error);
          setCurrentlyPlayingIndex(null);
        }
      );
    }
  };

  const handleViewBibleText = () => {
    setShowBibleModal(true);
  };

  const handleCompletionModalClose = () => {
    setShowCompletionModal(false);
    onExit(); // Return to story select
  };

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col">
      <header className="bg-white/80 backdrop-blur-sm shadow-md p-4 sticky top-0 z-10 border-b">
        <div className="flex justify-between items-center mb-3">
          <h1 className="text-2xl font-bold font-serif text-stone-800">
            {story.title}
            {isReplayMode && <span className="ml-3 text-sm bg-green-100 text-green-800 px-2 py-1 rounded-full">Replay Mode</span>}
          </h1>
          <button onClick={onExit} className="bg-stone-200 hover:bg-stone-300 text-stone-700 font-semibold py-2 px-4 rounded-lg transition-colors">
            Exit Story
          </button>
        </div>
        {/* Progress Bar */}
        <div className="w-full">
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-semibold text-stone-600">Progress</span>
            <span className="text-sm font-semibold text-stone-600">{progressPercentage}%</span>
          </div>
          <div className="w-full bg-stone-200 rounded-full h-2">
            <div 
              className="bg-amber-500 h-2 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        </div>
      </header>

      <main className="flex-grow p-4 md:p-6 space-y-6 overflow-y-auto">
        {segments.map((segment, index) => (
          <div key={index} className={`max-w-4xl mx-auto w-full flex flex-col ${segment.type === 'user' || segment.type === 'question' ? 'items-end' : 'items-start'}`}>
            {segment.type === 'narrator' && (
              <div className="w-full bg-white rounded-2xl shadow-lg border border-stone-200/50 overflow-hidden">
                <div className="w-full aspect-video bg-stone-200 flex items-center justify-center">
                  {segment.isLoadingImage ? (
                    <LoadingSpinner />
                  ) : segment.imageUrl ? (
                    <img src={segment.imageUrl} alt="Scene" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-stone-400">No media available</div>
                  )}
                </div>
                <div className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <p className="flex-grow text-stone-700 leading-relaxed whitespace-pre-wrap">{segment.text}</p>
                    {narrationSettings.enabled && (
                      <button
                        onClick={() => handlePlayNarration(segment.text, index)}
                        className={`flex-shrink-0 p-2 rounded-lg transition-colors ${
                          currentlyPlayingIndex === index 
                            ? 'bg-amber-500 text-white' 
                            : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                        }`}
                        title={currentlyPlayingIndex === index ? 'Stop narration' : 'Play narration'}
                      >
                        {currentlyPlayingIndex === index ? (
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
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
              <div className="bg-amber-500 text-white p-3 rounded-2xl rounded-br-none shadow-md max-w-lg">
                <p className="font-semibold">{segment.text}</p>
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
            {segment.type === 'lesson' && (
              <div className="bg-amber-100 border-l-4 border-amber-500 text-amber-800 p-4 rounded-r-lg shadow-md max-w-lg">
                <p><strong className="font-serif">Lesson:</strong> {segment.text}</p>
              </div>
            )}
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {choices.map((choice, index) => (
                  <button
                    key={index}
                    onClick={() => handleChoice(choice)}
                    className="w-full text-left bg-white hover:bg-amber-100 border border-stone-300 text-stone-700 font-semibold py-3 px-4 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md hover:border-amber-400 active:scale-[0.98]"
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
            <div className="text-center text-stone-600 py-4">
              <p className="text-sm">Replaying completed story - scroll up to review your journey!</p>
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
    </div>
  );
};

export default StoryPlayer;
