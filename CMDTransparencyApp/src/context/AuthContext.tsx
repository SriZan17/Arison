import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Types
interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'citizen' | 'official';
  verified: boolean;
}

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  error: string | null;
}

type AuthAction =
  | { type: 'AUTH_LOADING' }
  | { type: 'LOGIN_SUCCESS'; payload: User }
  | { type: 'LOGOUT' }
  | { type: 'AUTH_ERROR'; payload: string }
  | { type: 'CLEAR_ERROR' }
  | { type: 'UPDATE_USER'; payload: Partial<User> };

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<boolean>;
  signup: (userData: SignupData) => Promise<boolean>;
  logout: () => Promise<void>;
  clearError: () => void;
  updateUser: (userData: Partial<User>) => void;
  getAuthToken: () => Promise<string | null>;
}

interface SignupData {
  name: string;
  email: string;
  phone?: string;
  password: string;
  confirmPassword: string;
}

// Initial state
const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  loading: true,
  error: null,
};

// Reducer
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'AUTH_LOADING':
      return { ...state, loading: true, error: null };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload,
        loading: false,
        error: null,
      };
    case 'LOGOUT':
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        loading: false,
        error: null,
      };
    case 'AUTH_ERROR':
      return {
        ...state,
        loading: false,
        error: action.payload,
        isAuthenticated: false,
        user: null,
      };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    case 'UPDATE_USER':
      return {
        ...state,
        user: state.user ? { ...state.user, ...action.payload } : null,
      };
    default:
      return state;
  }
};

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// API Configuration
// Network configuration for different environments
const getBaseURL = () => {
  // Use the same IP address as apiService.ts for consistency
  return 'http://192.168.88.191:8000';
};

const API_BASE_URL = getBaseURL();
const API_ENDPOINTS = {
  LOGIN: '/api/auth/login',
  REGISTER: '/api/auth/register',
  ME: '/api/auth/me',
  DEMO: '/api/auth/demo-accounts',
};

// API Helper functions
const apiCall = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  console.log(`Making API call to: ${url}`);
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      signal: controller.signal,
      ...options,
    });

    clearTimeout(timeoutId);

    // Get response text first to handle non-JSON responses
    const responseText = await response.text();
    console.log(`API Response (${response.status}):`, responseText);

    // Try to parse as JSON
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      console.error('Response text:', responseText);
      
      // Check if it's an internal server error
      if (responseText.includes('Internal Server Error') || response.status === 500) {
        throw new Error('Server error - please check if the backend is properly configured and database is connected');
      }
      
      // Check if it's a database connection error
      if (responseText.includes('database') || responseText.includes('connection')) {
        throw new Error('Database connection error - please ensure PostgreSQL is running');
      }
      
      throw new Error(`Server returned invalid response: ${responseText.substring(0, 200)}${responseText.length > 200 ? '...' : ''}`);
    }
    
    if (!response.ok) {
      throw new Error(data.detail || data.message || `HTTP ${response.status}: ${response.statusText}`);
    }
    
    return data;
  } catch (error) {
    console.error(`API call failed for ${url}:`, error);
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timeout - please check your network connection');
      }
      
      if (error.message === 'Network request failed' || error.message.includes('fetch')) {
        throw new Error(`Cannot connect to server. Please ensure the backend is running on ${API_BASE_URL}`);
      }
      
      throw error;
    }
    
    throw new Error('An unexpected error occurred');
  }
};

// Storage keys
const STORAGE_KEYS = {
  USER: '@e_nirikshan_user',
  TOKEN: '@e_nirikshan_token',
};

// Provider component
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check for stored user data on app start
  useEffect(() => {
    checkStoredAuth();
  }, []);

  const checkStoredAuth = async () => {
    try {
      dispatch({ type: 'AUTH_LOADING' });
      const storedToken = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);

      if (storedToken) {
        // Validate token with backend by calling /me endpoint
        try {
          const userData = await apiCall(API_ENDPOINTS.ME, {
            headers: {
              'Authorization': `Bearer ${storedToken}`,
            },
          });

          // Update stored user data with latest from backend
          await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData));
          dispatch({ type: 'LOGIN_SUCCESS', payload: userData });
        } catch (error) {
          console.error('Token validation failed:', error);
          // Token is invalid, clear storage and logout
          await AsyncStorage.removeItem(STORAGE_KEYS.USER);
          await AsyncStorage.removeItem(STORAGE_KEYS.TOKEN);
          dispatch({ type: 'LOGOUT' });
        }
      } else {
        dispatch({ type: 'LOGOUT' });
      }
    } catch (error) {
      console.error('Error checking stored auth:', error);
      dispatch({ type: 'LOGOUT' });
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      dispatch({ type: 'AUTH_LOADING' });

      // Call backend login API
      const response = await apiCall(API_ENDPOINTS.LOGIN, {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      const { access_token, user } = response;

      // Store user data and token
      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
      await AsyncStorage.setItem(STORAGE_KEYS.TOKEN, access_token);

      dispatch({ type: 'LOGIN_SUCCESS', payload: user });
      return true;
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Login failed. Please try again.';
      dispatch({ type: 'AUTH_ERROR', payload: errorMessage });
      return false;
    }
  };

  const signup = async (userData: SignupData): Promise<boolean> => {
    try {
      dispatch({ type: 'AUTH_LOADING' });

      // Validate passwords match
      if (userData.password !== userData.confirmPassword) {
        dispatch({ type: 'AUTH_ERROR', payload: 'Passwords do not match' });
        return false;
      }

      // Prepare signup data for backend
      const signupData = {
        name: userData.name,
        email: userData.email,
        phone: userData.phone || '',
        password: userData.password,
        confirm_password: userData.confirmPassword,
        role: 'citizen',
      };

      // Call backend register API
      const response = await apiCall(API_ENDPOINTS.REGISTER, {
        method: 'POST',
        body: JSON.stringify(signupData),
      });

      const { access_token, user } = response;

      // Store user data and token
      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
      await AsyncStorage.setItem(STORAGE_KEYS.TOKEN, access_token);

      dispatch({ type: 'LOGIN_SUCCESS', payload: user });
      return true;
    } catch (error) {
      console.error('Signup error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Signup failed. Please try again.';
      dispatch({ type: 'AUTH_ERROR', payload: errorMessage });
      return false;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.USER);
      await AsyncStorage.removeItem(STORAGE_KEYS.TOKEN);
      dispatch({ type: 'LOGOUT' });
    } catch (error) {
      console.error('Logout error:', error);
      dispatch({ type: 'LOGOUT' });
    }
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const updateUser = (userData: Partial<User>) => {
    dispatch({ type: 'UPDATE_USER', payload: userData });
  };

  const getAuthToken = async (): Promise<string | null> => {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  };

  const value: AuthContextType = {
    ...state,
    login,
    signup,
    logout,
    clearError,
    updateUser,
    getAuthToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;