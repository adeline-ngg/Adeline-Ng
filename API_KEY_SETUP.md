# 🔑 API Key Setup Instructions

## The Problem

If you're seeing a **loading spinner that never loads an image**, it's likely because the Google Gemini API key is not configured.

## Quick Fix

### Step 1: Create `.env` file

In the root of your project (same folder as `package.json`), create a file named `.env`:

```bash
# From terminal in project root:
touch .env
```

### Step 2: Add your API key

Open `.env` and add this line:

```
API_KEY=your_actual_api_key_here
```

Or you can use:

```
GEMINI_API_KEY=your_actual_api_key_here
```

Both work! The app supports both variable names.

### Step 3: Get an API Key

1. Go to: https://aistudio.google.com/apikey
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the key
5. Paste it into your `.env` file

### Step 4: Restart the dev server

```bash
# Stop the server (Ctrl+C)
# Then start it again:
npm run dev
```

## Example `.env` File

```bash
# Google Gemini API Key (REQUIRED)
API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# Optional: Mem0 for memory features
MEM0_API_KEY=your_mem0_key_here
```

## How to Know It's Working

After restarting the server:

1. Start a story
2. Check browser console (F12)
3. You should see:
   ```
   Starting background image generation...
   Calling Imagen API...
   Image generation completed in X seconds
   GIF created successfully
   ```

4. The image will load (may take 30-60 seconds for first image)

## Troubleshooting

### Still seeing spinner forever?

**Check browser console (F12):**

1. **If you see:** `⚠️ GEMINI_API_KEY not found in environment variables!`
   - **Fix:** Your `.env` file isn't being loaded
   - Make sure it's named exactly `.env` (not `.env.txt`)
   - Make sure it's in the project root (same folder as `package.json`)
   - Restart the dev server completely

2. **If you see:** `Error generating scene frames: timeout`
   - **Fix:** Slow network or API is slow
   - Wait up to 90 seconds
   - A fallback image should appear
   - Try refreshing the page

3. **If you see:** `RESOURCE_EXHAUSTED` or `quota`
   - **Fix:** API quota exceeded
   - Check your API key's usage limits at: https://aistudio.google.com/
   - You may need to enable billing or wait until your quota resets

4. **If you see:** `Failed to generate scene GIF: [error message]`
   - Check the specific error message
   - Common issues:
     - Invalid API key
     - Network connectivity
     - API endpoint issues

### Fallback Images

If image generation fails, the app should show a fallback landscape image from Unsplash. If you're stuck on the loading spinner:

1. Open browser console (F12)
2. Look for errors
3. Hard refresh the page (Ctrl+Shift+R or Cmd+Shift+R)

## API Cost Information

### Free Tier (Gemini API)
- **Text generation:** Very generous free tier
- **Image generation (Imagen):** Limited free tier
  - Check current limits at: https://ai.google.dev/pricing

### What Uses API Calls?
1. **Avatar generation:** 1 image (one-time)
2. **Each story segment:** 
   - 1 text generation call (Gemini)
   - 1 image generation call (Imagen)

### Example Usage for One Story
- ~10-20 story segments
- ~10-20 text calls
- ~10-20 image calls

Check your usage at: https://aistudio.google.com/

## Security Note

⚠️ **NEVER commit your `.env` file to git!**

The `.gitignore` file already excludes it, but double-check:

```bash
# Make sure this is in your .gitignore:
.env
.env.local
.env.*.local
```

## Alternative: Use `.env.local`

You can also use `.env.local` instead of `.env`:

```bash
# Create it:
touch .env.local

# Add your key:
echo "API_KEY=your_key_here" > .env.local
```

Both `.env` and `.env.local` work!

## Still Need Help?

1. **Check if file exists:**
   ```bash
   ls -la .env
   ```

2. **Check if key is set:**
   ```bash
   cat .env
   ```

3. **Restart everything:**
   ```bash
   # Kill the server completely
   # Close terminal
   # Open new terminal
   cd /path/to/project
   npm run dev
   ```

4. **Last resort - clear everything:**
   ```bash
   rm -rf node_modules
   npm install
   npm run dev
   ```

## Expected Behavior After Setup

✅ **Working correctly:**
- Story text appears immediately
- Biblical lesson appears immediately
- Loading spinner shows while image generates
- Image appears after 10-60 seconds
- OR fallback image appears after 90 seconds if timeout

❌ **Not working (missing API key):**
- Story text appears
- Lesson appears
- Loading spinner shows forever
- Console shows API key error
- No image ever appears

---

**Need a Gemini API Key?** → https://aistudio.google.com/apikey

**Having issues?** Check browser console (F12) for specific error messages.

