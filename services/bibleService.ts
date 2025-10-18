export interface BibleVerse {
  book: string;
  chapter: number;
  verse: number;
  text: string;
  translation: string;
}

export interface BibleChapter {
  book: string;
  chapter: number;
  verses: BibleVerse[];
  translation: string;
}

/**
 * Fetch Bible text for a specific book and chapter
 * Uses the free Bible API (bible-api.com)
 */
export async function fetchBibleText(book: string, chapter: string): Promise<BibleChapter | null> {
  try {
    console.log(`Fetching Bible text for ${book} ${chapter}`);
    
    // Format book name for API (e.g., "1 Samuel" -> "1_Samuel")
    const formattedBook = book.replace(/\s+/g, '_');
    const url = `https://bible-api.com/${formattedBook}+${chapter}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Parse the API response
    const verses: BibleVerse[] = data.verses.map((v: any) => ({
      book: data.reference.split(' ')[0],
      chapter: parseInt(chapter),
      verse: v.verse,
      text: v.text,
      translation: data.translation_name || 'KJV'
    }));
    
    return {
      book: data.reference.split(' ')[0],
      chapter: parseInt(chapter),
      verses,
      translation: data.translation_name || 'KJV'
    };
    
  } catch (error) {
    console.error('Error fetching Bible text:', error);
    return null;
  }
}

/**
 * Fetch Bible text for multiple chapters (e.g., "6-9" for Genesis 6-9)
 */
export async function fetchBibleTextRange(book: string, chapterRange: string): Promise<BibleChapter[]> {
  try {
    const chapters: BibleChapter[] = [];
    
    // Parse chapter range (e.g., "6-9" or "19-20")
    if (chapterRange.includes('-')) {
      const [start, end] = chapterRange.split('-').map(n => parseInt(n.trim()));
      
      for (let chapter = start; chapter <= end; chapter++) {
        const chapterData = await fetchBibleText(book, chapter.toString());
        if (chapterData) {
          chapters.push(chapterData);
        }
        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } else {
      // Single chapter
      const chapterData = await fetchBibleText(book, chapterRange);
      if (chapterData) {
        chapters.push(chapterData);
      }
    }
    
    return chapters;
  } catch (error) {
    console.error('Error fetching Bible text range:', error);
    return [];
  }
}

/**
 * Get a formatted reference string
 */
export function formatBibleReference(book: string, chapters: string, verses?: string): string {
  let reference = `${book} ${chapters}`;
  if (verses) {
    reference += `:${verses}`;
  }
  return reference;
}

/**
 * Get a summary of the Bible text for display
 */
export function getBibleSummary(chapters: BibleChapter[]): string {
  if (chapters.length === 0) return '';
  
  const totalVerses = chapters.reduce((sum, chapter) => sum + chapter.verses.length, 0);
  const book = chapters[0].book;
  const chapterRange = chapters.length === 1 
    ? chapters[0].chapter.toString()
    : `${chapters[0].chapter}-${chapters[chapters.length - 1].chapter}`;
  
  return `${book} ${chapterRange} (${totalVerses} verses)`;
}
