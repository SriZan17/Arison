import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { ProjectFilter } from '../types';

// App State Interface
interface AppState {
  isOnline: boolean;
  activeFilters: ProjectFilter;
  searchHistory: string[];
  userLocation: {
    latitude: number;
    longitude: number;
  } | null;
  notifications: Notification[];
  theme: 'light' | 'dark';
}

interface Notification {
  id: string;
  title: string;
  body: string;
  timestamp: string;
  read: boolean;
}

// Initial State
const initialState: AppState = {
  isOnline: true,
  activeFilters: {},
  searchHistory: [],
  userLocation: null,
  notifications: [],
  theme: 'light',
};

// Actions
type AppAction =
  | { type: 'SET_ONLINE_STATUS'; payload: boolean }
  | { type: 'SET_ACTIVE_FILTERS'; payload: ProjectFilter }
  | { type: 'ADD_SEARCH_TERM'; payload: string }
  | { type: 'SET_USER_LOCATION'; payload: { latitude: number; longitude: number } | null }
  | { type: 'ADD_NOTIFICATION'; payload: Notification }
  | { type: 'MARK_NOTIFICATION_READ'; payload: string }
  | { type: 'CLEAR_NOTIFICATIONS' }
  | { type: 'SET_THEME'; payload: 'light' | 'dark' }
  | { type: 'RESET_APP_STATE' };

// Reducer
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_ONLINE_STATUS':
      return { ...state, isOnline: action.payload };
    
    case 'SET_ACTIVE_FILTERS':
      return { ...state, activeFilters: action.payload };
    
    case 'ADD_SEARCH_TERM':
      const newHistory = [action.payload, ...state.searchHistory.filter(term => term !== action.payload)].slice(0, 10);
      return { ...state, searchHistory: newHistory };
    
    case 'SET_USER_LOCATION':
      return { ...state, userLocation: action.payload };
    
    case 'ADD_NOTIFICATION':
      return { ...state, notifications: [action.payload, ...state.notifications] };
    
    case 'MARK_NOTIFICATION_READ':
      return {
        ...state,
        notifications: state.notifications.map(notif =>
          notif.id === action.payload ? { ...notif, read: true } : notif
        )
      };
    
    case 'CLEAR_NOTIFICATIONS':
      return { ...state, notifications: [] };
    
    case 'SET_THEME':
      return { ...state, theme: action.payload };
    
    case 'RESET_APP_STATE':
      return initialState;
    
    default:
      return state;
  }
}

// Context
const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
} | null>(null);

// Provider
interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
};

// Custom Hook
export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

// Action Creators (Optional helper functions)
export const appActions = {
  setOnlineStatus: (status: boolean): AppAction => ({ type: 'SET_ONLINE_STATUS', payload: status }),
  setActiveFilters: (filters: ProjectFilter): AppAction => ({ type: 'SET_ACTIVE_FILTERS', payload: filters }),
  addSearchTerm: (term: string): AppAction => ({ type: 'ADD_SEARCH_TERM', payload: term }),
  setUserLocation: (location: { latitude: number; longitude: number } | null): AppAction => ({ type: 'SET_USER_LOCATION', payload: location }),
  addNotification: (notification: Notification): AppAction => ({ type: 'ADD_NOTIFICATION', payload: notification }),
  markNotificationRead: (id: string): AppAction => ({ type: 'MARK_NOTIFICATION_READ', payload: id }),
  clearNotifications: (): AppAction => ({ type: 'CLEAR_NOTIFICATIONS' }),
  setTheme: (theme: 'light' | 'dark'): AppAction => ({ type: 'SET_THEME', payload: theme }),
  resetAppState: (): AppAction => ({ type: 'RESET_APP_STATE' }),
};