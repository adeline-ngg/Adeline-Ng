import React, { useState, useEffect } from 'react';
import { BibleTextModalProps, BibleChapter } from '../types';
import { fetchBibleTextRange, formatBibleReference, getBibleSummary } from '../services/bibleService';

const BibleTextModal: React.FC<BibleTextModalProps> = ({
  isOpen,
  onClose,
  storyTitle,
  bibleReference
}) => {
  const [chapters, setChapters] = useState<BibleChapter[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && bibleReference) {
      loadBibleText();
    }
  }, [isOpen, bibleReference]);

  const loadBibleText = async () => {
    if (!bibleReference) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const bibleChapters = await fetchBibleTextRange(
        bibleReference.book,
        bibleReference.chapters
      );
      
      if (bibleChapters.length === 0) {
        setError('Unable to load Bible text. Please try again.');
      } else {
        setChapters(bibleChapters);
      }
    } catch (err) {
      console.error('Error loading Bible text:', err);
      setError('Failed to load Bible text. Please check your internet connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setChapters([]);
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-amber-500 text-white p-4 rounded-t-lg">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold font-script">Original Bible Story</h2>
              <p className="text-amber-100 text-sm font-serif">{storyTitle}</p>
            </div>
            <button
              onClick={handleClose}
              className="text-white hover:text-amber-200 text-2xl font-bold"
            >
              ×
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
              <span className="ml-3 text-stone-600">Loading Bible text...</span>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
              <p className="text-red-600 font-medium">{error}</p>
              <button
                onClick={loadBibleText}
                className="mt-3 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Try Again
              </button>
            </div>
          )}

          {chapters.length > 0 && (
            <div className="space-y-6">
              {/* Reference Header */}
              <div className="bg-stone-50 border-l-4 border-amber-500 p-4 rounded-r-lg">
                <h3 className="font-bold text-stone-800 text-lg font-script">
                  {formatBibleReference(bibleReference.book, bibleReference.chapters, bibleReference.verses)}
                </h3>
                <p className="text-stone-600 text-sm mt-1 font-serif">
                  {getBibleSummary(chapters)} • {chapters[0]?.translation || 'KJV'}
                </p>
              </div>

              {/* Bible Text */}
              {chapters.map((chapter, chapterIndex) => (
                <div key={`${chapter.book}-${chapter.chapter}`} className="space-y-4">
                  {chapters.length > 1 && (
                    <h4 className="font-bold text-stone-800 text-lg border-b border-stone-200 pb-2 font-script">
                      Chapter {chapter.chapter}
                    </h4>
                  )}
                  
                  <div className="space-y-3">
                    {chapter.verses.map((verse, verseIndex) => (
                      <div key={`${chapter.chapter}-${verse.verse}`} className="flex">
                        <span className="text-amber-600 font-bold text-sm mr-3 mt-1 min-w-[3rem] text-right">
                          {verse.verse}
                        </span>
                        <p className="text-stone-700 leading-relaxed flex-1 font-serif">
                          {verse.text}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {/* Footer */}
              <div className="bg-stone-50 border-t border-stone-200 pt-4 mt-6">
                <p className="text-stone-500 text-sm text-center font-serif">
                  Scripture from {chapters[0]?.translation || 'King James Version'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-stone-50 border-t border-stone-200 p-4 rounded-b-lg">
          <div className="flex justify-between items-center">
            <p className="text-stone-500 text-sm font-serif">
              Compare with your interactive story experience
            </p>
            <button
              onClick={handleClose}
              className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BibleTextModal;
