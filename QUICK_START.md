# Quick Start Guide - Biblical Journeys Enhanced

## Installation

```bash
# 1. Install dependencies
npm install

# 2. Set up environment variables
# Create .env.local file (if not exists)
echo "API_KEY=your_gemini_api_key_here" > .env.local

# Optional: Add Mem0 API key for memory features
echo "MEM0_API_KEY=your_mem0_api_key_here" >> .env.local

# 3. Run the app
npm run dev
```

## What's New? 🎉

### 1. **Animated Scenes**
- Every story scene now has subtle animations
- Smooth transitions between frames
- More immersive experience

### 2. **Voice Narration** (Optional)
- Click the **play button** on any story segment
- Choose your narrator voice in **Settings** (gear icon)
- Adjust playback speed (0.75x - 1.5x)
- **100% FREE** - uses your browser's built-in voices

### 3. **Auto-Save Progress**
- Your progress saves automatically as you play
- Return anytime and **Continue** from where you left off
- Or **Restart** any story with a fresh beginning

### 4. **Profile Persistence**
- Create your avatar once
- Automatically loads when you return
- Edit or delete anytime in **Settings**

### 5. **Smart Memory** (Experimental)
- App learns your preferences over time
- Remembers your choice patterns
- Can subtly influence story generation
- (Requires Mem0 API key - optional)

## First Time Using the App

1. **Create Your Character**
   - Enter your character's name
   - Describe their appearance
   - Click "Generate Avatar"
   - Click "Begin Journey"

2. **Choose a Story**
   - Browse 6 biblical stories
   - Click "Experience This Story"

3. **Interactive Experience**
   - Read the narrative
   - Watch the animated scene
   - (Optional) Click 🔊 to hear narration
   - Choose your action
   - Ask questions anytime

4. **Your Progress Saves Automatically!**
   - Exit anytime
   - Return later to continue

## Returning User Flow

1. **App Opens** → Your profile auto-loads
2. **Story Selection** → See "In Progress" badges
3. **Choose**: 
   - **Continue Story** → Resume from last point
   - **Restart from Beginning** → Fresh start

## Settings Panel (⚙️ Icon)

### Narration Settings
- **Enable/Disable**: Toggle narration on/off
- **Voice Selection**: Choose from available system voices
- **Speed Control**: Adjust how fast the narrator speaks
- **Test Voice**: Preview your selected voice

### Storage Information
- View saved data
- See which stories have progress
- Check storage usage

### Data Management
- **Clear Audio Cache**: Free up space
- **Clear Story Progress**: Remove all saved progress
- **Delete Profile**: Remove everything and start fresh

## Browser Recommendations

### Best Experience
- **Chrome** or **Edge**: Best voice quality
- **Safari**: Good quality (Apple voices)

### Limited Support
- **Firefox**: Narration may not work properly

## Tips & Tricks

### For Narration
1. Enable narration in Settings first
2. Pick a voice you like (test it!)
3. Adjust speed to your preference
4. Click play button on any narrator segment

### For Storage
- Profile + progress uses ~100-500 KB
- Audio cache can grow to a few MB
- Clear cache in Settings if needed

### For Multiple Stories
- Each story saves progress independently
- You can have multiple stories in progress
- Switch between stories anytime

## Troubleshooting

### "Narration Not Working"
- Check if narration is enabled in Settings
- Try a different voice
- Ensure browser supports Web Speech API
- Use Chrome/Edge for best results

### "Progress Not Saving"
- Check if localStorage is enabled in browser
- Disable incognito/private mode
- Clear browser cache and try again

### "GIF Not Loading"
- Wait a moment (takes ~10-20 seconds)
- Check internet connection
- Reload page if stuck

### "Running Out of Storage"
- Clear audio cache in Settings
- Delete old story progress
- Use "Clear All Story Progress" option

## Cost Information

### What's Free
- ✅ Voice narration (Web Speech API)
- ✅ Profile & progress storage (localStorage)
- ✅ Audio caching (IndexedDB)

### What Uses API Credits
- 🔸 Avatar generation (1 image per avatar)
- 🔸 Scene generation (2 images per scene)
- 🔸 Story text (Gemini API)

### Optional Paid Feature
- 🔹 Mem0 memory (has free tier: 100k tokens/month)

## FAQ

**Q: Do I need to create a new profile every time?**
A: No! Your profile saves automatically and loads when you return.

**Q: Can I change my avatar later?**
A: Yes! Go to Settings → Delete Profile, then create a new one.

**Q: Do I need the Mem0 API key?**
A: No, it's optional. The app works great without it!

**Q: Why are the animations taking long to load?**
A: Generating 2 frames + creating GIF takes time. First frame shows quickly, animation follows.

**Q: Can I use this offline?**
A: Not for generating new content, but you can replay saved audio and view saved progress offline.

**Q: How do I backup my progress?**
A: Currently manual backup needed. Future version will have export/import.

## Need Help?

1. Check the browser console for errors (F12)
2. Try clearing cache: Settings → Clear Audio Cache
3. Try restarting story: Settings → Clear Story Progress
4. Last resort: Settings → Delete Profile & All Data

## Enjoy Your Biblical Journey! 📖✨

Experience interactive biblical stories with beautiful animations and immersive narration. Your progress is always saved, and you can return anytime to continue your adventure!

---

**Version**: 2.0.0
**Last Updated**: October 2025

