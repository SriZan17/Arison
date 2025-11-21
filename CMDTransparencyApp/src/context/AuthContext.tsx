import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

// Storage keys
const STORAGE_KEYS = {
  USER: '@e_nirikshan_user',
  TOKEN: '@e_nirikshan_token',
};

// Mock user database (replace with actual API later)
const MOCK_USERS = [
  {
    id: '1',
    name: 'John Citizen',
    email: 'citizen@example.com',
    phone: '+977-9841234567',
    password: 'password123',
    role: 'citizen' as const,
    verified: true,
  },
  {
    id: '2',
    name: 'सरकारी अधिकारी',
    email: 'official@gov.np',
    phone: '+977-9851234567',
    password: 'admin123',
    role: 'official' as const,
    verified: true,
  },
];

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
      const storedUser = await AsyncStorage.getItem(STORAGE_KEYS.USER);
      const storedToken = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);

      if (storedUser && storedToken) {
        const user = JSON.parse(storedUser);
        dispatch({ type: 'LOGIN_SUCCESS', payload: user });
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

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Find user in mock database
      const user = MOCK_USERS.find(u => u.email === email && u.password === password);

      if (!user) {
        dispatch({ type: 'AUTH_ERROR', payload: 'Invalid email or password' });
        return false;
      }

      // Create user object without password
      const { password: _, ...userData } = user;
      const authUser: User = userData;

      // Store user data
      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(authUser));
      await AsyncStorage.setItem(STORAGE_KEYS.TOKEN, `mock_token_${user.id}`);

      dispatch({ type: 'LOGIN_SUCCESS', payload: authUser });
      return true;
    } catch (error) {
      console.error('Login error:', error);
      dispatch({ type: 'AUTH_ERROR', payload: 'Login failed. Please try again.' });
      return false;
    }
  };

  const signup = async (userData: SignupData): Promise<boolean> => {
    try {
      dispatch({ type: 'AUTH_LOADING' });

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Check if user already exists
      const existingUser = MOCK_USERS.find(u => u.email === userData.email);
      if (existingUser) {
        dispatch({ type: 'AUTH_ERROR', payload: 'User with this email already exists' });
        return false;
      }

      // Validate passwords match
      if (userData.password !== userData.confirmPassword) {
        dispatch({ type: 'AUTH_ERROR', payload: 'Passwords do not match' });
        return false;
      }

      // Create new user
      const newUser: User = {
        id: `user_${Date.now()}`,
        name: userData.name,
        email: userData.email,
        phone: userData.phone,
        role: 'citizen',
        verified: false,
      };

      // In a real app, this would be sent to the backend
      MOCK_USERS.push({
        ...newUser,
        password: userData.password,
        phone: userData.phone || '',
      });

      // Store user data
      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(newUser));
      await AsyncStorage.setItem(STORAGE_KEYS.TOKEN, `mock_token_${newUser.id}`);

      dispatch({ type: 'LOGIN_SUCCESS', payload: newUser });
      return true;
    } catch (error) {
      console.error('Signup error:', error);
      dispatch({ type: 'AUTH_ERROR', payload: 'Signup failed. Please try again.' });
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

  const value: AuthContextType = {
    ...state,
    login,
    signup,
    logout,
    clearError,
    updateUser,
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