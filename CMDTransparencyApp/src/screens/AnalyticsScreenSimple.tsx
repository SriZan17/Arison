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
  monthlyProgress: { month: string; projects: number; completed: number }[];
  reportActivity: { [key: string]: number };
}

const AnalyticsScreen: React.FC = () => {
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'week' | 'month' | 'year'>('month');
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);

  // API calls
  const { data: statistics, loading: statsLoading, refetch: refetchStats } = useStatistics();
  const { data: projects, loading: projectsLoading, refetch: refetchProjects } = useProjects();

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
      generateAnalyticsData();
    }
  }, [projects, statistics, selectedTimeframe]);

  const generateAnalyticsData = () => {
    if (!projects || !statistics) return;

    // Status breakdown
    const statusCounts: { [key: string]: number } = {};
    projects.forEach(project => {
      statusCounts[project.status] = (statusCounts[project.status] || 0) + 1;
    });

    // Ministry breakdown
    const ministryCounts: { [key: string]: number } = {};
    projects.forEach(project => {
      const ministry = project.ministry.length > 20 
        ? project.ministry.substring(0, 20) + '...' 
        : project.ministry;
      ministryCounts[ministry] = (ministryCounts[ministry] || 0) + 1;
    });

    // Monthly progress simulation (using fiscal years)
    const monthlyData = [
      { month: 'Jan', projects: Math.floor(Math.random() * 20) + 10, completed: Math.floor(Math.random() * 15) + 5 },
      { month: 'Feb', projects: Math.floor(Math.random() * 20) + 10, completed: Math.floor(Math.random() * 15) + 5 },
      { month: 'Mar', projects: Math.floor(Math.random() * 20) + 10, completed: Math.floor(Math.random() * 15) + 5 },
      { month: 'Apr', projects: Math.floor(Math.random() * 20) + 10, completed: Math.floor(Math.random() * 15) + 5 },
      { month: 'May', projects: Math.floor(Math.random() * 20) + 10, completed: Math.floor(Math.random() * 15) + 5 },
      { month: 'Jun', projects: Math.floor(Math.random() * 20) + 10, completed: Math.floor(Math.random() * 15) + 5 },
    ];

    // Report activity
    const reportActivity = {
      'Progress Updates': Math.floor(Math.random() * 50) + 20,
      'Quality Issues': Math.floor(Math.random() * 30) + 10,
      'Completions': Math.floor(Math.random() * 25) + 5,
      'Delays': Math.floor(Math.random() * 20) + 5,
      'Fraud Alerts': Math.floor(Math.random() * 10) + 1,
    };

    const totalValue = projects.reduce((sum, project) => 
      sum + (project.procurement_plan.contract_amount || 0), 0
    );

    setAnalyticsData({
      totalProjects: projects.length,
      totalValue,
      avgProgress: Math.round(projects.reduce((sum, p) => sum + p.progress_percentage, 0) / projects.length),
      statusBreakdown: statusCounts,
      ministryBreakdown: ministryCounts,
      monthlyProgress: monthlyData,
      reportActivity,
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

  if (!analyticsData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="analytics-outline" size={64} color={theme.colors.textSecondary} />
          <Text style={styles.errorText}>No analytics data available</Text>
        </View>
      </SafeAreaView>
    );
  }

  const statusChartData = {
    labels: Object.keys(analyticsData.statusBreakdown),
    datasets: [{
      data: Object.values(analyticsData.statusBreakdown),
      color: (opacity = 1) => theme.colors.primary + Math.floor(opacity * 255).toString(16),
      strokeWidth: 2,
    }],
  };

  const monthlyChartData = {
    labels: analyticsData.monthlyProgress.map(d => d.month),
    datasets: [
      {
        data: analyticsData.monthlyProgress.map(d => d.projects),
        color: (opacity = 1) => theme.colors.primary + Math.floor(opacity * 255).toString(16),
        strokeWidth: 3,
      },
      {
        data: analyticsData.monthlyProgress.map(d => d.completed),
        color: (opacity = 1) => theme.colors.success + Math.floor(opacity * 255).toString(16),
        strokeWidth: 3,
      },
    ],
    legend: ['Total Projects', 'Completed'],
  };

  const pieData = Object.entries(analyticsData.statusBreakdown).map(([key, value], index) => ({
    name: key,
    population: value,
    color: [theme.colors.primary, theme.colors.success, theme.colors.warning, theme.colors.error, theme.colors.info][index % 5],
    legendFontColor: theme.colors.text,
    legendFontSize: 12,
  }));

  const reportActivityData = {
    labels: Object.keys(analyticsData.reportActivity).map(label => 
      label.length > 8 ? label.substring(0, 8) + '...' : label
    ),
    datasets: [{
      data: Object.values(analyticsData.reportActivity),
    }],
  };

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
              ৳{(analyticsData.totalValue / 1000000).toFixed(1)}M
            </Text>
            <Text style={styles.metricLabel}>Total Value</Text>
          </Card>

          <Card style={styles.metricCard}>
            <Ionicons name="trending-up-outline" size={32} color={theme.colors.warning} />
            <Text style={styles.metricValue}>{analyticsData.avgProgress}%</Text>
            <Text style={styles.metricLabel}>Avg Progress</Text>
          </Card>

          <Card style={styles.metricCard}>
            <Ionicons name="chatbubbles-outline" size={32} color={theme.colors.info} />
            <Text style={styles.metricValue}>
              {Object.values(analyticsData.reportActivity).reduce((a, b) => a + b, 0)}
            </Text>
            <Text style={styles.metricLabel}>Citizen Reports</Text>
          </Card>
        </View>

        {/* Timeframe Selector */}
        <View style={styles.timeframeContainer}>
          {(['week', 'month', 'year'] as const).map((timeframe) => (
            <TouchableOpacity
              key={timeframe}
              style={[
                styles.timeframeButton,
                selectedTimeframe === timeframe && styles.activeTimeframeButton
              ]}
              onPress={() => setSelectedTimeframe(timeframe)}
            >
              <Text style={[
                styles.timeframeText,
                selectedTimeframe === timeframe && styles.activeTimeframeText
              ]}>
                {timeframe.charAt(0).toUpperCase() + timeframe.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
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

        {/* Monthly Project Progress */}
        <Card style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <Ionicons name="trending-up-outline" size={24} color={theme.colors.primary} />
            <Text style={styles.chartTitle}>Monthly Project Progress</Text>
          </View>
          <LineChart
            data={monthlyChartData}
            width={screenWidth - 60}
            height={220}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
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
            height={220}
            chartConfig={chartConfig}
            verticalLabelRotation={30}
            style={styles.chart}
            showValuesOnTopOfBars
          />
        </Card>

        {/* Citizen Reports Activity */}
        <Card style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <Ionicons name="chatbubble-ellipses-outline" size={24} color={theme.colors.primary} />
            <Text style={styles.chartTitle}>Citizen Report Activity</Text>
          </View>
          <BarChart
            data={reportActivityData}
            width={screenWidth - 60}
            height={220}
            chartConfig={{
              ...chartConfig,
              color: (opacity = 1) => theme.colors.success + Math.floor(opacity * 255).toString(16),
            }}
            verticalLabelRotation={30}
            style={styles.chart}
            showValuesOnTopOfBars
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
  timeframeContainer: {
    flexDirection: 'row',
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.xs,
  },
  timeframeButton: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.sm,
    alignItems: 'center',
  },
  activeTimeframeButton: {
    backgroundColor: theme.colors.primary,
  },
  timeframeText: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  activeTimeframeText: {
    color: theme.colors.surface,
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