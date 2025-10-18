// DEPRECATED: This script is no longer used as we now use curated biblical artwork
// from free sources instead of AI-generated images.
// See scripts/downloadBiblicalArtwork.js for the new approach.

/*
import { generateSceneImageWithCharacters } from '../services/geminiService';
import fs from 'fs';
import path from 'path';

interface StoryCover {
  id: string;
  title: string;
  prompt: string;
  filename: string;
}

const storyCovers: StoryCover[] = [
  {
    id: 'noahs-ark',
    title: "Noah's Ark and the Great Flood",
    prompt: "Massive wooden ark on a hill, dark storm clouds gathering, rain beginning to fall, animals entering in pairs, dramatic biblical scene, 4k, photo-realistic, historically accurate, cinematic lighting",
    filename: 'noahs-ark.jpg'
  },
  {
    id: 'moses-red-sea',
    title: 'Moses and the Red Sea',
    prompt: "Moses with staff raised high, massive walls of water parted on both sides, Israelites walking through on dry ground, Egyptian army in distance, epic biblical scene, 4k, photo-realistic, historically accurate, cinematic lighting",
    filename: 'moses-red-sea.jpg'
  },
  {
    id: 'david-goliath',
    title: 'David and Goliath',
    prompt: "Young shepherd David with sling facing giant warrior Goliath in armor, valley battlefield, two armies watching, biblical scene, 4k, photo-realistic, historically accurate, cinematic lighting",
    filename: 'david-goliath.jpg'
  },
  {
    id: 'daniel-lions',
    title: "Daniel in the Lions' Den",
    prompt: "Daniel standing calmly in stone den surrounded by lions, divine light shining down, peaceful expression, biblical scene, 4k, photo-realistic, historically accurate, cinematic lighting",
    filename: 'daniel-lions.jpg'
  },
  {
    id: 'nativity',
    title: 'The Birth of a King',
    prompt: "Humble stable in Bethlehem at night, baby Jesus in manger, Mary and Joseph, warm candlelight, starry sky visible through opening, biblical scene, 4k, photo-realistic, historically accurate, cinematic lighting",
    filename: 'nativity.jpg'
  },
  {
    id: 'resurrection',
    title: 'The Crucifixion & Resurrection',
    prompt: "Empty tomb with stone rolled away, bright divine light emanating from entrance, dawn breaking, biblical scene, 4k, photo-realistic, historically accurate, cinematic lighting",
    filename: 'resurrection.jpg'
  }
];

const convertBase64ToFile = (base64Data: string, filePath: string): void => {
  // Remove data URL prefix if present
  const base64String = base64Data.replace(/^data:image\/[a-z]+;base64,/, '');
  
  // Convert base64 to buffer
  const buffer = Buffer.from(base64String, 'base64');
  
  // Write to file
  fs.writeFileSync(filePath, buffer);
  console.log(`✅ Saved image: ${filePath}`);
};

const generateStoryCovers = async (): Promise<void> => {
  console.log('🎨 Starting biblical story cover generation...\n');
  
  const outputDir = path.join(process.cwd(), 'public', 'assets', 'story-covers');
  
  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
    console.log(`📁 Created directory: ${outputDir}`);
  }
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const story of storyCovers) {
    try {
      console.log(`🖼️  Generating cover for: ${story.title}`);
      console.log(`   Prompt: ${story.prompt.substring(0, 100)}...`);
      
      // Generate image using Gemini
      const base64Image = await generateSceneImageWithCharacters(story.prompt);
      
      // Save to file
      const filePath = path.join(outputDir, story.filename);
      convertBase64ToFile(base64Image, filePath);
      
      successCount++;
      console.log(`✅ Successfully generated: ${story.title}\n`);
      
    } catch (error) {
      errorCount++;
      console.error(`❌ Failed to generate ${story.title}:`, error instanceof Error ? error.message : 'Unknown error');
      console.log(`   Using existing image as fallback: ${story.filename}\n`);
    }
  }
  
  console.log('🎉 Generation complete!');
  console.log(`✅ Successfully generated: ${successCount} images`);
  if (errorCount > 0) {
    console.log(`❌ Failed to generate: ${errorCount} images (using fallbacks)`);
  }
  console.log(`📁 Images saved to: ${outputDir}`);
};

// Run the script
generateStoryCovers().catch((error) => {
  console.error('💥 Script failed:', error);
  process.exit(1);
});
*/
