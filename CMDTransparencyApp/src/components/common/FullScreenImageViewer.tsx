import React, { useState } from 'react';
import {
  Modal,
  View,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  StatusBar,
  Text,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../styles/theme';

interface FullScreenImageViewerProps {
  visible: boolean;
  imageUrl: string;
  onClose: () => void;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const FullScreenImageViewer: React.FC<FullScreenImageViewerProps> = ({
  visible,
  imageUrl,
  onClose,
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  const [zoomLevel, setZoomLevel] = useState(1);

  const handleImageLoad = (event: any) => {
    const { width, height } = event.nativeEvent.source;
    setImageDimensions({ width, height });
    setImageLoaded(true);
    setImageError(false);
  };

  const handleImageError = () => {
    setImageError(true);
    setImageLoaded(false);
    console.error('Failed to load fullscreen image:', imageUrl);
  };

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.5, 3));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.5, 0.5));
  };

  const handleZoomReset = () => {
    setZoomLevel(1);
  };

  const calculateImageStyle = () => {
    if (!imageLoaded || !imageDimensions.width || !imageDimensions.height) {
      return { 
        width: screenWidth * 0.9, 
        height: screenHeight * 0.7 
      };
    }

    const imageRatio = imageDimensions.width / imageDimensions.height;
    const screenRatio = (screenWidth * 0.9) / (screenHeight * 0.7);

    let width, height;

    if (imageRatio > screenRatio) {
      // Image is wider than screen
      width = screenWidth * 0.9;
      height = width / imageRatio;
    } else {
      // Image is taller than screen or similar ratio
      height = screenHeight * 0.7;
      width = height * imageRatio;
    }

    return { 
      width: width * zoomLevel, 
      height: height * zoomLevel 
    };
  };

  const handleClose = () => {
    setZoomLevel(1);
    setImageLoaded(false);
    setImageError(false);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <StatusBar backgroundColor="rgba(0,0,0,0.9)" barStyle="light-content" />
      
      <View style={styles.overlay}>
        {/* Header Controls */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerButton} onPress={handleClose}>
            <Ionicons name="close" size={28} color={theme.colors.surface} />
          </TouchableOpacity>
          
          <View style={styles.headerControls}>
            <TouchableOpacity style={styles.headerButton} onPress={handleZoomOut}>
              <Ionicons name="remove" size={24} color={theme.colors.surface} />
            </TouchableOpacity>
            
            <Text style={styles.zoomText}>
              {Math.round(zoomLevel * 100)}%
            </Text>
            
            <TouchableOpacity style={styles.headerButton} onPress={handleZoomIn}>
              <Ionicons name="add" size={24} color={theme.colors.surface} />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.headerButton} onPress={handleZoomReset}>
              <Ionicons name="refresh" size={24} color={theme.colors.surface} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Image Container */}
        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.imageContainer}
          minimumZoomScale={0.5}
          maximumZoomScale={3}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          bouncesZoom
        >
          {imageError ? (
            <View style={styles.errorContainer}>
              <Ionicons name="image-outline" size={80} color={theme.colors.surface} />
              <Text style={styles.errorText}>Failed to load image</Text>
              <Text style={styles.errorUrl}>{imageUrl}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={() => {
                setImageError(false);
                setImageLoaded(false);
              }}>
                <Text style={styles.retryText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <Image
              source={{ uri: imageUrl }}
              style={[styles.fullscreenImage, calculateImageStyle()]}
              resizeMode="contain"
              onLoad={handleImageLoad}
              onError={handleImageError}
            />
          )}
        </ScrollView>

        {/* Footer Info */}
        <View style={styles.footer}>
          <Text style={styles.footerText} numberOfLines={1}>
            {imageUrl.split('/').pop()}
          </Text>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  headerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  headerButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  zoomText: {
    color: theme.colors.surface,
    fontSize: 16,
    fontWeight: '600',
    minWidth: 50,
    textAlign: 'center',
  },
  scrollContainer: {
    flex: 1,
  },
  imageContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  fullscreenImage: {
    backgroundColor: 'transparent',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorText: {
    color: theme.colors.surface,
    fontSize: 18,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  errorUrl: {
    color: theme.colors.surface,
    fontSize: 12,
    opacity: 0.7,
    marginBottom: 20,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  retryText: {
    color: theme.colors.surface,
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 20,
    paddingVertical: 15,
    paddingBottom: 30,
  },
  footerText: {
    color: theme.colors.surface,
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.8,
  },
});

export default FullScreenImageViewer;