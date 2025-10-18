<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1DkOWElso9kBfmnOFSioBP4Uej1H7E2Ka

## ⚠️ Important: API Key Required

**If images aren't loading (spinner shows forever)**, you need to set up your Google Gemini API key.

📖 **See:** [API_KEY_SETUP.md](API_KEY_SETUP.md) for detailed setup instructions.

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   ```bash
   npm install
   ```

2. **Create `.env` file** and add your Gemini API key:
   ```bash
   echo "API_KEY=your_api_key_here" > .env
   ```
   Get your API key at: https://aistudio.google.com/apikey

3. Run the app:
   ```bash
   npm run dev
   ```
