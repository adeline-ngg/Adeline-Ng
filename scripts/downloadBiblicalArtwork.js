#!/usr/bin/env node

/**
 * Script to help download and process biblical artwork for story covers
 * This script provides URLs and instructions for finding appropriate images
 */

import fs from 'fs';
import path from 'path';

// Image sources and search terms for each story
const storyArtwork = {
  'noahs-ark': {
    title: "Noah's Ark and the Great Flood",
    sources: [
      'https://freebibleimages.org/illustrations/?search=noah',
      'https://freechristimages.com/bible-story-art.html',
      'https://scrollandscreen.com/images/dore.htm'
    ],
    keywords: ['Noah', 'Ark', 'Flood', 'Animals', 'Rainbow'],
    filename: 'noahs-ark.jpg'
  },
  'moses-red-sea': {
    title: 'Moses and the Red Sea',
    sources: [
      'https://freebibleimages.org/illustrations/?search=moses',
      'https://freechristimages.com/bible-story-art.html',
      'https://scrollandscreen.com/images/dore.htm'
    ],
    keywords: ['Moses', 'Red Sea', 'Parting', 'Israelites', 'Egyptian army'],
    filename: 'moses-red-sea.jpg'
  },
  'david-goliath': {
    title: 'David and Goliath',
    sources: [
      'https://freechristimages.com/bible-story-art.html',
      'https://biblestudyvisuals.com/bible-artwork/',
      'https://scrollandscreen.com/images/dore.htm'
    ],
    keywords: ['David', 'Goliath', 'Sling', 'Stone', 'Valley'],
    filename: 'david-goliath.jpg'
  },
  'daniel-lions': {
    title: "Daniel in the Lions' Den",
    sources: [
      'https://freebibleimages.org/illustrations/?search=daniel',
      'https://commons.wikimedia.org/wiki/Category:Biblical_art',
      'https://scrollandscreen.com/images/dore.htm'
    ],
    keywords: ['Daniel', 'Lions', 'Den', 'Stone', 'Divine light'],
    filename: 'daniel-lions.jpg'
  },
  'nativity': {
    title: 'The Birth of a King',
    sources: [
      'https://freechristimages.com/bible-story-art.html',
      'https://freebibleimages.org/illustrations/?search=nativity',
      'https://scrollandscreen.com/images/dore.htm'
    ],
    keywords: ['Nativity', 'Jesus', 'Mary', 'Joseph', 'Stable', 'Bethlehem'],
    filename: 'nativity.jpg'
  },
  'resurrection': {
    title: 'The Crucifixion & Resurrection',
    sources: [
      'https://freechristimages.com/bible-story-art.html',
      'https://commons.wikimedia.org/wiki/Category:Biblical_art',
      'https://scrollandscreen.com/images/dore.htm'
    ],
    keywords: ['Crucifixion', 'Resurrection', 'Cross', 'Empty tomb', 'Jesus'],
    filename: 'resurrection.jpg'
  }
};

// Output directory
const outputDir = path.join(process.cwd(), 'public', 'assets', 'story-covers');

console.log('🎨 Biblical Artwork Download Guide\n');
console.log('=' .repeat(50));

Object.entries(storyArtwork).forEach(([storyId, info]) => {
  console.log(`\n📖 ${info.title}`);
  console.log(`   File: ${info.filename}`);
  console.log(`   Keywords: ${info.keywords.join(', ')}`);
  console.log('   Sources:');
  info.sources.forEach((source, index) => {
    console.log(`     ${index + 1}. ${source}`);
  });
});

console.log('\n' + '=' .repeat(50));
console.log('\n📋 Instructions:');
console.log('1. Visit each source URL above');
console.log('2. Search for images using the provided keywords');
console.log('3. Download high-resolution images (800x450px minimum)');
console.log('4. Save with the specified filenames in:');
console.log(`   ${outputDir}`);
console.log('5. Also copy to:');
console.log(`   ${path.join(process.cwd(), 'dist', 'assets', 'story-covers')}`);

console.log('\n📝 Requirements:');
console.log('- Aspect ratio: 16:9 (800x450px minimum)');
console.log('- Format: JPEG');
console.log('- Free to use (Creative Commons or public domain)');
console.log('- Visually compelling and historically themed');

console.log('\n✅ After downloading, run: npm run build');
console.log('   This will copy images to the dist folder automatically.');

// Create output directory if it doesn't exist
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
  console.log(`\n📁 Created directory: ${outputDir}`);
}
