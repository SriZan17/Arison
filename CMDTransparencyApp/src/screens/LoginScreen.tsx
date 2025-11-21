import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

// Components
import Card from '../components/common/Card';
import Button from '../components/common/Button';

// Hooks and Services
import { useAuth } from '../context/AuthContext';

// Types
import { theme } from '../styles/theme';
import { AuthStackParamList } from '../navigation/AuthNavigator';

type LoginScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

const LoginScreen: React.FC = () => {
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const { login, loading, error, clearError } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});

  useEffect(() => {
    if (error) {
      Alert.alert('Login Failed', error, [
        { text: 'OK', onPress: clearError }
      ]);
    }
  }, [error, clearError]);

  const validateForm = (): boolean => {
    const errors: {[key: string]: string} = {};

    // Email validation
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Please enter a valid email';
    }

    // Password validation
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) {
      return;
    }

    const success = await login(formData.email.toLowerCase().trim(), formData.password);
    
    if (!success) {
      // Error is handled in useEffect above
      return;
    }

    // Navigation to main app will be handled by the root navigator
  };

  const handleDemoLogin = (type: 'citizen' | 'official') => {
    if (type === 'citizen') {
      setFormData({
        email: 'citizen@example.com',
        password: 'password123',
      });
    } else {
      setFormData({
        email: 'official@gov.np',
        password: 'admin123',
      });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />
      
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <Ionicons name="shield-checkmark" size={80} color={theme.colors.primary} />
            <Text style={styles.appName}>E-निरीक्षण</Text>
            <Text style={styles.subtitle}>Government Project Transparency</Text>
          </View>

          {/* Login Form */}
          <Card style={styles.formCard}>
            <View style={styles.formHeader}>
              <Ionicons name="log-in-outline" size={24} color={theme.colors.primary} />
              <Text style={styles.formTitle}>Login to Your Account</Text>
            </View>

            {/* Email Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email Address</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="mail-outline" size={20} color={theme.colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter your email"
                  value={formData.email}
                  onChangeText={(text) => {
                    setFormData(prev => ({ ...prev, email: text }));
                    if (formErrors.email) {
                      setFormErrors(prev => ({ ...prev, email: '' }));
                    }
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  returnKeyType="next"
                />
              </View>
              {formErrors.email && <Text style={styles.errorText}>{formErrors.email}</Text>}
            </View>

            {/* Password Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Password</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color={theme.colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={[styles.textInput, styles.passwordInput]}
                  placeholder="Enter your password"
                  value={formData.password}
                  onChangeText={(text) => {
                    setFormData(prev => ({ ...prev, password: text }));
                    if (formErrors.password) {
                      setFormErrors(prev => ({ ...prev, password: '' }));
                    }
                  }}
                  secureTextEntry={!showPassword}
                  autoComplete="password"
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                />
                <TouchableOpacity
                  style={styles.passwordToggle}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color={theme.colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>
              {formErrors.password && <Text style={styles.errorText}>{formErrors.password}</Text>}
            </View>

            {/* Login Button */}
            <Button
              title={loading ? "Signing In..." : "Sign In"}
              onPress={handleLogin}
              disabled={loading}
              style={styles.loginButton}
            />

            {loading && (
              <ActivityIndicator 
                size="small" 
                color={theme.colors.primary} 
                style={styles.loader} 
              />
            )}

            {/* Demo Login */}
            <View style={styles.demoSection}>
              <Text style={styles.demoTitle}>Demo Accounts</Text>
              <View style={styles.demoButtons}>
                <TouchableOpacity
                  style={[styles.demoButton, styles.citizenDemo]}
                  onPress={() => handleDemoLogin('citizen')}
                >
                  <Ionicons name="person-outline" size={16} color={theme.colors.primary} />
                  <Text style={styles.demoButtonText}>Citizen Demo</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.demoButton, styles.officialDemo]}
                  onPress={() => handleDemoLogin('official')}
                >
                  <Ionicons name="shield-outline" size={16} color={theme.colors.warning} />
                  <Text style={[styles.demoButtonText, { color: theme.colors.warning }]}>Official Demo</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Card>

          {/* Sign Up Link */}
          <View style={styles.signupSection}>
            <Text style={styles.signupText}>Don't have an account?</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
              <Text style={styles.signupLink}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: theme.spacing.md,
  },
  header: {
    alignItems: 'center',
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.lg,
  },
  appName: {
    fontSize: theme.typography.h1.fontSize,
    fontWeight: theme.typography.h1.fontWeight,
    color: theme.colors.primary,
    marginTop: theme.spacing.md,
  },
  subtitle: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: theme.spacing.sm,
  },
  formCard: {
    marginBottom: theme.spacing.lg,
  },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  formTitle: {
    fontSize: theme.typography.h3.fontSize,
    fontWeight: theme.typography.h3.fontWeight,
    color: theme.colors.text,
    marginLeft: theme.spacing.sm,
  },
  inputGroup: {
    marginBottom: theme.spacing.md,
  },
  inputLabel: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.surface,
  },
  inputIcon: {
    marginLeft: theme.spacing.md,
  },
  textInput: {
    flex: 1,
    padding: theme.spacing.md,
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.text,
  },
  passwordInput: {
    paddingRight: theme.spacing.sm,
  },
  passwordToggle: {
    padding: theme.spacing.md,
  },
  errorText: {
    fontSize: theme.typography.small.fontSize,
    color: theme.colors.error,
    marginTop: theme.spacing.xs,
  },
  loginButton: {
    marginTop: theme.spacing.md,
  },
  loader: {
    marginTop: theme.spacing.sm,
  },
  demoSection: {
    marginTop: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  demoTitle: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
    fontWeight: '600',
  },
  demoButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  },
  demoButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
  },
  citizenDemo: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + '10',
  },
  officialDemo: {
    borderColor: theme.colors.warning,
    backgroundColor: theme.colors.warning + '10',
  },
  demoButtonText: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.primary,
    marginLeft: theme.spacing.xs,
    fontWeight: '600',
  },
  signupSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: theme.spacing.xl,
  },
  signupText: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.textSecondary,
    marginRight: theme.spacing.sm,
  },
  signupLink: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.primary,
    fontWeight: '600',
  },
});

export default LoginScreen;