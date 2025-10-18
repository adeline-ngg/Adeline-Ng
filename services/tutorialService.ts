import { TutorialCompletion, TutorialStep } from '../types';
import { saveTutorialCompletion, loadTutorialCompletion } from './storageService';

export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Biblical Journeys!',
    description: 'This interactive tutorial will guide you through the key features of your Bible story experience. You can skip this tutorial anytime and access it later from the menu.',
    position: 'center'
  },
  {
    id: 'story-selection',
    title: 'Choose Your Adventure',
    description: 'Select any story to begin your journey. Each story offers a unique biblical adventure where you\'ll make choices that shape your experience.',
    selector: '.story-card',
    position: 'bottom'
  },
  {
    id: 'settings-narration',
    title: 'Audio Narration',
    description: 'Customize your experience with voice narration. Click the settings gear to access narration options and choose your preferred voice.',
    selector: '[title="Settings"]',
    position: 'bottom'
  },
  {
    id: 'making-choices',
    title: 'Your Choices Matter',
    description: 'Throughout each story, you\'ll be presented with choices that allow you to interact with biblical characters and influence conversations.',
    selector: '.choice-button',
    position: 'top'
  },
  {
    id: 'viewing-lessons',
    title: 'Divine Lessons',
    description: 'Pay attention to the special lesson cards that appear during stories. These contain the spiritual wisdom and biblical teachings.',
    selector: '.lesson-card',
    position: 'center'
  },
  {
    id: 'audio-controls',
    title: 'Listen to Stories',
    description: 'Use the audio controls to hear the story narrated. You can pause, resume, or replay any segment.',
    selector: '.audio-control',
    position: 'left'
  },
  {
    id: 'bible-text',
    title: 'Read the Original',
    description: 'After completing a story, you can read the original biblical text to compare with your interactive experience.',
    selector: '.bible-text-button',
    position: 'top'
  },
  {
    id: 'lessons-summary',
    title: 'Your Spiritual Journey',
    description: 'Access all your collected lessons in one place. You can view them by story or chronologically, and even download them as a PDF.',
    selector: '.lessons-summary-button',
    position: 'bottom'
  }
];

export class TutorialService {
  private static instance: TutorialService;
  private currentStepIndex: number = 0;
  private isActive: boolean = false;

  static getInstance(): TutorialService {
    if (!TutorialService.instance) {
      TutorialService.instance = new TutorialService();
    }
    return TutorialService.instance;
  }

  getCurrentStep(): TutorialStep {
    return TUTORIAL_STEPS[this.currentStepIndex];
  }

  getNextStep(): TutorialStep | null {
    if (this.currentStepIndex < TUTORIAL_STEPS.length - 1) {
      return TUTORIAL_STEPS[this.currentStepIndex + 1];
    }
    return null;
  }

  getPreviousStep(): TutorialStep | null {
    if (this.currentStepIndex > 0) {
      return TUTORIAL_STEPS[this.currentStepIndex - 1];
    }
    return null;
  }

  nextStep(): boolean {
    if (this.currentStepIndex < TUTORIAL_STEPS.length - 1) {
      this.currentStepIndex++;
      return true;
    }
    return false;
  }

  previousStep(): boolean {
    if (this.currentStepIndex > 0) {
      this.currentStepIndex--;
      return true;
    }
    return false;
  }

  goToStep(index: number): void {
    if (index >= 0 && index < TUTORIAL_STEPS.length) {
      this.currentStepIndex = index;
    }
  }

  startTutorial(): void {
    this.isActive = true;
    this.currentStepIndex = 0;
  }

  stopTutorial(): void {
    this.isActive = false;
  }

  isTutorialActive(): boolean {
    return this.isActive;
  }

  getProgress(): { current: number; total: number } {
    return {
      current: this.currentStepIndex + 1,
      total: TUTORIAL_STEPS.length
    };
  }

  async completeTutorial(): Promise<void> {
    const completion: TutorialCompletion = {
      hasCompletedTutorial: true,
      lastCompletedDate: Date.now(),
      skippedTutorial: false
    };
    saveTutorialCompletion(completion);
    this.stopTutorial();
  }

  async skipTutorial(): Promise<void> {
    const completion: TutorialCompletion = {
      hasCompletedTutorial: false,
      skippedTutorial: true
    };
    saveTutorialCompletion(completion);
    this.stopTutorial();
  }

  shouldShowTutorial(): boolean {
    const completion = loadTutorialCompletion();
    return !completion.hasCompletedTutorial && !completion.skippedTutorial;
  }

  hasCompletedTutorial(): boolean {
    const completion = loadTutorialCompletion();
    return completion.hasCompletedTutorial;
  }

  getHighlightedElement(): HTMLElement | null {
    const currentStep = this.getCurrentStep();
    if (!currentStep.selector) return null;

    try {
      return document.querySelector(currentStep.selector) as HTMLElement;
    } catch (error) {
      console.warn('Could not find element for tutorial step:', currentStep.selector);
      return null;
    }
  }

  getElementPosition(element: HTMLElement): { top: number; left: number; width: number; height: number } {
    const rect = element.getBoundingClientRect();
    return {
      top: rect.top + window.scrollY,
      left: rect.left + window.scrollX,
      width: rect.width,
      height: rect.height
    };
  }
}

export const tutorialService = TutorialService.getInstance();
