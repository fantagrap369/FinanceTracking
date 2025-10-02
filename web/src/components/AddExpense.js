import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useExpenses } from '../context/ExpenseContext';
import { Save, ArrowLeft } from 'lucide-react';

const AddExpense = () => {
  const navigate = useNavigate();
  const { addExpense, categories } = useExpenses();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    store: '',
    category: '',
    notes: '',
    source: 'manual'
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.description || !formData.amount) {
      alert('Please fill in description and amount');
      return;
    }

    setLoading(true);
    try {
      await addExpense({
        ...formData,
        amount: parseFloat(formData.amount)
      });
      
      // Reset form
      setFormData({
        description: '',
        amount: '',
        store: '',
        category: '',
        notes: '',
        source: 'manual'
      });
      
      // Navigate back to expenses
      navigate('/expenses');
    } catch (error) {
      alert('Failed to add expense. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <button
          className="btn btn-secondary"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft size={16} />
          Back
        </button>
        <h2 className="text-3xl font-bold">Add Expense</h2>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="form-group">
              <label className="form-label" htmlFor="description">
                Description *
              </label>
              <input
                type="text"
                id="description"
                name="description"
                className="form-input"
                placeholder="What did you buy?"
                value={formData.description}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="amount">
                Amount *
              </label>
              <input
                type="number"
                id="amount"
                name="amount"
                className="form-input"
                placeholder="0.00"
                step="0.01"
                min="0"
                value={formData.amount}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="store">
                Store/Merchant
              </label>
              <input
                type="text"
                id="store"
                name="store"
                className="form-input"
                placeholder="Where did you buy it?"
                value={formData.store}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="category">
                Category
              </label>
              <select
                id="category"
                name="category"
                className="form-select"
                value={formData.category}
                onChange={handleChange}
              >
                <option value="">Select a category</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            <div className="form-group md:col-span-2">
              <label className="form-label" htmlFor="notes">
                Notes
              </label>
              <textarea
                id="notes"
                name="notes"
                className="form-input"
                rows="3"
                placeholder="Any additional notes..."
                value={formData.notes}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="flex justify-end gap-4 mt-6">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate(-1)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? (
                'Adding...'
              ) : (
                <>
                  <Save size={16} style={{ marginRight: '0.5rem' }} />
                  Add Expense
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Quick Add Examples */}
      <div className="card mt-6">
        <h3 className="text-lg font-bold mb-4">Quick Add Examples</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            className="p-4 border border-gray-200 rounded-lg text-left hover:bg-gray-50"
            onClick={() => setFormData(prev => ({
              ...prev,
              description: 'Coffee',
              amount: '4.50',
              store: 'Starbucks',
              category: 'Food'
            }))}
          >
            <div className="font-medium">☕ Coffee</div>
            <div className="text-sm text-gray-500">R45.00 • Starbucks • Food</div>
          </button>

          <button
            className="p-4 border border-gray-200 rounded-lg text-left hover:bg-gray-50"
            onClick={() => setFormData(prev => ({
              ...prev,
              description: 'Gas',
              amount: '45.00',
              store: 'Shell',
              category: 'Transport'
            }))}
          >
            <div className="font-medium">⛽ Gas</div>
            <div className="text-sm text-gray-500">R450.00 • Shell • Transport</div>
          </button>

          <button
            className="p-4 border border-gray-200 rounded-lg text-left hover:bg-gray-50"
            onClick={() => setFormData(prev => ({
              ...prev,
              description: 'Groceries',
              amount: '85.30',
              store: 'Walmart',
              category: 'Food'
            }))}
          >
            <div className="font-medium">🛒 Groceries</div>
            <div className="text-sm text-gray-500">R853.00 • Pick n Pay • Food</div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddExpense;
