import React from 'react';
import { TouchableOpacity, Animated, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../styles/theme';

interface VoiceRecordButtonProps {
  isRecording: boolean;
  isTranscribing?: boolean;
  recordingAnimation: Animated.Value;
  onPress: () => void;
  disabled?: boolean;
  size?: number;
  style?: any;
  audioUri?: string | null;
}

const VoiceRecordButton: React.FC<VoiceRecordButtonProps> = ({
  isRecording,
  isTranscribing = false,
  recordingAnimation,
  onPress,
  disabled = false,
  size = 20,
  style,
  audioUri,
}) => {
  const getIconName = () => {
    if (isTranscribing) return "hourglass";
    if (isRecording) return "stop";
    if (audioUri) return "musical-notes";
    return "mic";
  };

  const getIconColor = () => {
    if (disabled) return theme.colors.textSecondary;
    if (isTranscribing) return theme.colors.surface;
    if (isRecording) return theme.colors.surface;
    if (audioUri) return theme.colors.success;
    return theme.colors.primary;
  };

  return (
    <Animated.View style={[{ transform: [{ scale: recordingAnimation }] }, style]}>
      <TouchableOpacity
        style={[
          styles.voiceButton,
          isRecording && styles.voiceButtonRecording,
          isTranscribing && styles.voiceButtonTranscribing,
          audioUri && styles.voiceButtonWithAudio,
          disabled && styles.voiceButtonDisabled,
        ]}
        onPress={onPress}
        disabled={disabled || isTranscribing}
      >
        <Ionicons 
          name={getIconName() as any} 
          size={size} 
          color={getIconColor()}
        />
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  voiceButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderWidth: 2,
    borderColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  voiceButtonRecording: {
    backgroundColor: theme.colors.error,
    borderColor: theme.colors.error,
  },
  voiceButtonTranscribing: {
    backgroundColor: theme.colors.warning,
    borderColor: theme.colors.warning,
  },
  voiceButtonWithAudio: {
    backgroundColor: theme.colors.success + '20',
    borderColor: theme.colors.success,
  },
  voiceButtonDisabled: {
    opacity: 0.5,
    backgroundColor: theme.colors.textSecondary,
    borderColor: theme.colors.textSecondary,
  },
});

export default VoiceRecordButton;