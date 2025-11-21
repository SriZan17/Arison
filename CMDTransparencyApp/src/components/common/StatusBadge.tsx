import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { theme } from '../../styles/theme';
import { ProjectStatus } from '../../types';

interface StatusBadgeProps {
  status: ProjectStatus | string;
  style?: ViewStyle;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, style }) => {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return {
          background: theme.colors.success,
          text: theme.colors.surface,
        };
      case 'in progress':
        return {
          background: theme.colors.primary,
          text: theme.colors.surface,
        };
      case 'delayed':
      case 'delay report':
        return {
          background: theme.colors.warning,
          text: theme.colors.surface,
        };
      case 'disputed':
      case 'fraud alert':
        return {
          background: theme.colors.error,
          text: theme.colors.surface,
        };
      case 'planning':
        return {
          background: theme.colors.textSecondary,
          text: theme.colors.surface,
        };
      case 'tender open':
      case 'evaluation':
      case 'awarded':
        return {
          background: theme.colors.secondary,
          text: theme.colors.surface,
        };
      default:
        return {
          background: theme.colors.disabled,
          text: theme.colors.text,
        };
    }
  };

  const colors = getStatusColor(status);

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: colors.background },
        style,
      ]}
    >
      <Text style={[styles.text, { color: colors.text }]}>
        {status}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: theme.typography.small.fontSize,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
});

export default StatusBadge;