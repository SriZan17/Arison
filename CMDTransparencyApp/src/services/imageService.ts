import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';

export interface ImageAsset {
  uri: string;
  name: string;
  type: string;
  size?: number;
}

export interface ImageOptions {
  maxImages?: number;
  quality?: number;
  maxWidth?: number;
  maxHeight?: number;
  compress?: boolean;
}

export class ImageService {
  static async requestPermissions(): Promise<boolean> {
    try {
      const cameraStatus = await ImagePicker.requestCameraPermissionsAsync();
      const mediaLibraryStatus = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      return cameraStatus.status === 'granted' && mediaLibraryStatus.status === 'granted';
    } catch (error) {
      console.error('Error requesting camera permissions:', error);
      return false;
    }
  }

  static async pickImages(options: ImageOptions = {}): Promise<ImageAsset[]> {
    const hasPermission = await this.requestPermissions();
    
    if (!hasPermission) {
      throw new Error('Camera and media library permissions not granted');
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: options.quality || 0.8,
        aspect: undefined,
        allowsEditing: false,
      });

      if (result.canceled) {
        return [];
      }

      const assets = result.assets || [];
      const maxImages = options.maxImages || 5;
      const selectedAssets = assets.slice(0, maxImages);

      const processedAssets = await Promise.all(
        selectedAssets.map(async (asset) => {
          let processedUri = asset.uri;
          
          // Compress image if requested
          if (options.compress !== false) {
            try {
              const compressed = await this.compressImage(asset.uri, {
                quality: options.quality || 0.8,
                maxWidth: options.maxWidth || 1920,
                maxHeight: options.maxHeight || 1080,
              });
              processedUri = compressed.uri;
            } catch (compressionError) {
              console.warn('Image compression failed, using original:', compressionError);
            }
          }

          return {
            uri: processedUri,
            name: asset.fileName || `image_${Date.now()}.jpg`,
            type: 'image/jpeg',
            size: asset.fileSize,
          };
        })
      );

      return processedAssets;
    } catch (error) {
      console.error('Error picking images:', error);
      throw new Error('Failed to select images');
    }
  }

  static async captureImage(options: ImageOptions = {}): Promise<ImageAsset | null> {
    const hasPermission = await this.requestPermissions();
    
    if (!hasPermission) {
      throw new Error('Camera permission not granted');
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: options.quality || 0.8,
        allowsEditing: false,
        aspect: undefined,
      });

      if (result.canceled) {
        return null;
      }

      const asset = result.assets[0];
      let processedUri = asset.uri;

      // Compress image if requested
      if (options.compress !== false) {
        try {
          const compressed = await this.compressImage(asset.uri, {
            quality: options.quality || 0.8,
            maxWidth: options.maxWidth || 1920,
            maxHeight: options.maxHeight || 1080,
          });
          processedUri = compressed.uri;
        } catch (compressionError) {
          console.warn('Image compression failed, using original:', compressionError);
        }
      }

      return {
        uri: processedUri,
        name: asset.fileName || `capture_${Date.now()}.jpg`,
        type: 'image/jpeg',
        size: asset.fileSize,
      };
    } catch (error) {
      console.error('Error capturing image:', error);
      throw new Error('Failed to capture image');
    }
  }

  static async compressImage(
    uri: string,
    options: {
      quality?: number;
      maxWidth?: number;
      maxHeight?: number;
    } = {}
  ): Promise<{ uri: string }> {
    try {
      const result = await ImageManipulator.manipulateAsync(
        uri,
        [
          {
            resize: {
              width: options.maxWidth || 1920,
              height: options.maxHeight || 1080,
            },
          },
        ],
        {
          compress: options.quality || 0.8,
          format: ImageManipulator.SaveFormat.JPEG,
        }
      );

      return result;
    } catch (error) {
      console.error('Error compressing image:', error);
      throw new Error('Failed to compress image');
    }
  }

  static createFormData(images: ImageAsset[]): FormData {
    const formData = new FormData();

    images.forEach((image, index) => {
      const imageData = {
        uri: image.uri,
        type: image.type,
        name: image.name,
      } as any;

      formData.append('files', imageData);
    });

    return formData;
  }

  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }
}