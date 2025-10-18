/**
 * Text formatting utilities for enhanced biblical narrative display
 */

/**
 * Formats narrative text with automatic paragraph breaks for better readability
 * @param text - The narrative text to format
 * @returns Formatted text with paragraph breaks every 2-3 sentences
 */
export const formatNarrative = (text: string): string => {
  if (!text || text.trim().length === 0) {
    return '';
  }

  // Split by existing paragraph breaks first
  const paragraphs = text.split(/\n\s*\n/);
  
  const formattedParagraphs = paragraphs.map(paragraph => {
    if (paragraph.trim().length === 0) {
      return paragraph;
    }

    // Split into sentences using regex that handles common abbreviations
    const sentences = paragraph.split(/(?<=[.!?])\s+(?=[A-Z])/);
    
    // If we have 3 or fewer sentences, return as is
    if (sentences.length <= 3) {
      return paragraph.trim();
    }

    // Group sentences into chunks of 2-3 sentences
    const chunks: string[] = [];
    for (let i = 0; i < sentences.length; i += 2) {
      const chunk = sentences.slice(i, i + 2).join(' ').trim();
      if (chunk) {
        chunks.push(chunk);
      }
    }

    return chunks.join('\n\n');
  });

  return formattedParagraphs.join('\n\n');
};

/**
 * Creates an illuminated manuscript-style first letter (drop cap)
 * @param text - The text to add a drop cap to
 * @returns Text with the first letter wrapped in a drop cap span
 */
export const addDropCap = (text: string): string => {
  if (!text || text.trim().length === 0) {
    return text;
  }

  const trimmedText = text.trim();
  const firstChar = trimmedText.charAt(0);
  const restOfText = trimmedText.slice(1);

  return `<span class="drop-cap">${firstChar}</span>${restOfText}`;
};

/**
 * Enhanced typography settings for biblical narratives
 */
export const NARRATIVE_TYPOGRAPHY = {
  // Line height for better readability
  lineHeight: 'leading-relaxed md:leading-loose', // 1.625 line height on mobile, 1.75 on desktop
  // Paragraph spacing
  paragraphSpacing: 'mb-3 md:mb-4', // 0.75rem bottom margin on mobile, 1rem on desktop
  // Font size for body text
  fontSize: 'text-base md:text-lg', // 1rem (16px) on mobile, 1.125rem (18px) on desktop
  // Font family
  fontFamily: 'font-serif', // Crimson Text
  // Text color for good contrast on parchment
  textColor: 'text-stone-800',
  // Indent for traditional manuscript feel
  indent: 'indent-4', // 1rem indent
};

/**
 * Typography settings for headers and titles
 */
export const HEADER_TYPOGRAPHY = {
  // Font family for headers
  fontFamily: 'font-script', // Cormorant Garamond
  // Font weight
  fontWeight: 'font-semibold',
  // Text color
  textColor: 'text-stone-900',
  // Letter spacing for elegance
  letterSpacing: 'tracking-wide',
};
