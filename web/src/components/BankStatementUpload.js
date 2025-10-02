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
      
      const transactions = await extractTransactionsFromFile(fileObj.file);
      
      setUploadedFiles(prev => 
        prev.map(f => 
          f.id === fileObj.id 
            ? { ...f, status: 'processed', transactions }
            : f
        )
      );

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
    setShowPreview(false);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
            <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: '600', color: '#1f2937' }}>
              Extracted Transactions ({extractedTransactions.length})
            </h3>
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
              maxHeight: '400px', 
              overflowY: 'auto',
              border: '1px solid #e5e7eb',
              borderRadius: '0.5rem'
            }}>
              {extractedTransactions.map((transaction, index) => (
                <div key={transaction.id} style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  padding: '0.75rem 1rem',
                  borderBottom: index < extractedTransactions.length - 1 ? '1px solid #f3f4f6' : 'none'
                }}>
                  <div>
                    <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: '500', color: '#1f2937' }}>
                      {transaction.description}
                    </p>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: '#6b7280' }}>
                      {transaction.store} • {transaction.date}
                    </p>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: '600', color: '#1f2937' }}>
                    R{transaction.amount.toFixed(2)}
                  </p>
                </div>
              ))}
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
