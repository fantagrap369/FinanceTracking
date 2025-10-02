import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { format, subDays, subMonths } from 'date-fns';
import ExpenseService from '../services/ExpenseService';
import FailedParsingManager from '../services/FailedParsingManager';

const screenWidth = Dimensions.get('window').width;

const DashboardScreen = ({ navigation }) => {
  const [expenses, setExpenses] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [failedAttemptsCount, setFailedAttemptsCount] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const expenseData = await ExpenseService.getExpenses();
      const summaryData = await ExpenseService.getSpendingSummary();
      const failedAttempts = FailedParsingManager.getAllFailedAttempts();
      
      setExpenses(expenseData);
      setSummary(summaryData);
      setFailedAttemptsCount(failedAttempts.length);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const formatCurrency = (amount) => {
    return `R${amount.toFixed(2)}`;
  };

  const getRecentExpenses = () => {
    return expenses
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5);
  };

  const getChartData = () => {
    const last7Days = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = subDays(today, i);
      const dayExpenses = expenses.filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate.toDateString() === date.toDateString();
      });
      
      const total = dayExpenses.reduce((sum, exp) => sum + exp.amount, 0);
      last7Days.push({
        date: format(date, 'EEE'),
        amount: total
      });
    }
    
    return last7Days;
  };

  const getCategoryData = () => {
    if (!summary?.categoryBreakdown) return [];
    
    const colors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'];
    let colorIndex = 0;
    
    return Object.entries(summary.categoryBreakdown).map(([category, amount]) => ({
      name: category,
      population: amount,
      color: colors[colorIndex++ % colors.length],
      legendFontColor: '#7F7F7F',
      legendFontSize: 12,
    }));
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Summary Cards */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>This Month</Text>
          <Text style={styles.summaryAmount}>
            {formatCurrency(summary?.thisMonth?.total || 0)}
          </Text>
          <Text style={styles.summarySubtext}>
            {summary?.thisMonth?.count || 0} transactions
          </Text>
        </View>
        
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Last Month</Text>
          <Text style={styles.summaryAmount}>
            {formatCurrency(summary?.lastMonth?.total || 0)}
          </Text>
          <Text style={styles.summarySubtext}>
            {summary?.lastMonth?.count || 0} transactions
          </Text>
        </View>
      </View>

      {/* Change Indicator */}
      {summary?.change !== undefined && (
        <View style={styles.changeContainer}>
          <Icon 
            name={summary.change >= 0 ? 'trending-up' : 'trending-down'} 
            size={20} 
            color={summary.change >= 0 ? '#ef4444' : '#22c55e'} 
          />
          <Text style={[
            styles.changeText, 
            { color: summary.change >= 0 ? '#ef4444' : '#22c55e' }
          ]}>
            {summary.change >= 0 ? '+' : ''}{summary.change.toFixed(1)}% from last month
          </Text>
        </View>
      )}

      {/* Charts */}
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Last 7 Days</Text>
        <LineChart
          data={{
            labels: getChartData().map(d => d.date),
            datasets: [{
              data: getChartData().map(d => d.amount),
              color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
              strokeWidth: 2
            }]
          }}
          width={screenWidth - 40}
          height={220}
          chartConfig={{
            backgroundColor: '#ffffff',
            backgroundGradientFrom: '#ffffff',
            backgroundGradientTo: '#ffffff',
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            style: {
              borderRadius: 16
            },
            propsForDots: {
              r: '6',
              strokeWidth: '2',
              stroke: '#3b82f6'
            }
          }}
          style={styles.chart}
        />
      </View>

      {/* Category Breakdown */}
      {getCategoryData().length > 0 && (
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Spending by Category</Text>
          <PieChart
            data={getCategoryData()}
            width={screenWidth - 40}
            height={220}
            chartConfig={{
              color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            }}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="15"
            style={styles.chart}
          />
        </View>
      )}

      {/* Recent Expenses */}
      <View style={styles.recentContainer}>
        <View style={styles.recentHeader}>
          <Text style={styles.recentTitle}>Recent Expenses</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Expenses')}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>
        
        {getRecentExpenses().map((expense, index) => (
          <View key={expense.id} style={styles.recentItem}>
            <View style={styles.recentItemLeft}>
              <View style={styles.recentItemIcon}>
                <Icon name="receipt" size={20} color="#6b7280" />
              </View>
              <View style={styles.recentItemDetails}>
                <Text style={styles.recentItemDescription}>{expense.description}</Text>
                <Text style={styles.recentItemStore}>{expense.store}</Text>
                <Text style={styles.recentItemDate}>
                  {format(new Date(expense.date), 'MMM dd, yyyy')}
                </Text>
              </View>
            </View>
            <Text style={styles.recentItemAmount}>
              {formatCurrency(expense.amount)}
            </Text>
          </View>
        ))}
        
        {getRecentExpenses().length === 0 && (
          <View style={styles.emptyState}>
            <Icon name="receipt" size={48} color="#d1d5db" />
            <Text style={styles.emptyStateText}>No expenses yet</Text>
            <Text style={styles.emptyStateSubtext}>
              Add your first expense to get started
            </Text>
          </View>
        )}
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity 
          style={styles.quickActionButton}
          onPress={() => navigation.navigate('Add')}
        >
          <Icon name="add" size={24} color="#ffffff" />
          <Text style={styles.quickActionText}>Add Expense</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.quickActionButton, styles.secondaryButton]}
          onPress={() => navigation.navigate('Expenses')}
        >
          <Icon name="list" size={24} color="#3b82f6" />
          <Text style={[styles.quickActionText, styles.secondaryButtonText]}>View All</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
  },
  summaryContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  summaryAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  summarySubtext: {
    fontSize: 12,
    color: '#9ca3af',
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  changeText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  chartContainer: {
    backgroundColor: '#ffffff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  chart: {
    borderRadius: 16,
  },
  recentContainer: {
    backgroundColor: '#ffffff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  recentTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  viewAllText: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '500',
  },
  recentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  recentItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  recentItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  recentItemDetails: {
    flex: 1,
  },
  recentItemDescription: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: 2,
  },
  recentItemStore: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 2,
  },
  recentItemDate: {
    fontSize: 12,
    color: '#9ca3af',
  },
  recentItemAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#6b7280',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 4,
  },
  quickActions: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  quickActionButton: {
    flex: 1,
    backgroundColor: '#3b82f6',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  secondaryButton: {
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#3b82f6',
  },
  quickActionText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  secondaryButtonText: {
    color: '#3b82f6',
  },
});

export default DashboardScreen;