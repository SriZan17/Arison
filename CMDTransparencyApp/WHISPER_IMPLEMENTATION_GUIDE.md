# OpenAI Whisper Voice Transcription Implementation

## Overview
This implementation uses OpenAI's Whisper API for accurate voice transcription in the IMaan chat interface. Users can record voice messages that are automatically transcribed and sent to the AI assistant.

## Features

### 🎤 Voice Recording
- Record audio using Expo Audio API
- Real-time visual feedback with animated recording button
- Support for high-quality audio recording (44.1kHz, 128kbps)
- Maximum recording duration of 60 seconds

### 🤖 AI Transcription
- Uses OpenAI Whisper-1 model for accurate transcription
- Supports multiple languages (English, Nepali)
- Automatic language detection
- High accuracy even with background noise

### 💬 Seamless Integration
- Transcribed text automatically fills the input field
- User can edit transcription before sending
- Visual status indicators for recording and transcription states
- Error handling with user-friendly messages

## Setup Instructions

### 1. Get OpenAI API Key
1. Visit [OpenAI Platform](https://platform.openai.com/api-keys)
2. Create a new API key
3. Copy the key for configuration

### 2. Configure Environment Variables
Create a `.env` file in your project root:
```env
EXPO_PUBLIC_OPENAI_API_KEY=your-actual-api-key-here
```

### 3. Install Required Dependencies
```bash
npm install expo-av expo-file-system
```

### 4. Update App Configuration
Ensure your `app.json` includes microphone permissions:
```json
{
  "expo": {
    "plugins": [
      [
        "expo-av",
        {
          "microphonePermission": "Allow app to access microphone for voice messages."
        }
      ]
    ]
  }
}
```

## How It Works

### Recording Process
1. User taps microphone button
2. App requests microphone permission (if not granted)
3. Recording starts with visual feedback (animated red button)
4. Audio is recorded at high quality (M4A format)
5. User taps stop button or recording auto-stops after 60 seconds

### Transcription Process
1. Recorded audio file is sent to OpenAI Whisper API
2. Button shows transcription state (orange with hourglass icon)
3. Whisper returns transcribed text
4. Text is automatically populated in the input field
5. User can edit text or send directly

### API Integration
- Transcribed text uses the same IMaan API endpoint
- No changes needed to existing chat functionality
- Maintains conversation context and sources

## File Structure

```
src/
├── components/
│   └── common/
│       └── VoiceRecordButton.tsx    # Voice recording button component
├── hooks/
│   └── useVoiceRecording.ts         # Voice recording hook
├── services/
│   └── whisperService.ts            # OpenAI Whisper API service
├── config/
│   └── appConfig.ts                 # App configuration
└── screens/
    └── IMaanScreen.tsx              # Updated chat screen
```

## Component Details

### VoiceRecordButton
```tsx
interface VoiceRecordButtonProps {
  isRecording: boolean;
  isTranscribing?: boolean;
  recordingAnimation: Animated.Value;
  onPress: () => void;
  disabled?: boolean;
  audioUri?: string | null;
}
```

### useVoiceRecording Hook
```tsx
const {
  isRecording,        // Currently recording audio
  isTranscribing,     // AI is transcribing audio
  recognizedText,     // Transcribed text result
  audioUri,           // Path to recorded audio file
  recordingAnimation, // Animation value for button
  toggleRecording,    // Start/stop recording function
  clearRecording,     // Clear current recording
} = useVoiceRecording(onTextCallback);
```

## Visual States

### Button States
- **Default**: Blue microphone icon
- **Recording**: Red stop icon with pulse animation
- **Transcribing**: Orange hourglass icon
- **Has Audio**: Green musical notes icon
- **Disabled**: Gray with reduced opacity

### Status Messages
- 🔴 Recording... Speak now
- ⏳ AI is understanding your voice...
- ✓ Recognized: "transcribed text preview"

## Error Handling

### Common Issues & Solutions
1. **Microphone Permission Denied**
   - Show permission request dialog
   - Guide user to device settings if needed

2. **OpenAI API Errors**
   - Invalid API key: Show configuration error
   - Network issues: Retry mechanism
   - File size too large: Audio compression

3. **Audio Recording Failures**
   - Device compatibility check
   - Fallback to text input
   - Clear error messages

### Error Messages
- "Microphone access required for voice messages"
- "Failed to transcribe audio. Please try again."
- "Recording failed. Check microphone permissions."

## Performance Optimization

### Audio Quality vs File Size
- Sample rate: 44.1kHz (optimal for speech)
- Bit rate: 128kbps (good quality, reasonable size)
- Format: M4A (iOS/Android compatible)
- Max duration: 60 seconds (Whisper API limit)

### API Efficiency
- Automatic audio compression if needed
- Request timeout: 30 seconds
- Retry mechanism: 3 attempts
- Error caching to avoid repeated failures

## Security Considerations

### API Key Protection
- Never commit API keys to repository
- Use environment variables
- Validate API key format before use
- Monitor API usage and costs

### Audio Data
- Audio files are temporary
- Automatic cleanup after transcription
- No audio data stored permanently
- HTTPS only for API calls

## Testing Checklist

### Functional Testing
- [ ] Recording starts/stops correctly
- [ ] Audio quality is acceptable
- [ ] Transcription accuracy is good
- [ ] Text appears in input field
- [ ] Send functionality works
- [ ] Error handling works

### Permission Testing
- [ ] First-time permission request
- [ ] Permission denied scenario
- [ ] Permission granted scenario
- [ ] Settings app integration

### Edge Cases
- [ ] Network connectivity issues
- [ ] Very quiet audio
- [ ] Very loud audio
- [ ] Background noise
- [ ] Multiple languages
- [ ] Long pauses in speech

## Future Enhancements

### Planned Features
1. **Language Selection**: Let users choose transcription language
2. **Audio Playback**: Play recorded audio before sending
3. **Voice Commands**: "Send message", "Clear text", etc.
4. **Offline Support**: Local speech recognition fallback
5. **Audio Compression**: Reduce file sizes for faster upload

### Advanced Features
1. **Real-time Transcription**: Stream audio and get partial results
2. **Voice Assistant Responses**: AI speaks responses back
3. **Multi-turn Voice Conversations**: Continuous voice interaction
4. **Custom Wake Words**: "Hey e-maan" activation

## Troubleshooting

### Common Problems
1. **"Whisper service not initialized"**
   - Check API key in environment variables
   - Verify network connectivity

2. **Recording not working**
   - Check microphone permissions
   - Test on physical device (not simulator)
   - Verify Expo Audio setup

3. **Poor transcription quality**
   - Ensure quiet environment
   - Speak clearly and slowly
   - Check microphone is not obstructed

### Debug Mode
Enable debug logging in config:
```typescript
export const config = {
  debug: {
    enabled: true,
    logLevel: 'verbose'
  }
};
```

## Cost Considerations

### OpenAI Whisper Pricing
- $0.006 per minute of audio
- Typical 30-second message: ~$0.003
- 1000 messages per month: ~$3.00
- Monitor usage through OpenAI dashboard

### Optimization Tips
- Encourage shorter messages
- Implement usage analytics
- Set daily/monthly limits if needed
- Cache common phrases locally

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review OpenAI API documentation
3. Test with different audio samples
4. Check device compatibility