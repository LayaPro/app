import { useState, useEffect, useRef } from 'react';
import { projectApi } from '../../../services/api';
import { DataTable } from '../../../components/ui/DataTable';
import type { Column } from '../../../components/ui/DataTable';
import { Modal } from '../../../components/ui/Modal';
import { useToast } from '../../../context/ToastContext';
import { projectFinanceApi } from '../../../services/api';
import { Input } from '../../../components/ui/Input';
import { DatePicker } from '../../../components/ui/DatePicker';
import { Select } from '../../../components/ui/Select';
import { Textarea } from '../../../components/ui/Textarea';

interface Transaction {
  transactionId: string;
  datetime: string | Date;
  amount: number;
  comment?: string;
  nature: 'received' | 'paid';
  createdAt?: string;
}

interface ProjectFinance {
  financeId: string;
  projectId: string;
  totalBudget?: number;
  receivedAmount?: number;
  nextDueDate?: Date;
  nextDueAmount?: number;
  isClientClosed?: boolean;
  transactions?: Transaction[];
  createdAt?: string;
  updatedAt?: string;
}

interface ProjectWithFinance {
  projectId: string;
  projectName: string;
  brideFirstName?: string;
  groomFirstName?: string;
  brideLastName?: string;
  groomLastName?: string;
  phoneNumber?: string;
  displayPic?: string;
  finance?: ProjectFinance;
}

export const CustomersFinanceTable = () => {
  const [projects, setProjects] = useState<ProjectWithFinance[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddPaymentModalOpen, setIsAddPaymentModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<ProjectWithFinance | null>(null);
  const [transactionForm, setTransactionForm] = useState({
    datetime: new Date().toISOString().split('T')[0],
    time: '',
    amount: '',
    comment: '',
    nature: 'received' as 'received' | 'paid'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();

  useEffect(() => {
    fetchProjectsWithFinances();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchProjectsWithFinances = async () => {
    try {
      setLoading(true);
      const response = await projectApi.getAll();
      const projectsData = response?.projects || [];
      
      // Projects already include finance data from backend
      setProjects(projectsData);
    } catch (error) {
      console.error('Error fetching projects with finances:', error);
      showToast('error', 'Failed to load finance data');
    } finally {
      setLoading(false);
    }
  };

  const getCustomerName = (project: ProjectWithFinance) => {
    const brideName = project.brideFirstName && project.brideLastName 
      ? `${project.brideFirstName} ${project.brideLastName}` 
      : project.brideFirstName || '';
    const groomName = project.groomFirstName && project.groomLastName 
      ? `${project.groomFirstName} ${project.groomLastName}` 
      : project.groomFirstName || '';
    
    if (brideName && groomName) {
      return `${brideName} & ${groomName}`;
    }
    return brideName || groomName || project.projectName;
  };

  const formatAmount = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const handleAddPaymentClick = (project: ProjectWithFinance) => {
    setSelectedProject(project);
    const now = new Date();
    setTransactionForm({
      datetime: now.toISOString().split('T')[0],
      time: now.toTimeString().slice(0, 5),
      amount: '',
      comment: '',
      nature: 'received'
    });
    setIsAddPaymentModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsAddPaymentModalOpen(false);
    setSelectedProject(null);
    setTransactionForm({
      datetime: new Date().toISOString().split('T')[0],
      time: '',
      amount: '',
      comment: '',
      nature: 'received'
    });
  };

  const handleSubmitTransaction = async () => {
    if (!selectedProject || !transactionForm.amount) {
      showToast('error', 'Please fill in all required fields');
      return;
    }

    try {
      setIsSubmitting(true);
      // Combine date and time
      const datetimeString = transactionForm.time 
        ? `${transactionForm.datetime}T${transactionForm.time}:00`
        : `${transactionForm.datetime}T00:00:00`;
      
      await projectFinanceApi.addTransaction(selectedProject.projectId, {
        datetime: datetimeString,
        amount: parseFloat(transactionForm.amount),
        comment: transactionForm.comment,
        nature: transactionForm.nature
      });

      showToast('success', 'Transaction added successfully');
      handleCloseModal();
      fetchProjectsWithFinances(); // Refresh data
    } catch (error: any) {
      console.error('Error adding transaction:', error);
      showToast('error', error.message || 'Failed to add transaction');
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns: Column<ProjectWithFinance>[] = [
    {
      key: 'projectName',
      header: 'Name',
      sortable: true,
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {row.displayPic ? (
            <img 
              src={row.displayPic} 
              alt="Profile"
              style={{ 
                width: '2.5rem', 
                height: '2.5rem', 
                borderRadius: '50%',
                objectFit: 'cover'
              }}
            />
          ) : (
            <div style={{ 
              width: '2.5rem', 
              height: '2.5rem', 
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 600,
              fontSize: '0.875rem'
            }}>
              {getCustomerName(row).substring(0, 2).toUpperCase()}
            </div>
          )}
          <div>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
              {getCustomerName(row)}
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              {row.projectName}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'finance',
      header: 'Received Amount',
      sortable: true,
      render: (row) => (
        <span style={{ color: '#10b981', fontWeight: 600 }}>
          {formatAmount(row.finance?.receivedAmount || 0)}
        </span>
      ),
    },
    {
      key: 'finance',
      header: 'Pending Amount',
      sortable: true,
      render: (row) => {
        const totalBudget = row.finance?.totalBudget || 0;
        const received = row.finance?.receivedAmount || 0;
        const pending = totalBudget - received;
        return (
          <span style={{ color: pending > 0 ? '#ef4444' : 'var(--text-secondary)', fontWeight: 600 }}>
            {formatAmount(pending)}
          </span>
        );
      },
    },
    {
      key: 'finance',
      header: 'Total Budget',
      sortable: true,
      render: (row) => (
        <span style={{ fontWeight: 600 }}>
          {formatAmount(row.finance?.totalBudget || 0)}
        </span>
      ),
    },
    {
      key: 'projectId',
      header: 'Actions',
      render: (row) => (
        <div style={{ position: 'relative' }}>
          <button
            style={{
              padding: '0.5rem',
              background: 'transparent',
              color: 'var(--text-secondary)',
              border: 'none',
              borderRadius: '0.375rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.2s',
            }}
            onClick={(e) => {
              e.stopPropagation();
              setOpenMenuId(openMenuId === row.projectId ? null : row.projectId);
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
              <circle cx="10" cy="4" r="1.5" />
              <circle cx="10" cy="10" r="1.5" />
              <circle cx="10" cy="16" r="1.5" />
            </svg>
          </button>
          {openMenuId === row.projectId && (
            <div
              ref={menuRef}
              style={{
                position: 'absolute',
                right: 0,
                top: '100%',
                marginTop: '0.25rem',
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: '0.5rem',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                zIndex: 1000,
                minWidth: '160px',
                overflow: 'hidden'
              }}
            >
              <button
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  background: 'transparent',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  color: 'var(--text-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  transition: 'background 0.2s'
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleAddPaymentClick(row);
                  setOpenMenuId(null);
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Add Payment
              </button>
              <button
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  background: 'transparent',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  color: 'var(--text-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  transition: 'background 0.2s'
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  // TODO: View details functionality
                  setOpenMenuId(null);
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                View Details
              </button>
              <button
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  background: 'transparent',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  color: 'var(--text-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  transition: 'background 0.2s'
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  // TODO: Edit budget functionality
                  setOpenMenuId(null);
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit Budget
              </button>
            </div>
          )}
        </div>
      ),
    },
  ];

  const renderExpandedRow = (row: ProjectWithFinance) => {
    const transactions = row.finance?.transactions || [];

    return (
      <div style={{ 
        padding: '0',
        background: 'var(--bg-secondary)',
      }}>
        <div style={{ 
          padding: '0.5rem 1.5rem',
          borderBottom: '1px solid var(--border-color)'
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.375rem'
          }}>
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ color: 'var(--color-primary)' }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 style={{ 
              margin: 0, 
              fontSize: '0.75rem', 
              fontWeight: 600, 
              color: 'var(--text-secondary)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              Transactions
            </h3>
            <span style={{
              marginLeft: 'auto',
              padding: '0.125rem 0.5rem',
              background: 'var(--color-primary)',
              color: 'white',
              fontSize: '0.6875rem',
              fontWeight: 600,
              borderRadius: '9999px'
            }}>
              {transactions.length}
            </span>
          </div>
        </div>
        
        {transactions.length === 0 ? (
          <div style={{ 
            padding: '2rem 1.5rem', 
            textAlign: 'center',
            color: 'var(--text-tertiary)'
          }}>
            <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" style={{ margin: '0 auto 0.5rem', opacity: 0.5 }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
            </svg>
            <p style={{ margin: 0, fontSize: '0.8125rem', fontWeight: 500 }}>No transactions yet</p>
          </div>
        ) : (
          <div style={{ padding: '0.5rem 1.5rem 0.75rem' }}>
            <div style={{ 
              background: 'var(--bg-primary)',
              borderRadius: '0.375rem',
              overflow: 'hidden',
              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
              border: '1px solid var(--border-color)'
            }}>
              {transactions.map((transaction, index) => (
                <div 
                  key={transaction.transactionId} 
                  style={{ 
                    display: 'grid',
                    gridTemplateColumns: '1.75fr 1.25fr 0.75fr 2fr',
                    gap: '0.5rem',
                    padding: '0.5rem 0.75rem',
                    borderBottom: index < transactions.length - 1 ? '1px solid var(--border-color)' : 'none',
                    transition: 'background 0.15s',
                    background: 'var(--bg-primary)'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'var(--bg-primary)'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{
                      width: '1.75rem',
                      height: '1.75rem',
                      borderRadius: '0.375rem',
                      background: transaction.nature === 'received' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      {transaction.nature === 'received' ? (
                        <svg width="14" height="14" fill="none" stroke="#10b981" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m0 0l6.75-6.75M12 19.5l-6.75-6.75" />
                        </svg>
                      ) : (
                        <svg width="14" height="14" fill="none" stroke="#ef4444" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 19.5v-15m0 0l-6.75 6.75M12 4.5l6.75 6.75" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.0625rem' }}>
                        {new Date(transaction.datetime).toLocaleDateString('en-IN', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </div>
                      <div style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)' }}>
                        {new Date(transaction.datetime).toLocaleTimeString('en-IN', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <div style={{ 
                      fontSize: '0.8125rem', 
                      fontWeight: 700, 
                      color: transaction.nature === 'received' ? '#10b981' : '#ef4444'
                    }}>
                      {transaction.nature === 'received' ? '+' : '-'} {formatAmount(transaction.amount)}
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{
                      padding: '0.1875rem 0.5rem',
                      borderRadius: '0.25rem',
                      fontSize: '0.625rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.025em',
                      background: transaction.nature === 'received' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                      color: transaction.nature === 'received' ? '#059669' : '#dc2626',
                      border: `1px solid ${transaction.nature === 'received' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`
                    }}>
                      {transaction.nature}
                    </span>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <div style={{ 
                      fontSize: '0.75rem', 
                      color: transaction.comment ? '#475569' : '#94a3b8',
                      fontStyle: transaction.comment ? 'normal' : 'italic',
                      lineHeight: '1.4',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {transaction.comment || 'No comment'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        padding: '3rem',
        color: 'var(--text-secondary)'
      }}>
        Loading finance data...
      </div>
    );
  }

  return (
    <>
      <DataTable
        columns={columns}
        data={projects}
        emptyMessage="No customer finance records found"
        renderExpandedRow={renderExpandedRow}
        getRowKey={(row) => row.projectId}
        itemsPerPage={5}
      />

      <Modal
        isOpen={isAddPaymentModalOpen}
        onClose={handleCloseModal}
        title={`Add Payment - ${selectedProject ? getCustomerName(selectedProject) : ''}`}
        size="small"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <DatePicker
            label="Date"
            value={transactionForm.datetime}
            onChange={(value) => setTransactionForm({ ...transactionForm, datetime: value })}
            placeholder="Select date"
            required
            includeTime={true}
            timeValue={transactionForm.time}
            onTimeChange={(value) => setTransactionForm({ ...transactionForm, time: value })}
          />

          <Input
            label="Amount (₹)"
            type="number"
            value={transactionForm.amount}
            onChange={(e) => setTransactionForm({ ...transactionForm, amount: e.target.value })}
            placeholder="Enter amount"
            min="0"
            step="0.01"
            required
          />

          <Select
            label="Nature"
            value={transactionForm.nature}
            onChange={(value) => setTransactionForm({ ...transactionForm, nature: value as 'received' | 'paid' })}
            options={[
              { value: 'received', label: 'Received' },
              { value: 'paid', label: 'Paid' }
            ]}
            required
          />

          <Textarea
            label="Comment"
            value={transactionForm.comment}
            onChange={(e) => setTransactionForm({ ...transactionForm, comment: e.target.value })}
            placeholder="Add a comment (optional)"
            rows={3}
          />

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <button
              onClick={handleCloseModal}
              disabled={isSubmitting}
              style={{
                padding: '0.5rem 1rem',
                border: '1px solid var(--border-color)',
                borderRadius: '0.375rem',
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                fontSize: '0.875rem',
                fontWeight: 500,
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmitTransaction}
              disabled={isSubmitting}
              style={{
                padding: '0.5rem 1rem',
                border: 'none',
                borderRadius: '0.375rem',
                background: '#6366f1',
                color: 'white',
                fontSize: '0.875rem',
                fontWeight: 500,
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                opacity: isSubmitting ? 0.6 : 1
              }}
            >
              {isSubmitting ? 'Adding...' : 'Add Payment'}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};
