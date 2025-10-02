import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Label, Legend } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Receipt, Calendar, CreditCard } from 'lucide-react';
import { useExpenses } from '../context/ExpenseContext';
import { format, subDays, subMonths } from 'date-fns';

const Dashboard = () => {
  const { expenses, summary, loading, fetchExpenses, fetchSummary } = useExpenses();
  const [selectedPeriod, setSelectedPeriod] = useState('7days');
  const [customDateRange, setCustomDateRange] = useState({
    start: '',
    end: ''
  });

  useEffect(() => {
    fetchExpenses();
    fetchSummary();
  }, [fetchExpenses, fetchSummary]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR'
    }).format(amount);
  };

  const getFilteredExpenses = () => {
    const now = new Date();
    let startDate, endDate = now;

    switch (selectedPeriod) {
      case '7days':
        startDate = subDays(now, 7);
        break;
      case '1month':
        startDate = subMonths(now, 1);
        break;
      case '3months':
        startDate = subMonths(now, 3);
        break;
      case 'custom':
        if (customDateRange.start && customDateRange.end) {
          startDate = new Date(customDateRange.start);
          endDate = new Date(customDateRange.end);
        } else {
          startDate = subDays(now, 7);
        }
        break;
      default:
        startDate = subDays(now, 7);
    }

    return expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate >= startDate && expenseDate <= endDate;
    });
  };

  const getChartData = () => {
    const filteredExpenses = getFilteredExpenses();
    const chartData = [];
    const now = new Date();
    let startDate, endDate = now;
    let intervalDays = 1;

    switch (selectedPeriod) {
      case '7days':
        startDate = subDays(now, 7);
        intervalDays = 1;
        break;
      case '1month':
        startDate = subMonths(now, 1);
        intervalDays = 2;
        break;
      case '3months':
        startDate = subMonths(now, 3);
        intervalDays = 7;
        break;
      case 'custom':
        if (customDateRange.start && customDateRange.end) {
          startDate = new Date(customDateRange.start);
          endDate = new Date(customDateRange.end);
          const diffDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
          intervalDays = Math.max(1, Math.floor(diffDays / 20)); // Max 20 data points
        } else {
          startDate = subDays(now, 7);
          intervalDays = 1;
        }
        break;
      default:
        startDate = subDays(now, 7);
        intervalDays = 1;
    }

    const current = new Date(startDate);
    while (current <= endDate) {
      const periodEnd = new Date(current);
      periodEnd.setDate(periodEnd.getDate() + intervalDays - 1);
      if (periodEnd > endDate) periodEnd.setTime(endDate.getTime());

      const periodExpenses = filteredExpenses.filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate >= current && expenseDate <= periodEnd;
      });
      
      const total = periodExpenses.reduce((sum, expense) => sum + expense.amount, 0);
      
      chartData.push({
        date: format(current, intervalDays === 1 ? 'EEE dd' : 'MMM dd'),
        amount: total,
        fullDate: format(current, 'MMM dd, yyyy'),
        count: periodExpenses.length
      });

      current.setDate(current.getDate() + intervalDays);
    }
    
    return chartData;
  };

  const getCategoryData = () => {
    const filteredExpenses = getFilteredExpenses();
    const categoryBreakdown = {};
    
    filteredExpenses.forEach(expense => {
      const category = expense.category || 'Uncategorized';
      categoryBreakdown[category] = (categoryBreakdown[category] || 0) + expense.amount;
    });
    
    const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4'];
    
    return Object.entries(categoryBreakdown).map(([category, amount], index) => ({
      name: category,
      value: amount,
      color: colors[index % colors.length]
    }));
  };

  const getRecentExpenses = () => {
    return getFilteredExpenses()
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5);
  };

  const getMonthlyData = () => {
    const last6Months = [];
    const today = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const month = subMonths(today, i);
      const monthExpenses = expenses.filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate.getMonth() === month.getMonth() && 
               expenseDate.getFullYear() === month.getFullYear();
      });
      
      const total = monthExpenses.reduce((sum, exp) => sum + exp.amount, 0);
      last6Months.push({
        month: format(month, 'MMM'),
        amount: total
      });
    }
    
    return last6Months;
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '400px' 
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            width: '40px', 
            height: '40px', 
            border: '4px solid #f3f4f6', 
            borderTop: '4px solid #3b82f6', 
            borderRadius: '50%', 
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }}></div>
          <p style={{ color: '#6b7280' }}>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem 0' }}>
      {/* Time Period Selector */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '2rem',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <h2 style={{ margin: 0, fontSize: '1.875rem', fontWeight: 'bold', color: '#1f2937' }}>
          Dashboard
        </h2>
        
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Time Period Buttons */}
          <div style={{ display: 'flex', gap: '0.25rem', backgroundColor: '#f3f4f6', padding: '0.25rem', borderRadius: '0.5rem' }}>
            {[
              { value: '7days', label: '7 Days' },
              { value: '1month', label: '1 Month' },
              { value: '3months', label: '3 Months' }
            ].map(period => (
              <button
                key={period.value}
                onClick={() => setSelectedPeriod(period.value)}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '0.375rem',
                  border: 'none',
                  backgroundColor: selectedPeriod === period.value ? '#3b82f6' : 'transparent',
                  color: selectedPeriod === period.value ? 'white' : '#6b7280',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  fontSize: '0.875rem'
                }}
                onMouseOver={(e) => {
                  if (selectedPeriod !== period.value) {
                    e.target.style.backgroundColor = '#e5e7eb';
                  }
                }}
                onMouseOut={(e) => {
                  if (selectedPeriod !== period.value) {
                    e.target.style.backgroundColor = 'transparent';
                  }
                }}
              >
                {period.label}
              </button>
            ))}
          </div>
          
          {/* Custom Date Range */}
          <button
            onClick={() => setSelectedPeriod('custom')}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '0.5rem',
              border: selectedPeriod === 'custom' ? '2px solid #3b82f6' : '1px solid #d1d5db',
              backgroundColor: selectedPeriod === 'custom' ? '#dbeafe' : 'white',
              color: selectedPeriod === 'custom' ? '#1e40af' : '#374151',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s',
              fontSize: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <Calendar size={16} />
            Custom
          </button>
        </div>
      </div>

      {/* Custom Date Range Inputs */}
      {selectedPeriod === 'custom' && (
        <div style={{ 
          display: 'flex', 
          gap: '1rem', 
          marginBottom: '2rem',
          padding: '1rem',
          backgroundColor: '#f9fafb',
          borderRadius: '0.5rem',
          border: '1px solid #e5e7eb',
          flexWrap: 'wrap',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.875rem', fontWeight: '500', color: '#374151' }}>
              From:
            </label>
            <input
              type="date"
              value={customDateRange.start}
              onChange={(e) => setCustomDateRange(prev => ({ ...prev, start: e.target.value }))}
              style={{
                padding: '0.5rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                fontSize: '0.875rem'
              }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.875rem', fontWeight: '500', color: '#374151' }}>
              To:
            </label>
            <input
              type="date"
              value={customDateRange.end}
              onChange={(e) => setCustomDateRange(prev => ({ ...prev, end: e.target.value }))}
              style={{
                padding: '0.5rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                fontSize: '0.875rem'
              }}
            />
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
        gap: '1.5rem', 
        marginBottom: '2rem' 
      }}>
        <div style={{ 
          backgroundColor: 'white', 
          padding: '1.5rem', 
          borderRadius: '0.75rem', 
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
            <div style={{ 
              backgroundColor: '#dbeafe', 
              padding: '0.75rem', 
              borderRadius: '0.5rem',
              marginRight: '1rem'
            }}>
              <DollarSign size={24} color="#3b82f6" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280', fontWeight: '500' }}>
                {selectedPeriod === '7days' ? 'Last 7 Days' : 
                 selectedPeriod === '1month' ? 'Last Month' :
                 selectedPeriod === '3months' ? 'Last 3 Months' :
                 selectedPeriod === 'custom' ? 'Custom Period' : 'Selected Period'}
              </h3>
              <p style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold', color: '#1f2937' }}>
                {formatCurrency(getFilteredExpenses().reduce((sum, expense) => sum + expense.amount, 0))}
              </p>
            </div>
          </div>
          <p style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280' }}>
            {getFilteredExpenses().length} transactions
          </p>
        </div>

        <div style={{ 
          backgroundColor: 'white', 
          padding: '1.5rem', 
          borderRadius: '0.75rem', 
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
            <div style={{ 
              backgroundColor: '#f3f4f6', 
              padding: '0.75rem', 
              borderRadius: '0.5rem',
              marginRight: '1rem'
            }}>
              <Calendar size={24} color="#6b7280" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280', fontWeight: '500' }}>
                Average Transaction
              </h3>
              <p style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold', color: '#1f2937' }}>
                {formatCurrency(getFilteredExpenses().length > 0 ? 
                  getFilteredExpenses().reduce((sum, expense) => sum + expense.amount, 0) / getFilteredExpenses().length : 0)}
              </p>
            </div>
          </div>
          <p style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280' }}>
            {getFilteredExpenses().length} transactions
          </p>
        </div>

        <div style={{ 
          backgroundColor: 'white', 
          padding: '1.5rem', 
          borderRadius: '0.75rem', 
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
            <div style={{ 
              backgroundColor: summary?.change >= 0 ? '#fef2f2' : '#f0fdf4', 
              padding: '0.75rem', 
              borderRadius: '0.5rem',
              marginRight: '1rem'
            }}>
              {summary?.change >= 0 ? (
                <TrendingUp size={24} color="#ef4444" />
              ) : (
                <TrendingDown size={24} color="#22c55e" />
              )}
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280', fontWeight: '500' }}>
                Highest Day
              </h3>
              <p style={{ 
                margin: 0, 
                fontSize: '2rem', 
                fontWeight: 'bold', 
                color: '#1f2937'
              }}>
                {formatCurrency(Math.max(...getChartData().map(d => d.amount), 0))}
              </p>
            </div>
          </div>
          <p style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280' }}>
            {getChartData().length > 0 ? 
              getChartData().find(d => d.amount === Math.max(...getChartData().map(d => d.amount)))?.fullDate || 'N/A' : 
              'No data'}
          </p>
        </div>
      </div>

      {/* Charts Row */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '2fr 1fr', 
        gap: '1.5rem', 
        marginBottom: '2rem' 
      }}>
        {/* 7-Day Trend */}
        <div style={{ 
          backgroundColor: 'white', 
          padding: '1.5rem', 
          borderRadius: '0.75rem', 
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
          border: '1px solid #e5e7eb'
        }}>
          <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.125rem', fontWeight: '600', color: '#1f2937' }}>
            {selectedPeriod === '7days' ? 'Last 7 Days' : 
             selectedPeriod === '1month' ? 'Last Month' :
             selectedPeriod === '3months' ? 'Last 3 Months' :
             selectedPeriod === 'custom' ? 'Custom Period' : 'Spending Trend'}
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={getChartData()}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis 
                dataKey="date" 
                stroke="#6b7280" 
                tick={{ fontSize: 12 }}
                interval={0}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis 
                stroke="#6b7280" 
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => `R${value}`}
              />
              <Tooltip 
                formatter={(value) => [formatCurrency(value), 'Amount']}
                labelFormatter={(label) => `Date: ${label}`}
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.5rem',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="amount" 
                stroke="#3b82f6" 
                strokeWidth={3}
                dot={{ fill: '#3b82f6', strokeWidth: 2, r: 6 }}
                activeDot={{ r: 8, stroke: '#3b82f6', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Category Breakdown */}
        <div style={{ 
          backgroundColor: 'white', 
          padding: '1.5rem', 
          borderRadius: '0.75rem', 
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
          border: '1px solid #e5e7eb'
        }}>
          <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.125rem', fontWeight: '600', color: '#1f2937' }}>
            Spending by Category
          </h3>
          {getCategoryData().length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={getCategoryData()}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {getCategoryData().map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value, name) => [formatCurrency(value), name]}
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.5rem',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Legend 
                  verticalAlign="bottom" 
                  height={36}
                  formatter={(value, entry) => (
                    <span style={{ color: entry.color, fontSize: '0.875rem' }}>
                      {value}
                    </span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              height: '300px',
              color: '#6b7280'
            }}>
              No data available
            </div>
          )}
        </div>
      </div>

      {/* Recent Expenses */}
      <div style={{ 
        backgroundColor: 'white', 
        padding: '1.5rem', 
        borderRadius: '0.75rem', 
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        border: '1px solid #e5e7eb'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '1.5rem' 
        }}>
          <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: '600', color: '#1f2937' }}>
            Recent Expenses
          </h3>
          <a 
            href="/expenses" 
            style={{ 
              color: '#3b82f6', 
              textDecoration: 'none', 
              fontSize: '0.875rem', 
              fontWeight: '500' 
            }}
          >
            View All
          </a>
        </div>
        
        {getRecentExpenses().length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {getRecentExpenses().map((expense) => (
              <div key={expense.id} style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                padding: '1rem',
                backgroundColor: '#f8fafc',
                borderRadius: '0.5rem',
                border: '1px solid #e5e7eb'
              }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <div style={{ 
                    backgroundColor: '#dbeafe', 
                    padding: '0.75rem', 
                    borderRadius: '0.5rem',
                    marginRight: '1rem'
                  }}>
                    <Receipt size={20} color="#3b82f6" />
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: '1rem', fontWeight: '600', color: '#1f2937' }}>
                      {expense.description}
                    </p>
                    <p style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280' }}>
                      {expense.store} • {format(new Date(expense.date), 'MMM dd, yyyy')}
                    </p>
                  </div>
                </div>
                <p style={{ margin: 0, fontSize: '1.125rem', fontWeight: 'bold', color: '#1f2937' }}>
                  {formatCurrency(expense.amount)}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            padding: '3rem',
            color: '#6b7280'
          }}>
            <Receipt size={48} color="#d1d5db" />
            <p style={{ margin: '1rem 0 0.5rem 0', fontSize: '1.125rem', fontWeight: '500' }}>
              No expenses yet
            </p>
            <p style={{ margin: 0, fontSize: '0.875rem' }}>
              Add your first expense to get started
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;