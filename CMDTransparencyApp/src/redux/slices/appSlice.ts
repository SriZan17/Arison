import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ProjectFilter } from '../../types';

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
  type: 'project_update' | 'new_project' | 'report_response' | 'announcement';
}

const initialState: AppState = {
  isOnline: true,
  activeFilters: {},
  searchHistory: [],
  userLocation: null,
  notifications: [],
  theme: 'light',
};

const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    setOnlineStatus: (state, action: PayloadAction<boolean>) => {
      state.isOnline = action.payload;
    },
    
    setActiveFilters: (state, action: PayloadAction<ProjectFilter>) => {
      state.activeFilters = action.payload;
    },
    
    clearFilters: (state) => {
      state.activeFilters = {};
    },
    
    addToSearchHistory: (state, action: PayloadAction<string>) => {
      const searchTerm = action.payload.trim();
      if (searchTerm && !state.searchHistory.includes(searchTerm)) {
        state.searchHistory.unshift(searchTerm);
        // Keep only last 10 searches
        if (state.searchHistory.length > 10) {
          state.searchHistory = state.searchHistory.slice(0, 10);
        }
      }
    },
    
    clearSearchHistory: (state) => {
      state.searchHistory = [];
    },
    
    setUserLocation: (state, action: PayloadAction<{ latitude: number; longitude: number } | null>) => {
      state.userLocation = action.payload;
    },
    
    addNotification: (state, action: PayloadAction<Notification>) => {
      state.notifications.unshift(action.payload);
    },
    
    markNotificationAsRead: (state, action: PayloadAction<string>) => {
      const notification = state.notifications.find(n => n.id === action.payload);
      if (notification) {
        notification.read = true;
      }
    },
    
    markAllNotificationsAsRead: (state) => {
      state.notifications.forEach(n => n.read = true);
    },
    
    clearNotifications: (state) => {
      state.notifications = [];
    },
    
    setTheme: (state, action: PayloadAction<'light' | 'dark'>) => {
      state.theme = action.payload;
    },
  },
});

export const {
  setOnlineStatus,
  setActiveFilters,
  clearFilters,
  addToSearchHistory,
  clearSearchHistory,
  setUserLocation,
  addNotification,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  clearNotifications,
  setTheme,
} = appSlice.actions;

export default appSlice.reducer;