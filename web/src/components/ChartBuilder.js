import React, { useState, useEffect } from 'react';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area, 
  BarChart, Bar, ComposedChart, 
  Legend
} from 'recharts';
import { 
  BarChart3, PieChart as PieChartIcon, TrendingUp, 
  Activity, Settings, Save, X
} from 'lucide-react';
import { useExpenses } from '../context/ExpenseContext';
import { format, subDays, subMonths } from 'date-fns';

const ChartBuilder = () => {
  const { 
    expenses, 
    selectedAccount, 
    getAccountExpenses, 
    getAccountBalance 
  } = useExpenses();

  const [chartConfig, setChartConfig] = useState({
    type: 'area',
    title: 'Custom Chart',
    dataSource: 'balance',
    timePeriod: '7days',
    groupBy: 'day',
    showLegend: true,
    showGrid: true,
    colors: ['#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6'],
    customDateRange: { start: '', end: '' }
  });

  const [savedCharts, setSavedCharts] = useState([]);
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  const chartTypes = [
    { id: 'area', name: 'Area Chart', icon: Activity, description: 'Shows trends over time with filled areas' },
    { id: 'line', name: 'Line Chart', icon: TrendingUp, description: 'Simple line connecting data points' },
    { id: 'bar', name: 'Bar Chart', icon: BarChart3, description: 'Vertical bars comparing values' },
    { id: 'pie', name: 'Pie Chart', icon: PieChartIcon, description: 'Circular chart showing proportions' },
    { id: 'composed', name: 'Composed Chart', icon: Settings, description: 'Combines multiple chart types' }
  ];

  const dataSources = [
    { id: 'balance', name: 'Account Balance', description: 'Running balance over time' },
    { id: 'spending', name: 'Daily Spending', description: 'Amount spent per day' },
    { id: 'income', name: 'Daily Income', description: 'Amount earned per day' },
    { id: 'net', name: 'Net Change', description: 'Daily net change (income - spending)' },
    { id: 'categories', name: 'Category Breakdown', description: 'Spending by category' },
    { id: 'transactions', name: 'Transaction Count', description: 'Number of transactions per day' }
  ];

  const timePeriods = [
    { id: '7days', name: 'Last 7 Days' },
    { id: '1month', name: 'Last Month' },
    { id: '3months', name: 'Last 3 Months' },
    { id: '6months', name: 'Last 6 Months' },
    { id: '1year', name: 'Last Year' },
    { id: 'custom', name: 'Custom Range' }
  ];


  // Load saved charts from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('savedCharts');
    if (saved) {
      setSavedCharts(JSON.parse(saved));
    }
  }, []);

  // Save charts to localStorage
  const saveCharts = (charts) => {
    localStorage.setItem('savedCharts', JSON.stringify(charts));
    setSavedCharts(charts);
  };

  const generateChartData = () => {
    const filteredExpenses = selectedAccount ? getAccountExpenses() : expenses;
    const now = new Date();
    let startDate, endDate = now;
    let intervalDays = 1;

    // Determine date range
    switch (chartConfig.timePeriod) {
      case '7days':
        startDate = subDays(now, 7);
        intervalDays = 1;
        break;
      case '1month':
        startDate = subMonths(now, 1);
        intervalDays = 1;
        break;
      case '3months':
        startDate = subMonths(now, 3);
        intervalDays = 7;
        break;
      case '6months':
        startDate = subMonths(now, 6);
        intervalDays = 14;
        break;
      case '1year':
        startDate = subMonths(now, 12);
        intervalDays = 30;
        break;
      case 'custom':
        if (chartConfig.customDateRange.start && chartConfig.customDateRange.end) {
          startDate = new Date(chartConfig.customDateRange.start);
          endDate = new Date(chartConfig.customDateRange.end);
          const diffDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
          intervalDays = Math.max(1, Math.floor(diffDays / 20));
        } else {
          startDate = subDays(now, 7);
          intervalDays = 1;
        }
        break;
      default:
        startDate = subDays(now, 7);
        intervalDays = 1;
        break;
    }

    const periodExpenses = filteredExpenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate >= startDate && expenseDate <= endDate;
    }).sort((a, b) => new Date(a.date) - new Date(b.date));

    if (chartConfig.dataSource === 'balance') {
      return generateBalanceData(periodExpenses, startDate, endDate, intervalDays);
    } else if (chartConfig.dataSource === 'categories') {
      return generateCategoryData(periodExpenses);
    } else {
      return generateTimeSeriesData(periodExpenses, startDate, endDate, intervalDays);
    }
  };

  const generateBalanceData = (expenses, startDate, endDate, intervalDays) => {
    const accountBalance = getAccountBalance();
    let currentBalance = 0;
    
    // Start with the current balance from CSV if available
    if (accountBalance && accountBalance.currentBalance !== null) {
      currentBalance = accountBalance.currentBalance;
    }

    // Sort expenses by date (newest first for reverse calculation)
    const sortedExpenses = [...expenses].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Create a map of expenses by date for easy lookup
    const expensesByDate = {};
    sortedExpenses.forEach(expense => {
      const dateKey = format(new Date(expense.date), 'yyyy-MM-dd');
      if (!expensesByDate[dateKey]) {
        expensesByDate[dateKey] = [];
      }
      expensesByDate[dateKey].push(expense);
    });

    const chartData = [];
    const current = new Date(endDate);
    
    // Go backwards from today to start date
    while (current >= startDate) {
      const dateKey = format(current, 'yyyy-MM-dd');
      const dayExpenses = expensesByDate[dateKey] || [];
      
      let dayEndBalance = currentBalance;
      let dayChange = 0;
      
      // Check if any transaction has a balance from CSV
      const transactionWithBalance = dayExpenses.find(exp => exp.balance !== null && exp.balance !== undefined);
      
      if (transactionWithBalance && transactionWithBalance.balance !== 0) {
        // Use the balance from CSV (this is the balance after all transactions for this day)
        dayEndBalance = transactionWithBalance.balance;
        console.log(`📊 Using CSV balance for ${dateKey}: ${dayEndBalance}`);
        
        // Calculate the change for this day
        dayChange = dayExpenses.reduce((sum, exp) => {
          const isIncome = exp.category === 'Salary' || (exp.category === 'Transfers' && exp.isIncome);
          return sum + (isIncome ? exp.amount : -exp.amount);
        }, 0);
      } else {
        // Fall back to calculation if no CSV balance available
        console.log(`📊 Calculating balance for ${dateKey} (no CSV balance)`);
        
        // Subtract all transactions that happened on this day
        // (since we're going backwards, we need to reverse the effect)
        dayExpenses.forEach(expense => {
          const isIncome = expense.category === 'Salary' || (expense.category === 'Transfers' && expense.isIncome);
          // Reverse the transaction effect to get the balance before this transaction
          dayEndBalance -= isIncome ? expense.amount : -expense.amount;
        });
        
        // Calculate total change for this day
        dayChange = dayExpenses.reduce((sum, exp) => {
          const isIncome = exp.category === 'Salary' || (exp.category === 'Transfers' && exp.isIncome);
          return sum + (isIncome ? exp.amount : -exp.amount);
        }, 0);
      }

      chartData.unshift({
        date: format(current, intervalDays === 1 ? 'MMM dd' : 'MMM dd'),
        balance: dayEndBalance,
        fullDate: format(current, 'MMM dd, yyyy'),
        change: dayChange,
        transactionCount: dayExpenses.length
      });

      // Update current balance to the start of this day
      currentBalance = dayEndBalance;
      
      // Move to previous day
      current.setDate(current.getDate() - intervalDays);
    }

    return chartData;
  };

  const generateTimeSeriesData = (expenses, startDate, endDate, intervalDays) => {
    const chartData = [];
    const current = new Date(startDate);
    
    while (current <= endDate) {
      const periodEnd = new Date(current);
      periodEnd.setDate(periodEnd.getDate() + intervalDays - 1);
      if (periodEnd > endDate) periodEnd.setTime(endDate.getTime());

      const periodExpenses = expenses.filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate >= current && expenseDate <= periodEnd;
      });

      let value = 0;
      switch (chartConfig.dataSource) {
        case 'spending':
          value = periodExpenses
            .filter(exp => exp.category !== 'Salary' && !(exp.category === 'Transfers' && exp.isIncome))
            .reduce((sum, exp) => sum + exp.amount, 0);
          break;
        case 'income':
          value = periodExpenses
            .filter(exp => exp.category === 'Salary' || (exp.category === 'Transfers' && exp.isIncome))
            .reduce((sum, exp) => sum + exp.amount, 0);
          break;
        case 'net':
          const spending = periodExpenses
            .filter(exp => exp.category !== 'Salary' && !(exp.category === 'Transfers' && exp.isIncome))
            .reduce((sum, exp) => sum + exp.amount, 0);
          const income = periodExpenses
            .filter(exp => exp.category === 'Salary' || (exp.category === 'Transfers' && exp.isIncome))
            .reduce((sum, exp) => sum + exp.amount, 0);
          value = income - spending;
          break;
        case 'transactions':
          value = periodExpenses.length;
          break;
        default:
          value = 0;
          break;
      }

      chartData.push({
        date: format(current, intervalDays === 1 ? 'MMM dd' : 'MMM dd'),
        value: value,
        fullDate: format(current, 'MMM dd, yyyy'),
        count: periodExpenses.length
      });

      current.setDate(current.getDate() + intervalDays);
    }

    return chartData;
  };

  const generateCategoryData = (expenses) => {
    const categoryBreakdown = {};
    
    expenses.forEach(expense => {
      const category = expense.category || 'Uncategorized';
      categoryBreakdown[category] = (categoryBreakdown[category] || 0) + expense.amount;
    });

    return Object.entries(categoryBreakdown).map(([category, amount]) => ({
      name: category,
      value: amount,
      percentage: ((amount / Object.values(categoryBreakdown).reduce((a, b) => a + b, 0)) * 100).toFixed(1)
    }));
  };

  const renderChart = () => {
    const data = generateChartData();
    const commonProps = {
      data,
      margin: { top: 20, right: 30, left: 20, bottom: 5 }
    };

    const formatCurrency = (value) => `R${value.toLocaleString()}`;
    const formatTooltip = (value, name, props) => {
      if (chartConfig.dataSource === 'transactions') {
        return [value, 'Transactions'];
      }
      if (chartConfig.dataSource === 'balance') {
        return [
          formatCurrency(value), 
          `Balance${props.payload.change !== 0 ? ` (${props.payload.change > 0 ? '+' : ''}${formatCurrency(props.payload.change)})` : ''}`
        ];
      }
      return [formatCurrency(value), name];
    };

    switch (chartConfig.type) {
      case 'area':
        return (
          <AreaChart {...commonProps}>
            {chartConfig.showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />}
            <XAxis dataKey="date" stroke="#6b7280" tick={{ fontSize: 12 }} />
            <YAxis stroke="#6b7280" tick={{ fontSize: 12 }} tickFormatter={formatCurrency} />
            <Tooltip formatter={formatTooltip} />
            {chartConfig.showLegend && <Legend />}
            <Area 
              type="monotone" 
              dataKey={chartConfig.dataSource === 'balance' ? 'balance' : 'value'} 
              stroke={chartConfig.colors[0]} 
              fill={chartConfig.colors[0]} 
              fillOpacity={0.6}
            />
          </AreaChart>
        );

      case 'line':
        return (
          <LineChart {...commonProps}>
            {chartConfig.showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />}
            <XAxis dataKey="date" stroke="#6b7280" tick={{ fontSize: 12 }} />
            <YAxis stroke="#6b7280" tick={{ fontSize: 12 }} tickFormatter={formatCurrency} />
            <Tooltip formatter={formatTooltip} />
            {chartConfig.showLegend && <Legend />}
            <Line 
              type="monotone" 
              dataKey={chartConfig.dataSource === 'balance' ? 'balance' : 'value'} 
              stroke={chartConfig.colors[0]} 
              strokeWidth={2}
              dot={{ fill: chartConfig.colors[0], strokeWidth: 2, r: 4 }}
            />
          </LineChart>
        );

      case 'bar':
        return (
          <BarChart {...commonProps}>
            {chartConfig.showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />}
            <XAxis dataKey="date" stroke="#6b7280" tick={{ fontSize: 12 }} />
            <YAxis stroke="#6b7280" tick={{ fontSize: 12 }} tickFormatter={formatCurrency} />
            <Tooltip formatter={formatTooltip} />
            {chartConfig.showLegend && <Legend />}
            <Bar 
              dataKey={chartConfig.dataSource === 'balance' ? 'balance' : 'value'} 
              fill={chartConfig.colors[0]}
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        );

      case 'pie':
        return (
          <PieChart {...commonProps}>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percentage }) => `${name}: ${percentage}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={chartConfig.colors[index % chartConfig.colors.length]} />
              ))}
            </Pie>
            <Tooltip formatter={formatTooltip} />
            {chartConfig.showLegend && <Legend />}
          </PieChart>
        );

      case 'composed':
        return (
          <ComposedChart {...commonProps}>
            {chartConfig.showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />}
            <XAxis dataKey="date" stroke="#6b7280" tick={{ fontSize: 12 }} />
            <YAxis stroke="#6b7280" tick={{ fontSize: 12 }} tickFormatter={formatCurrency} />
            <Tooltip formatter={formatTooltip} />
            {chartConfig.showLegend && <Legend />}
            <Bar dataKey="value" fill={chartConfig.colors[0]} />
            <Line type="monotone" dataKey="balance" stroke={chartConfig.colors[1]} strokeWidth={2} />
          </ComposedChart>
        );

      default:
        return <div>Select a chart type</div>;
    }
  };

  const saveChart = () => {
    const newChart = {
      id: Date.now().toString(),
      ...chartConfig,
      createdAt: new Date().toISOString()
    };
    const updatedCharts = [...savedCharts, newChart];
    saveCharts(updatedCharts);
  };

  const loadChart = (chart) => {
    setChartConfig(chart);
    setIsConfigOpen(false);
  };

  const deleteChart = (chartId) => {
    const updatedCharts = savedCharts.filter(chart => chart.id !== chartId);
    saveCharts(updatedCharts);
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '2rem' 
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold', color: '#1f2937' }}>
            Chart Builder
          </h1>
          <p style={{ margin: '0.5rem 0 0 0', fontSize: '1.125rem', color: '#6b7280' }}>
            Create custom visualizations of your financial data
          </p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button
            onClick={() => setIsConfigOpen(!isConfigOpen)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1rem',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: '500'
            }}
          >
            <Settings size={16} />
            {isConfigOpen ? 'Hide Config' : 'Configure'}
          </button>
          <button
            onClick={saveChart}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1rem',
              backgroundColor: '#22c55e',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: '500'
            }}
          >
            <Save size={16} />
            Save Chart
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isConfigOpen ? '1fr 300px' : '1fr', gap: '2rem' }}>
        {/* Chart Display */}
        <div style={{ 
          backgroundColor: 'white', 
          padding: '1.5rem', 
          borderRadius: '0.75rem', 
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
          border: '1px solid #e5e7eb'
        }}>
          <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.125rem', fontWeight: '600', color: '#1f2937' }}>
            {chartConfig.title}
          </h3>
          <ResponsiveContainer width="100%" height={400}>
            {renderChart()}
          </ResponsiveContainer>
        </div>

        {/* Configuration Panel */}
        {isConfigOpen && (
          <div style={{ 
            backgroundColor: 'white', 
            padding: '1.5rem', 
            borderRadius: '0.75rem', 
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
            border: '1px solid #e5e7eb',
            height: 'fit-content'
          }}>
            <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.125rem', fontWeight: '600', color: '#1f2937' }}>
              Chart Configuration
            </h3>

            {/* Chart Type */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                Chart Type
              </label>
              <div style={{ display: 'grid', gap: '0.5rem' }}>
                {chartTypes.map(type => (
                  <button
                    key={type.id}
                    onClick={() => setChartConfig({ ...chartConfig, type: type.id })}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.75rem',
                      border: chartConfig.type === type.id ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                      borderRadius: '0.5rem',
                      backgroundColor: chartConfig.type === type.id ? '#eff6ff' : 'white',
                      cursor: 'pointer',
                      textAlign: 'left',
                      width: '100%'
                    }}
                  >
                    <type.icon size={20} color={chartConfig.type === type.id ? '#3b82f6' : '#6b7280'} />
                    <div>
                      <div style={{ fontWeight: '500', fontSize: '0.875rem' }}>{type.name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{type.description}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Data Source */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                Data Source
              </label>
              <select
                value={chartConfig.dataSource}
                onChange={(e) => setChartConfig({ ...chartConfig, dataSource: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem'
                }}
              >
                {dataSources.map(source => (
                  <option key={source.id} value={source.id}>
                    {source.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Time Period */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                Time Period
              </label>
              <select
                value={chartConfig.timePeriod}
                onChange={(e) => setChartConfig({ ...chartConfig, timePeriod: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem'
                }}
              >
                {timePeriods.map(period => (
                  <option key={period.id} value={period.id}>
                    {period.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Custom Date Range */}
            {chartConfig.timePeriod === 'custom' && (
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                  Custom Date Range
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <input
                    type="date"
                    value={chartConfig.customDateRange.start}
                    onChange={(e) => setChartConfig({
                      ...chartConfig,
                      customDateRange: { ...chartConfig.customDateRange, start: e.target.value }
                    })}
                    style={{
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem'
                    }}
                  />
                  <input
                    type="date"
                    value={chartConfig.customDateRange.end}
                    onChange={(e) => setChartConfig({
                      ...chartConfig,
                      customDateRange: { ...chartConfig.customDateRange, end: e.target.value }
                    })}
                    style={{
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>
              </div>
            )}

            {/* Chart Title */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                Chart Title
              </label>
              <input
                type="text"
                value={chartConfig.title}
                onChange={(e) => setChartConfig({ ...chartConfig, title: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem'
                }}
              />
            </div>

            {/* Display Options */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                Display Options
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                  <input
                    type="checkbox"
                    checked={chartConfig.showLegend}
                    onChange={(e) => setChartConfig({ ...chartConfig, showLegend: e.target.checked })}
                  />
                  Show Legend
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                  <input
                    type="checkbox"
                    checked={chartConfig.showGrid}
                    onChange={(e) => setChartConfig({ ...chartConfig, showGrid: e.target.checked })}
                  />
                  Show Grid
                </label>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Saved Charts */}
      {savedCharts.length > 0 && (
        <div style={{ marginTop: '2rem' }}>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.125rem', fontWeight: '600', color: '#1f2937' }}>
            Saved Charts
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
            {savedCharts.map(chart => (
              <div
                key={chart.id}
                style={{
                  backgroundColor: 'white',
                  padding: '1rem',
                  borderRadius: '0.5rem',
                  border: '1px solid #e5e7eb',
                  boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <h4 style={{ margin: 0, fontSize: '0.875rem', fontWeight: '600' }}>{chart.title}</h4>
                  <button
                    onClick={() => deleteChart(chart.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#ef4444',
                      padding: '0.25rem'
                    }}
                  >
                    <X size={16} />
                  </button>
                </div>
                <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.75rem', color: '#6b7280' }}>
                  {chartTypes.find(t => t.id === chart.type)?.name} • {dataSources.find(d => d.id === chart.dataSource)?.name}
                </p>
                <button
                  onClick={() => loadChart(chart)}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.375rem',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    fontWeight: '500'
                  }}
                >
                  Load Chart
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChartBuilder;
