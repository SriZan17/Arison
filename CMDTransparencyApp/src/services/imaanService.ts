import axios from 'axios';
import { Platform } from 'react-native';
import { speechToText, TranscriptionResult } from './speechService';

// Base URL for the RAG API
const RAG_API_BASE_URL = 'http://192.168.88.191:8000'

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface IMaanResponse {
  response: string;
  sources?: Array<{ source: string; page: number }>;
  transcription?: string;
}

class IMaanApiService {
  private baseURL: string;

  constructor() {
    this.baseURL = RAG_API_BASE_URL;
  }

  /**
   * Send text message to i-maan RAG chatbot
   */
  async sendTextMessage(message: string, chatHistory: any[] = []): Promise<IMaanResponse> {
    try {
      // Convert chat history to the expected format
      const messages: ChatMessage[] = chatHistory
        .filter(msg => msg.role === 'user' || msg.role === 'assistant')
        .map(msg => ({
          role: msg.role,
          content: msg.content
        }));

      // Add the new message
      messages.push({
        role: 'user',
        content: message
      });

      const response = await axios.post(`${this.baseURL}/chatbot`, {
        messages
      }, {
        timeout: 60000, // Increased to 60 seconds for longer AI responses
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.data && response.data.messages) {
        // Get the last assistant message
        const assistantMessage = response.data.messages
          .filter((msg: ChatMessage) => msg.role === 'assistant')
          .pop();

        return {
          response: assistantMessage?.content || 'माफ गर्नुहोस्, मैले तपाईंको प्रश्न बुझिन।',
          sources: response.data.sources || []
        };
      } else {
        throw new Error('Invalid response format from server');
      }
    } catch (error) {
      console.error('Error sending text message:', error);
      
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNREFUSED') {
          throw new Error('सर्भरमा जडान गर्न सकिएन। कृपया पछि प्रयास गर्नुहोस्।');
        } else if (error.response?.status === 500) {
          throw new Error('सर्भर त्रुटि। कृपया केही समयपछि प्रयास गर्नुहोस्।');
        } else if (error.response?.status === 400) {
          throw new Error('गलत अनुरोध। कृपया आफ्नो सन्देश जाँच गर्नुहोस्।');
        }
      }
      
      throw new Error('सन्देश पठाउन असफल। कृपया पुनः प्रयास गर्नुहोस्।');
    }
  }

  /**
   * Send voice message to i-maan (with transcription)
   */
  async sendVoiceMessage(audioUri: string): Promise<IMaanResponse> {
    try {
      console.log('🎵 ===== VOICE MESSAGE PROCESSING START =====');
      console.log('📁 Audio URI:', audioUri);
      
      // Transcribe audio to text
      const transcriptionResult: TranscriptionResult = await speechToText.transcribeAudio(audioUri, {
        language: 'ne-NP'
      });
      
      console.log('🎯 ===== TRANSCRIPTION RECEIVED =====');
      console.log('📝 Transcribed Text:', `"${transcriptionResult.text}"`);
      console.log('📊 Confidence:', transcriptionResult.confidence);
      console.log('🌐 Language:', transcriptionResult.language);
      console.log('⏱️ Duration:', transcriptionResult.duration + 's');
      
      if (!transcriptionResult.text.trim()) {
        console.log('⚠️ Empty transcription received');
        // Return a helpful response instead of throwing an error
        return {
          response: 'माफ गर्नुहोस्, म तपाईंको आवाज सुन्न सकिन। कृपया स्पष्ट रूपमा बोल्नुहोस् र पुनः प्रयास गर्नुहोस्।',
          transcription: 'आवाज स्पष्ट सुनिएन',
          sources: []
        };
      }
      
      console.log('🤖 Sending transcribed text to RAG chatbot...');
      console.log('💬 Text to send:', `"${transcriptionResult.text}"`);
      
      // Send transcribed text to RAG chatbot
      const response = await this.sendTextMessage(transcriptionResult.text);
      
      return {
        ...response,
        transcription: transcriptionResult.text
      };
    } catch (error) {
      console.error('Error processing voice message:', error);
      
      // Return a helpful error response instead of throwing
      return {
        response: 'माफ गर्नुहोस्, आवाज प्रक्रियामा समस्या भयो। कृपया पुनः प्रयास गर्नुहोस् वा टेक्स्ट प्रयोग गर्नुहोस्।',
        transcription: 'आवाज प्रक्रिया त्रुटि',
        sources: []
      };
    }
  }

  /**
   * Check if the RAG API server is available
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.baseURL}/`, {
        timeout: 5000
      });
      return response.status === 200;
    } catch (error) {
      console.warn('RAG API health check failed:', error);
      return false;
    }
  }

  /**
   * Get available speech-to-text languages
   */
  getSupportedLanguages(): Array<{ code: string; name: string }> {
    return [
      { code: 'ne-NP', name: 'नेपाली' },
      { code: 'en-US', name: 'English' },
      { code: 'hi-IN', name: 'हिंदी' }
    ];
  }
}

// Export singleton instance
export const imaanApi = new IMaanApiService();