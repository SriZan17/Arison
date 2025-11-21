# Voice Transcription Implementation Guide

## Overview
This guide covers the implementation of voice transcription functionality in the IMaan screen using `@react-native-voice/voice`.

## Features Added

### 1. Voice Recognition Hook (`useVoiceRecognition.ts`)
- Reusable hook for voice recognition functionality
- Handles voice events: start, stop, results, errors
- Provides recording animation
- Supports multiple languages (currently set to 'en-US')

### 2. Voice Record Button Component (`VoiceRecordButton.tsx`)
- Reusable voice recording button
- Visual feedback for recording state
- Animated recording indicator
- Disabled state support

### 3. IMaan Screen Integration
- Voice button added to text input container
- Real-time transcription display
- Voice status indicators in help text
- Automatic text input population from voice

## Setup Instructions

### 1. Install Dependencies
```bash
npm install @react-native-voice/voice
```

### 2. Platform-specific Setup

#### Android (android/app/src/main/AndroidManifest.xml)
```xml
<uses-permission android:name="android.permission.RECORD_AUDIO" />
<uses-permission android:name="android.permission.INTERNET" />
```

#### iOS (ios/YourApp/Info.plist)
```xml
<key>NSMicrophoneUsageDescription</key>
<string>This app needs access to microphone to transcribe your voice messages to e-maan AI assistant.</string>
<key>NSSpeechRecognitionUsageDescription</key>
<string>This app needs access to speech recognition to convert your voice to text for better communication with e-maan.</string>
```

### 3. Expo Configuration (app.json)
```json
{
  "expo": {
    "plugins": [
      [
        "expo-av",
        {
          "microphonePermission": "Allow $(PRODUCT_NAME) to access your microphone to transcribe voice messages."
        }
      ]
    ]
  }
}
```

## Usage

### Basic Usage
1. Tap the microphone button in the chat input
2. Speak your message in English (or supported language)
3. The text will automatically populate in the input field
4. Tap send or continue typing to modify the message

### Voice Languages Supported
- English (en-US) - Primary
- Can be extended to support Nepali (ne-NP) if available on device

## API Integration

The transcribed text is sent to the same IMaan API endpoint:
```typescript
const response = await imaanApi.sendTextMessage(messageText, messages);
```

## Features

### Visual Feedback
- Microphone icon changes to stop icon when recording
- Button color changes during recording (red background)
- Animated pulse effect during recording
- Status text shows recording state and recognized text

### Error Handling
- Device compatibility check
- Permission handling
- Network error handling
- Fallback to text input if voice fails

### User Experience
- Real-time transcription feedback
- Clear visual states for recording
- Seamless integration with existing chat flow
- Help text includes voice instructions

## Troubleshooting

### Common Issues
1. **Voice not working on device**: Check if device supports speech recognition
2. **Permissions denied**: Ensure microphone permissions are granted
3. **No transcription**: Check internet connection and language support
4. **App crashes**: Verify all dependencies are properly linked

### Testing
- Test on physical devices (voice recognition may not work on simulators)
- Test with different languages
- Test with background noise
- Test permission flows

## Future Enhancements
1. Add Nepali language support
2. Implement voice commands (e.g., "send message", "clear text")
3. Add voice playback of AI responses
4. Implement offline voice recognition
5. Add voice message recording (audio files)

## Technical Notes
- Voice recognition requires internet connection
- Works best in quiet environments
- Accuracy depends on device microphone quality
- Different devices may support different languages