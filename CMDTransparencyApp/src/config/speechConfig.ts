// Speech Recognition Configuration
export interface SpeechConfig {
  provider: 'openai' | 'google' | 'azure' | 'simulation' | 'web-speech' | 'vosk' | 'speechly';
  apiKey?: string;
  endpoint?: string;
  model?: string;
  language: string;
  useFreeServices?: boolean;
}

export const speechProviders = {
  openai: {
    endpoint: 'https://api.openai.com/v1/audio/transcriptions',
    model: 'whisper-1',
    supportedLanguages: ['ne', 'hi', 'en'],
    cost: 'paid',
  },
  google: {
    endpoint: 'https://speech.googleapis.com/v1/speech:recognize',
    supportedLanguages: ['ne-NP', 'hi-IN', 'en-US'],
    cost: 'paid',
  },
  azure: {
    endpoint: '', // To be configured based on region
    supportedLanguages: ['ne-NP', 'hi-IN', 'en-US'],
    cost: 'paid',
  },
  'web-speech': {
    // Browser Web Speech API - FREE
    endpoint: 'browser-native',
    supportedLanguages: ['ne-NP', 'hi-IN', 'en-US'],
    cost: 'free',
    description: 'Browser native speech recognition (Chrome, Edge)',
  },
  vosk: {
    // Vosk Open Source Speech Recognition - FREE
    endpoint: 'https://alphacephei.com/vosk/',
    supportedLanguages: ['ne', 'hi', 'en'],
    cost: 'free',
    description: 'Open source offline speech recognition',
  },
  speechly: {
    // Speechly Free Tier - FREE (limited)
    endpoint: 'https://api.speechly.com/v1/',
    supportedLanguages: ['en-US', 'hi-IN'],
    cost: 'free-limited',
    description: 'Free tier with limitations',
  },
  simulation: {
    // Enhanced simulation mode
    supportedLanguages: ['ne-NP', 'hi-IN', 'en-US'],
    cost: 'free',
    description: 'Enhanced simulation with contextual responses',
  }
};

export const defaultSpeechConfig: SpeechConfig = {
  provider: 'web-speech', // Free Web Speech API as primary
  language: 'ne-NP',
  useFreeServices: true,
  // Fallback: simulation mode for enhanced responses
};

// Free TTS Configuration for Nepali
export const freeTTSConfig = {
  nepali: {
    provider: 'browser-speechsynthesis', // Built-in browser TTS
    voice: 'ne-NP',
    rate: 0.9,
    pitch: 1.0,
    volume: 1.0,
  },
  hindi: {
    provider: 'browser-speechsynthesis',
    voice: 'hi-IN', 
    rate: 0.9,
    pitch: 1.0,
    volume: 1.0,
  },
  english: {
    provider: 'browser-speechsynthesis',
    voice: 'en-US',
    rate: 1.0,
    pitch: 1.0, 
    volume: 1.0,
  }
};

// Instructions for FREE speech recognition and TTS:
/*
🆓 FREE OPTIONS (No API Key Required):

1. Web Speech API (Recommended - FREE):
   - Works in Chrome, Edge browsers
   - Supports Nepali (ne-NP), Hindi (hi-IN), English (en-US)
   - Built into browser, no setup required
   - Already configured as default!

2. Browser TTS (FREE):
   - Built-in speech synthesis
   - Supports multiple languages including Nepali
   - No API key or setup required

3. Vosk Offline (FREE):
   - Open source speech recognition
   - Works offline
   - Supports Nepali language
   - Requires model download (~50MB)

💰 PAID OPTIONS (Require API Keys):

4. OpenAI Whisper API:
   - Excellent accuracy for Nepali
   - Costs ~$0.006 per minute
   - Get API key: https://platform.openai.com/api-keys

5. Google Cloud Speech-to-Text:
   - Good Nepali support
   - First 60 minutes free monthly

6. Azure Cognitive Services:
   - Decent Nepali support
   - Free tier available

🎯 CURRENT SETUP: Using FREE Web Speech API + Browser TTS
No configuration needed - works out of the box!
*/