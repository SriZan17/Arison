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
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

// Components
import LoadingSpinner from '../components/common/LoadingSpinner';

// Services
import { imaanApi } from '../services/imaanService';

// Types and Theme
import { theme } from '../styles/theme';

const { width: screenWidth } = Dimensions.get('window');

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  sources?: Array<{ source: string; page: number }>;
}

const IMaanScreen: React.FC = () => {
  const [isSending, setIsSending] = useState(false);
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'नमस्ते! म i-maan हुँ। म तपाईंलाई सरकारी परियोजनाहरू र पारदर्शिताका बारेमा जानकारी दिन सक्छु। के तपाईंसँग कुनै प्रश्न छ?',
      timestamp: new Date(),
    }
  ]);

  const scrollViewRef = useRef<ScrollView>(null);
  const textInputRef = useRef<TextInput>(null);

  useEffect(() => {
    // Auto-scroll to bottom when new messages are added
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);



  const sendTextMessage = async (text?: string) => {
    const messageText = text || inputText.trim();
    if (!messageText) return;

    try {
      setIsSending(true);
      setInputText(''); // Clear input

      // Add user message
      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'user',
        content: messageText,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, userMessage]);

      // Send to i-maan API
      const response = await imaanApi.sendTextMessage(messageText, messages);

      // Add assistant response
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.response,
        timestamp: new Date(),
        sources: response.sources,
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending text message:', error);
      Alert.alert('Error', 'Failed to send message. Please try again.');
    } finally {
      setIsSending(false);
    }
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
          <TouchableOpacity 
            style={styles.infoButton}
            onPress={() => Alert.alert('i-maan', 'AI असिस्टेन्ट सरकारी पारदर्शिताको लागि')}
          >
            <Ionicons name="information-circle" size={20} color={theme.colors.primary} />
          </TouchableOpacity>
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
                <Text style={[
                  styles.messageTime,
                  message.role === 'user' ? styles.userMessageTime : styles.assistantMessageTime
                ]}>
                  {formatTime(message.timestamp)}
                </Text>
              </View>
              
              <Text style={[
                styles.messageText,
                message.role === 'user' ? styles.userMessageText : styles.assistantMessageText
              ]}>
                {message.content}
              </Text>

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

      {/* Text Input */}
      <View style={styles.inputContainer}>
        <View style={styles.inputWrapper}>
          <View style={styles.textInputContainer}>
            <TouchableOpacity
              style={styles.helpButton}
              onPress={() => sendTextMessage('मलाई सहयोग चाहिन्छ')}
              disabled={isSending}
            >
              <Ionicons name="help-circle" size={20} color={theme.colors.primary} />
            </TouchableOpacity>
            
            <TextInput
              ref={textInputRef}
              style={styles.textInput}
              placeholder="आफ्नो प्रश्न लेख्नुहोस्..."
              placeholderTextColor={theme.colors.textSecondary}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={500}
              editable={!isSending}
              onSubmitEditing={() => sendTextMessage()}
              blurOnSubmit={false}
            />

            <TouchableOpacity
              style={[
                styles.sendButton,
                (!inputText.trim() || isSending) && styles.sendButtonDisabled
              ]}
              onPress={() => sendTextMessage()}
              disabled={!inputText.trim() || isSending}
            >
              {isSending ? (
                <LoadingSpinner size="small" color={theme.colors.surface} />
              ) : (
                <Ionicons name="send" size={20} color={theme.colors.surface} />
              )}
            </TouchableOpacity>
          </View>
          
          <Text style={styles.helpText}>
            💬 नेपाली वा अङ्ग्रेजीमा प्रश्न सोध्नुहोस् • ❓ सहयोग माग्नुहोस्
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
  infoButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.primary,
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
  messageRole: {
    fontSize: theme.typography.caption.fontSize,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
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
  textInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    marginBottom: theme.spacing.sm,
    minHeight: 48,
  },
  helpButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.sm,
  },
  textInput: {
    flex: 1,
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.text,
    maxHeight: 100,
    paddingVertical: theme.spacing.xs,
    textAlignVertical: 'center',
  },
  sendButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: theme.spacing.sm,
  },
  sendButtonDisabled: {
    backgroundColor: theme.colors.textSecondary,
    opacity: 0.5,
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