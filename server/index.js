const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs-extra');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data', 'expenses.json');

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../web/dist')));

// Ensure data directory exists
fs.ensureDirSync(path.dirname(DATA_FILE));

// Initialize data file if it doesn't exist
if (!fs.existsSync(DATA_FILE)) {
  fs.writeJsonSync(DATA_FILE, {
    expenses: [],
    categories: ['Food', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Other'],
    lastUpdated: new Date().toISOString()
  });
}

// Helper function to read data
const readData = () => {
  try {
    return fs.readJsonSync(DATA_FILE);
  } catch (error) {
    console.error('Error reading data file:', error);
    return { expenses: [], categories: [], lastUpdated: new Date().toISOString() };
  }
};

// Helper function to write data
const writeData = (data) => {
  try {
    data.lastUpdated = new Date().toISOString();
    fs.writeJsonSync(DATA_FILE, data, { spaces: 2 });
    return true;
  } catch (error) {
    console.error('Error writing data file:', error);
    return false;
  }
};

// Routes

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Get all expenses
app.get('/api/expenses', (req, res) => {
  const data = readData();
  res.json(data.expenses);
});

// Add new expense
app.post('/api/expenses', (req, res) => {
  const data = readData();
  const newExpense = {
    id: Date.now().toString(),
    ...req.body,
    createdAt: new Date().toISOString(),
    source: req.body.source || 'manual'
  };
  
  data.expenses.push(newExpense);
  
  if (writeData(data)) {
    res.status(201).json(newExpense);
  } else {
    res.status(500).json({ error: 'Failed to save expense' });
  }
});

// Update expense
app.put('/api/expenses/:id', (req, res) => {
  const data = readData();
  const expenseIndex = data.expenses.findIndex(exp => exp.id === req.params.id);
  
  if (expenseIndex === -1) {
    return res.status(404).json({ error: 'Expense not found' });
  }
  
  data.expenses[expenseIndex] = {
    ...data.expenses[expenseIndex],
    ...req.body,
    updatedAt: new Date().toISOString()
  };
  
  if (writeData(data)) {
    res.json(data.expenses[expenseIndex]);
  } else {
    res.status(500).json({ error: 'Failed to update expense' });
  }
});

// Delete expense
app.delete('/api/expenses/:id', (req, res) => {
  const data = readData();
  const expenseIndex = data.expenses.findIndex(exp => exp.id === req.params.id);
  
  if (expenseIndex === -1) {
    return res.status(404).json({ error: 'Expense not found' });
  }
  
  data.expenses.splice(expenseIndex, 1);
  
  if (writeData(data)) {
    res.json({ success: true });
  } else {
    res.status(500).json({ error: 'Failed to delete expense' });
  }
});

// Get categories
app.get('/api/categories', (req, res) => {
  const data = readData();
  res.json(data.categories);
});

// Get spending summary
app.get('/api/summary', (req, res) => {
  const data = readData();
  const expenses = data.expenses;
  
  const summary = {
    totalSpent: expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0),
    totalTransactions: expenses.length,
    byCategory: {},
    byMonth: {},
    recentExpenses: expenses
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 10)
  };
  
  // Group by category
  expenses.forEach(expense => {
    const category = expense.category || 'Other';
    if (!summary.byCategory[category]) {
      summary.byCategory[category] = { count: 0, total: 0 };
    }
    summary.byCategory[category].count++;
    summary.byCategory[category].total += expense.amount || 0;
  });
  
  // Group by month
  expenses.forEach(expense => {
    const month = new Date(expense.createdAt).toISOString().substring(0, 7);
    if (!summary.byMonth[month]) {
      summary.byMonth[month] = { count: 0, total: 0 };
    }
    summary.byMonth[month].count++;
    summary.byMonth[month].total += expense.amount || 0;
  });
  
  res.json(summary);
});

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../web/dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Data file: ${DATA_FILE}`);
});
