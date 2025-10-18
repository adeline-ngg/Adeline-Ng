#!/usr/bin/env node

/**
 * Script to verify story cover images and provide replacement instructions
 */

import fs from 'fs';
import path from 'path';

const storyCovers = [
  'noahs-ark.jpg',
  'moses-red-sea.jpg', 
  'david-goliath.jpg',
  'daniel-lions.jpg',
  'nativity.jpg',
  'resurrection.jpg'
];

const publicDir = path.join(process.cwd(), 'public', 'assets', 'story-covers');
const distDir = path.join(process.cwd(), 'dist', 'assets', 'story-covers');

console.log('🔍 Story Cover Image Verification\n');
console.log('=' .repeat(50));

let allImagesPresent = true;

// Check public directory
console.log('\n📁 Checking public/assets/story-covers/:');
storyCovers.forEach(filename => {
  const filePath = path.join(publicDir, filename);
  if (fs.existsSync(filePath)) {
    const stats = fs.statSync(filePath);
    const sizeKB = Math.round(stats.size / 1024);
    console.log(`✅ ${filename} (${sizeKB} KB)`);
  } else {
    console.log(`❌ ${filename} - MISSING`);
    allImagesPresent = false;
  }
});

// Check dist directory
console.log('\n📁 Checking dist/assets/story-covers/:');
storyCovers.forEach(filename => {
  const filePath = path.join(distDir, filename);
  if (fs.existsSync(filePath)) {
    const stats = fs.statSync(filePath);
    const sizeKB = Math.round(stats.size / 1024);
    console.log(`✅ ${filename} (${sizeKB} KB)`);
  } else {
    console.log(`❌ ${filename} - MISSING`);
    allImagesPresent = false;
  }
});

console.log('\n' + '=' .repeat(50));

if (allImagesPresent) {
  console.log('\n✅ All story cover images are present!');
  console.log('🎨 Current images appear to be generic stock photos.');
  console.log('📋 To replace with biblical artwork, run: npm run download-artwork');
} else {
  console.log('\n❌ Some story cover images are missing.');
  console.log('📋 To download biblical artwork, run: npm run download-artwork');
}

console.log('\n📖 For detailed instructions, see: docs/STORY_COVERS.md');
