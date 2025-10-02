import React from 'react';
import { CreditCard, ChevronDown } from 'lucide-react';
import { useExpenses } from '../context/ExpenseContext';

const AccountSelector = () => {
  const { accounts, selectedAccount, setSelectedAccount, getAccountBalance } = useExpenses();

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR'
    }).format(amount);
  };

  const accountBalance = getAccountBalance();

  if (accounts.length === 0) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.75rem 1rem',
        backgroundColor: '#f3f4f6',
        borderRadius: '0.5rem',
        color: '#6b7280',
        fontSize: '0.875rem'
      }}>
        <CreditCard size={16} />
        <span>No accounts found</span>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      padding: '0.75rem 1rem',
      backgroundColor: 'white',
      borderRadius: '0.5rem',
      border: '1px solid #e5e7eb',
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
      minWidth: '250px'
    }}>
      <CreditCard size={16} color="#3b82f6" />
      
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '0.875rem', fontWeight: '500', color: '#1f2937' }}>
          {selectedAccount || 'Select Account'}
        </div>
        {accountBalance && (
          <div style={{ fontSize: '0.75rem' }}>
            <div style={{ 
              color: accountBalance.currentBalance >= 0 ? '#22c55e' : '#ef4444',
              fontWeight: '500'
            }}>
              Balance: {formatCurrency(accountBalance.currentBalance)}
            </div>
            {accountBalance.availableBalance !== null && (
              <div style={{ 
                color: '#6b7280',
                fontSize: '0.7rem',
                marginTop: '0.125rem'
              }}>
                Available: {formatCurrency(accountBalance.availableBalance)}
              </div>
            )}
          </div>
        )}
      </div>

      <select
        value={selectedAccount || ''}
        onChange={(e) => setSelectedAccount(e.target.value)}
        style={{
          border: 'none',
          backgroundColor: 'transparent',
          fontSize: '0.875rem',
          color: '#374151',
          cursor: 'pointer',
          outline: 'none',
          appearance: 'none',
          backgroundImage: 'none'
        }}
      >
        {accounts.map(account => (
          <option key={account.name} value={account.name}>
            {account.name}
          </option>
        ))}
      </select>
      
      <ChevronDown size={16} color="#6b7280" />
    </div>
  );
};

export default AccountSelector;
