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

const screenWidth = Dimensions.get('window').width;

const DashboardScreen = ({ navigation }) => {
  const [expenses, setExpenses] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [expensesData, summaryData] = await Promise.all([
        ExpenseService.getExpenses(),
        ExpenseService.getSummary()
      ]);
      setExpenses(expensesData);
      setSummary(summaryData);
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

  const getChartData = () => {
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dayExpenses = expenses.filter(expense => 
        format(new Date(expense.createdAt), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
      );
      const total = dayExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
      last7Days.push({
        date: format(date, 'MMM dd'),
        amount: total
      });
    }
    return last7Days;
  };

  const getCategoryData = () => {
    const categoryTotals = {};
    expenses.forEach(expense => {
      const category = expense.category || 'Other';
      categoryTotals[category] = (categoryTotals[category] || 0) + (expense.amount || 0);
    });

    return Object.entries(categoryTotals).map(([category, amount], index) => ({
      name: category,
      population: amount,
      color: `hsl(${index * 60}, 70%, 50%)`,
      legendFontColor: '#7F7F7F',
      legendFontSize: 12,
    }));
  };

  const chartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: '#3b82f6',
    },
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  const chartData = getChartData();
  const categoryData = getCategoryData();
  const totalSpent = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
  const avgTransaction = expenses.length > 0 ? totalSpent / expenses.length : 0;

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
          <Icon name="attach-money" size={24} color="#059669" />
          <Text style={styles.summaryValue}>R{totalSpent.toFixed(2)}</Text>
          <Text style={styles.summaryLabel}>Total Spent</Text>
        </View>
        
        <View style={styles.summaryCard}>
          <Icon name="receipt" size={24} color="#3b82f6" />
          <Text style={styles.summaryValue}>{expenses.length}</Text>
          <Text style={styles.summaryLabel}>Transactions</Text>
        </View>
      </View>

      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <Icon name="trending-up" size={24} color="#8b5cf6" />
          <Text style={styles.summaryValue}>R{avgTransaction.toFixed(2)}</Text>
          <Text style={styles.summaryLabel}>Avg/Transaction</Text>
        </View>
        
        <View style={styles.summaryCard}>
          <Icon name="today" size={24} color="#f59e0b" />
          <Text style={styles.summaryValue}>
            R{expenses
              .filter(exp => format(new Date(exp.createdAt), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd'))
              .reduce((sum, exp) => sum + (exp.amount || 0), 0)
              .toFixed(2)}
          </Text>
          <Text style={styles.summaryLabel}>Today</Text>
        </View>
      </View>

      {/* 7-Day Spending Chart */}
      {chartData.length > 0 && (
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>7-Day Spending Trend</Text>
          <LineChart
            data={{
              labels: chartData.map(d => d.date),
              datasets: [{
                data: chartData.map(d => d.amount),
                color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
                strokeWidth: 2
              }]
            }}
            width={screenWidth - 32}
            height={220}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
          />
        </View>
      )}

      {/* Category Breakdown */}
      {categoryData.length > 0 && (
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Spending by Category</Text>
          <PieChart
            data={categoryData}
            width={screenWidth - 32}
            height={220}
            chartConfig={chartConfig}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="15"
            style={styles.chart}
          />
        </View>
      )}

      {/* Recent Expenses */}
      <View style={styles.recentContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Expenses</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Expenses')}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>
        
        {expenses.slice(0, 5).map((expense) => (
          <View key={expense.id} style={styles.expenseItem}>
            <View style={styles.expenseInfo}>
              <Text style={styles.expenseDescription}>
                {expense.description || 'No description'}
              </Text>
              <Text style={styles.expenseDetails}>
                {expense.store && `${expense.store} • `}
                {format(new Date(expense.createdAt), 'MMM dd')}
              </Text>
            </View>
            <Text style={styles.expenseAmount}>
              -R{expense.amount?.toFixed(2) || '0.00'}
            </Text>
          </View>
        ))}
        
        {expenses.length === 0 && (
          <View style={styles.emptyState}>
            <Icon name="receipt" size={48} color="#d1d5db" />
            <Text style={styles.emptyText}>No expenses yet</Text>
            <Text style={styles.emptySubtext}>Add your first expense to get started</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 8,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  chartContainer: {
    backgroundColor: 'white',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  chart: {
    borderRadius: 16,
  },
  recentContainer: {
    backgroundColor: 'white',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  seeAllText: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '500',
  },
  expenseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  expenseInfo: {
    flex: 1,
  },
  expenseDescription: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
  },
  expenseDetails: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  expenseAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#dc2626',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 4,
  },
});

export default DashboardScreen;
