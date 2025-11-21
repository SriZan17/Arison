import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  StatusBar,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BarChart, PieChart, LineChart, ContributionGraph } from 'react-native-chart-kit';

// Components
import Card from '../components/common/Card';
import LoadingSpinner from '../components/common/LoadingSpinner';

// Hooks and Services
import { useStatistics, useProjects } from '../hooks/useApi';

// Types and Theme
import { theme } from '../styles/theme';
import { Project, ProjectStatus } from '../types';

const { width: screenWidth } = Dimensions.get('window');

interface ChartConfig {
  backgroundColor: string;
  backgroundGradientFrom: string;
  backgroundGradientTo: string;
  decimalPlaces: 0;
  color: (opacity?: number) => string;
  labelColor: (opacity?: number) => string;
  style: {
    borderRadius: number;
  };
  propsForDots: {
    r: string;
    strokeWidth: string;
    stroke: string;
  };
}

interface AnalyticsData {
  totalProjects: number;
  totalValue: number;
  avgProgress: number;
  statusBreakdown: { [key: string]: number };
  ministryBreakdown: { [key: string]: number };
}

const AnalyticsScreen: React.FC = () => {
  const [refreshing, setRefreshing] = useState(false);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);

  // API calls
  const { data: statistics, loading: statsLoading, refetch: refetchStats } = useStatistics();
  const { data: projects, loading: projectsLoading, refetch: refetchProjects } = useProjects();

  // Debug API responses
  useEffect(() => {
    console.log('Analytics Debug - Statistics loading:', statsLoading);
    console.log('Analytics Debug - Projects loading:', projectsLoading);
    console.log('Analytics Debug - Statistics data:', statistics);
    console.log('Analytics Debug - Projects data:', projects ? `${projects.length} projects` : 'No projects');
  }, [statistics, projects, statsLoading, projectsLoading]);

  const chartConfig: ChartConfig = {
    backgroundColor: theme.colors.surface,
    backgroundGradientFrom: theme.colors.surface,
    backgroundGradientTo: theme.colors.surface,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
    labelColor: (opacity = 1) => theme.colors.text + Math.floor(opacity * 255).toString(16),
    style: {
      borderRadius: theme.borderRadius.lg,
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: theme.colors.primary,
    },
  };

  useEffect(() => {
    if (projects && statistics) {
      console.log('Analytics Debug - Statistics:', statistics);
      console.log('Analytics Debug - Projects count:', projects.length);
      console.log('Analytics Debug - Status breakdown:', statistics.status_breakdown);
      generateAnalyticsData();
    }
  }, [projects, statistics]);

  const generateAnalyticsData = () => {
    if (!projects || !statistics) return;

    // Use status breakdown from backend statistics if available, otherwise calculate from projects
    const statusCounts = statistics.status_breakdown && Object.keys(statistics.status_breakdown).length > 0
      ? statistics.status_breakdown
      : projects.reduce((acc, project) => {
          acc[project.status] = (acc[project.status] || 0) + 1;
          return acc;
        }, {} as { [key: string]: number });

    // Ministry breakdown from projects
    const ministryCounts: { [key: string]: number } = {};
    projects.forEach(project => {
      const ministry = project.ministry.length > 20 
        ? project.ministry.substring(0, 20) + '...' 
        : project.ministry;
      ministryCounts[ministry] = (ministryCounts[ministry] || 0) + 1;
    });

    // Use backend statistics data
    setAnalyticsData({
      totalProjects: statistics.total_projects,
      totalValue: statistics.total_contract_value,
      avgProgress: Math.round(statistics.average_progress),
      statusBreakdown: statusCounts,
      ministryBreakdown: ministryCounts,
    });
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchStats(), refetchProjects()]);
    setRefreshing(false);
  };

  if (statsLoading || projectsLoading) {
    return <LoadingSpinner message="Loading analytics..." />;
  }

  if (!statistics && !projects) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="analytics-outline" size={64} color={theme.colors.textSecondary} />
          <Text style={styles.errorText}>Failed to load analytics data</Text>
          <Text style={styles.errorText}>Stats Loading: {statsLoading ? 'Yes' : 'No'}</Text>
          <Text style={styles.errorText}>Projects Loading: {projectsLoading ? 'Yes' : 'No'}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!analyticsData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="analytics-outline" size={64} color={theme.colors.textSecondary} />
          <Text style={styles.errorText}>No analytics data available</Text>
          <Text style={styles.errorText}>Statistics: {statistics ? 'Available' : 'Missing'}</Text>
          <Text style={styles.errorText}>Projects: {projects ? `${projects.length} found` : 'Missing'}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const statusChartData = {
    labels: Object.keys(analyticsData.statusBreakdown).length > 0 
      ? Object.keys(analyticsData.statusBreakdown).map(label => 
          label.length > 10 ? label.substring(0, 10) + '...' : label
        )
      : ['No Data'],
    datasets: [{
      data: Object.keys(analyticsData.statusBreakdown).length > 0 ? Object.values(analyticsData.statusBreakdown) : [1],
      color: (opacity = 1) => theme.colors.primary + Math.floor(opacity * 255).toString(16),
      strokeWidth: 2,
    }],
  };

  const pieData = Object.keys(analyticsData.statusBreakdown).length > 0 
    ? Object.entries(analyticsData.statusBreakdown).map(([key, value], index) => ({
        name: key,
        population: value,
        color: [theme.colors.primary, theme.colors.success, theme.colors.warning, theme.colors.error, theme.colors.accent][index % 5],
        legendFontColor: theme.colors.text,
        legendFontSize: 12,
      }))
    : [{
        name: 'No Data',
        population: 1,
        color: theme.colors.disabled,
        legendFontColor: theme.colors.text,
        legendFontSize: 12,
      }];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />
      
      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Analytics Dashboard</Text>
          <Text style={styles.subtitle}>Government Project Insights</Text>
        </View>

        {/* Key Metrics */}
        <View style={styles.metricsContainer}>
          <Card style={styles.metricCard}>
            <Ionicons name="folder-outline" size={32} color={theme.colors.primary} />
            <Text style={styles.metricValue}>{analyticsData.totalProjects}</Text>
            <Text style={styles.metricLabel}>Total Projects</Text>
          </Card>

          <Card style={styles.metricCard}>
            <Ionicons name="cash-outline" size={32} color={theme.colors.success} />
            <Text style={styles.metricValue}>
              NPR {(analyticsData.totalValue / 1000000).toFixed(1)}M
            </Text>
            <Text style={styles.metricLabel}>Total Value</Text>
          </Card>

          <Card style={styles.metricCard}>
            <Ionicons name="trending-up-outline" size={32} color={theme.colors.warning} />
            <Text style={styles.metricValue}>{analyticsData.avgProgress}%</Text>
            <Text style={styles.metricLabel}>Avg Progress</Text>
          </Card>

          <Card style={styles.metricCard}>
            <Ionicons name="chatbubbles-outline" size={32} color={theme.colors.accent} />
            <Text style={styles.metricValue}>
              {statistics?.total_citizen_reports || 0}
            </Text>
            <Text style={styles.metricLabel}>Citizen Reports</Text>
          </Card>
        </View>

        {/* Project Status Distribution */}
        <Card style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <Ionicons name="pie-chart-outline" size={24} color={theme.colors.primary} />
            <Text style={styles.chartTitle}>Project Status Distribution</Text>
          </View>
          <PieChart
            data={pieData}
            width={screenWidth - 60}
            height={220}
            chartConfig={chartConfig}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="15"
            absolute
          />
        </Card>

        {/* Project Status Bar Chart */}
        <Card style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <Ionicons name="bar-chart-outline" size={24} color={theme.colors.primary} />
            <Text style={styles.chartTitle}>Projects by Status</Text>
          </View>
          <BarChart
            data={statusChartData}
            width={screenWidth - 60}
            height={250}
            chartConfig={chartConfig}
            verticalLabelRotation={0}
            style={styles.chart}
            showValuesOnTopOfBars
            yAxisLabel=""
            yAxisSuffix=""
          />
        </Card>

        {/* Ministry Breakdown */}
        <Card style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <Ionicons name="business-outline" size={24} color={theme.colors.primary} />
            <Text style={styles.chartTitle}>Top Ministries by Project Count</Text>
          </View>
          <View style={styles.ministryList}>
            {Object.entries(analyticsData.ministryBreakdown)
              .sort(([,a], [,b]) => b - a)
              .slice(0, 5)
              .map(([ministry, count], index) => (
                <View key={ministry} style={styles.ministryItem}>
                  <View style={styles.ministryInfo}>
                    <Text style={styles.ministryRank}>#{index + 1}</Text>
                    <Text style={styles.ministryName}>{ministry}</Text>
                  </View>
                  <Text style={styles.ministryCount}>{count}</Text>
                </View>
              ))
            }
          </View>
        </Card>
      </ScrollView>
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
  header: {
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.primary,
  },
  title: {
    fontSize: theme.typography.h1.fontSize,
    fontWeight: theme.typography.h1.fontWeight,
    color: theme.colors.surface,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.surface,
    opacity: 0.9,
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
    marginTop: theme.spacing.md,
    textAlign: 'center',
  },
  metricsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  metricCard: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  metricValue: {
    fontSize: theme.typography.h2.fontSize,
    fontWeight: theme.typography.h2.fontWeight,
    color: theme.colors.text,
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  metricLabel: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  chartCard: {
    margin: theme.spacing.md,
    padding: theme.spacing.lg,
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  chartTitle: {
    fontSize: theme.typography.h3.fontSize,
    fontWeight: theme.typography.h3.fontWeight,
    color: theme.colors.text,
    marginLeft: theme.spacing.sm,
  },
  chart: {
    borderRadius: theme.borderRadius.md,
  },
  ministryList: {
    gap: theme.spacing.sm,
  },
  ministryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.sm,
  },
  ministryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  ministryRank: {
    fontSize: theme.typography.body.fontSize,
    fontWeight: 'bold',
    color: theme.colors.primary,
    width: 30,
  },
  ministryName: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.text,
    flex: 1,
  },
  ministryCount: {
    fontSize: theme.typography.h4.fontSize,
    fontWeight: theme.typography.h4.fontWeight,
    color: theme.colors.primary,
  },
});

export default AnalyticsScreen;