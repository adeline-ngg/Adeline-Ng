# Story Cover Images

This document explains how to replace the story cover images with biblical artwork.

## Current Status

The story covers are currently using generic stock photos from Unsplash that don't match the biblical themes. We need to replace them with relevant, high-quality biblical artwork from free sources.

## Required Images

The following 6 images need to be replaced:

1. **Noah's Ark and the Great Flood** (`noahs-ark.jpg`)
2. **Moses and the Red Sea** (`moses-red-sea.jpg`)
3. **David and Goliath** (`david-goliath.jpg`)
4. **Daniel in the Lions' Den** (`daniel-lions.jpg`)
5. **The Birth of a King** (`nativity.jpg`)
6. **The Crucifixion & Resurrection** (`resurrection.jpg`)

## Free Sources for Biblical Artwork

### 1. FreeBibleimages.org
- **URL**: https://freebibleimages.org/
- **Content**: 1,500+ Bible story illustration sets
- **Usage**: Free for educational and ministry use
- **Format**: Multiple formats available (PowerPoint, PDF, Keynote, JPEG)

### 2. Free Christ Images
- **URL**: https://freechristimages.com/
- **Content**: High-resolution, royalty-free Christian images
- **Usage**: Free for non-commercial purposes
- **Requirements**: Link back to site when used on web pages

### 3. Bible Study Visuals
- **URL**: https://biblestudyvisuals.com/bible-artwork/
- **Content**: Fine art, classic Bible comic illustrations, AI-generated art
- **Usage**: Free for educational use

### 4. Gustave Doré Collection (Public Domain)
- **URL**: https://scrollandscreen.com/images/dore.htm
- **Content**: Classic biblical illustrations by Gustave Doré
- **Usage**: Public domain - completely free to use

### 5. Wikimedia Commons
- **URL**: https://commons.wikimedia.org/
- **Content**: Public domain biblical artwork
- **Usage**: Various licenses, many public domain

## Image Requirements

- **Aspect Ratio**: 16:9 (800x450px minimum)
- **Format**: JPEG
- **Quality**: High resolution, visually compelling
- **Theme**: Historically accurate biblical scenes
- **License**: Free to use (Creative Commons or public domain)

## How to Replace Images

1. **Download Images**: Visit the source URLs and download high-resolution images
2. **Process Images**: Resize/crop to 16:9 aspect ratio (800x450px minimum) and optimize for web use
3. **Replace Files**: Copy images to `public/assets/story-covers/` with exact filenames
4. **Build and Test**: Run `npm run build` and test the application

## File Locations

- **Source images**: `public/assets/story-covers/`
- **Build images**: `dist/assets/story-covers/`
- **Attribution**: `public/assets/story-covers/ATTRIBUTION.md`

## Attribution Requirements

Some sources require attribution. Please document:
- The exact URL where the image was found
- The artist name (if available)
- The license type
- Any specific attribution requirements

Add this information to `public/assets/story-covers/ATTRIBUTION.md`.

## Implementation Notes

The app now uses curated biblical artwork instead of AI-generated images for better historical accuracy and cost efficiency.

## Troubleshooting

### Images not displaying
- Check file paths and filenames
- Ensure images are in both `public/` and `dist/` folders
- Run `npm run build` to copy images to dist folder

### Image quality issues
- Use high-resolution source images (800x450px minimum)
- Optimize for web use without losing quality
- Ensure 16:9 aspect ratio

### Attribution issues
- Check license requirements for each source
- Update attribution file with proper credits
- Some sources require links back to their websites
