import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';

export interface WhisperTranscriptionService {
  transcribeAudio: (audioUri: string) => Promise<string>;
}

class OpenAIWhisperService implements WhisperTranscriptionService {
  private apiKey: string;
  private baseUrl: string = 'https://api.openai.com/v1/audio/transcriptions';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async transcribeAudio(audioUri: string): Promise<string> {
    try {
      // Create form data for OpenAI Whisper API
      const formData = new FormData();
      formData.append('file', {
        uri: audioUri,
        type: 'audio/m4a',
        name: 'audio.m4a',
      } as any);
      formData.append('model', 'whisper-1');
      // Remove language parameter to let Whisper auto-detect and preserve original language
      formData.append('response_format', 'text');

      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      try {
        const response = await fetch(this.baseUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'multipart/form-data',
          },
          body: formData,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`Whisper API error: ${errorData.error?.message || response.statusText}`);
        }

        const transcription = await response.text();
        return transcription.trim();
      } catch (fetchError) {
        clearTimeout(timeoutId);
        if (fetchError instanceof Error && fetchError.name === 'AbortError') {
          throw new Error('Voice transcription timeout. Please try with a shorter recording.');
        }
        throw fetchError;
      }
    } catch (error) {
      console.error('Whisper transcription error:', error);
      if (error instanceof Error) {
        if (error.message.includes('timeout') || error.message.includes('AbortError')) {
          throw new Error('Voice transcription took too long. Please try with a shorter message.');
        } else if (error.message.includes('API error')) {
          throw error; // Re-throw API errors as-is
        }
      }
      throw new Error('Failed to transcribe audio. Please check your internet connection and try again.');
    }
  }
}

// Singleton instance
let whisperService: OpenAIWhisperService | null = null;

export const initializeWhisperService = (apiKey: string) => {
  whisperService = new OpenAIWhisperService(apiKey);
};

export const getWhisperService = (): OpenAIWhisperService => {
  if (!whisperService) {
    throw new Error('Whisper service not initialized. Call initializeWhisperService first.');
  }
  return whisperService;
};

export { OpenAIWhisperService };