import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Trash2, AlertTriangle, CheckCircle, Database, RefreshCw, Plus, Edit2, X, Save } from 'lucide-react';
import { useExpenses } from '../context/ExpenseContext';

const Settings = () => {
  const { refreshData, accounts } = useExpenses();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState(false);
  
  // Merchants and patterns management
  const [merchants, setMerchants] = useState({});
  const [patterns, setPatterns] = useState({});
  const [editingMerchant, setEditingMerchant] = useState(null);
  const [editingPattern, setEditingPattern] = useState(null);
  const [newMerchant, setNewMerchant] = useState({ name: '', category: '', group: '' });
  const [newPattern, setNewPattern] = useState({ category: '', keyword: '' });
  const [activeTab, setActiveTab] = useState('overview');

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR'
    }).format(amount);
  };

  // Load merchants and patterns data
  useEffect(() => {
    loadMerchants();
    loadPatterns();
  }, []);

  const loadMerchants = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/merchants');
      if (response.ok) {
        const data = await response.json();
        setMerchants(data.merchants);
      }
    } catch (error) {
      console.error('Error loading merchants:', error);
    }
  };

  const loadPatterns = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/categorization-patterns');
      if (response.ok) {
        const data = await response.json();
        setPatterns(data.patterns);
      }
    } catch (error) {
      console.error('Error loading patterns:', error);
    }
  };

  const saveMerchants = async (updatedMerchants) => {
    try {
      const response = await fetch('http://localhost:3001/api/merchants', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ merchants: updatedMerchants })
      });
      if (response.ok) {
        setMerchants(updatedMerchants);
        return true;
      }
    } catch (error) {
      console.error('Error saving merchants:', error);
    }
    return false;
  };

  const savePatterns = async (updatedPatterns) => {
    try {
      const response = await fetch('http://localhost:3001/api/categorization-patterns', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patterns: updatedPatterns })
      });
      if (response.ok) {
        setPatterns(updatedPatterns);
        return true;
      }
    } catch (error) {
      console.error('Error saving patterns:', error);
    }
    return false;
  };

  const addMerchant = async () => {
    if (!newMerchant.name || !newMerchant.category || !newMerchant.group) return;
    
    const updatedMerchants = { ...merchants };
    if (!updatedMerchants[newMerchant.group]) {
      updatedMerchants[newMerchant.group] = {};
    }
    updatedMerchants[newMerchant.group][newMerchant.name] = newMerchant.category;
    
    if (await saveMerchants(updatedMerchants)) {
      setNewMerchant({ name: '', category: '', group: '' });
    }
  };

  const addPattern = async () => {
    if (!newPattern.category || !newPattern.keyword) return;
    
    const updatedPatterns = { ...patterns };
    if (!updatedPatterns[newPattern.category]) {
      updatedPatterns[newPattern.category] = { keywords: [], description: '' };
    }
    if (!updatedPatterns[newPattern.category].keywords) {
      updatedPatterns[newPattern.category].keywords = [];
    }
    updatedPatterns[newPattern.category].keywords.push(newPattern.keyword);
    
    if (await savePatterns(updatedPatterns)) {
      setNewPattern({ category: '', keyword: '' });
    }
  };

  const removeMerchant = async (group, merchantName) => {
    const updatedMerchants = { ...merchants };
    if (updatedMerchants[group] && updatedMerchants[group][merchantName]) {
      delete updatedMerchants[group][merchantName];
      if (Object.keys(updatedMerchants[group]).length === 0) {
        delete updatedMerchants[group];
      }
      await saveMerchants(updatedMerchants);
    }
  };

  const removePattern = async (category, keyword) => {
    const updatedPatterns = { ...patterns };
    if (updatedPatterns[category] && updatedPatterns[category].keywords) {
      updatedPatterns[category].keywords = updatedPatterns[category].keywords.filter(k => k !== keyword);
      if (updatedPatterns[category].keywords.length === 0) {
        delete updatedPatterns[category];
      }
      await savePatterns(updatedPatterns);
    }
  };

  const handleDeleteAllData = async () => {
    setIsDeleting(true);
    try {
      // Call the API to delete all data
      const response = await fetch('http://localhost:3001/api/expenses/delete-all', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setDeleteSuccess(true);
        // Refresh the data to reflect the changes
        await refreshData();
        // Hide success message after 3 seconds
        setTimeout(() => {
          setDeleteSuccess(false);
        }, 3000);
      } else {
        throw new Error('Failed to delete data');
      }
    } catch (error) {
      console.error('Error deleting data:', error);
      alert('Failed to delete data. Please try again.');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const getTotalAccounts = () => {
    return accounts.length;
  };

  const getTotalTransactions = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/expenses');
      const expenses = await response.json();
      return expenses.length;
    } catch (error) {
      return 0;
    }
  };

  return (
    <div style={{ padding: '2rem 0' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold', color: '#1f2937' }}>
          Settings
        </h1>
        <p style={{ margin: '0.5rem 0 0 0', fontSize: '1.125rem', color: '#6b7280' }}>
          Manage your application settings and data
        </p>
      </div>

      {/* Tab Navigation */}
      <div style={{ 
        backgroundColor: 'white', 
        padding: '0.5rem', 
        borderRadius: '0.75rem', 
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        border: '1px solid #e5e7eb',
        marginBottom: '2rem'
      }}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'merchants', label: 'Merchants' },
            { id: 'patterns', label: 'Categories' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '0.75rem 1.5rem',
                borderRadius: '0.5rem',
                border: 'none',
                backgroundColor: activeTab === tab.id ? '#3b82f6' : 'transparent',
                color: activeTab === tab.id ? 'white' : '#6b7280',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <>
          {/* Data Overview */}
          <div style={{ 
            backgroundColor: 'white', 
            padding: '1.5rem', 
            borderRadius: '0.75rem', 
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
            border: '1px solid #e5e7eb',
            marginBottom: '2rem'
          }}>
        <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.125rem', fontWeight: '600', color: '#1f2937' }}>
          <Database size={20} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
          Data Overview
        </h3>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '1rem' 
        }}>
          <div style={{ 
            padding: '1rem', 
            backgroundColor: '#f8fafc', 
            borderRadius: '0.5rem',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>
              Total Accounts
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937' }}>
              {getTotalAccounts()}
            </div>
          </div>
          <div style={{ 
            padding: '1rem', 
            backgroundColor: '#f8fafc', 
            borderRadius: '0.5rem',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>
              Accounts
            </div>
            <div style={{ fontSize: '0.875rem', color: '#1f2937' }}>
              {accounts.map(acc => acc.name).join(', ') || 'No accounts'}
            </div>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div style={{ 
        backgroundColor: 'white', 
        padding: '1.5rem', 
        borderRadius: '0.75rem', 
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        border: '1px solid #fecaca'
      }}>
        <h3 style={{ 
          margin: '0 0 1rem 0', 
          fontSize: '1.125rem', 
          fontWeight: '600', 
          color: '#dc2626',
          display: 'flex',
          alignItems: 'center'
        }}>
          <AlertTriangle size={20} style={{ marginRight: '0.5rem' }} />
          Danger Zone
        </h3>
        
        <div style={{ 
          padding: '1rem', 
          backgroundColor: '#fef2f2', 
          borderRadius: '0.5rem',
          border: '1px solid #fecaca',
          marginBottom: '1rem'
        }}>
          <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', fontWeight: '600', color: '#dc2626' }}>
            Delete All Data
          </h4>
          <p style={{ margin: '0 0 1rem 0', fontSize: '0.875rem', color: '#7f1d1d' }}>
            This will permanently delete all your expenses, accounts, and imported data. 
            This action cannot be undone.
          </p>
          
          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '0.75rem 1rem',
                backgroundColor: '#dc2626',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#b91c1c';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = '#dc2626';
              }}
            >
              <Trash2 size={16} style={{ marginRight: '0.5rem' }} />
              Delete All Data
            </button>
          ) : (
            <div>
              <p style={{ 
                margin: '0 0 1rem 0', 
                fontSize: '0.875rem', 
                fontWeight: '600', 
                color: '#dc2626' 
              }}>
                Are you sure you want to delete all data? This action cannot be undone.
              </p>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={handleDeleteAllData}
                  disabled={isDeleting}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0.75rem 1rem',
                    backgroundColor: isDeleting ? '#9ca3af' : '#dc2626',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    cursor: isDeleting ? 'not-allowed' : 'pointer',
                    opacity: isDeleting ? 0.7 : 1
                  }}
                >
                  {isDeleting ? (
                    <>
                      <RefreshCw size={16} style={{ marginRight: '0.5rem', animation: 'spin 1s linear infinite' }} />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 size={16} style={{ marginRight: '0.5rem' }} />
                      Yes, Delete All Data
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                  style={{
                    padding: '0.75rem 1rem',
                    backgroundColor: '#f3f4f6',
                    color: '#374151',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    cursor: isDeleting ? 'not-allowed' : 'pointer',
                    opacity: isDeleting ? 0.7 : 1
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {deleteSuccess && (
          <div style={{ 
            display: 'flex',
            alignItems: 'center',
            padding: '0.75rem 1rem',
            backgroundColor: '#f0fdf4',
            color: '#166534',
            borderRadius: '0.5rem',
            border: '1px solid #bbf7d0',
            fontSize: '0.875rem',
            fontWeight: '500'
          }}>
            <CheckCircle size={16} style={{ marginRight: '0.5rem' }} />
            All data has been successfully deleted!
          </div>
        )}
      </div>

      {/* Additional Settings */}
      <div style={{ 
        backgroundColor: 'white', 
        padding: '1.5rem', 
        borderRadius: '0.75rem', 
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        border: '1px solid #e5e7eb',
        marginTop: '1.5rem'
      }}>
        <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.125rem', fontWeight: '600', color: '#1f2937' }}>
          <SettingsIcon size={20} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
          Application Settings
        </h3>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
          gap: '1rem' 
        }}>
          <div style={{ 
            padding: '1rem', 
            backgroundColor: '#f8fafc', 
            borderRadius: '0.5rem',
            border: '1px solid #e5e7eb'
          }}>
            <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', fontWeight: '600', color: '#1f2937' }}>
              Data Management
            </h4>
            <p style={{ margin: '0 0 1rem 0', fontSize: '0.875rem', color: '#6b7280' }}>
              Manage your financial data and account information.
            </p>
            <button
              onClick={refreshData}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '0.5rem 1rem',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              <RefreshCw size={16} style={{ marginRight: '0.5rem' }} />
              Refresh Data
            </button>
          </div>

          <div style={{ 
            padding: '1rem', 
            backgroundColor: '#f8fafc', 
            borderRadius: '0.5rem',
            border: '1px solid #e5e7eb'
          }}>
            <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', fontWeight: '600', color: '#1f2937' }}>
              Import/Export
            </h4>
            <p style={{ margin: '0 0 1rem 0', fontSize: '0.875rem', color: '#6b7280' }}>
              Import bank statements or export your data for backup.
            </p>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <a
                href="/upload"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0.5rem 1rem',
                  backgroundColor: '#10b981',
                  color: 'white',
                  textDecoration: 'none',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  fontWeight: '500'
                }}
              >
                Import Data
              </a>
              <a
                href="/expenses"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0.5rem 1rem',
                  backgroundColor: '#6b7280',
                  color: 'white',
                  textDecoration: 'none',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  fontWeight: '500'
                }}
              >
                View Data
              </a>
            </div>
          </div>
        </div>
      </div>
        </>
      )}

      {/* Merchants Management Tab */}
      {activeTab === 'merchants' && (
        <div style={{ 
          backgroundColor: 'white', 
          padding: '1.5rem', 
          borderRadius: '0.75rem', 
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
          border: '1px solid #e5e7eb',
          marginBottom: '2rem'
        }}>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.125rem', fontWeight: '600', color: '#1f2937' }}>
            <Database size={20} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
            Merchants Management
          </h3>
          
          {/* Add New Merchant */}
          <div style={{ 
            padding: '1rem', 
            backgroundColor: '#f8fafc', 
            borderRadius: '0.5rem',
            border: '1px solid #e5e7eb',
            marginBottom: '1.5rem'
          }}>
            <h4 style={{ margin: '0 0 1rem 0', fontSize: '1rem', fontWeight: '600', color: '#1f2937' }}>
              Add New Merchant
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '0.5rem', alignItems: 'end' }}>
              <input
                type="text"
                placeholder="Merchant Name"
                value={newMerchant.name}
                onChange={(e) => setNewMerchant({ ...newMerchant, name: e.target.value })}
                style={{
                  padding: '0.5rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem'
                }}
              />
              <select
                value={newMerchant.category}
                onChange={(e) => setNewMerchant({ ...newMerchant, category: e.target.value })}
                style={{
                  padding: '0.5rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem'
                }}
              >
                <option value="">Select Category</option>
                <option value="Food">Food</option>
                <option value="Transport">Transport</option>
                <option value="Shopping">Shopping</option>
                <option value="Bills">Bills</option>
                <option value="Entertainment">Entertainment</option>
                <option value="Healthcare">Healthcare</option>
                <option value="Rent">Rent</option>
                <option value="Salary">Salary</option>
                <option value="Transfers">Transfers</option>
                <option value="Other">Other</option>
              </select>
              <input
                type="text"
                placeholder="Group (e.g., Food & Groceries)"
                value={newMerchant.group}
                onChange={(e) => setNewMerchant({ ...newMerchant, group: e.target.value })}
                style={{
                  padding: '0.5rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem'
                }}
              />
              <button
                onClick={addMerchant}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0.5rem 1rem',
                  backgroundColor: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                <Plus size={16} style={{ marginRight: '0.5rem' }} />
                Add
              </button>
            </div>
          </div>

          {/* Merchants List */}
          <div>
            {Object.entries(merchants).map(([group, groupMerchants]) => (
              <div key={group} style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', fontWeight: '600', color: '#1f2937' }}>
                  {group}
                </h4>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
                  gap: '0.5rem' 
                }}>
                  {Object.entries(groupMerchants).map(([merchantName, category]) => (
                    <div key={merchantName} style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.75rem',
                      backgroundColor: '#f8fafc',
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.5rem'
                    }}>
                      <div>
                        <div style={{ fontWeight: '500', color: '#1f2937' }}>{merchantName}</div>
                        <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>{category}</div>
                      </div>
                      <button
                        onClick={() => removeMerchant(group, merchantName)}
                        style={{
                          padding: '0.25rem',
                          backgroundColor: '#ef4444',
                          color: 'white',
                          border: 'none',
                          borderRadius: '0.25rem',
                          cursor: 'pointer'
                        }}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Patterns Management Tab */}
      {activeTab === 'patterns' && (
        <div style={{ 
          backgroundColor: 'white', 
          padding: '1.5rem', 
          borderRadius: '0.75rem', 
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
          border: '1px solid #e5e7eb',
          marginBottom: '2rem'
        }}>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.125rem', fontWeight: '600', color: '#1f2937' }}>
            <Database size={20} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
            Category Patterns Management
          </h3>
          
          {/* Add New Pattern */}
          <div style={{ 
            padding: '1rem', 
            backgroundColor: '#f8fafc', 
            borderRadius: '0.5rem',
            border: '1px solid #e5e7eb',
            marginBottom: '1.5rem'
          }}>
            <h4 style={{ margin: '0 0 1rem 0', fontSize: '1rem', fontWeight: '600', color: '#1f2937' }}>
              Add New Keyword Pattern
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '0.5rem', alignItems: 'end' }}>
              <select
                value={newPattern.category}
                onChange={(e) => setNewPattern({ ...newPattern, category: e.target.value })}
                style={{
                  padding: '0.5rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem'
                }}
              >
                <option value="">Select Category</option>
                <option value="Food">Food</option>
                <option value="Transport">Transport</option>
                <option value="Shopping">Shopping</option>
                <option value="Bills">Bills</option>
                <option value="Entertainment">Entertainment</option>
                <option value="Healthcare">Healthcare</option>
                <option value="Rent">Rent</option>
                <option value="Salary">Salary</option>
                <option value="Transfers">Transfers</option>
                <option value="Other">Other</option>
              </select>
              <input
                type="text"
                placeholder="Keyword (e.g., 'grocery', 'fuel')"
                value={newPattern.keyword}
                onChange={(e) => setNewPattern({ ...newPattern, keyword: e.target.value })}
                style={{
                  padding: '0.5rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem'
                }}
              />
              <button
                onClick={addPattern}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0.5rem 1rem',
                  backgroundColor: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                <Plus size={16} style={{ marginRight: '0.5rem' }} />
                Add
              </button>
            </div>
          </div>

          {/* Patterns List */}
          <div>
            {Object.entries(patterns).map(([category, patternData]) => (
              <div key={category} style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', fontWeight: '600', color: '#1f2937' }}>
                  {category}
                  {patternData.description && (
                    <span style={{ fontSize: '0.875rem', fontWeight: '400', color: '#6b7280', marginLeft: '0.5rem' }}>
                      - {patternData.description}
                    </span>
                  )}
                </h4>
                <div style={{ 
                  display: 'flex', 
                  flexWrap: 'wrap', 
                  gap: '0.5rem' 
                }}>
                  {patternData.keywords && patternData.keywords.map((keyword, index) => (
                    <div key={index} style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '0.5rem 0.75rem',
                      backgroundColor: '#f8fafc',
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem'
                    }}>
                      <span style={{ marginRight: '0.5rem' }}>{keyword}</span>
                      <button
                        onClick={() => removePattern(category, keyword)}
                        style={{
                          padding: '0.125rem',
                          backgroundColor: '#ef4444',
                          color: 'white',
                          border: 'none',
                          borderRadius: '0.25rem',
                          cursor: 'pointer',
                          fontSize: '0.75rem'
                        }}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
