import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  StatusBar,
  Platform,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';

// Components
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import LoadingSpinner from '../components/common/LoadingSpinner';

// Hooks and Services
import { useProject, useSubmitReview } from '../hooks/useApi';

// Types
import { theme } from '../styles/theme';
import { RootStackParamList } from '../navigation/AppNavigator';
import { ReviewType, ProjectStatus } from '../types';

type ReviewSubmissionScreenRouteProp = RouteProp<RootStackParamList, 'ReviewSubmission'>;
type ReviewSubmissionScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'ReviewSubmission'>;

interface FormData {
  reporter_name: string;
  reporter_contact: string;
  review_type: ReviewType;
  review_text: string;
  work_completed: boolean;
  quality_rating: number;
  images: ImagePicker.ImagePickerAsset[];
}

interface LocationData {
  latitude: number;
  longitude: number;
}

const REVIEW_TYPES = [
  { key: ReviewType.PROGRESS_UPDATE, label: 'Progress Update', icon: 'trending-up-outline', color: theme.colors.primary },
  { key: ReviewType.COMPLETION_VERIFICATION, label: 'Work Completion', icon: 'checkmark-circle-outline', color: theme.colors.success },
  { key: ReviewType.QUALITY_ISSUE, label: 'Quality Issue', icon: 'warning-outline', color: theme.colors.warning },
  { key: ReviewType.DELAY_REPORT, label: 'Delay Report', icon: 'time-outline', color: theme.colors.error },
  { key: ReviewType.FRAUD_ALERT, label: 'Fraud Alert', icon: 'shield-checkmark-outline', color: theme.colors.error },
];

const QUALITY_RATINGS = [
  { value: 1, label: 'Very Poor', color: theme.colors.error },
  { value: 2, label: 'Poor', color: theme.colors.warning },
  { value: 3, label: 'Average', color: theme.colors.textSecondary },
  { value: 4, label: 'Good', color: theme.colors.primary },
  { value: 5, label: 'Excellent', color: theme.colors.success },
];

const ReviewSubmissionScreen: React.FC = () => {
  const navigation = useNavigation<ReviewSubmissionScreenNavigationProp>();
  const route = useRoute<ReviewSubmissionScreenRouteProp>();
  const { projectId } = route.params;

  // Form state
  const [formData, setFormData] = useState<FormData>({
    reporter_name: '',
    reporter_contact: '',
    review_type: ReviewType.PROGRESS_UPDATE,
    review_text: '',
    work_completed: false,
    quality_rating: 0,
    images: [],
  });

  const [location, setLocation] = useState<LocationData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showQualityRating, setShowQualityRating] = useState(false);

  // API hooks
  const { data: project, loading: projectLoading } = useProject(projectId);
  const { mutate: submitReview } = useSubmitReview();

  useEffect(() => {
    requestLocationPermission();
    checkQualityRatingVisibility();
  }, [formData.review_type]);

  useEffect(() => {
    if (project) {
      navigation.setOptions({
        title: 'Submit Report',
        headerRight: () => (
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="close" size={24} color={theme.colors.surface} />
          </TouchableOpacity>
        ),
      });
    }
  }, [project, navigation]);

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({});
        setLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
      }
    } catch (error) {
      console.warn('Location permission denied:', error);
    }
  };

  const checkQualityRatingVisibility = () => {
    const showRating = [
      ReviewType.COMPLETION_VERIFICATION,
      ReviewType.PROGRESS_UPDATE,
      ReviewType.QUALITY_ISSUE
    ].includes(formData.review_type);
    setShowQualityRating(showRating);
    
    if (!showRating) {
      setFormData(prev => ({ ...prev, quality_rating: 0 }));
    }
  };

  const handleImagePick = async () => {
    if (formData.images.length >= 5) {
      Alert.alert('Limit Reached', 'You can upload maximum 5 images.');
      return;
    }

    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert('Permission Required', 'Please allow access to your photo library to upload images.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
      allowsMultipleSelection: false,
    });

    if (!result.canceled && result.assets[0]) {
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, result.assets[0]]
      }));
    }
  };

  const handleCameraPick = async () => {
    if (formData.images.length >= 5) {
      Alert.alert('Limit Reached', 'You can upload maximum 5 images.');
      return;
    }

    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert('Permission Required', 'Please allow access to your camera to take photos.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, result.assets[0]]
      }));
    }
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const validateForm = (): string | null => {
    if (!formData.review_text.trim()) {
      return 'Please provide a detailed description of your observation.';
    }
    
    if (formData.review_text.trim().length < 20) {
      return 'Please provide at least 20 characters in your description.';
    }

    if (showQualityRating && formData.quality_rating === 0) {
      return 'Please provide a quality rating for your observation.';
    }

    return null;
  };

  const handleSubmit = async () => {
    const validationError = validateForm();
    if (validationError) {
      Alert.alert('Validation Error', validationError);
      return;
    }

    setIsSubmitting(true);

    try {
      // Create FormData for multipart/form-data request
      const submitData = new FormData();
      
      // Add text fields
      if (formData.reporter_name.trim()) {
        submitData.append('reporter_name', formData.reporter_name.trim());
      }
      if (formData.reporter_contact.trim()) {
        submitData.append('reporter_contact', formData.reporter_contact.trim());
      }
      
      submitData.append('review_type', formData.review_type);
      submitData.append('review_text', formData.review_text.trim());
      submitData.append('work_completed', formData.work_completed.toString());
      
      if (showQualityRating && formData.quality_rating > 0) {
        submitData.append('quality_rating', formData.quality_rating.toString());
      }

      // Add location if available
      if (location) {
        submitData.append('latitude', location.latitude.toString());
        submitData.append('longitude', location.longitude.toString());
      }

      // Add images
      formData.images.forEach((image, index) => {
        submitData.append('images', {
          uri: image.uri,
          type: 'image/jpeg',
          name: `image_${index}.jpg`,
        } as any);
      });

      const result = await submitReview({ projectId, reviewData: submitData });
      
      if (result) {
        Alert.alert(
          'Success!',
          'Your report has been submitted successfully. Thank you for contributing to transparency.',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } else {
        Alert.alert('Error', 'Failed to submit report. Please try again.');
      }
    } catch (error) {
      console.error('Submit error:', error);
      Alert.alert('Error', 'Failed to submit report. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const showImageOptions = () => {
    Alert.alert(
      'Add Image',
      'Choose how you want to add an image',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Camera', onPress: handleCameraPick },
        { text: 'Gallery', onPress: handleImagePick },
      ]
    );
  };

  if (projectLoading) {
    return <LoadingSpinner message="Loading project information..." />;
  }

  if (!project) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={theme.colors.error} />
          <Text style={styles.errorText}>Project not found</Text>
          <Button title="Go Back" onPress={() => navigation.goBack()} />
        </View>
      </SafeAreaView>
    );
  }

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
          {/* Project Info Header */}
          <Card style={styles.projectCard}>
            <View style={styles.projectHeader}>
              <Ionicons name="folder-outline" size={24} color={theme.colors.primary} />
              <View style={styles.projectInfo}>
                <Text style={styles.projectTitle} numberOfLines={2}>
                  {project.budget_subtitle}
                </Text>
                <Text style={styles.projectMeta}>
                  {project.ministry} • {project.fiscal_year}
                </Text>
              </View>
            </View>
          </Card>

          {/* Reporter Information (Optional) */}
          <Card style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="person-outline" size={20} color={theme.colors.primary} />
              <Text style={styles.sectionTitle}>Reporter Information (Optional)</Text>
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Your Name</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Enter your name (optional)"
                value={formData.reporter_name}
                onChangeText={(text) => setFormData(prev => ({ ...prev, reporter_name: text }))}
                returnKeyType="next"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Contact Information</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Phone or email (optional)"
                value={formData.reporter_contact}
                onChangeText={(text) => setFormData(prev => ({ ...prev, reporter_contact: text }))}
                returnKeyType="next"
                keyboardType="email-address"
              />
            </View>
          </Card>

          {/* Report Type */}
          <Card style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="list-outline" size={20} color={theme.colors.primary} />
              <Text style={styles.sectionTitle}>Report Type *</Text>
            </View>
            
            <View style={styles.reviewTypes}>
              {REVIEW_TYPES.map((type) => (
                <TouchableOpacity
                  key={type.key}
                  style={[
                    styles.reviewTypeOption,
                    formData.review_type === type.key && styles.reviewTypeActive
                  ]}
                  onPress={() => setFormData(prev => ({ ...prev, review_type: type.key }))}
                >
                  <Ionicons 
                    name={type.icon as any} 
                    size={24} 
                    color={formData.review_type === type.key ? theme.colors.primary : theme.colors.textSecondary} 
                  />
                  <Text style={[
                    styles.reviewTypeText,
                    formData.review_type === type.key && styles.reviewTypeActiveText
                  ]}>
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Card>

          {/* Work Status */}
          <Card style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="checkmark-circle-outline" size={20} color={theme.colors.primary} />
              <Text style={styles.sectionTitle}>Work Status</Text>
            </View>
            
            <View style={styles.workStatusContainer}>
              <TouchableOpacity
                style={[
                  styles.workStatusOption,
                  !formData.work_completed && styles.workStatusActive
                ]}
                onPress={() => setFormData(prev => ({ ...prev, work_completed: false }))}
              >
                <Ionicons 
                  name="time-outline" 
                  size={20} 
                  color={!formData.work_completed ? theme.colors.primary : theme.colors.textSecondary} 
                />
                <Text style={[
                  styles.workStatusText,
                  !formData.work_completed && styles.workStatusActiveText
                ]}>
                  In Progress
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.workStatusOption,
                  formData.work_completed && styles.workStatusActive
                ]}
                onPress={() => setFormData(prev => ({ ...prev, work_completed: true }))}
              >
                <Ionicons 
                  name="checkmark-circle-outline" 
                  size={20} 
                  color={formData.work_completed ? theme.colors.primary : theme.colors.textSecondary} 
                />
                <Text style={[
                  styles.workStatusText,
                  formData.work_completed && styles.workStatusActiveText
                ]}>
                  Completed
                </Text>
              </TouchableOpacity>
            </View>
          </Card>

          {/* Quality Rating */}
          {showQualityRating && (
            <Card style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="star-outline" size={20} color={theme.colors.primary} />
                <Text style={styles.sectionTitle}>Quality Rating *</Text>
              </View>
              
              <View style={styles.qualityRating}>
                {QUALITY_RATINGS.map((rating) => (
                  <TouchableOpacity
                    key={rating.value}
                    style={[
                      styles.ratingOption,
                      formData.quality_rating === rating.value && styles.ratingActive
                    ]}
                    onPress={() => setFormData(prev => ({ ...prev, quality_rating: rating.value }))}
                  >
                    <View style={[
                      styles.ratingCircle,
                      formData.quality_rating === rating.value && { backgroundColor: rating.color }
                    ]}>
                      <Text style={[
                        styles.ratingNumber,
                        formData.quality_rating === rating.value && styles.ratingNumberActive
                      ]}>
                        {rating.value}
                      </Text>
                    </View>
                    <Text style={styles.ratingLabel}>{rating.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </Card>
          )}

          {/* Description */}
          <Card style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="document-text-outline" size={20} color={theme.colors.primary} />
              <Text style={styles.sectionTitle}>Description *</Text>
            </View>
            
            <Text style={styles.inputLabel}>
              Provide detailed information about your observation
            </Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              placeholder="Describe what you observed at this project site. Be specific about conditions, progress, quality, or any issues you noticed..."
              value={formData.review_text}
              onChangeText={(text) => setFormData(prev => ({ ...prev, review_text: text }))}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
            <Text style={styles.characterCount}>
              {formData.review_text.length}/1000 characters
            </Text>
          </Card>

          {/* Images */}
          <Card style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="camera-outline" size={20} color={theme.colors.primary} />
              <Text style={styles.sectionTitle}>Evidence Photos</Text>
              <Text style={styles.optional}>Optional (Max 5)</Text>
            </View>
            
            <Text style={styles.imageHint}>
              Add photos to support your report. Photos help verify your observations.
            </Text>

            <View style={styles.imageContainer}>
              {formData.images.map((image, index) => (
                <View key={index} style={styles.imagePreview}>
                  <Image source={{ uri: image.uri }} style={styles.previewImage} />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => removeImage(index)}
                  >
                    <Ionicons name="close-circle" size={24} color={theme.colors.error} />
                  </TouchableOpacity>
                </View>
              ))}
              
              {formData.images.length < 5 && (
                <TouchableOpacity style={styles.addImageButton} onPress={showImageOptions}>
                  <Ionicons name="camera-outline" size={24} color={theme.colors.primary} />
                  <Text style={styles.addImageText}>Add Photo</Text>
                </TouchableOpacity>
              )}
            </View>
          </Card>

          {/* Location Status */}
          <Card style={styles.section}>
            <View style={styles.locationInfo}>
              <Ionicons 
                name={location ? "location" : "location-outline"} 
                size={20} 
                color={location ? theme.colors.success : theme.colors.warning} 
              />
              <Text style={styles.locationText}>
                {location 
                  ? "Location captured automatically" 
                  : "Location not available - enable location services for better reporting"
                }
              </Text>
            </View>
          </Card>
        </ScrollView>

        {/* Submit Button */}
        <View style={styles.submitContainer}>
          <Button
            title={isSubmitting ? "Submitting..." : "Submit Report"}
            onPress={handleSubmit}
            disabled={isSubmitting}
            style={styles.submitButton}
          />
          {isSubmitting && (
            <ActivityIndicator 
              size="small" 
              color={theme.colors.primary} 
              style={styles.submitLoader} 
            />
          )}
        </View>
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
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  errorText: {
    fontSize: theme.typography.h3.fontSize,
    color: theme.colors.text,
    marginVertical: theme.spacing.md,
  },
  projectCard: {
    margin: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  projectHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  projectInfo: {
    flex: 1,
    marginLeft: theme.spacing.sm,
  },
  projectTitle: {
    fontSize: theme.typography.h4.fontSize,
    fontWeight: theme.typography.h4.fontWeight,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  projectMeta: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.textSecondary,
  },
  section: {
    margin: theme.spacing.md,
    marginTop: theme.spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.typography.h4.fontSize,
    fontWeight: theme.typography.h4.fontWeight,
    color: theme.colors.text,
    marginLeft: theme.spacing.sm,
    flex: 1,
  },
  optional: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
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
  textInput: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.text,
    backgroundColor: theme.colors.surface,
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  characterCount: {
    fontSize: theme.typography.small.fontSize,
    color: theme.colors.textSecondary,
    textAlign: 'right',
    marginTop: theme.spacing.xs,
  },
  reviewTypes: {
    gap: theme.spacing.sm,
  },
  reviewTypeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.surface,
  },
  reviewTypeActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + '10',
  },
  reviewTypeText: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.textSecondary,
    marginLeft: theme.spacing.md,
    fontWeight: '500',
  },
  reviewTypeActiveText: {
    color: theme.colors.primary,
  },
  workStatusContainer: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  workStatusOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.surface,
  },
  workStatusActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + '10',
  },
  workStatusText: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.textSecondary,
    marginLeft: theme.spacing.sm,
    fontWeight: '500',
  },
  workStatusActiveText: {
    color: theme.colors.primary,
  },
  qualityRating: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.xs,
  },
  ratingOption: {
    flex: 1,
    alignItems: 'center',
    padding: theme.spacing.sm,
  },
  ratingActive: {},
  ratingCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: theme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  ratingNumber: {
    fontSize: theme.typography.body.fontSize,
    fontWeight: 'bold',
    color: theme.colors.textSecondary,
  },
  ratingNumberActive: {
    color: theme.colors.surface,
  },
  ratingLabel: {
    fontSize: theme.typography.small.fontSize,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  imageHint: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
    lineHeight: 18,
  },
  imageContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  imagePreview: {
    position: 'relative',
    width: 80,
    height: 80,
  },
  previewImage: {
    width: 80,
    height: 80,
    borderRadius: theme.borderRadius.md,
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
  },
  addImageButton: {
    width: 80,
    height: 80,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    borderStyle: 'dashed',
    borderRadius: theme.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addImageText: {
    fontSize: theme.typography.small.fontSize,
    color: theme.colors.primary,
    marginTop: theme.spacing.xs,
    textAlign: 'center',
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.textSecondary,
    marginLeft: theme.spacing.sm,
    flex: 1,
  },
  submitContainer: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    flexDirection: 'row',
    alignItems: 'center',
  },
  submitButton: {
    flex: 1,
  },
  submitLoader: {
    marginLeft: theme.spacing.md,
  },
});

export default ReviewSubmissionScreen;