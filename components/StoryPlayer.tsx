import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Story, UserProfile, StorySegment, GeminiStoryResponse } from '../types';
import { generateStorySegment, generateSceneImage, generateClarification } from '../services/geminiService';
import LoadingSpinner from './LoadingSpinner';

interface StoryPlayerProps {
  userProfile: UserProfile;
  story: Story;
  onExit: () => void;
}

const StoryPlayer: React.FC<StoryPlayerProps> = ({ userProfile, story, onExit }) => {
  const [segments, setSegments] = useState<StorySegment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [choices, setChoices] = useState<string[]>([]);
  const [question, setQuestion] = useState('');
  const [isAnswering, setIsAnswering] = useState(false);
  const storyHistory = useRef<string[]>([]);
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [segments]);

  const fetchNextSegment = useCallback(async (prompt: string) => {
    setIsLoading(true);
    setChoices([]);
    storyHistory.current.push(`PROMPT: ${prompt}`);

    const response: GeminiStoryResponse = await generateStorySegment(prompt);
    
    storyHistory.current.push(`RESPONSE: ${JSON.stringify(response)}`);

    const newNarratorSegment: StorySegment = {
      type: 'narrator',
      text: response.narrative,
      isLoadingImage: true,
    };

    setSegments(prev => [...prev, newNarratorSegment]);
    setIsLoading(false);
    setChoices(response.choices);
    
    const imageGenerationPrompt = `${response.imagePrompt}, which also includes ${userProfile.name}, who is described as: "${userProfile.description}"`;

    try {
        const imageUrl = await generateSceneImage(imageGenerationPrompt);
        setSegments(prev => {
            const newSegments = [...prev];
            // Find the last segment that is a narrator segment and is loading media
            for (let i = newSegments.length - 1; i >= 0; i--) {
                if (newSegments[i].type === 'narrator' && newSegments[i].isLoadingImage) {
                    newSegments[i] = { ...newSegments[i], imageUrl: imageUrl, isLoadingImage: false };
                    break; // Stop after updating the most recent one
                }
            }
            return newSegments;
        });
    } catch (error) {
        console.error("Failed to generate scene image:", error);
         setSegments(prev => {
             const newSegments = [...prev];
            for (let i = newSegments.length - 1; i >= 0; i--) {
                if (newSegments[i].type === 'narrator' && newSegments[i].isLoadingImage) {
                    newSegments[i] = { ...newSegments[i], imageUrl: 'https://picsum.photos/seed/error/1280/720', isLoadingImage: false };
                    break;
                }
            }
            return newSegments;
        });
    }


    if (response.lesson) {
        const lessonSegment: StorySegment = {
            type: 'lesson',
            text: response.lesson,
        };
        setSegments(prev => [...prev, lessonSegment]);
    }
  }, [userProfile.name, userProfile.description]);

  useEffect(() => {
    const initialPrompt = story.initialPrompt
        .replace('{userName}', userProfile.name)
        .replace('{userAvatarDescription}', userProfile.description);
    fetchNextSegment(initialPrompt);
  // FIX: Added fetchNextSegment to dependency array to follow rules of hooks.
  }, [story, userProfile.name, userProfile.description, fetchNextSegment]);

  const handleChoice = (choice: string) => {
    const userSegment: StorySegment = {
      type: 'user',
      text: choice,
    };
    setSegments(prev => [...prev, userSegment]);
    setChoices([]);

    const context = storyHistory.current.join('\n');
    const nextPrompt = `The story has unfolded as follows:\n${context}\n\nThe user, ${userProfile.name}, who looks like "${userProfile.description}", chose to: "${choice}".\n\nContinue the story based on this choice. If a biblical character is present, have them respond to the user's choice in their dialogue. The user's new choices should allow for further conversation or interaction. IMPORTANT: While the user can influence conversations, the major events, outcomes, and timeline of the story MUST strictly adhere to the biblical narrative. The core biblical events are unchangeable. Generate the next narrative segment, a vivid image prompt that includes the user's character, 2-3 new choices, and a potential bible lesson.`;
    
    fetchNextSegment(nextPrompt);
  };

  const handleAskQuestion = async () => {
    if (!question.trim() || isLoading || isAnswering) return;

    setIsAnswering(true);
    const userQuestion = question;
    setQuestion(''); // Clear input immediately

    const questionSegment: StorySegment = { type: 'question', text: userQuestion };
    setSegments(prev => [...prev, questionSegment]);

    const context = storyHistory.current.join('\n');
    const answerText = await generateClarification(context, userQuestion);

    const answerSegment: StorySegment = { type: 'answer', text: answerText };
    setSegments(prev => [...prev, answerSegment]);
    setIsAnswering(false);
  };

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col">
      <header className="bg-white/80 backdrop-blur-sm shadow-md p-4 sticky top-0 z-10 flex justify-between items-center border-b">
        <h1 className="text-2xl font-bold font-serif text-stone-800">{story.title}</h1>
        <button onClick={onExit} className="bg-stone-200 hover:bg-stone-300 text-stone-700 font-semibold py-2 px-4 rounded-lg transition-colors">
          Exit Story
        </button>
      </header>

      <main className="flex-grow p-4 md:p-6 space-y-6 overflow-y-auto">
        {segments.map((segment, index) => (
          <div key={index} className={`max-w-4xl mx-auto w-full flex flex-col ${segment.type === 'user' || segment.type === 'question' ? 'items-end' : 'items-start'}`}>
            {segment.type === 'narrator' && (
              <div className="w-full bg-white rounded-2xl shadow-lg border border-stone-200/50 overflow-hidden">
                <div className="w-full aspect-video bg-stone-200 flex items-center justify-center">
                  {segment.isLoadingImage ? <LoadingSpinner /> : (
                    <img src={segment.imageUrl} alt="Scene" className="w-full h-full object-cover" />
                  )}
                </div>
                <p className="p-6 text-stone-700 leading-relaxed whitespace-pre-wrap">{segment.text}</p>
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
          {!isLoading && choices.length > 0 && (
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
        </div>
      </footer>
    </div>
  );
};

export default StoryPlayer;