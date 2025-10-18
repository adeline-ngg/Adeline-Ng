# Biblical Journeys - Enhanced Features

## Overview
This document describes the new features added to the Biblical Journeys interactive story application.

## New Features

### 1. Animated GIF Scenes ✨
- **Description**: Each story scene now features animated GIF transitions instead of static images
- **Implementation**: Generates 2 frames per scene and creates smooth animated GIF transitions
- **Cost Optimization**: Uses 2-frame generation + interpolation to minimize API costs (2x image cost vs 5x+ for full animation)
- **Technical Details**:
  - `generateSceneFrames()` in `geminiService.ts` generates beginning and end frames
  - `createAnimatedGIF()` in `utils/gifCreator.ts` uses gifshot library to create smooth animations
  - Fallback to placeholder if generation fails

### 2. Voice Narration 🎙️
- **Description**: Optional text-to-speech narration for story segments
- **Technology**: Uses browser's built-in Web Speech API (free, no API costs)
- **Features**:
  - Voice selection from available system voices
  - Speed control (0.75x, 1.0x, 1.25x, 1.5x)
  - Manual play button for each narrator segment
  - Visual indicator when narration is playing
  - Audio caching in IndexedDB to prevent regeneration

- **Settings**:
  - Enable/disable narration
  - Choose from available voices (varies by OS/browser)
  - Adjust playback speed
  - Test voice before using

- **Future Enhancement**: Framework ready for ElevenLabs integration as premium feature

### 3. Profile Persistence 💾
- **Description**: User profiles are saved and automatically loaded on app launch
- **Storage**: localStorage (device-specific, ~5-10MB capacity)
- **Features**:
  - Avatar image saved as base64
  - Auto-load existing profile on app start
  - Edit profile option in settings
  - Delete profile with confirmation

### 4. Story Progress Auto-Save 📖
- **Description**: Story progress is automatically saved as you play
- **Features**:
  - Saves after each story segment
  - Resume from last position
  - Multiple stories can have independent progress
  - "Continue" or "Restart" options on story selection
  - Visual "In Progress" badge on story cards

- **Storage Format**:
  ```typescript
  {
    storyId: string;
    segments: StorySegment[];
    currentChoices: string[];
    storyHistory: string[];
    lastUpdated: number;
  }
  ```

### 5. Mem0 Memory Integration 🧠
- **Description**: AI-powered memory system tracks user preferences and patterns
- **Optional**: Gracefully degrades if not configured
- **Features**:
  - Tracks choice patterns (peaceful, brave, wise, etc.)
  - Identifies favorite themes (faith, courage, redemption)
  - Analyzes interaction style (conversational, decisive, exploratory)
  - Can enhance story prompts with user context

- **Setup** (Optional):
  - Set `MEM0_API_KEY` environment variable
  - Automatically initializes on app load
  - Free tier: 100k tokens/month

- **Privacy**: All data stored per user ID (profile name)

### 6. Settings Panel ⚙️
- **Access**: Gear icon in story selection screen
- **Sections**:
  
  **Narration Settings**:
  - Enable/disable narration
  - Voice selection
  - Speed control
  - Test voice button

  **Storage Information**:
  - Profile status
  - Number of stories in progress
  - Storage size used
  - Audio cache entries

  **Data Management**:
  - Clear audio cache
  - Clear all story progress
  - Delete profile and all data

## Technical Architecture

### Services
- `speechService.ts`: Web Speech API wrapper
- `storageService.ts`: localStorage management
- `memoryService.ts`: Mem0 integration
- `geminiService.ts`: Enhanced with 2-frame generation

### Utilities
- `gifCreator.ts`: Animated GIF generation
- `audioCache.ts`: IndexedDB audio caching

### Components
- `Settings.tsx`: Settings panel
- `StoryPlayer.tsx`: Enhanced with narration, auto-save, GIF display
- `ProfileSetup.tsx`: Profile persistence
- `StorySelect.tsx`: Continue/restart options

## Cost Optimization

### Current Costs
- **Images**: 2x per scene (vs 1x before, but creates animation)
- **Narration**: $0 (using Web Speech API)
- **Memory**: Free tier sufficient for most users
- **Storage**: Free (localStorage and IndexedDB)

### Budget-Friendly Approach
1. ✅ Web Speech API instead of ElevenLabs (saves $$$)
2. ✅ 2-frame GIF instead of 5+ frames (saves 60% on images)
3. ✅ Audio caching prevents regeneration
4. ✅ localStorage for saves (no backend costs)
5. ✅ Mem0 free tier for memory (100k tokens/month)

## User Flow

### First Time User
1. Create profile (name + avatar description)
2. Generate avatar image
3. Select story
4. Experience interactive story with animations and optional narration
5. Progress auto-saves

### Returning User
1. Profile auto-loads
2. See stories with "In Progress" badges
3. Choose "Continue" or "Restart"
4. Access settings to manage data or preferences

## Browser Compatibility

### Required Features
- localStorage (all modern browsers)
- IndexedDB (all modern browsers)
- Web Speech API:
  - ✅ Chrome/Edge (best voice quality)
  - ✅ Safari (Apple voices)
  - ⚠️ Firefox (limited support)

### Recommended Browsers
- Chrome 90+
- Safari 14+
- Edge 90+

## Future Enhancements

### Planned
1. **ElevenLabs Integration**: Premium narration option
2. **Cloud Sync**: Optional backend for cross-device progress
3. **More Animation Frames**: Option for higher quality GIFs
4. **Export/Import**: Backup and restore data
5. **Social Sharing**: Share story moments

### Under Consideration
1. Background music
2. Sound effects
3. Multiple language support
4. Accessibility improvements (screen readers, keyboard navigation)

## Installation

```bash
npm install
```

### New Dependencies Added
- `gifshot`: GIF creation
- `mem0ai`: Memory/preference tracking
- `idb`: IndexedDB wrapper
- `@types/gifshot`: TypeScript types

## Environment Variables

```bash
# Required
API_KEY=your_gemini_api_key

# Optional (for Mem0 memory features)
MEM0_API_KEY=your_mem0_api_key
```

## Development

```bash
npm run dev
```

## Notes

- All new features are designed to be budget-friendly
- Graceful degradation when optional features unavailable
- No breaking changes to existing functionality
- Progressive enhancement approach

---

**Version**: 2.0.0
**Last Updated**: October 2025

