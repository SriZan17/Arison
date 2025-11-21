import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  Alert,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';

// Components
import Card from '../components/common/Card';
import LoadingSpinner from '../components/common/LoadingSpinner';

// Services
import { imaanApi } from '../services/imaanService';
import { speechToText } from '../services/speechService';
// Import speech test utilities for development
import '../utils/speechTestUtils';
import { runAudioDebugTests } from '../debug/audioTest';

// Types and Theme
import { theme } from '../styles/theme';

const { width: screenWidth } = Dimensions.get('window');

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isVoice?: boolean;
  transcribedText?: string;
  sources?: Array<{ source: string; page: number }>;
}

const IMaanScreen: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'नमस्ते! म i-maan हुँ। म तपाईंलाई सरकारी परियोजनाहरू र पारदर्शिताका बारेमा जानकारी दिन सक्छु। के तपाईंसँग कुनै प्रश्न छ?',
      timestamp: new Date(),
    }
  ]);

  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    return () => {
      // Cleanup speech to text if recording
      if (speechToText.getIsRecording()) {
        speechToText.cancelRecording();
      }
    };
  }, []);

  useEffect(() => {
    // Auto-scroll to bottom when new messages are added
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const startRecording = async () => {
    try {
      console.log('Starting recording...');
      console.log('Platform:', Platform.OS);
      
      // Check if web platform and show warning
      if (Platform.OS === 'web') {
        Alert.alert(
          'वेब प्लेटफर्म',
          'वेब ब्राउजरमा भ्वाइस रेकर्डिङ सीमित छ। पूर्ण सुविधाका लागि मोबाइल एप प्रयोग गर्नुहोस्।',
          [{ text: 'ठीक छ', style: 'default' }]
        );
      }
      
      await speechToText.startRecording({
        language: 'ne-NP',
        maxDuration: 30 // 30 seconds max
      });
      
      console.log('Recording started successfully');
      setIsRecording(true);
    } catch (error) {
      console.error('Failed to start recording:', error);
      
      let errorMessage = 'Failed to start recording. Please try again.';
      if (error instanceof Error) {
        console.log('Error type:', error.constructor.name);
        console.log('Error message:', error.message);
        
        if (error.message.includes('permission')) {
          errorMessage = 'माइक्रोफोनको अनुमति चाहिन्छ। कृपया सेटिङमा जानुहोस्।';
        } else if (error.message.includes('Already recording')) {
          errorMessage = 'पहिले नै रेकर्डिङ भइरहेको छ।';
        } else if (error.message.includes('recording not started')) {
          errorMessage = 'रेकर्डिङ सुरु गर्न सकिएन। कृपया दोहोर्याउनुहोस्।';
        } else if (error.message.includes('interruptionMode')) {
          errorMessage = 'ऑडियो सेटअप समस्या। कृपया एप रिस्टार्ट गर्नुहोस्।';
        }
      }
      
      Alert.alert('रेकर्डिङ त्रुटि', errorMessage);
    }
  };

  const stopRecording = async () => {
    if (!speechToText.getIsRecording()) return;

    try {
      setIsRecording(false);
      const audioUri = await speechToText.stopRecording();

      if (audioUri) {
        await sendVoiceMessage(audioUri);
      }
    } catch (error) {
      console.error('Failed to stop recording:', error);
      Alert.alert('Error', 'Failed to stop recording.');
    }
  };

  const sendVoiceMessage = async (audioUri: string) => {
    const userMessageId = Date.now().toString();
    
    try {
      setIsSending(true);

      // Add user voice message placeholder
      const userMessage: ChatMessage = {
        id: userMessageId,
        role: 'user',
        content: '🎙️ Processing voice message...',
        timestamp: new Date(),
        isVoice: true,
      };

      setMessages(prev => [...prev, userMessage]);

      // Update to show transcription in progress
      setTimeout(() => {
        setMessages(prev => prev.map(msg => 
          msg.id === userMessageId 
            ? { ...msg, content: '🎙️ Transcribing audio...' }
            : msg
        ));
      }, 500);

      // Send to i-maan API
      console.log('📤 Sending voice message to i-maan API...');
      const response = await imaanApi.sendVoiceMessage(audioUri);
      
      console.log('📥 ===== VOICE MESSAGE RESPONSE =====');
      console.log('📝 Transcription received:', `"${response.transcription}"`);
      console.log('🤖 AI Response:', `"${response.response}"`);
      console.log('📚 Sources count:', response.sources?.length || 0);
      console.log('📥 ===== RESPONSE END =====');
      
      // Update user message with transcribed text
      setMessages(prev => prev.map(msg => 
        msg.id === userMessageId 
          ? { 
              ...msg, 
              content: response.transcription || 'Voice message',
              transcribedText: response.transcription
            }
          : msg
      ));

      // Add assistant response
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.response,
        timestamp: new Date(),
        sources: response.sources,
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Speak the response
      if (response.response) {
        await speakText(response.response);
      }
    } catch (error) {
      console.error('Error sending voice message:', error);
      
      // Update the user message to show error
      setMessages(prev => prev.map(msg => 
        msg.id === userMessageId 
          ? { 
              ...msg, 
              content: '❌ Voice processing failed'
            }
          : msg
      ));
      
      Alert.alert(
        'आवाज सन्देश त्रुटि', 
        'आवाज प्रसंस्करणमा समस्या भयो। कृपया पुनः प्रयास गर्नुहोस्।'
      );
    } finally {
      setIsSending(false);
    }
  };

  const sendTextMessage = async (text: string) => {
    try {
      setIsSending(true);

      // Add user message
      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'user',
        content: text,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, userMessage]);

      // Send to i-maan API
      const response = await imaanApi.sendTextMessage(text, messages);

      // Add assistant response
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.response,
        timestamp: new Date(),
        sources: response.sources,
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Speak the response
      if (response.response) {
        await speakText(response.response);
      }
    } catch (error) {
      console.error('Error sending text message:', error);
      Alert.alert('Error', 'Failed to send message. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const speakText = async (text: string) => {
    try {
      // Stop any ongoing speech
      if (isSpeaking) {
        Speech.stop();
        setIsSpeaking(false);
        return;
      }

      setIsSpeaking(true);

      const options = {
        language: 'ne-NP', // Nepali
        pitch: 1.0,
        rate: 0.8,
        onDone: () => setIsSpeaking(false),
        onStopped: () => setIsSpeaking(false),
        onError: () => {
          setIsSpeaking(false);
          console.warn('TTS error - falling back to default language');
          // Fallback to default language if Nepali is not available
          Speech.speak(text, {
            language: 'en-US',
            pitch: 1.0,
            rate: 0.8,
            onDone: () => setIsSpeaking(false),
            onStopped: () => setIsSpeaking(false),
          });
        },
      };

      Speech.speak(text, options);
    } catch (error) {
      console.error('TTS Error:', error);
      setIsSpeaking(false);
    }
  };

  const stopSpeaking = () => {
    Speech.stop();
    setIsSpeaking(false);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Ionicons name="chatbubbles" size={28} color={theme.colors.primary} />
            </View>
            <View style={styles.statusIndicator} />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.title}>i-maan</Text>
            <Text style={styles.subtitle}>AI असिस्टेन्ट • सरकारी पारदर्शिता</Text>
          </View>
        </View>
        <View style={styles.headerActions}>
          {isSpeaking && (
            <TouchableOpacity style={styles.speakingButton} onPress={stopSpeaking}>
              <Ionicons name="volume-high" size={20} color={theme.colors.primary} />
              <Text style={styles.speakingText}>बोलिरहेको</Text>
            </TouchableOpacity>
          )}
          {__DEV__ && (
            <TouchableOpacity 
              style={styles.debugButton} 
              onPress={runAudioDebugTests}
            >
              <Ionicons name="bug" size={18} color={theme.colors.primary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Chat Messages */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.chatContainer}
        contentContainerStyle={styles.chatContent}
        showsVerticalScrollIndicator={false}
      >
        {messages.map((message) => (
          <View
            key={message.id}
            style={[
              styles.messageContainer,
              message.role === 'user' ? styles.userMessage : styles.assistantMessage
            ]}
          >
            {message.role === 'assistant' && (
              <View style={styles.assistantAvatar}>
                <Ionicons name="sparkles" size={16} color={theme.colors.primary} />
              </View>
            )}
            
            <View style={[
              styles.messageBubble,
              message.role === 'user' ? styles.userMessageBubble : styles.assistantMessageBubble
            ]}>
              <View style={styles.messageHeader}>
                <Text style={[
                  styles.messageRole,
                  message.role === 'user' ? styles.userMessageRole : styles.assistantMessageRole
                ]}>
                  {message.role === 'user' ? 'तपाईं' : 'i-maan'}
                </Text>
                <View style={styles.messageMetaRow}>
                  {message.isVoice && (
                    <View style={styles.voiceIndicator}>
                      <Ionicons 
                        name="mic" 
                        size={12} 
                        color={message.role === 'user' ? 'rgba(255,255,255,0.8)' : theme.colors.primary} 
                      />
                      <Text style={[
                        styles.voiceLabel,
                        message.role === 'user' ? styles.userVoiceLabel : styles.assistantVoiceLabel
                      ]}>
                        VOICE
                      </Text>
                    </View>
                  )}
                  <Text style={[
                    styles.messageTime,
                    message.role === 'user' ? styles.userMessageTime : styles.assistantMessageTime
                  ]}>
                    {formatTime(message.timestamp)}
                  </Text>
                </View>
              </View>
              
              <Text style={[
                styles.messageText,
                message.role === 'user' ? styles.userMessageText : styles.assistantMessageText
              ]}>
                {message.content}
              </Text>

              {/* Show transcribed text for voice messages */}
              {message.isVoice && message.transcribedText && message.transcribedText !== message.content && (
                <View style={[
                  styles.transcriptionContainer,
                  {
                    borderTopColor: message.role === 'user' 
                      ? 'rgba(255, 255, 255, 0.2)' 
                      : 'rgba(0, 0, 0, 0.1)'
                  }
                ]}>
                  <View style={styles.transcriptionHeader}>
                    <Ionicons 
                      name="document-text" 
                      size={12} 
                      color={message.role === 'user' ? 'rgba(255,255,255,0.7)' : theme.colors.textSecondary} 
                    />
                    <Text style={[
                      styles.transcriptionLabel,
                      message.role === 'user' ? styles.userTranscriptionLabel : styles.assistantTranscriptionLabel
                    ]}>
                      Transcribed:
                    </Text>
                  </View>
                  <Text style={[
                    styles.transcriptionText,
                    message.role === 'user' ? styles.userTranscriptionText : styles.assistantTranscriptionText
                  ]}>
                    {message.transcribedText}
                  </Text>
                </View>
              )}

              {message.role === 'assistant' && (
                <View style={styles.messageActions}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => speakText(message.content)}
                  >
                    <Ionicons 
                      name={isSpeaking ? "volume-high" : "volume-medium-outline"} 
                      size={18} 
                      color={theme.colors.primary} 
                    />
                    <Text style={styles.actionText}>
                      {isSpeaking ? 'रोक्नुहोस्' : 'सुन्नुहोस्'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {message.sources && message.sources.length > 0 && (
                <View style={styles.sourcesContainer}>
                  <Text style={styles.sourcesTitle}>स्रोतहरू:</Text>
                  {message.sources.map((source, index) => (
                    <Text key={index} style={styles.sourceText}>
                      • {source.source} (पृष्ठ {source.page})
                    </Text>
                  ))}
                </View>
              )}
            </View>
          </View>
        ))}

        {isSending && (
          <View style={styles.loadingContainer}>
            <LoadingSpinner message="प्रतिक्रियाको पर्खाइमा..." />
          </View>
        )}
      </ScrollView>

      {/* Voice Input Controls */}
      <View style={styles.inputContainer}>
        <View style={styles.inputWrapper}>
          <View style={styles.controlsContainer}>
            <TouchableOpacity
              style={styles.helpButton}
              onPress={() => sendTextMessage('मलाई सहयोग चाहिन्छ')}
              disabled={isSending}
            >
              <Ionicons name="help-circle" size={24} color={theme.colors.primary} />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.recordButton,
                isRecording ? styles.recordingButton : styles.idleButton
              ]}
              onPress={isRecording ? stopRecording : startRecording}
              disabled={isSending}
            >
              {isRecording ? (
                <View style={styles.recordingIndicatorContainer}>
                  <View style={styles.recordingPulse} />
                  <Ionicons name="stop" size={28} color={theme.colors.surface} />
                </View>
              ) : (
                <Ionicons name="mic" size={28} color={theme.colors.surface} />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.textButton}
              onPress={() => sendTextMessage('नमस्ते, सरकारी परियोजनाहरूको बारेमा जानकारी चाहिन्छ')}
              disabled={isSending}
            >
              <Ionicons name="chatbox" size={24} color={theme.colors.primary} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.statusContainer}>
            <Text style={styles.statusText}>
              {isRecording 
                ? 'सुनिरहेको छ... छुनुहोस् रोक्न'
                : isSending 
                  ? 'पठाउँदै...'
                  : 'बोल्न माइक थिच्नुहोस्'
              }
            </Text>
          </View>
          
          <Text style={styles.helpText}>
            🎤 नेपालीमा बोल्नुहोस् • 💬 टेक्स्ट पठाउनुहोस् • ❓ सहयोग माग्नुहोस्
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    minHeight: 60,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: theme.spacing.md,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  statusIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: theme.colors.success,
    borderWidth: 2,
    borderColor: theme.colors.surface,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: theme.typography.h3.fontSize - 2,
    fontWeight: theme.typography.h3.fontWeight,
    color: theme.colors.text,
    marginBottom: 1,
  },
  subtitle: {
    fontSize: theme.typography.caption.fontSize - 1,
    color: theme.colors.textSecondary,
    lineHeight: 14,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  speakingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  speakingText: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.primary,
    fontWeight: '600',
    marginLeft: theme.spacing.xs,
  },
  debugButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  chatContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  chatContent: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
  },
  messageContainer: {
    marginBottom: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: theme.spacing.xs,
  },
  userMessage: {
    alignSelf: 'flex-end',
    flexDirection: 'row-reverse',
  },
  assistantMessage: {
    alignSelf: 'flex-start',
  },
  assistantAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.xs,
    marginBottom: 4,
  },
  messageBubble: {
    maxWidth: screenWidth * 0.8,
    minWidth: screenWidth * 0.3,
    padding: theme.spacing.sm,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  userMessageBubble: {
    backgroundColor: theme.colors.primary,
    borderBottomRightRadius: 8,
    marginLeft: theme.spacing.sm,
  },
  assistantMessageBubble: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderBottomLeftRadius: 8,
  },
  messageHeader: {
    marginBottom: theme.spacing.xs,
  },
  messageMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  messageRole: {
    fontSize: theme.typography.caption.fontSize,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  userMessageRole: {
    color: 'rgba(255, 255, 255, 0.9)',
  },
  assistantMessageRole: {
    color: theme.colors.primary,
  },
  messageTime: {
    fontSize: theme.typography.caption.fontSize - 2,
  },
  userMessageTime: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  assistantMessageTime: {
    color: theme.colors.textSecondary,
  },
  voiceIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginRight: theme.spacing.xs,
  },
  voiceLabel: {
    fontSize: 9,
    fontWeight: '700',
    marginLeft: 2,
    letterSpacing: 0.3,
  },
  userVoiceLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  assistantVoiceLabel: {
    color: theme.colors.primary,
  },
  voiceIcon: {
    marginRight: theme.spacing.xs,
  },
  messageText: {
    fontSize: theme.typography.body.fontSize,
    lineHeight: 20,
    marginBottom: theme.spacing.xs,
  },
  userMessageText: {
    color: theme.colors.surface,
  },
  assistantMessageText: {
    color: theme.colors.text,
  },
  transcriptionContainer: {
    marginTop: theme.spacing.xs,
    paddingTop: theme.spacing.xs,
    borderTopWidth: 1,
  },
  transcriptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  transcriptionLabel: {
    fontSize: theme.typography.caption.fontSize - 1,
    fontWeight: '600',
    marginLeft: theme.spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  userTranscriptionLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  assistantTranscriptionLabel: {
    color: theme.colors.textSecondary,
  },
  transcriptionText: {
    fontSize: theme.typography.caption.fontSize,
    lineHeight: 18,
    fontStyle: 'italic',
  },
  userTranscriptionText: {
    color: 'rgba(255, 255, 255, 0.9)',
  },
  assistantTranscriptionText: {
    color: theme.colors.textSecondary,
  },
  messageActions: {
    flexDirection: 'row',
    marginTop: theme.spacing.sm,
    paddingTop: theme.spacing.xs,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  actionText: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.primary,
    fontWeight: '600',
    marginLeft: theme.spacing.xs,
  },
  sourcesContainer: {
    marginTop: theme.spacing.sm,
    paddingTop: theme.spacing.xs,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  sourcesTitle: {
    fontSize: theme.typography.caption.fontSize,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  sourceText: {
    fontSize: theme.typography.caption.fontSize - 1,
    color: theme.colors.textSecondary,
    lineHeight: 16,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  inputContainer: {
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  inputWrapper: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    paddingBottom: theme.spacing.md,
  },
  controlsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
  },
  helpButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  textButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: theme.spacing.md,
  },
  recordButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  idleButton: {
    backgroundColor: theme.colors.primary,
  },
  recordingButton: {
    backgroundColor: theme.colors.error,
  },
  recordingIndicatorContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordingPulse: {
    position: 'absolute',
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(239, 68, 68, 0.3)',
    // Animation would be added here in a real implementation
  },
  statusContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  statusText: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.text,
    fontWeight: '600',
    textAlign: 'center',
  },
  helpText: {
    fontSize: theme.typography.caption.fontSize - 1,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: theme.spacing.sm,
    marginTop: theme.spacing.xs,
  },
});

export default IMaanScreen;