import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import Expenses from './components/Expenses';
import AddExpense from './components/AddExpense';
import RecurringExpenses from './components/RecurringExpenses';
import { ExpenseProvider } from './context/ExpenseContext';

function App() {
  return (
    <ExpenseProvider>
      <Router>
        <div className="App">
          <Header />
          <main className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
                    <Routes>
                      <Route path="/" element={<Dashboard />} />
                      <Route path="/expenses" element={<Expenses />} />
                      <Route path="/add" element={<AddExpense />} />
                      <Route path="/recurring" element={<RecurringExpenses />} />
                    </Routes>
          </main>
        </div>
      </Router>
    </ExpenseProvider>
  );
}

export default App;
