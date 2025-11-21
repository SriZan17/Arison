import { configureStore } from '@reduxjs/toolkit';
import { projectsApi } from './api/projectsApi';
import { reviewsApi } from './api/reviewsApi';
import appSlice from './slices/appSlice';

export const store = configureStore({
  reducer: {
    app: appSlice,
    [projectsApi.reducerPath]: projectsApi.reducer,
    [reviewsApi.reducerPath]: reviewsApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [
          // Ignore these action types
          'persist/PERSIST',
          'persist/REHYDRATE',
        ],
      },
    }).concat(
      projectsApi.middleware,
      reviewsApi.middleware
    ),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;