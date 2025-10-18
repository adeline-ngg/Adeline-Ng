import React, { useState, useEffect } from 'react';
import { StoryLesson } from '../types';
import { getAllStoryLessons } from '../services/storageService';
import { generateLessonsPDF, downloadPDF } from '../utils/pdfGenerator';

interface LessonsSummaryProps {
  onBack: () => void;
}

type ViewMode = 'grouped' | 'chronological';

const LessonsSummary: React.FC<LessonsSummaryProps> = ({ onBack }) => {
  const [lessons, setLessons] = useState<StoryLesson[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('grouped');
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  useEffect(() => {
    const allLessons = getAllStoryLessons();
    setLessons(allLessons);
  }, []);

  const handleDownloadPDF = async () => {
    setIsGeneratingPDF(true);
    try {
      const pdfBlob = generateLessonsPDF(lessons, viewMode);
      downloadPDF(pdfBlob);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const groupedLessons = lessons.reduce((acc, lesson) => {
    if (!acc[lesson.storyId]) {
      acc[lesson.storyId] = {
        storyTitle: lesson.storyTitle,
        completionDate: lesson.completionDate,
        lessons: []
      };
    }
    acc[lesson.storyId].lessons.push(lesson);
    return acc;
  }, {} as { [storyId: string]: { storyTitle: string; completionDate: number; lessons: StoryLesson[] } });

  const renderGroupedView = () => (
    <div className="space-y-8">
      {Object.entries(groupedLessons).map(([storyId, storyData]) => (
        <div key={storyId} className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-amber-200 overflow-hidden">
          {/* Story Header */}
          <div className="p-6 bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold text-stone-800 font-script">{storyData.storyTitle}</h3>
                <p className="text-stone-600 mt-1 font-serif">
                  Completed on {new Date(storyData.completionDate).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
              <div className="text-right">
                <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm font-semibold">
                  {storyData.lessons.length} lesson{storyData.lessons.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          </div>

          {/* Lessons */}
          <div className="p-6">
            <div className="parchment-bg p-6 rounded-lg">
              {storyData.lessons.map((lesson, index) => (
                <p key={`${lesson.storyId}-${index}`} className="text-stone-800 leading-relaxed font-script text-lg mb-6 last:mb-0">
                  {lesson.lesson}
                </p>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderChronologicalView = () => (
    <div className="space-y-6">
      {lessons.map((lesson, index) => (
        <div
          key={`${lesson.storyId}-${index}`}
          className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-amber-200 overflow-hidden"
        >
          <div className="p-6">
            <div className="mb-4">
              <h4 className="font-semibold text-stone-800 font-script text-lg">{lesson.storyTitle}</h4>
              <p className="text-stone-600 text-sm">
                {new Date(lesson.completionDate).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
            
            <div className="parchment-bg p-6 rounded-lg">
              <p className="text-stone-800 leading-relaxed font-script text-lg">
                {lesson.lesson}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  if (lessons.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-100 to-orange-200 p-4 sm:p-6 md:p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <header className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-stone-800 font-script">Lessons Summary</h1>
              <p className="text-stone-600 mt-1 font-serif">Your collected spiritual wisdom</p>
            </div>
            <button
              onClick={onBack}
              className="bg-stone-800 hover:bg-stone-700 text-white font-bold py-3 px-6 rounded-xl transition-colors"
            >
              Back to Stories
            </button>
          </header>

          {/* Empty State */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-amber-200 p-12 text-center">
            <div className="w-24 h-24 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-stone-800 mb-4 font-script">No Lessons Yet</h3>
            <p className="text-stone-600 mb-8 font-serif max-w-md mx-auto">
              Complete some Bible stories to start collecting divine lessons and wisdom from your journey.
            </p>
            <button
              onClick={onBack}
              className="bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 px-8 rounded-xl transition-colors"
            >
              Start Your Journey
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-100 to-orange-200 p-4 sm:p-6 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-stone-800 font-script">Lessons Summary</h1>
            <p className="text-stone-600 mt-1 font-serif">
              {lessons.length} divine lesson{lessons.length !== 1 ? 's' : ''} from your journey
            </p>
          </div>
          <button
            onClick={onBack}
            className="bg-stone-800 hover:bg-stone-700 text-white font-bold py-3 px-6 rounded-xl transition-colors"
          >
            Back to Stories
          </button>
        </header>

        {/* Controls */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex bg-white/80 backdrop-blur-sm rounded-xl p-1 border border-amber-200">
            <button
              onClick={() => setViewMode('grouped')}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                viewMode === 'grouped'
                  ? 'bg-amber-500 text-white'
                  : 'text-stone-600 hover:text-stone-800'
              }`}
            >
              By Story
            </button>
            <button
              onClick={() => setViewMode('chronological')}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                viewMode === 'chronological'
                  ? 'bg-amber-500 text-white'
                  : 'text-stone-600 hover:text-stone-800'
              }`}
            >
              Chronological
            </button>
          </div>

          <button
            onClick={handleDownloadPDF}
            disabled={isGeneratingPDF}
            className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-bold py-3 px-6 rounded-xl transition-colors flex items-center space-x-2"
          >
            {isGeneratingPDF ? (
              <>
                <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Generating PDF...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Download PDF</span>
              </>
            )}
          </button>
        </div>

        {/* Content */}
        <div className="mb-8">
          {viewMode === 'grouped' ? renderGroupedView() : renderChronologicalView()}
        </div>
      </div>
    </div>
  );
};

export default LessonsSummary;
