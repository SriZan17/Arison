# E-निरीक्षण Mobile App

A React Native Expo application for the CMD Government Procurement Transparency Platform, enabling citizens to monitor government projects and submit reports with photographic evidence.

## 🚀 Features

- **Home Dashboard**: Overview of government transparency metrics
- **Project Browser**: Browse and filter government procurement projects
- **Project Details**: Detailed view of individual projects with progress tracking
- **Review Submission**: Submit citizen reports with photo upload
- **Map View**: Geographic visualization of projects
- **Analytics**: Statistical insights and transparency metrics
- **Location Services**: GPS-based project recommendations
- **Real-time Data**: Live updates from government databases

## 🛠️ Tech Stack

- **React Native Expo**: Cross-platform mobile development
- **TypeScript**: Type-safe development
- **Redux Toolkit**: State management with RTK Query for API calls
- **React Navigation**: Tab and stack navigation
- **Expo Location**: GPS and location services
- **Expo Image Picker**: Camera and photo gallery access
- **React Native Maps**: Interactive map components
- **React Native SVG**: Vector graphics for charts and icons

## 📋 Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Expo CLI (`npm install -g @expo/cli`)
- iOS Simulator (Mac) or Android Studio (for emulator)
- Physical device with Expo Go app (recommended for testing)

## 🚀 Quick Start

### 1. Clone and Install
```bash
cd CMDTransparencyApp
npm install
```

### 2. Configure API Connection

For development, update the API base URL in these files:
- `src/redux/api/projectsApi.ts`
- `src/redux/api/reviewsApi.ts`
- `src/services/apiClient.ts`

**For physical device testing**, replace `localhost` with your computer's IP address:
```typescript
const API_BASE_URL = 'http://192.168.1.100:8000'; // Replace with your IP
```

Find your IP address:
- **Windows**: `ipconfig` (look for IPv4 Address)
- **Mac/Linux**: `ifconfig` (look for inet under your network interface)

### 3. Start the Backend

Make sure your CMD Transparency backend is running:
```bash
cd ../backend
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### 4. Run the Mobile App

```bash
# Start Expo development server
npm start

# Or run directly on specific platforms
npm run android
npm run ios
npm run web
```

### 5. Test on Device

1. Install **Expo Go** app on your phone
2. Scan the QR code from the Expo dev server
3. The app will load on your device

## 📱 App Structure

```
src/
├── components/          # Reusable UI components
│   ├── common/         # Generic components (Button, Card, etc.)
│   ├── project/        # Project-specific components
│   └── review/         # Review-specific components
├── screens/            # Main app screens
├── navigation/         # Navigation configuration
├── redux/             # State management
│   ├── api/           # RTK Query API slices
│   ├── slices/        # Redux slices
│   └── store.ts       # Store configuration
├── services/          # External services
├── styles/            # Theme and styling
├── types/             # TypeScript type definitions
└── utils/             # Utility functions
```

## 🔧 Key Components

### Navigation
- **Tab Navigation**: Main app sections (Home, Projects, Map, Analytics, Profile)
- **Stack Navigation**: Detailed views (Project Details, Review Submission)

### State Management
- **Redux Toolkit**: Centralized state management
- **RTK Query**: API caching and data fetching
- **App Slice**: Global app state (location, filters, notifications)

### API Integration
- **Projects API**: Government project data
- **Reviews API**: Citizen report submission
- **Real-time sync**: Automatic data updates

### Services
- **Location Service**: GPS coordinates and address resolution
- **Image Service**: Photo capture and compression
- **API Client**: HTTP client with error handling

## 📊 API Endpoints Integration

The app integrates with the following backend endpoints:

### Projects
- `GET /api/projects/` - Browse projects with filters
- `GET /api/projects/{id}` - Project details
- `GET /api/projects/stats/overview` - Dashboard statistics

### Reviews
- `POST /api/reviews/{projectId}/submit` - Submit citizen report
- `POST /api/reviews/upload-images` - Upload photos
- `GET /api/reviews/{projectId}/all` - Get project reviews

## 🎨 UI/UX Features

### Design System
- **Government Blue** (#1E40AF) - Primary color for trust
- **Transparency Teal** (#0891B2) - Secondary for clarity
- **Status Colors** - Green (completed), Orange (issues), Red (alerts)
- **Consistent Typography** - Clear hierarchy and readability
- **Accessibility** - Screen reader support and proper contrast

### User Experience
- **Pull-to-refresh** - Update data with simple gesture
- **Offline indicators** - Show connection status
- **Loading states** - Smooth transitions and feedback
- **Error handling** - User-friendly error messages
- **Location awareness** - Nearby project recommendations

## 🔒 Permissions

The app requires these permissions:

### iOS
- **Location (When In Use)**: Find nearby projects
- **Camera**: Capture project photos
- **Photo Library**: Select existing photos

### Android
- **ACCESS_FINE_LOCATION**: GPS coordinates
- **CAMERA**: Photo capture
- **READ_EXTERNAL_STORAGE**: Photo selection
- **WRITE_EXTERNAL_STORAGE**: Photo saving

## 🚀 Development Workflow

### 1. API Development
```bash
# Test API endpoints
curl http://localhost:8000/api/projects/
curl http://localhost:8000/health
```

### 2. Mobile Development
```bash
# Start with live reload
npm start

# Clear cache if needed
npm start --clear
```

### 3. Testing
- **Manual Testing**: Use Expo Go on physical device
- **iOS Simulator**: Test iOS-specific features
- **Android Emulator**: Test Android-specific features
- **Web Version**: Quick testing in browser

## 📱 Platform-Specific Features

### iOS
- Native navigation gestures
- Safe area handling
- iOS-style alerts and modals

### Android
- Material Design components
- Back button handling
- Android permissions flow

### Universal
- Responsive layouts for tablets
- Cross-platform icon system
- Consistent user experience

## 🔧 Troubleshooting

### Common Issues

1. **API Connection Failed**
   - Check backend is running on port 8000
   - Update IP address for physical device testing
   - Verify firewall settings

2. **Location Not Working**
   - Grant location permissions in device settings
   - Test on physical device (simulator has limited GPS)

3. **Images Not Uploading**
   - Check camera permissions
   - Verify photo library access
   - Test file size limits (10MB max)

4. **App Crashes on Startup**
   - Clear Expo cache: `npm start --clear`
   - Check for TypeScript errors
   - Verify all dependencies are installed

### Development Tips

1. **Use Physical Device**: Best experience for location and camera features
2. **Check Network**: Ensure device and computer are on same network
3. **Monitor Logs**: Use `npx react-native log-android` or iOS console
4. **Test Offline**: Verify app behavior without internet

## 🗺️ Map View (native + web fallback)

This project includes a `MapView` screen that shows projects on a map. For native (Expo) builds the screen uses `react-native-maps`; the web build falls back to OpenStreetMap links so the bundle stays lightweight.

To enable the native map functionality (recommended for mobile testing), install the package and follow Expo's guidance:

```bash
# from the `CMDTransparencyApp` folder
npx expo install react-native-maps
```

Notes:
- Expo-managed apps can use `react-native-maps`. On iOS you may need to provide Google Maps API keys for certain features; on Android, ensure the Google Play services are available on device/emulator.
- The web fallback does not require additional deps: it renders a simple project list with OpenStreetMap links. For a richer web map experience consider adding `leaflet`/`react-leaflet`.

Street-level imagery (street view):
- Google Street View requires API keys and billing — not free for production use.
- Free community alternatives include Mapillary and KartaView (OpenStreetCam). You can link to those services for street-level imagery at a given lat/lon, or ingest imagery collected by users into your own storage and display it in the app.

To add street-level photos to projects:
1. Allow users to upload photos when submitting reviews (already supported in the app). Store geolocation metadata with the photos.
2. Show uploaded photos in the project detail screen and, for a street-like experience, allow swiping through chronologically-ordered images near the project coordinates.

If you want, I can:
- Add a richer web map using `react-leaflet` and example markers.
- Add an in-app photo carousel tied to project locations to simulate a street view using user-submitted photos.


## 🌟 Current Status

### ✅ Implemented Features
- ✅ Project browsing with real data
- ✅ Navigation structure (5 main tabs)
- ✅ Home dashboard with statistics
- ✅ Project cards with progress indicators
- ✅ Location services integration
- ✅ Redux state management
- ✅ API integration with backend
- ✅ TypeScript implementation
- ✅ UI component library

### 🔄 In Development
- 🔄 Project detail view
- 🔄 Review submission form
- 🔄 Photo upload functionality
- 🔄 Map view with project markers
- 🔄 Analytics charts
- 🔄 Push notifications
- 🔄 User profile management

### 📋 Planned Features
- 📋 Advanced project filtering
- 📋 Search functionality
- 📋 Dark mode support
- 📋 Offline data caching
- 📋 Share project functionality
- 📋 Report verification system
- 📋 Multi-language support

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📞 Support

- **Documentation**: Check this README and inline code comments
- **Issues**: Report bugs via GitHub Issues
- **API Documentation**: Available at `http://localhost:8000/docs`

---

**📱 App Status**: ✅ MVP Ready - Core features implemented  
**🔌 Backend Integration**: ✅ Connected to FastAPI backend  
**📊 Real Data**: ✅ Live government project data  
**📍 Location Services**: ✅ GPS and nearby projects  
**📸 Media Upload**: ✅ Photo capture and selection ready  

*Built with ❤️ for Democratic Transparency and Citizen Engagement*