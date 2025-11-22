import { useState, useEffect, useRef } from 'react';
import { Alert, Animated } from 'react-native';
import { Audio } from 'expo-av';
import { getWhisperService } from '../services/whisperService';

interface VoiceRecordingHook {
  isRecording: boolean;
  isTranscribing: boolean;
  recognizedText: string;
  audioUri: string | null;
  recordingAnimation: Animated.Value;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  toggleRecording: () => Promise<void>;
  transcribeAudio: () => Promise<string>;
  clearRecording: () => void;
}

export const useVoiceRecording = (
  onTextRecognized?: (text: string) => void
): VoiceRecordingHook => {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [recognizedText, setRecognizedText] = useState('');
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const recordingAnimation = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const setupAudio = async () => {
      try {
        await Audio.requestPermissionsAsync();
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });
      } catch (error) {
        console.error('Failed to setup audio:', error);
        Alert.alert('Audio Setup Error', 'Failed to initialize audio recording.');
      }
    };

    setupAudio();
  }, []);

  const startRecordingAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(recordingAnimation, {
          toValue: 1.2,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(recordingAnimation, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const stopRecordingAnimation = () => {
    recordingAnimation.stopAnimation();
    Animated.timing(recordingAnimation, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const startRecording = async () => {
    try {
      if (recording) {
        await recording.stopAndUnloadAsync();
      }

      const { recording: newRecording } = await Audio.Recording.createAsync({
        android: {
          extension: '.m4a',
          outputFormat: Audio.AndroidOutputFormat.MPEG_4,
          audioEncoder: Audio.AndroidAudioEncoder.AAC,
          sampleRate: 44100,
          numberOfChannels: 2,
          bitRate: 128000,
        },
        ios: {
          extension: '.m4a',
          outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
          audioQuality: Audio.IOSAudioQuality.HIGH,
          sampleRate: 44100,
          numberOfChannels: 2,
          bitRate: 128000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
        web: {
          mimeType: 'audio/webm',
          bitsPerSecond: 128000,
        },
      });

      setRecording(newRecording);
      setIsRecording(true);
      startRecordingAnimation();
      setRecognizedText('');
      setAudioUri(null);
    } catch (error) {
      console.error('Failed to start recording:', error);
      Alert.alert('Recording Error', 'Failed to start recording. Please check microphone permissions.');
    }
  };

  const stopRecording = async () => {
    try {
      if (!recording) return;

      setIsRecording(false);
      stopRecordingAnimation();

      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setAudioUri(uri);
      setRecording(null);

      if (uri) {
        // Automatically transcribe the audio
        await transcribeAudioFile(uri);
      }
    } catch (error) {
      console.error('Failed to stop recording:', error);
      Alert.alert('Recording Error', 'Failed to stop recording.');
    }
  };

  const transcribeAudioFile = async (uri: string): Promise<string> => {
    try {
      setIsTranscribing(true);
      const whisperService = getWhisperService();
      const transcription = await whisperService.transcribeAudio(uri);
      
      setRecognizedText(transcription);
      onTextRecognized?.(transcription);
      
      return transcription;
    } catch (error) {
      console.error('Transcription error:', error);
      Alert.alert('Transcription Error', 'Failed to transcribe audio. Please try again.');
      return '';
    } finally {
      setIsTranscribing(false);
    }
  };

  const transcribeAudio = async (): Promise<string> => {
    if (!audioUri) {
      throw new Error('No audio to transcribe');
    }
    return await transcribeAudioFile(audioUri);
  };

  const toggleRecording = async () => {
    if (isRecording) {
      await stopRecording();
    } else {
      await startRecording();
    }
  };

  const clearRecording = () => {
    setRecognizedText('');
    setAudioUri(null);
    if (recording) {
      recording.stopAndUnloadAsync();
      setRecording(null);
    }
    setIsRecording(false);
    stopRecordingAnimation();
  };

  return {
    isRecording,
    isTranscribing,
    recognizedText,
    audioUri,
    recordingAnimation,
    startRecording,
    stopRecording,
    toggleRecording,
    transcribeAudio,
    clearRecording,
  };
};