import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { DollarSign, Plus, BarChart3, Settings } from 'lucide-react';

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
      padding: '1rem 0',
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
    }}>
      <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1rem' }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between' 
        }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <h1 style={{ 
              fontSize: '1.5rem', 
              fontWeight: 'bold', 
              color: '#1e293b',
              margin: 0,
              marginRight: '2rem'
            }}>
              💰 Finance Tracker
            </h1>
            
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem',
              fontSize: '0.875rem',
              color: '#6b7280'
            }}>
              <div style={{ 
                width: '8px', 
                height: '8px', 
                borderRadius: '50%', 
                backgroundColor: '#10b981' 
              }}></div>
              <span>Local Data Source</span>
            </div>
          </div>
          
          <nav>
            <div style={{ display: 'flex', gap: '1rem' }}>
              {navItems.map(({ path, label, icon: Icon }) => (
                <Link
                  key={path}
                  to={path}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0.5rem 1rem',
                    borderRadius: '0.5rem',
                    textDecoration: 'none',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    transition: 'all 0.2s',
                    backgroundColor: location.pathname === path ? '#3b82f6' : 'transparent',
                    color: location.pathname === path ? 'white' : '#6b7280',
                    border: location.pathname === path ? 'none' : '1px solid #e5e7eb'
                  }}
                  onMouseEnter={(e) => {
                    if (location.pathname !== path) {
                      e.target.style.backgroundColor = '#f3f4f6';
                      e.target.style.color = '#374151';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (location.pathname !== path) {
                      e.target.style.backgroundColor = 'transparent';
                      e.target.style.color = '#6b7280';
                    }
                  }}
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