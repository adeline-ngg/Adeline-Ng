import React, { useState, useEffect, useRef } from 'react';
import { tutorialService } from '../services/tutorialService';

interface TutorialGuideProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

const TutorialGuide: React.FC<TutorialGuideProps> = ({ isOpen, onClose, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(tutorialService.getCurrentStep());
  const [progress, setProgress] = useState(tutorialService.getProgress());
  const [highlightedElement, setHighlightedElement] = useState<HTMLElement | null>(null);
  const [spotlightStyle, setSpotlightStyle] = useState<React.CSSProperties>({});
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      tutorialService.startTutorial();
      updateHighlight();
    }
  }, [isOpen]);

  useEffect(() => {
    updateHighlight();
  }, [currentStep]);

  const updateHighlight = () => {
    const element = tutorialService.getHighlightedElement();
    setHighlightedElement(element);
    
    if (element) {
      const position = tutorialService.getElementPosition(element);
      setSpotlightStyle({
        position: 'absolute',
        top: position.top - 10,
        left: position.left - 10,
        width: position.width + 20,
        height: position.height + 20,
        border: '3px solid #F59E0B',
        borderRadius: '8px',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        pointerEvents: 'none',
        zIndex: 1000,
        animation: 'pulse 2s infinite'
      });
    } else {
      setSpotlightStyle({});
    }
  };

  const handleNext = () => {
    if (tutorialService.nextStep()) {
      setCurrentStep(tutorialService.getCurrentStep());
      setProgress(tutorialService.getProgress());
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (tutorialService.previousStep()) {
      setCurrentStep(tutorialService.getCurrentStep());
      setProgress(tutorialService.getProgress());
    }
  };

  const handleSkip = async () => {
    await tutorialService.skipTutorial();
    onClose();
  };

  const handleComplete = async () => {
    await tutorialService.completeTutorial();
    onComplete();
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) {
      handleSkip();
    }
  };

  if (!isOpen) return null;

  const getTooltipPosition = (): React.CSSProperties => {
    if (!highlightedElement) {
      return {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 1001
      };
    }

    const position = tutorialService.getElementPosition(highlightedElement);
    const step = currentStep;
    
    switch (step.position) {
      case 'top':
        return {
          position: 'absolute',
          bottom: window.innerHeight - position.top + 20,
          left: Math.max(20, Math.min(position.left, window.innerWidth - 320)),
          zIndex: 1001
        };
      case 'bottom':
        return {
          position: 'absolute',
          top: position.top + position.height + 20,
          left: Math.max(20, Math.min(position.left, window.innerWidth - 320)),
          zIndex: 1001
        };
      case 'left':
        return {
          position: 'absolute',
          top: position.top,
          right: window.innerWidth - position.left + 20,
          zIndex: 1001
        };
      case 'right':
        return {
          position: 'absolute',
          top: position.top,
          left: position.left + position.width + 20,
          zIndex: 1001
        };
      default:
        return {
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 1001
        };
    }
  };

  return (
    <div 
      ref={overlayRef}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
      onClick={handleBackdropClick}
    >
      {/* Spotlight effect for highlighted element */}
      {Object.keys(spotlightStyle).length > 0 && (
        <div style={spotlightStyle} />
      )}

      {/* Tooltip */}
      <div 
        style={getTooltipPosition()}
        className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm border-2 border-amber-200"
      >
        {/* Progress indicator */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex space-x-1">
            {Array.from({ length: progress.total }, (_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-colors ${
                  i < progress.current ? 'bg-amber-500' : 'bg-stone-200'
                }`}
              />
            ))}
          </div>
          <span className="text-sm text-stone-600 font-medium">
            {progress.current} of {progress.total}
          </span>
        </div>

        {/* Step content */}
        <div className="mb-6">
          <h3 className="text-xl font-bold text-stone-800 mb-3 font-script">
            {currentStep.title}
          </h3>
          <p className="text-stone-600 leading-relaxed font-serif">
            {currentStep.description}
          </p>
        </div>

        {/* Navigation buttons */}
        <div className="flex items-center justify-between">
          <div className="flex space-x-2">
            <button
              onClick={handlePrevious}
              disabled={progress.current === 1}
              className="px-4 py-2 text-stone-600 hover:text-stone-800 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-colors rounded-lg"
            >
              Previous
            </button>
            {progress.current > 1 && (
              <button
                onClick={handleSkip}
                className="px-4 py-2 text-stone-500 hover:text-stone-700 font-semibold transition-colors rounded-lg"
              >
                Skip Tutorial
              </button>
            )}
          </div>
          
          <div className="flex space-x-2">
            {progress.current === progress.total ? (
              <button
                onClick={handleComplete}
                className="bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 px-6 rounded-xl transition-colors"
              >
                Complete
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="bg-stone-800 hover:bg-stone-700 text-white font-bold py-3 px-6 rounded-xl transition-colors"
              >
                Next
              </button>
            )}
          </div>
        </div>
      </div>

      {/* CSS for pulse animation */}
      <style jsx>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.8;
            transform: scale(1.02);
          }
        }
      `}</style>
    </div>
  );
};

export default TutorialGuide;
