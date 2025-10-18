<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Biblical Journeys - Interactive Storytelling

An immersive interactive storytelling experience featuring biblical narratives with AI-generated animations, voice narration, and personalized character development.

## Quick Start

### Prerequisites
- Node.js (latest LTS recommended)
- Google Gemini API key
- ElevenLabs API key (optional, for high-quality narration)

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment:**
   ```bash
   # Create .env file
   echo "API_KEY=your_gemini_api_key_here" > .env
   echo "VITE_ELEVENLABS_API_KEY=your_elevenlabs_api_key_here" >> .env
   ```
   Get your API keys at:
   - Gemini: https://aistudio.google.com/apikey
   - ElevenLabs: https://elevenlabs.io (optional, for high-quality narration)

3. **Run the application:**
   ```bash
   npm run dev
   ```

## Documentation

- **[Setup Guide](docs/SETUP.md)** - Complete installation and troubleshooting
- **[User Guide](docs/USER_GUIDE.md)** - How to use features and navigate the app

## Features

- **Interactive Stories** - 6 biblical narratives with choice-driven gameplay
- **AI-Generated Animations** - Beautiful animated scenes for each story segment
- **Voice Narration** - Optional text-to-speech with Web Speech API or high-quality ElevenLabs voices
- **Auto-Save Progress** - Resume stories from where you left off
- **Profile Persistence** - Create and save your character
- **Bible Integration** - Read original biblical text after completing stories

## Tech Stack

- **Frontend:** React + TypeScript + Vite
- **AI Services:** Google Gemini API (text + image generation)
- **Storage:** localStorage + IndexedDB
- **Audio:** Web Speech API + ElevenLabs API
- **Styling:** Tailwind CSS

## API Requirements

- **Google Gemini API** (required) - For story generation and image creation
- **ElevenLabs API** (optional) - For high-quality voice narration
- **Mem0 API** (optional) - For AI-powered memory features

## Browser Compatibility

- Chrome 90+ (recommended)
- Safari 14+
- Edge 90+
- Firefox 88+ (limited voice support)

## Contributing

This project was created with AI Studio. For development setup and contribution guidelines, see the [Setup Guide](docs/SETUP.md).

## License

This project is open source. Please check the individual story cover images for their specific licensing requirements in the [attribution file](public/assets/story-covers/ATTRIBUTION.md).
