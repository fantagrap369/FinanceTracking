import React, { useState, useRef } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle, X, Download, Eye, Trash2 } from 'lucide-react';
import { useExpenses } from '../context/ExpenseContext';
import PDFParser from '../services/PDFParser';
import BankStatementParser from '../services/BankStatementParser';

const BankStatementUpload = () => {
  const { addExpense } = useExpenses();
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');
  const [extractedTransactions, setExtractedTransactions] = useState([]);
  const [accountGroups, setAccountGroups] = useState({});
  const [selectedAccount, setSelectedAccount] = useState('all');
  const [showPreview, setShowPreview] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    const newFiles = files.map(file => ({
      id: Date.now() + Math.random(),
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      status: 'uploaded',
      transactions: []
    }));

    setUploadedFiles(prev => [...prev, ...newFiles]);
    
    // Process files immediately
    for (const fileObj of newFiles) {
      await processFile(fileObj);
    }
  };

  const processFile = async (fileObj) => {
    try {
      setIsProcessing(true);
      setProcessingStatus(`Processing ${fileObj.name}...`);
      
      const result = await extractTransactionsFromFile(fileObj.file);
      const { accountInfo, transactions } = result;
      
      setUploadedFiles(prev => 
        prev.map(f => 
          f.id === fileObj.id 
            ? { ...f, status: 'processed', transactions, accountInfo }
            : f
        )
      );

      // Group transactions by account
      const accountKey = accountInfo.accountNumber || accountInfo.accountType || 'unknown';
      setAccountGroups(prev => ({
        ...prev,
        [accountKey]: {
          accountInfo,
          transactions: [...(prev[accountKey]?.transactions || []), ...transactions]
        }
      }));

      setExtractedTransactions(prev => [...prev, ...transactions]);
      setProcessingStatus(`Successfully processed ${fileObj.name}`);
    } catch (error) {
      console.error('Error processing file:', error);
      setUploadedFiles(prev => 
        prev.map(f => 
          f.id === fileObj.id 
            ? { ...f, status: 'error', error: error.message }
            : f
        )
      );
      setProcessingStatus(`Error processing ${fileObj.name}: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const extractTransactionsFromFile = async (file) => {
    const fileType = file.type;
    let text = '';

    try {
      if (fileType === 'application/pdf') {
        text = await PDFParser.parsePDF(file);
      } else if (fileType === 'text/plain' || fileType === 'text/csv') {
        text = await extractTextFromTextFile(file);
      } else if (fileType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
                 fileType === 'application/vnd.ms-excel') {
        text = await extractTextFromExcel(file);
      } else {
        throw new Error('Unsupported file type');
      }

      return BankStatementParser.parseBankStatement(text);
    } catch (error) {
      console.error('Error extracting text:', error);
      throw error;
    }
  };

  const extractTextFromTextFile = async (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

  const extractTextFromExcel = async (file) => {
    // Simplified - in reality you'd use xlsx library
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        // Excel parsing would go here
        resolve('Excel content extraction would go here');
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  };

  const handleImportTransactions = async () => {
    try {
      setIsProcessing(true);
      setProcessingStatus('Importing transactions...');
      
      let importedCount = 0;
      for (const transaction of extractedTransactions) {
        try {
          await addExpense(transaction);
          importedCount++;
        } catch (error) {
          console.error('Error importing transaction:', error);
        }
      }
      
      setProcessingStatus(`Successfully imported ${importedCount} transactions`);
      
      // Clear the extracted transactions
      setExtractedTransactions([]);
      setUploadedFiles([]);
      
    } catch (error) {
      console.error('Error importing transactions:', error);
      setProcessingStatus(`Error importing transactions: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRemoveFile = (fileId) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const handleClearAll = () => {
    setUploadedFiles([]);
    setExtractedTransactions([]);
    setAccountGroups({});
    setSelectedAccount('all');
    setShowPreview(false);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getCategoryColor = (category) => {
    const colors = {
      'Food': '#ef4444',
      'Transport': '#3b82f6',
      'Shopping': '#8b5cf6',
      'Bills': '#f59e0b',
      'Entertainment': '#10b981',
      'Other': '#6b7280'
    };
    return colors[category] || colors['Other'];
  };

  const getFilteredTransactions = () => {
    if (selectedAccount === 'all') {
      return extractedTransactions;
    }
    return accountGroups[selectedAccount]?.transactions || [];
  };

  const getAccountStatistics = (transactions) => {
    const expenses = transactions.filter(t => !t.isIncome);
    const income = transactions.filter(t => t.isIncome);
    const totalExpenses = expenses.reduce((sum, t) => sum + t.amount, 0);
    const totalIncome = income.reduce((sum, t) => sum + t.amount, 0);
    const netTotal = totalIncome - totalExpenses;

    return {
      totalTransactions: transactions.length,
      expenseCount: expenses.length,
      incomeCount: income.length,
      totalExpenses,
      totalIncome,
      netTotal
    };
  };

  const getAccountDisplayName = (accountKey, accountInfo) => {
    if (accountInfo.accountType) {
      return `${accountInfo.bankName || 'Bank'} - ${accountInfo.accountType}`;
    }
    if (accountInfo.accountNumber) {
      return `${accountInfo.bankName || 'Bank'} - ${accountInfo.accountNumber}`;
    }
    return accountKey;
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'uploaded':
        return <FileText size={16} color="#6b7280" />;
      case 'processed':
        return <CheckCircle size={16} color="#10b981" />;
      case 'error':
        return <AlertCircle size={16} color="#ef4444" />;
      default:
        return <FileText size={16} color="#6b7280" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'uploaded':
        return '#6b7280';
      case 'processed':
        return '#10b981';
      case 'error':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  return (
    <div style={{ padding: '2rem 0' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold', color: '#1f2937' }}>
          <Upload size={28} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
          Bank Statement Upload
        </h1>
        <p style={{ margin: '0.5rem 0 0 0', fontSize: '1.125rem', color: '#6b7280' }}>
          Upload your bank statements to automatically extract and import transactions
        </p>
      </div>

      {/* Upload Area */}
      <div style={{ 
        backgroundColor: 'white', 
        padding: '2rem', 
        borderRadius: '0.75rem', 
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        border: '2px dashed #d1d5db',
        marginBottom: '2rem',
        textAlign: 'center'
      }}>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.txt,.csv,.xlsx,.xls"
          onChange={handleFileUpload}
          style={{ display: 'none' }}
        />
        
        <div style={{ marginBottom: '1rem' }}>
          <Upload size={48} color="#6b7280" />
        </div>
        
        <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem', fontWeight: '600', color: '#1f2937' }}>
          Upload Bank Statements
        </h3>
        
        <p style={{ margin: '0 0 1.5rem 0', fontSize: '0.875rem', color: '#6b7280' }}>
          Supported formats: PDF, TXT, CSV, Excel (.xlsx, .xls)
        </p>
        
        <button
          onClick={() => fileInputRef.current?.click()}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '0.5rem',
            fontSize: '0.875rem',
            fontWeight: '500',
            cursor: 'pointer'
          }}
        >
          Choose Files
        </button>
      </div>

      {/* Processing Status */}
      {isProcessing && (
        <div style={{ 
          backgroundColor: '#f0f9ff', 
          padding: '1rem', 
          borderRadius: '0.5rem', 
          border: '1px solid #0ea5e9',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <div style={{ 
            width: '20px', 
            height: '20px', 
            border: '2px solid #0ea5e9', 
            borderTop: '2px solid transparent', 
            borderRadius: '50%', 
            animation: 'spin 1s linear infinite'
          }}></div>
          <span style={{ color: '#0c4a6e', fontWeight: '500' }}>
            {processingStatus}
          </span>
        </div>
      )}

      {/* Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <div style={{ 
          backgroundColor: 'white', 
          padding: '1.5rem', 
          borderRadius: '0.75rem', 
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
          border: '1px solid #e5e7eb',
          marginBottom: '1.5rem'
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginBottom: '1rem' 
          }}>
            <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: '600', color: '#1f2937' }}>
              Uploaded Files ({uploadedFiles.length})
            </h3>
            <button
              onClick={handleClearAll}
              style={{
                padding: '0.5rem',
                backgroundColor: '#fef2f2',
                color: '#ef4444',
                border: '1px solid #fecaca',
                borderRadius: '0.375rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                fontSize: '0.875rem'
              }}
            >
              <Trash2 size={14} />
              Clear All
            </button>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {uploadedFiles.map((file) => (
              <div key={file.id} style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                padding: '1rem',
                backgroundColor: '#f8fafc',
                borderRadius: '0.5rem',
                border: '1px solid #e5e7eb'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  {getStatusIcon(file.status)}
                  <div>
                    <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: '500', color: '#1f2937' }}>
                      {file.name}
                    </p>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: '#6b7280' }}>
                      {formatFileSize(file.size)} • {file.transactions.length} transactions
                    </p>
                  </div>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ 
                    fontSize: '0.75rem', 
                    fontWeight: '500', 
                    color: getStatusColor(file.status),
                    textTransform: 'capitalize'
                  }}>
                    {file.status}
                  </span>
                  <button
                    onClick={() => handleRemoveFile(file.id)}
                    style={{
                      padding: '0.25rem',
                      backgroundColor: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <X size={16} color="#6b7280" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Account Overview */}
      {Object.keys(accountGroups).length > 0 && (
        <div style={{ 
          backgroundColor: 'white', 
          padding: '1.5rem', 
          borderRadius: '0.75rem', 
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
          border: '1px solid #e5e7eb',
          marginBottom: '1.5rem'
        }}>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.125rem', fontWeight: '600', color: '#1f2937' }}>
            Account Overview
          </h3>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
            gap: '1rem' 
          }}>
            {Object.entries(accountGroups).map(([accountKey, { accountInfo, transactions }]) => {
              const stats = getAccountStatistics(transactions);
              return (
                <div key={accountKey} style={{ 
                  padding: '1rem',
                  backgroundColor: '#f8fafc',
                  borderRadius: '0.5rem',
                  border: '1px solid #e5e7eb'
                }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    marginBottom: '0.75rem'
                  }}>
                    <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: '600', color: '#1f2937' }}>
                      {getAccountDisplayName(accountKey, accountInfo)}
                    </h4>
                    <span style={{ 
                      fontSize: '0.75rem', 
                      color: '#6b7280',
                      backgroundColor: '#e5e7eb',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '0.25rem'
                    }}>
                      {stats.totalTransactions} transactions
                    </span>
                  </div>
                  
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: '1fr 1fr', 
                    gap: '0.5rem',
                    fontSize: '0.875rem'
                  }}>
                    <div>
                      <span style={{ color: '#6b7280' }}>Expenses:</span>
                      <div style={{ fontWeight: '600', color: '#ef4444' }}>
                        R{stats.totalExpenses.toFixed(2)}
                      </div>
                    </div>
                    <div>
                      <span style={{ color: '#6b7280' }}>Income:</span>
                      <div style={{ fontWeight: '600', color: '#10b981' }}>
                        R{stats.totalIncome.toFixed(2)}
                      </div>
                    </div>
                    <div>
                      <span style={{ color: '#6b7280' }}>Net:</span>
                      <div style={{ 
                        fontWeight: '600', 
                        color: stats.netTotal >= 0 ? '#10b981' : '#ef4444'
                      }}>
                        R{stats.netTotal.toFixed(2)}
                      </div>
                    </div>
                    <div>
                      <span style={{ color: '#6b7280' }}>Balance:</span>
                      <div style={{ fontWeight: '600', color: '#1f2937' }}>
                        R{accountInfo.balance?.toFixed(2) || 'N/A'}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Extracted Transactions Preview */}
      {extractedTransactions.length > 0 && (
        <div style={{ 
          backgroundColor: 'white', 
          padding: '1.5rem', 
          borderRadius: '0.75rem', 
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginBottom: '1rem' 
          }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: '600', color: '#1f2937' }}>
                Extracted Transactions ({getFilteredTransactions().length})
              </h3>
              {Object.keys(accountGroups).length > 1 && (
                <div style={{ marginTop: '0.5rem' }}>
                  <select
                    value={selectedAccount}
                    onChange={(e) => setSelectedAccount(e.target.value)}
                    style={{
                      padding: '0.5rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem',
                      backgroundColor: 'white'
                    }}
                  >
                    <option value="all">All Accounts</option>
                    {Object.entries(accountGroups).map(([accountKey, { accountInfo }]) => (
                      <option key={accountKey} value={accountKey}>
                        {getAccountDisplayName(accountKey, accountInfo)}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {getFilteredTransactions().length > 0 && (
                <div style={{ 
                  display: 'flex', 
                  gap: '1.5rem', 
                  marginTop: '0.5rem',
                  fontSize: '0.875rem',
                  color: '#6b7280'
                }}>
                  <span>
                    <strong style={{ color: '#ef4444' }}>
                      {getFilteredTransactions().filter(t => !t.isIncome).length}
                    </strong> expenses
                  </span>
                  <span>
                    <strong style={{ color: '#10b981' }}>
                      {getFilteredTransactions().filter(t => t.isIncome).length}
                    </strong> income
                  </span>
                  <span>
                    Total: <strong style={{ color: '#1f2937' }}>
                      R{getFilteredTransactions().reduce((sum, t) => sum + (t.isIncome ? t.amount : -t.amount), 0).toFixed(2)}
                    </strong>
                  </span>
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => setShowPreview(!showPreview)}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#f3f4f6',
                  color: '#6b7280',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.375rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  fontSize: '0.875rem'
                }}
              >
                <Eye size={14} />
                {showPreview ? 'Hide' : 'Preview'}
              </button>
              <button
                onClick={handleImportTransactions}
                disabled={isProcessing}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: isProcessing ? '#9ca3af' : '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.375rem',
                  cursor: isProcessing ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  fontSize: '0.875rem'
                }}
              >
                <Download size={14} />
                Import All
              </button>
            </div>
          </div>
          
          {showPreview && (
            <div style={{ 
              maxHeight: '500px', 
              overflowY: 'auto',
              border: '1px solid #e5e7eb',
              borderRadius: '0.5rem',
              backgroundColor: 'white'
            }}>
              <table style={{ 
                width: '100%', 
                borderCollapse: 'collapse',
                fontSize: '0.875rem'
              }}>
                <thead style={{ 
                  backgroundColor: '#f8fafc',
                  position: 'sticky',
                  top: 0,
                  zIndex: 10
                }}>
                  <tr>
                    <th style={{ 
                      padding: '0.75rem 1rem', 
                      textAlign: 'left', 
                      fontWeight: '600', 
                      color: '#374151',
                      borderBottom: '1px solid #e5e7eb',
                      fontSize: '0.75rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      Date
                    </th>
                    <th style={{ 
                      padding: '0.75rem 1rem', 
                      textAlign: 'left', 
                      fontWeight: '600', 
                      color: '#374151',
                      borderBottom: '1px solid #e5e7eb',
                      fontSize: '0.75rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      Description
                    </th>
                    <th style={{ 
                      padding: '0.75rem 1rem', 
                      textAlign: 'left', 
                      fontWeight: '600', 
                      color: '#374151',
                      borderBottom: '1px solid #e5e7eb',
                      fontSize: '0.75rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      Store
                    </th>
                    <th style={{ 
                      padding: '0.75rem 1rem', 
                      textAlign: 'left', 
                      fontWeight: '600', 
                      color: '#374151',
                      borderBottom: '1px solid #e5e7eb',
                      fontSize: '0.75rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      Category
                    </th>
                    <th style={{ 
                      padding: '0.75rem 1rem', 
                      textAlign: 'right', 
                      fontWeight: '600', 
                      color: '#374151',
                      borderBottom: '1px solid #e5e7eb',
                      fontSize: '0.75rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      Amount
                    </th>
                    <th style={{ 
                      padding: '0.75rem 1rem', 
                      textAlign: 'center', 
                      fontWeight: '600', 
                      color: '#374151',
                      borderBottom: '1px solid #e5e7eb',
                      fontSize: '0.75rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      Type
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {getFilteredTransactions().map((transaction, index) => (
                    <tr key={transaction.id} style={{ 
                      backgroundColor: index % 2 === 0 ? 'white' : '#f8fafc',
                      borderBottom: index < getFilteredTransactions().length - 1 ? '1px solid #f3f4f6' : 'none'
                    }}>
                      <td style={{ 
                        padding: '0.75rem 1rem', 
                        color: '#6b7280',
                        fontSize: '0.875rem',
                        whiteSpace: 'nowrap'
                      }}>
                        {transaction.date ? new Date(transaction.date).toLocaleDateString('en-ZA', {
                          year: 'numeric',
                          month: 'short',
                          day: '2-digit'
                        }) : 'N/A'}
                      </td>
                      <td style={{ 
                        padding: '0.75rem 1rem', 
                        color: '#1f2937',
                        fontSize: '0.875rem',
                        maxWidth: '300px'
                      }}>
                        <div style={{ 
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {transaction.description || 'N/A'}
                        </div>
                      </td>
                      <td style={{ 
                        padding: '0.75rem 1rem', 
                        color: '#6b7280',
                        fontSize: '0.875rem',
                        maxWidth: '150px'
                      }}>
                        <div style={{ 
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {transaction.store || 'N/A'}
                        </div>
                      </td>
                      <td style={{ 
                        padding: '0.75rem 1rem', 
                        fontSize: '0.875rem'
                      }}>
                        <span style={{
                          padding: '0.25rem 0.5rem',
                          backgroundColor: getCategoryColor(transaction.category) + '20',
                          color: getCategoryColor(transaction.category),
                          borderRadius: '0.25rem',
                          fontSize: '0.75rem',
                          fontWeight: '500'
                        }}>
                          {transaction.category || 'Other'}
                        </span>
                      </td>
                      <td style={{ 
                        padding: '0.75rem 1rem', 
                        textAlign: 'right',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        color: transaction.isIncome ? '#10b981' : '#1f2937'
                      }}>
                        {transaction.isIncome ? '+' : '-'}R{(transaction.amount || 0).toFixed(2)}
                      </td>
                      <td style={{ 
                        padding: '0.75rem 1rem', 
                        textAlign: 'center',
                        fontSize: '0.75rem'
                      }}>
                        <span style={{
                          padding: '0.25rem 0.5rem',
                          backgroundColor: transaction.isIncome ? '#10b981' : '#3b82f6',
                          color: 'white',
                          borderRadius: '0.25rem',
                          fontWeight: '500'
                        }}>
                          {transaction.isIncome ? 'Income' : 'Expense'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Instructions */}
      <div style={{ 
        backgroundColor: '#f0f9ff', 
        padding: '1.5rem', 
        borderRadius: '0.75rem', 
        border: '1px solid #0ea5e9',
        marginTop: '2rem'
      }}>
        <h4 style={{ margin: '0 0 1rem 0', fontSize: '1rem', fontWeight: '600', color: '#0c4a6e' }}>
          How to Use Bank Statement Upload
        </h4>
        <ol style={{ margin: 0, paddingLeft: '1.5rem', color: '#0c4a6e', fontSize: '0.875rem' }}>
          <li style={{ marginBottom: '0.5rem' }}>
            Download your bank statement as PDF, CSV, or Excel file
          </li>
          <li style={{ marginBottom: '0.5rem' }}>
            Upload the file using the upload area above
          </li>
          <li style={{ marginBottom: '0.5rem' }}>
            Review the extracted transactions in the preview
          </li>
          <li style={{ marginBottom: '0.5rem' }}>
            Click "Import All" to add transactions to your expense tracker
          </li>
          <li>
            Transactions will be automatically categorized and can be edited later
          </li>
        </ol>
      </div>
    </div>
  );
};

export default BankStatementUpload;
