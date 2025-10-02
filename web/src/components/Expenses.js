import React, { useState } from 'react';
import { useExpenses } from '../context/ExpenseContext';
import { Search, Filter, Edit, Trash2, Calendar } from 'lucide-react';
import { format } from 'date-fns';

const Expenses = () => {
  const { expenses, categories, deleteExpense, loading, error } = useExpenses();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');

  if (loading) {
    return (
      <div className="text-center">
        <div className="text-lg">Loading expenses...</div>
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

  // Filter and sort expenses
  const filteredExpenses = expenses
    .filter(expense => {
      const matchesSearch = !searchTerm || 
        expense.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        expense.store?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = !selectedCategory || expense.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'date':
          comparison = new Date(a.createdAt) - new Date(b.createdAt);
          break;
        case 'amount':
          comparison = (a.amount || 0) - (b.amount || 0);
          break;
        case 'description':
          comparison = (a.description || '').localeCompare(b.description || '');
          break;
        case 'store':
          comparison = (a.store || '').localeCompare(b.store || '');
          break;
        default:
          comparison = 0;
      }
      
      return sortOrder === 'desc' ? -comparison : comparison;
    });

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      try {
        await deleteExpense(id);
      } catch (err) {
        alert('Failed to delete expense');
      }
    }
  };

  const totalFiltered = filteredExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-bold">Expenses</h2>
        <div className="text-lg text-gray-600">
          {filteredExpenses.length} expenses • R{totalFiltered.toFixed(2)} total
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="form-group">
            <label className="form-label">Search</label>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                className="form-input pl-10"
                placeholder="Search expenses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Category</label>
            <select
              className="form-select"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Sort By</label>
            <select
              className="form-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="date">Date</option>
              <option value="amount">Amount</option>
              <option value="description">Description</option>
              <option value="store">Store</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Order</label>
            <select
              className="form-select"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
            >
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </div>
        </div>
      </div>

      {/* Expenses List */}
      <div className="card">
        {filteredExpenses.length > 0 ? (
          <div className="space-y-2">
            {filteredExpenses.map((expense) => (
              <div key={expense.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                <div className="flex-1">
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="font-medium text-lg">
                        {expense.description || 'No description'}
                      </div>
                      <div className="text-sm text-gray-500 flex items-center gap-4">
                        {expense.store && (
                          <span>📍 {expense.store}</span>
                        )}
                        {expense.category && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                            {expense.category}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Calendar size={12} />
                          {format(new Date(expense.createdAt), 'MMM dd, yyyy')}
                        </span>
                        {expense.source && (
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                            {expense.source}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                    <div className="text-xl font-bold text-red-600">
                      -R{expense.amount?.toFixed(2) || '0.00'}
                    </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 ml-4">
                  <button
                    className="btn btn-secondary"
                    onClick={() => {
                      // TODO: Implement edit functionality
                      alert('Edit functionality coming soon!');
                    }}
                    title="Edit expense"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    className="btn btn-danger"
                    onClick={() => handleDelete(expense.id)}
                    title="Delete expense"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-gray-500 text-lg mb-2">No expenses found</div>
            <div className="text-gray-400">
              {searchTerm || selectedCategory ? 'Try adjusting your filters' : 'Add your first expense to get started'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Expenses;
