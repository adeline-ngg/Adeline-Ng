# Setup Guide - Biblical Journeys

## Prerequisites

- Node.js (latest LTS recommended)
- Google Gemini API key (required for image generation)

## Quick Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Configuration

Create a `.env` file in the project root and add your API keys:

```bash
# Required: Google Gemini API Key
API_KEY=your_actual_api_key_here

# Optional: Mem0 for memory features
MEM0_API_KEY=your_mem0_key_here
```

**Note:** Both `API_KEY` and `GEMINI_API_KEY` are supported for the Gemini API key.

### 3. Get Your API Keys

#### Google Gemini API Key (Required)
1. Go to: https://aistudio.google.com/apikey
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the key and paste it into your `.env` file

#### Mem0 API Key (Optional)
- Used for AI-powered memory features
- Free tier: 100k tokens/month
- Get at: https://www.mem0.ai/

### 4. Start the Application

```bash
npm run dev
```

## Troubleshooting

### Images Not Loading (Infinite Spinner)

**Check browser console (F12) for these errors:**

#### 1. API Key Not Found
**Error:** `⚠️ GEMINI_API_KEY not found in environment variables!`

**Solutions:**
- Verify `.env` file exists in project root (same folder as `package.json`)
- Check file is named exactly `.env` (not `.env.txt`)
- Restart the development server completely
- Try using `.env.local` instead

#### 2. API Timeout
**Error:** `Error generating scene frames: timeout`

**Solutions:**
- Wait up to 90 seconds (first image generation can be slow)
- Check internet connection
- Try refreshing the page
- A fallback image should appear after timeout

#### 3. API Quota Exceeded
**Error:** `RESOURCE_EXHAUSTED` or `quota`

**Solutions:**
- Check your API usage at: https://aistudio.google.com/
- Enable billing if needed
- Wait for quota reset
- Consider upgrading your plan

#### 4. Generation Failed
**Error:** `Failed to generate scene GIF: [error message]`

**Solutions:**
- Verify API key is valid
- Check network connectivity
- Try regenerating the image
- Check for API endpoint issues

### Fallback Images

If image generation fails, the app should show a fallback landscape image from Unsplash. If you're stuck on the loading spinner:

1. Open browser console (F12)
2. Look for specific error messages
3. Hard refresh the page (Ctrl+Shift+R or Cmd+Shift+R)
4. Try restarting the development server

## Expected Behavior

### ✅ Working Correctly
- Story text appears immediately
- Biblical lesson appears immediately
- Loading spinner shows while image generates
- Image appears after 10-60 seconds
- OR fallback image appears after 90 seconds if timeout

### ❌ Not Working (Missing API Key)
- Story text appears
- Lesson appears
- Loading spinner shows forever
- Console shows API key error
- No image ever appears

## API Cost Information

### Free Tier (Gemini API)
- **Text generation:** Very generous free tier
- **Image generation (Imagen):** Limited free tier
- Check current limits at: https://ai.google.dev/pricing

### What Uses API Calls?
1. **Avatar generation:** 1 image (one-time)
2. **Each story segment:** 
   - 1 text generation call (Gemini)
   - 2 image generation calls (Imagen) for animated GIFs

### Example Usage for One Story
- ~10-20 story segments
- ~10-20 text calls
- ~20-40 image calls (2 per segment for animation)

Check your usage at: https://aistudio.google.com/

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

## Security Notes

⚠️ **NEVER commit your `.env` file to git!**

The `.gitignore` file already excludes it, but verify:

```bash
# Make sure this is in your .gitignore:
.env
.env.local
.env.*.local
```

## Alternative: Use `.env.local`

You can also use `.env.local` instead of `.env`. Both work the same way.

## Debug Commands

### Check if file exists:
```bash
ls -la .env
```

### Check if key is set:
```bash
cat .env
```

### Restart everything:
```bash
# Kill the server completely
# Close terminal
# Open new terminal
cd /path/to/project
npm run dev
```

### Last resort - clear everything:
```bash
rm -rf node_modules
npm install
npm run dev
```

## Still Need Help?

1. **Check browser console (F12)** for specific error messages
2. **Verify API key** is correctly set in `.env`
3. **Restart development server** completely
4. **Check API usage** at https://aistudio.google.com/
5. **Try fallback approach** - wait for timeout to see fallback image

---

**Need a Gemini API Key?** → https://aistudio.google.com/apikey  
**Having issues?** Check browser console (F12) for specific error messages.
