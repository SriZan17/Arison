// Configuration file for API keys and settings
export const config = {
  // OpenAI Configuration
  openai: {
    apiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY || 'your-openai-api-key-here',
    whisperModel: 'whisper-1',
    maxAudioSize: 25 * 1024 * 1024, // 25MB limit for Whisper API
  },
  
  // Voice Recording Configuration
  voice: {
    maxRecordingDuration: 60000, // 1 minute in milliseconds
    sampleRate: 44100,
    bitRate: 128000,
    numberOfChannels: 2,
    supportedLanguages: ['en', 'ne'], // English and Nepali
  },
  
  // API Configuration
  api: {
    timeout: 30000, // 30 seconds
    retryAttempts: 3,
  },
};

export default config;