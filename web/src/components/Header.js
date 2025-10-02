import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { DollarSign, Plus, BarChart3 } from 'lucide-react';

const Header = () => {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Dashboard', icon: BarChart3 },
    { path: '/expenses', label: 'Expenses', icon: DollarSign },
    { path: '/add', label: 'Add Expense', icon: Plus }
  ];

  return (
    <header style={{ 
      backgroundColor: 'white', 
      borderBottom: '1px solid #e5e7eb',
      padding: '1rem 0'
    }}>
      <div className="container">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold" style={{ color: '#1e293b' }}>
            💰 Finance Tracker
          </h1>
          
          <nav>
            <div className="flex gap-4">
              {navItems.map(({ path, label, icon: Icon }) => (
                <Link
                  key={path}
                  to={path}
                  className={`btn ${
                    location.pathname === path ? 'btn-primary' : 'btn-secondary'
                  }`}
                  style={{ textDecoration: 'none' }}
                >
                  <Icon size={16} style={{ marginRight: '0.5rem' }} />
                  {label}
                </Link>
              ))}
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
