import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  Platform,
} from 'react-native';
import { theme } from '../../styles/theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  title?: string;
  subtitle?: string;
}

const Card: React.FC<CardProps> = ({
  children,
  style,
  onPress,
  title,
  subtitle,
}) => {
  const CardComponent = onPress ? TouchableOpacity : View;

  const cardProps: any = {
    style: [styles.card, style],
  };

  if (onPress) {
    cardProps.onPress = onPress;
    cardProps.activeOpacity = 0.7;
  }

  return (
    <CardComponent {...cardProps}>
      {(title || subtitle) && (
        <View style={styles.header}>
          {title && <Text style={styles.title}>{title}</Text>}
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
      )}
      {children}
    </CardComponent>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    // react-native-web warns about shadow* props being deprecated on web.
    // Prefer boxShadow for web while keeping native shadow props for mobile.
    ...(Platform.OS === 'web'
      ? { boxShadow: theme.shadows.sm.boxShadow }
      : theme.shadows.sm),
  },
  header: {
    marginBottom: theme.spacing.md,
  },
  title: {
    fontSize: theme.typography.h4.fontSize,
    fontWeight: theme.typography.h4.fontWeight,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.textSecondary,
  },
});

export default Card;