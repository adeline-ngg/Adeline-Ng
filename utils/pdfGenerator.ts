import jsPDF from 'jspdf';
import { StoryLesson } from '../types';

export interface PDFOptions {
  title?: string;
  includeDate?: boolean;
  includeStoryInfo?: boolean;
  fontSize?: number;
  lineHeight?: number;
}

export class PDFGenerator {
  private doc: jsPDF;
  private pageWidth: number;
  private pageHeight: number;
  private margin: number;
  private currentY: number;
  private options: Required<PDFOptions>;

  constructor(options: PDFOptions = {}) {
    this.doc = new jsPDF();
    this.pageWidth = this.doc.internal.pageSize.getWidth();
    this.pageHeight = this.doc.internal.pageSize.getHeight();
    this.margin = 20;
    this.currentY = this.margin;
    
    this.options = {
      title: 'Biblical Journeys - Lessons Summary',
      includeDate: true,
      includeStoryInfo: true,
      fontSize: 12,
      lineHeight: 6,
      ...options
    };

    this.setupDocument();
  }

  private setupDocument(): void {
    // Set font
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(16);

    // Add title
    this.doc.text(this.options.title, this.margin, this.currentY);
    this.currentY += 15;

    // Add date if requested
    if (this.options.includeDate) {
      this.doc.setFontSize(10);
      this.doc.setTextColor(100, 100, 100);
      const dateStr = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      this.doc.text(`Generated on ${dateStr}`, this.margin, this.currentY);
      this.currentY += 10;
    }

    // Reset font
    this.doc.setFontSize(this.options.fontSize);
    this.doc.setTextColor(0, 0, 0);
    this.currentY += 10;
  }

  private checkPageBreak(neededSpace: number): void {
    if (this.currentY + neededSpace > this.pageHeight - this.margin) {
      this.doc.addPage();
      this.currentY = this.margin;
    }
  }

  private addStoryHeader(storyTitle: string, completionDate: number): void {
    this.checkPageBreak(20);

    // Add story title
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(14);
    this.doc.setTextColor(139, 69, 19); // Brown color
    
    this.doc.text(storyTitle, this.margin, this.currentY);
    this.currentY += 8;

    // Add completion date
    if (this.options.includeStoryInfo) {
      this.doc.setFont('helvetica', 'normal');
      this.doc.setFontSize(10);
      this.doc.setTextColor(100, 100, 100);
      
      const dateStr = new Date(completionDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
      this.doc.text(`Completed on ${dateStr}`, this.margin, this.currentY);
      this.currentY += 8;
    }

    // Add separator line
    this.doc.setDrawColor(200, 200, 200);
    this.doc.line(this.margin, this.currentY, this.pageWidth - this.margin, this.currentY);
    this.currentY += 10;

    // Reset font
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(this.options.fontSize);
    this.doc.setTextColor(0, 0, 0);
  }

  private addLesson(lesson: string, lessonNumber: number): void {
    this.checkPageBreak(25);

    // Add lesson number
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(11);
    this.doc.setTextColor(139, 69, 19);
    this.doc.text(`Lesson ${lessonNumber}:`, this.margin, this.currentY);
    this.currentY += 6;

    // Add lesson text
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(this.options.fontSize);
    this.doc.setTextColor(0, 0, 0);

    // Split text into lines that fit the page width
    const maxWidth = this.pageWidth - (this.margin * 2);
    const lines = this.doc.splitTextToSize(lesson, maxWidth);
    
    this.doc.text(lines, this.margin, this.currentY);
    this.currentY += (lines.length * this.options.lineHeight) + 8;
  }

  public generateGroupedLessonsPDF(lessons: StoryLesson[]): Blob {
    // Group lessons by story
    const groupedLessons = lessons.reduce((acc, lesson) => {
      if (!acc[lesson.storyId]) {
        acc[lesson.storyId] = {
          storyTitle: lesson.storyTitle,
          completionDate: lesson.completionDate,
          lessons: []
        };
      }
      acc[lesson.storyId].lessons.push(lesson.lesson);
      return acc;
    }, {} as { [storyId: string]: { storyTitle: string; completionDate: number; lessons: string[] } });

    // Add lessons by story
    Object.values(groupedLessons).forEach(storyData => {
      this.addStoryHeader(storyData.storyTitle, storyData.completionDate);
      
      storyData.lessons.forEach((lesson, index) => {
        this.addLesson(lesson, index + 1);
      });
      
      this.currentY += 10; // Extra space between stories
    });

    return this.doc.output('blob');
  }

  public generateChronologicalLessonsPDF(lessons: StoryLesson[]): Blob {
    // Add chronological header
    this.checkPageBreak(15);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(14);
    this.doc.setTextColor(139, 69, 19);
    this.doc.text('All Lessons (Chronological Order)', this.margin, this.currentY);
    this.currentY += 15;

    // Add lessons in chronological order
    lessons.forEach((lesson, index) => {
      this.checkPageBreak(20);
      
      // Add story context
      this.doc.setFont('helvetica', 'italic');
      this.doc.setFontSize(10);
      this.doc.setTextColor(100, 100, 100);
      this.doc.text(`From: ${lesson.storyTitle}`, this.margin, this.currentY);
      this.currentY += 5;

      // Add lesson
      this.addLesson(lesson.lesson, index + 1);
    });

    return this.doc.output('blob');
  }

  public generatePDF(lessons: StoryLesson[], viewMode: 'grouped' | 'chronological'): Blob {
    if (viewMode === 'grouped') {
      return this.generateGroupedLessonsPDF(lessons);
    } else {
      return this.generateChronologicalLessonsPDF(lessons);
    }
  }
}

export function generateLessonsPDF(
  lessons: StoryLesson[], 
  viewMode: 'grouped' | 'chronological' = 'grouped',
  options: PDFOptions = {}
): Blob {
  const generator = new PDFGenerator(options);
  return generator.generatePDF(lessons, viewMode);
}

export function downloadPDF(blob: Blob, filename?: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || `Biblical_Journeys_Lessons_${new Date().toISOString().split('T')[0]}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
