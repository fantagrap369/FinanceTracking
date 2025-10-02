import React from 'react';
import { useExpenses } from '../context/ExpenseContext';
import { DollarSign, TrendingUp, Calendar, CreditCard } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, subMonths } from 'date-fns';

const Dashboard = () => {
  const { summary, loading, error } = useExpenses();

  if (loading) {
    return (
      <div className="text-center">
        <div className="text-lg">Loading dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center">
        <div className="text-red-600">Error: {error}</div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="text-center">
        <div className="text-lg">No data available</div>
      </div>
    );
  }

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

  // Prepare data for charts
  const categoryData = Object.entries(summary.byCategory).map(([category, data]) => ({
    name: category,
    value: data.total,
    count: data.count
  }));

  const monthlyData = Object.entries(summary.byMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6) // Last 6 months
    .map(([month, data]) => ({
      month: format(new Date(month + '-01'), 'MMM yyyy'),
      amount: data.total,
      count: data.count
    }));

  return (
    <div>
      <h2 className="text-3xl font-bold mb-6">Dashboard</h2>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="card">
          <div className="flex items-center">
            <DollarSign className="text-green-600" size={24} />
            <div className="ml-3">
              <div className="text-sm text-gray-500">Total Spent</div>
              <div className="text-2xl font-bold text-green-600">
                R{summary.totalSpent.toFixed(2)}
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <CreditCard className="text-blue-600" size={24} />
            <div className="ml-3">
              <div className="text-sm text-gray-500">Transactions</div>
              <div className="text-2xl font-bold text-blue-600">
                {summary.totalTransactions}
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <TrendingUp className="text-purple-600" size={24} />
            <div className="ml-3">
              <div className="text-sm text-gray-500">Avg per Transaction</div>
              <div className="text-2xl font-bold text-purple-600">
                R{summary.totalTransactions > 0 ? (summary.totalSpent / summary.totalTransactions).toFixed(2) : '0.00'}
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <Calendar className="text-orange-600" size={24} />
            <div className="ml-3">
              <div className="text-sm text-gray-500">This Month</div>
              <div className="text-2xl font-bold text-orange-600">
                R{monthlyData.length > 0 ? monthlyData[monthlyData.length - 1]?.amount.toFixed(2) || '0.00' : '0.00'}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Spending by Category */}
        <div className="card">
          <h3 className="text-xl font-bold mb-4">Spending by Category</h3>
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`R${value.toFixed(2)}`, 'Amount']} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center text-gray-500 py-8">No category data available</div>
          )}
        </div>

        {/* Monthly Spending Trend */}
        <div className="card">
          <h3 className="text-xl font-bold mb-4">Monthly Spending Trend</h3>
          {monthlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => [`R${value.toFixed(2)}`, 'Amount']} />
                <Bar dataKey="amount" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center text-gray-500 py-8">No monthly data available</div>
          )}
        </div>
      </div>

      {/* Recent Expenses */}
      <div className="card mt-6">
        <h3 className="text-xl font-bold mb-4">Recent Expenses</h3>
        {summary.recentExpenses.length > 0 ? (
          <div className="space-y-2">
            {summary.recentExpenses.map((expense) => (
              <div key={expense.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div>
                  <div className="font-medium">{expense.description || 'No description'}</div>
                  <div className="text-sm text-gray-500">
                    {expense.store && `${expense.store} • `}
                    {expense.category && `${expense.category} • `}
                    {format(new Date(expense.createdAt), 'MMM dd, yyyy')}
                  </div>
                </div>
                <div className="text-lg font-bold text-red-600">
                  -R{expense.amount?.toFixed(2) || '0.00'}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-500 py-8">No recent expenses</div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
