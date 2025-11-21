import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  StatusBar,
  Platform,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Image,
  Dimensions,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

// Components
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import LoadingSpinner from '../components/common/LoadingSpinner';
import StatusBadge from '../components/common/StatusBadge';
import ProgressCircle from '../components/project/ProgressCircle';
import FullScreenImageViewer from '../components/common/FullScreenImageViewer';

// Hooks and Services
import { useProject, useProjectReports } from '../hooks/useApi';
import { reviewsApi } from '../services/apiService';
import { openInMaps } from '../utils/mapUtils';

// Types
import { theme } from '../styles/theme';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Project, CitizenReport, ProjectStatus } from '../types';

type ProjectDetailScreenRouteProp = RouteProp<RootStackParamList, 'ProjectDetail'>;
type ProjectDetailScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'ProjectDetail'>;

interface InfoRowProps {
  label: string;
  value: string | number | undefined;
  icon?: string;
}

const InfoRow: React.FC<InfoRowProps> = ({ label, value, icon }) => (
  <View style={styles.infoRow}>
    {icon && <Ionicons name={icon as any} size={20} color={theme.colors.primary} style={styles.infoIcon} />}
    <View style={styles.infoContent}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value || 'Not specified'}</Text>
    </View>
  </View>
);

const ProjectDetailScreen: React.FC = () => {
  const navigation = useNavigation<ProjectDetailScreenNavigationProp>();
  const route = useRoute<ProjectDetailScreenRouteProp>();
  const { projectId } = route.params;

  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'progress' | 'reports'>('details');
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
  const [fullscreenImage, setFullscreenImage] = useState<{
    visible: boolean;
    url: string;
  }>({ visible: false, url: '' });

  // API calls
  const { data: project, loading: projectLoading, error: projectError, refetch: refetchProject } = useProject(projectId);
  const { data: reports, loading: reportsLoading, refetch: refetchReports } = useProjectReports(projectId);

  useEffect(() => {
    if (project) {
      navigation.setOptions({
        title: project.budget_subtitle.length > 30 
          ? project.budget_subtitle.substring(0, 30) + '...' 
          : project.budget_subtitle
      });
    }
  }, [project, navigation]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([refetchProject(), refetchReports()]);
    } catch (error) {
      console.error('Error refreshing:', error);
    }
    setRefreshing(false);
  };

  const handleSubmitReport = () => {
    if (project) {
      navigation.navigate('ReviewSubmission', { projectId: project.id });
    }
  };

  const handleViewLocation = () => {
    if (project?.location) {
      openInMaps({
        lat: project.location.lat,
        lng: project.location.lng
      });
    } else {
      Alert.alert('Location', 'Location information not available for this project.');
    }
  };

  const formatCurrency = (amount?: number) => {
    if (!amount) return 'Not specified';
    return `NPR ${(amount / 1000000).toFixed(1)}M`;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not specified';
    return new Date(dateString).toLocaleDateString();
  };

  const getImageUrl = (photoUrl: string): string => {
    const fullUrl = reviewsApi.getImageUrl(photoUrl);
    console.log('Original photo URL:', photoUrl);
    console.log('Constructed full URL:', fullUrl);
    return fullUrl;
  };

  const handleImageError = (photoUrl: string) => {
    const fullUrl = getImageUrl(photoUrl);
    console.warn('Failed to load image:', fullUrl);
    console.warn('Original photo URL was:', photoUrl);
    setImageErrors(prev => new Set(prev).add(photoUrl));
  };

  const handlePhotoPress = (photoUrl: string, reviewId: string) => {
    const fullImageUrl = getImageUrl(photoUrl);
    console.log('Opening fullscreen image:', fullImageUrl);
    setFullscreenImage({ visible: true, url: fullImageUrl });
  };

  const getStatusColor = (status: ProjectStatus) => {
    switch (status) {
      case ProjectStatus.COMPLETED: return theme.colors.success;
      case ProjectStatus.IN_PROGRESS: return theme.colors.primary;
      case ProjectStatus.DELAYED: return theme.colors.warning;
      case ProjectStatus.DISPUTED: return theme.colors.error;
      default: return theme.colors.textSecondary;
    }
  };

  if (projectLoading && !project) {
    return <LoadingSpinner message="Loading project details..." />;
  }

  if (projectError) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={theme.colors.error} />
          <Text style={styles.errorTitle}>Error Loading Project</Text>
          <Text style={styles.errorText}>{projectError}</Text>
          <Button title="Try Again" onPress={() => refetchProject()} />
        </View>
      </SafeAreaView>
    );
  }

  if (!project) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />
        <View style={styles.errorContainer}>
          <Ionicons name="document-outline" size={48} color={theme.colors.textSecondary} />
          <Text style={styles.errorTitle}>Project Not Found</Text>
          <Text style={styles.errorText}>The requested project could not be found.</Text>
          <Button title="Go Back" onPress={() => navigation.goBack()} />
        </View>
      </SafeAreaView>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'details':
        return (
          <View style={styles.tabContent}>
            {/* Project Overview */}
            <Card style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="information-circle-outline" size={24} color={theme.colors.primary} />
                <Text style={styles.sectionTitle}>Project Overview</Text>
              </View>
              
              <InfoRow label="Ministry" value={project.ministry} icon="business-outline" />
              <InfoRow label="Fiscal Year" value={project.fiscal_year} icon="calendar-outline" />
              <InfoRow label="Project Type" value={project.procurement_plan.project_type} icon="construct-outline" />
              <InfoRow label="Status" value={project.status} />
              <InfoRow label="Progress" value={`${project.progress_percentage}%`} icon="trending-up-outline" />
            </Card>

            {/* Procurement Details */}
            <Card style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="document-text-outline" size={24} color={theme.colors.primary} />
                <Text style={styles.sectionTitle}>Procurement Details</Text>
              </View>
              
              <InfoRow label="Contract Amount" value={formatCurrency(project.procurement_plan.contract_amount)} icon="card-outline" />
              <InfoRow label="Procurement Method" value={project.procurement_plan.procurement_method} icon="settings-outline" />
              <InfoRow label="Contractor" value={project.procurement_plan.contractor_name} icon="people-outline" />
              <InfoRow label="Contract Number" value={project.procurement_plan.contract_number} icon="document-outline" />
              <InfoRow label="Number of Packages" value={project.procurement_plan.no_of_package} icon="cube-outline" />
            </Card>

            {/* Timeline */}
            <Card style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="time-outline" size={24} color={theme.colors.primary} />
                <Text style={styles.sectionTitle}>Project Timeline</Text>
              </View>
              
              <InfoRow label="Date of Approval" value={formatDate(project.procurement_plan.date_of_approval)} icon="checkmark-circle-outline" />
              <InfoRow label="Contract Signing" value={formatDate(project.procurement_plan.date_of_signing_contract)} icon="create-outline" />
              <InfoRow label="Project Initiation" value={formatDate(project.procurement_plan.date_of_initiation)} icon="play-circle-outline" />
              <InfoRow label="Expected Completion" value={formatDate(project.procurement_plan.date_of_completion)} icon="flag-outline" />
            </Card>

            {/* Work Details */}
            <Card style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="hammer-outline" size={24} color={theme.colors.primary} />
                <Text style={styles.sectionTitle}>Work Description</Text>
              </View>
              <Text style={styles.workDescription}>{project.procurement_plan.details_of_work}</Text>
            </Card>
          </View>
        );

      case 'progress':
        return (
          <View style={styles.tabContent}>
            <Card style={styles.section}>
              <View style={styles.progressHeader}>
                <ProgressCircle 
                  percentage={project.progress_percentage} 
                  size={120}
                  strokeWidth={12}
                />
                <View style={styles.progressInfo}>
                  <Text style={styles.progressPercentage}>{project.progress_percentage}%</Text>
                  <Text style={styles.progressLabel}>Complete</Text>
                  <StatusBadge status={project.status} />
                </View>
              </View>
            </Card>

            {/* Progress Timeline */}
            <Card style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="git-commit-outline" size={24} color={theme.colors.primary} />
                <Text style={styles.sectionTitle}>Project Milestones</Text>
              </View>
              
              <View style={styles.timeline}>
                <View style={[styles.timelineItem, { opacity: project.procurement_plan.date_of_approval ? 1 : 0.5 }]}>
                  <View style={[styles.timelineMarker, { backgroundColor: project.procurement_plan.date_of_approval ? theme.colors.success : theme.colors.disabled }]}>
                    <Ionicons name="checkmark" size={16} color="white" />
                  </View>
                  <View style={styles.timelineContent}>
                    <Text style={styles.timelineTitle}>Approved</Text>
                    <Text style={styles.timelineDate}>{formatDate(project.procurement_plan.date_of_approval)}</Text>
                  </View>
                </View>

                <View style={[styles.timelineItem, { opacity: project.procurement_plan.date_of_signing_contract ? 1 : 0.5 }]}>
                  <View style={[styles.timelineMarker, { backgroundColor: project.procurement_plan.date_of_signing_contract ? theme.colors.success : theme.colors.disabled }]}>
                    <Ionicons name="create" size={16} color="white" />
                  </View>
                  <View style={styles.timelineContent}>
                    <Text style={styles.timelineTitle}>Contract Signed</Text>
                    <Text style={styles.timelineDate}>{formatDate(project.procurement_plan.date_of_signing_contract)}</Text>
                  </View>
                </View>

                <View style={[styles.timelineItem, { opacity: project.procurement_plan.date_of_initiation ? 1 : 0.5 }]}>
                  <View style={[styles.timelineMarker, { backgroundColor: project.procurement_plan.date_of_initiation ? theme.colors.success : theme.colors.disabled }]}>
                    <Ionicons name="play" size={16} color="white" />
                  </View>
                  <View style={styles.timelineContent}>
                    <Text style={styles.timelineTitle}>Work Started</Text>
                    <Text style={styles.timelineDate}>{formatDate(project.procurement_plan.date_of_initiation)}</Text>
                  </View>
                </View>

                <View style={[styles.timelineItem, { opacity: project.status === ProjectStatus.COMPLETED ? 1 : 0.5 }]}>
                  <View style={[styles.timelineMarker, { backgroundColor: project.status === ProjectStatus.COMPLETED ? theme.colors.success : theme.colors.disabled }]}>
                    <Ionicons name="flag" size={16} color="white" />
                  </View>
                  <View style={styles.timelineContent}>
                    <Text style={styles.timelineTitle}>Completed</Text>
                    <Text style={styles.timelineDate}>{project.status === ProjectStatus.COMPLETED ? formatDate(project.procurement_plan.date_of_completion) : 'Pending'}</Text>
                  </View>
                </View>
              </View>
            </Card>
          </View>
        );

      case 'reports':
        return (
          <View style={styles.tabContent}>
            <Card style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="chatbubbles-outline" size={24} color={theme.colors.primary} />
                <Text style={styles.sectionTitle}>Citizen Reports</Text>
                <Text style={styles.reportCount}>{project.citizen_reports_count}</Text>
              </View>

              {reportsLoading ? (
                <LoadingSpinner message="Loading reports..." />
              ) : reports && reports.length > 0 ? (
                reports.map((report, index) => (
                  <View key={report.review_id} style={styles.reportItem}>
                    <View style={styles.reportHeader}>
                      <View style={styles.reportType}>
                        <StatusBadge status={report.review_type} />
                      </View>
                      <Text style={styles.reportDate}>{formatDate(report.timestamp)}</Text>
                    </View>
                    <Text style={styles.reportText}>{report.review_text}</Text>
                    
                    {/* Photo Gallery */}
                    {report.photo_urls && report.photo_urls.length > 0 && (
                      <View style={styles.photoSection}>
                        <View style={styles.photoHeader}>
                          <Ionicons name="images-outline" size={16} color={theme.colors.primary} />
                          <Text style={styles.photoHeaderText}>
                            {report.photo_urls.length} Photo{report.photo_urls.length > 1 ? 's' : ''}
                          </Text>
                        </View>
                        <ScrollView 
                          horizontal 
                          showsHorizontalScrollIndicator={false}
                          style={styles.photoScrollView}
                          contentContainerStyle={styles.photoScrollContent}
                        >
                          {report.photo_urls.map((photoUrl, photoIndex) => (
                            <TouchableOpacity 
                              key={photoIndex}
                              style={styles.photoContainer}
                              onPress={() => handlePhotoPress(getImageUrl(photoUrl), report.review_id)}
                            >
                              {imageErrors.has(photoUrl) ? (
                                <View style={styles.imageFallback}>
                                  <Ionicons name="image-outline" size={32} color={theme.colors.textSecondary} />
                                  <Text style={styles.fallbackText}>Image not available</Text>
                                </View>
                              ) : (
                                <Image
                                  source={{ uri: getImageUrl(photoUrl) }}
                                  style={styles.reportPhoto}
                                  resizeMode="cover"
                                  onError={() => handleImageError(photoUrl)}
                                />
                              )}
                              <View style={styles.photoOverlay}>
                                <Ionicons name="expand-outline" size={16} color={theme.colors.surface} />
                              </View>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      </View>
                    )}
                    
                    {report.quality_rating && (
                      <View style={styles.rating}>
                        <Ionicons name="star" size={16} color={theme.colors.warning} />
                        <Text style={styles.ratingText}>{report.quality_rating}/5</Text>
                      </View>
                    )}
                    <View style={styles.reportFooter}>
                      <View style={styles.reportMeta}>
                        <Ionicons 
                          name={report.work_completed ? "checkmark-circle" : "time"} 
                          size={16} 
                          color={report.work_completed ? theme.colors.success : theme.colors.warning} 
                        />
                        <Text style={styles.reportMetaText}>
                          {report.work_completed ? "Work Completed" : "Work In Progress"}
                        </Text>
                      </View>
                      {report.verified && (
                        <View style={styles.verified}>
                          <Ionicons name="shield-checkmark" size={16} color={theme.colors.success} />
                          <Text style={styles.verifiedText}>Verified</Text>
                        </View>
                      )}
                    </View>
                  </View>
                ))
              ) : (
                <View style={styles.emptyState}>
                  <Ionicons name="chatbubble-outline" size={48} color={theme.colors.textSecondary} />
                  <Text style={styles.emptyStateTitle}>No Reports Yet</Text>
                  <Text style={styles.emptyStateText}>Be the first to submit a report for this project.</Text>
                </View>
              )}
            </Card>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />
      
      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Project Header */}
        <Card style={styles.headerCard}>
          <Text style={styles.projectTitle}>{project.budget_subtitle}</Text>
          <View style={styles.headerMeta}>
            <StatusBadge status={project.status} />
            <View style={styles.progressBadge}>
              <Text style={styles.progressBadgeText}>{project.progress_percentage}% Complete</Text>
            </View>
          </View>
        </Card>

        {/* Tab Navigation */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'details' && styles.activeTab]}
            onPress={() => setActiveTab('details')}
          >
            <Ionicons 
              name="information-circle-outline" 
              size={20} 
              color={activeTab === 'details' ? theme.colors.primary : theme.colors.textSecondary} 
            />
            <Text style={[styles.tabText, activeTab === 'details' && styles.activeTabText]}>
              Details
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, activeTab === 'progress' && styles.activeTab]}
            onPress={() => setActiveTab('progress')}
          >
            <Ionicons 
              name="trending-up-outline" 
              size={20} 
              color={activeTab === 'progress' ? theme.colors.primary : theme.colors.textSecondary} 
            />
            <Text style={[styles.tabText, activeTab === 'progress' && styles.activeTabText]}>
              Progress
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, activeTab === 'reports' && styles.activeTab]}
            onPress={() => setActiveTab('reports')}
          >
            <Ionicons 
              name="chatbubbles-outline" 
              size={20} 
              color={activeTab === 'reports' ? theme.colors.primary : theme.colors.textSecondary} 
            />
            <Text style={[styles.tabText, activeTab === 'reports' && styles.activeTabText]}>
              Reports
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        {renderTabContent()}
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <Button
          title="View Location"
          onPress={handleViewLocation}
          variant="outline"
          style={styles.actionButton}
          disabled={!project.location}
        />
        <Button
          title="Submit Report"
          onPress={handleSubmitReport}
          style={styles.actionButton}
        />
      </View>
      
      {/* Fullscreen Image Viewer */}
      <FullScreenImageViewer
        visible={fullscreenImage.visible}
        imageUrl={fullscreenImage.url}
        onClose={() => setFullscreenImage({ visible: false, url: '' })}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
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
  errorTitle: {
    fontSize: theme.typography.h3.fontSize,
    fontWeight: theme.typography.h3.fontWeight,
    color: theme.colors.text,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  errorText: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  headerCard: {
    margin: theme.spacing.md,
    marginBottom: 0,
  },
  projectTitle: {
    fontSize: theme.typography.h2.fontSize,
    fontWeight: theme.typography.h2.fontWeight,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
    lineHeight: theme.typography.h2.lineHeight,
  },
  headerMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  progressBadge: {
    backgroundColor: theme.colors.primary + '15',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.md,
  },
  progressBadgeText: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    marginHorizontal: theme.spacing.md,
    marginTop: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.xs,
    ...theme.shadows.sm,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  activeTab: {
    backgroundColor: theme.colors.primary + '10',
  },
  tabText: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.textSecondary,
    marginLeft: theme.spacing.xs,
    fontWeight: '500',
  },
  activeTabText: {
    color: theme.colors.primary,
  },
  tabContent: {
    padding: theme.spacing.md,
    paddingTop: 0,
  },
  section: {
    marginBottom: theme.spacing.md,
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
  reportCount: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.textSecondary,
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
    fontWeight: '600',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
    paddingBottom: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  infoIcon: {
    marginTop: 2,
    marginRight: theme.spacing.sm,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  infoValue: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.text,
    fontWeight: '500',
  },
  workDescription: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.text,
    lineHeight: 24,
    textAlign: 'justify',
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressInfo: {
    alignItems: 'center',
    flex: 1,
    marginLeft: theme.spacing.lg,
  },
  progressPercentage: {
    fontSize: theme.typography.h1.fontSize,
    fontWeight: theme.typography.h1.fontWeight,
    color: theme.colors.primary,
    marginBottom: theme.spacing.xs,
  },
  progressLabel: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
  },
  timeline: {
    paddingLeft: theme.spacing.md,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
    position: 'relative',
  },
  timelineMarker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.success,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  timelineContent: {
    flex: 1,
    paddingTop: theme.spacing.xs,
  },
  timelineTitle: {
    fontSize: theme.typography.body.fontSize,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  timelineDate: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.textSecondary,
  },
  reportItem: {
    marginBottom: theme.spacing.md,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  reportType: {},
  reportDate: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.textSecondary,
  },
  reportText: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.text,
    lineHeight: 22,
    marginBottom: theme.spacing.sm,
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  ratingText: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.warning,
    marginLeft: theme.spacing.xs,
    fontWeight: '600',
  },
  reportFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reportMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reportMetaText: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.textSecondary,
    marginLeft: theme.spacing.xs,
  },
  verified: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  verifiedText: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.success,
    marginLeft: theme.spacing.xs,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
  },
  emptyStateTitle: {
    fontSize: theme.typography.h4.fontSize,
    fontWeight: theme.typography.h4.fontWeight,
    color: theme.colors.text,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  emptyStateText: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  // Photo Gallery Styles
  photoSection: {
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  photoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  photoHeaderText: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.primary,
    fontWeight: '600',
    marginLeft: theme.spacing.xs,
  },
  photoScrollView: {
    marginHorizontal: -theme.spacing.xs,
  },
  photoScrollContent: {
    paddingHorizontal: theme.spacing.xs,
  },
  photoContainer: {
    position: 'relative',
    marginRight: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  reportPhoto: {
    width: 80,
    height: 80,
    borderRadius: theme.borderRadius.md,
  },
  photoOverlay: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: theme.colors.primary + '80',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageFallback: {
    width: 80,
    height: 80,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xs,
  },
  fallbackText: {
    fontSize: theme.typography.small.fontSize,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: theme.spacing.xs,
  },
  actionButtons: {
    flexDirection: 'row',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    gap: theme.spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
});

export default ProjectDetailScreen;