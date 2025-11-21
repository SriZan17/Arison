import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Card from '../common/Card';
import StatusBadge from '../common/StatusBadge';
import ProgressCircle from './ProgressCircle';
import { theme } from '../../styles/theme';
import { Project } from '../../types';

interface ProjectCardProps {
  project: Project;
  onPress: (projectId: string) => void;
  showDistance?: boolean;
  distance?: number;
}

const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  onPress,
  showDistance = false,
  distance,
}) => {
  const formatCurrency = (amount?: number) => {
    if (!amount) return 'Amount not specified';
    return `NPR ${amount.toLocaleString()}`;
  };

  const formatDistance = (km?: number) => {
    if (!km) return '';
    if (km < 1) return `${Math.round(km * 1000)}m away`;
    return `${km.toFixed(1)}km away`;
  };

  return (
    <Card onPress={() => onPress(project.id)} style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.title} numberOfLines={2}>
            {project.procurement_plan.details_of_work}
          </Text>
          <StatusBadge status={project.status} />
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.ministryRow}>
          <Ionicons 
            name="business-outline" 
            size={16} 
            color={theme.colors.textSecondary} 
          />
          <Text style={styles.ministry}>{project.ministry}</Text>
        </View>

        <View style={styles.progressContainer}>
          <ProgressCircle 
            progress={project.progress_percentage}
            size={60}
          />
          <View style={styles.progressInfo}>
            <Text style={styles.progressText}>
              {project.progress_percentage}% Complete
            </Text>
            <Text style={styles.contractor}>
              {project.procurement_plan.contractor_name || 'Contractor TBA'}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <View style={styles.amountContainer}>
          <Ionicons 
            name="cash-outline" 
            size={16} 
            color={theme.colors.success} 
          />
          <Text style={styles.amount}>
            {formatCurrency(project.procurement_plan.contract_amount)}
          </Text>
        </View>

        <View style={styles.rightSection}>
          {showDistance && distance && (
            <View style={styles.distanceContainer}>
              <Ionicons 
                name="location-outline" 
                size={14} 
                color={theme.colors.textSecondary} 
              />
              <Text style={styles.distance}>
                {formatDistance(distance)}
              </Text>
            </View>
          )}

          <View style={styles.reportsContainer}>
            <Ionicons 
              name="chatbubbles-outline" 
              size={14} 
              color={theme.colors.primary} 
            />
            <Text style={styles.reports}>
              {project.citizen_reports_count || 0} Reports
            </Text>
          </View>
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: theme.spacing.md,
  },
  header: {
    marginBottom: theme.spacing.md,
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  title: {
    flex: 1,
    fontSize: theme.typography.h4.fontSize,
    fontWeight: theme.typography.h4.fontWeight,
    color: theme.colors.text,
    marginRight: theme.spacing.sm,
    lineHeight: 22,
  },
  content: {
    marginBottom: theme.spacing.md,
  },
  ministryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  ministry: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.textSecondary,
    marginLeft: theme.spacing.xs,
    fontWeight: '500',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressInfo: {
    marginLeft: theme.spacing.md,
    flex: 1,
  },
  progressText: {
    fontSize: theme.typography.body.fontSize,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  contractor: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.textSecondary,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  amount: {
    fontSize: theme.typography.caption.fontSize,
    fontWeight: '600',
    color: theme.colors.success,
    marginLeft: theme.spacing.xs,
  },
  rightSection: {
    alignItems: 'flex-end',
  },
  distanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  distance: {
    fontSize: theme.typography.small.fontSize,
    color: theme.colors.textSecondary,
    marginLeft: 2,
  },
  reportsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reports: {
    fontSize: theme.typography.small.fontSize,
    color: theme.colors.primary,
    marginLeft: 2,
    fontWeight: '500',
  },
});

export default ProjectCard;