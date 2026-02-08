import { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
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
import { AmountInput } from '../../../components/ui/AmountInput';
import styles from './FinanceTables.module.css';

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
  contactPerson?: string;
  brideFirstName?: string;
  groomFirstName?: string;
  brideLastName?: string;
  groomLastName?: string;
  phoneNumber?: string;
  displayPic?: string;
  finance?: ProjectFinance;
}

interface CustomersFinanceTableProps {
  onDataChange?: () => void;
  initialCustomerFilter?: string | null;
}

export const CustomersFinanceTable: React.FC<CustomersFinanceTableProps> = ({ onDataChange, initialCustomerFilter }) => {
  const [projects, setProjects] = useState<ProjectWithFinance[]>([]);
  const [loading, setLoading] = useState(true);
  const [customerFilter, setCustomerFilter] = useState<string>('all');
  const [dateRangeFilter, setDateRangeFilter] = useState<string>('all');
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
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();

  useEffect(() => {
    fetchProjectsWithFinances();
  }, []);

  useEffect(() => {
    if (initialCustomerFilter && projects.length > 0) {
      setCustomerFilter(initialCustomerFilter);
    }
  }, [initialCustomerFilter, projects]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      
      if (target.closest('button[class*="actionsDropdownButton"]') || 
          target.closest('button[class*="actionsDropdownItem"]')) {
        return;
      }
      
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
    };

    const handleScroll = () => {
      if (openMenuId) {
        setOpenMenuId(null);
      }
    };

    if (openMenuId) {
      setTimeout(() => {
        document.addEventListener('click', handleClickOutside);
        window.addEventListener('scroll', handleScroll, true);
      }, 0);
      return () => {
        document.removeEventListener('click', handleClickOutside);
        window.removeEventListener('scroll', handleScroll, true);
      };
    }
  }, [openMenuId]);

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
    return brideName || groomName || '';
  };

  const filteredProjects = useMemo(() => {
    let filtered = projects;

    // Filter by customer
    if (customerFilter !== 'all') {
      filtered = filtered.filter(project => project.projectId === customerFilter);
    }

    // Filter by date range
    if (dateRangeFilter !== 'all') {
      const now = new Date();
      filtered = filtered.filter(project => {
        const transactions = project.finance?.transactions || [];
        if (transactions.length === 0) return false;

        return transactions.some(transaction => {
          const txDate = new Date(transaction.datetime);
          const daysDiff = Math.floor((now.getTime() - txDate.getTime()) / (1000 * 60 * 60 * 24));

          switch (dateRangeFilter) {
            case 'today':
              return daysDiff === 0;
            case 'week':
              return daysDiff <= 7;
            case 'month':
              return daysDiff <= 30;
            case 'quarter':
              return daysDiff <= 90;
            default:
              return true;
          }
        });
      });
    }

    return filtered;
  }, [projects, customerFilter, dateRangeFilter]);

  const customerOptions = useMemo(() => {
    const options = [{ value: 'all', label: 'All Customers' }];
    projects.forEach(project => {
      options.push({
        value: project.projectId,
        label: project.projectName
      });
    });
    return options;
  }, [projects]);

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

  const formatAmount = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const getAvatarColors = (name: string) => {
    const colors = [
      { bg: 'rgba(99, 102, 241, 0.1)', text: '#4f46e5', border: 'rgba(99, 102, 241, 0.2)' },    // indigo
      { bg: 'rgba(59, 130, 246, 0.1)', text: '#2563eb', border: 'rgba(59, 130, 246, 0.2)' },    // blue
      { bg: 'rgba(34, 197, 94, 0.1)', text: '#16a34a', border: 'rgba(34, 197, 94, 0.2)' },      // green
      { bg: 'rgba(245, 158, 11, 0.1)', text: '#d97706', border: 'rgba(245, 158, 11, 0.2)' },    // amber
      { bg: 'rgba(239, 68, 68, 0.1)', text: '#dc2626', border: 'rgba(239, 68, 68, 0.2)' },      // red
      { bg: 'rgba(236, 72, 153, 0.1)', text: '#db2777', border: 'rgba(236, 72, 153, 0.2)' },    // pink
      { bg: 'rgba(6, 182, 212, 0.1)', text: '#0891b2', border: 'rgba(6, 182, 212, 0.2)' },      // cyan
      { bg: 'rgba(20, 184, 166, 0.1)', text: '#0d9488', border: 'rgba(20, 184, 166, 0.2)' },    // teal
      { bg: 'rgba(249, 115, 22, 0.1)', text: '#ea580c', border: 'rgba(249, 115, 22, 0.2)' },    // orange
      { bg: 'rgba(168, 85, 247, 0.1)', text: '#9333ea', border: 'rgba(168, 85, 247, 0.2)' },    // violet
      { bg: 'rgba(234, 179, 8, 0.1)', text: '#ca8a04', border: 'rgba(234, 179, 8, 0.2)' },      // yellow
      { bg: 'rgba(14, 165, 233, 0.1)', text: '#0284c7', border: 'rgba(14, 165, 233, 0.2)' },    // sky
      { bg: 'rgba(16, 185, 129, 0.1)', text: '#059669', border: 'rgba(16, 185, 129, 0.2)' },    // emerald
      { bg: 'rgba(244, 63, 94, 0.1)', text: '#e11d48', border: 'rgba(244, 63, 94, 0.2)' },      // rose
    ];
    
    let hash = 0;
    for (let i = 0; i < (name?.length || 0); i++) {
      hash = ((hash << 5) - hash) + name.charCodeAt(i);
      hash = hash & hash;
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .filter(word => word.toLowerCase() !== '&' && word.toLowerCase() !== 'and')
      .map(word => word.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('');
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

    // Validate that received amount doesn't exceed pending amount
    if (transactionForm.nature === 'received') {
      const totalBudget = selectedProject.finance?.totalBudget || 0;
      const receivedAmount = selectedProject.finance?.receivedAmount || 0;
      const pendingAmount = totalBudget - receivedAmount;
      const transactionAmount = parseFloat(transactionForm.amount);

      if (transactionAmount > pendingAmount) {
        showToast('error', `Amount received (₹${transactionAmount.toLocaleString('en-IN')}) cannot exceed pending amount (₹${pendingAmount.toLocaleString('en-IN')})`);
        return;
      }
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
      onDataChange?.(); // Refresh stats
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
      header: 'Customer',
      sortable: true,
      render: (row) => {
        const colors = getAvatarColors(row.projectName);
        const clientName = row.contactPerson || getCustomerName(row);

        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {row.displayPic ? (
              <img 
                src={row.displayPic} 
                alt="Profile"
                style={{ 
                  width: '40px', 
                  height: '40px', 
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: `1.5px solid ${colors.border}`,
                  flexShrink: 0
                }}
              />
            ) : (
              <div style={{ 
                width: '40px', 
                height: '40px', 
                borderRadius: '50%',
                backgroundColor: colors.bg,
                border: `1.5px solid ${colors.border}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px',
                fontWeight: '600',
                color: colors.text,
                flexShrink: 0,
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                {getInitials(row.projectName)}
              </div>
            )}
            <div>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                {row.projectName}
              </div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                {clientName}
              </div>
            </div>
          </div>
        );
      },
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
        <div style={{ position: 'relative' }} onClick={(e) => e.stopPropagation()}>
          <button
            className={styles.actionsDropdownButton}
            onClick={(e) => {
              e.stopPropagation();
              const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
              setDropdownPosition({
                top: rect.bottom + 4,
                left: rect.right - 160
              });
              setOpenMenuId(openMenuId === row.projectId ? null : row.projectId);
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </button>

          {openMenuId === row.projectId && createPortal(
            <>
              <div
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  zIndex: 999
                }}
                onClick={() => {
                  setOpenMenuId(null);
                  setDropdownPosition(null);
                }}
              />
              <div 
                ref={menuRef} 
                className={styles.actionsDropdown}
                style={{ top: `${dropdownPosition?.top || 0}px`, left: `${dropdownPosition?.left || 0}px` }}
              >
              <button
                className={styles.actionsDropdownItem}
                onClick={(e) => {
                  e.stopPropagation();
                  handleAddPaymentClick(row);
                  setOpenMenuId(null);
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Payment
              </button>
            </div>
          </>,
          document.body
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
        data={filteredProjects}
        emptyMessage="No customer finance records found"
        renderExpandedRow={renderExpandedRow}
        getRowKey={(row) => row.projectId}
        itemsPerPage={5}
        customFilters={
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <Select
              value={customerFilter}
              onChange={setCustomerFilter}
              options={customerOptions}
              placeholder="Filter by customer"
              className={styles.statusFilterSelect}
            />
            <Select
              value={dateRangeFilter}
              onChange={setDateRangeFilter}
              options={[
                { value: 'all', label: 'All Time' },
                { value: 'today', label: 'Today' },
                { value: 'week', label: 'Last 7 Days' },
                { value: 'month', label: 'Last 30 Days' },
                { value: 'quarter', label: 'Last 90 Days' }
              ]}
              placeholder="Filter by date"
              className={styles.statusFilterSelect}
            />
          </div>
        }
      />

      <Modal
        isOpen={isAddPaymentModalOpen}
        onClose={handleCloseModal}
        title={`Add Payment - ${selectedProject ? getCustomerName(selectedProject) : ''}`}
        size="small"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {selectedProject && transactionForm.nature === 'received' && (
            <div style={{
              padding: '0.75rem',
              background: 'var(--bg-secondary)',
              borderRadius: '0.5rem',
              border: '1px solid var(--border-color)',
              fontSize: '0.875rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Total Budget:</span>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                  {formatAmount(selectedProject.finance?.totalBudget || 0)}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Received:</span>
                <span style={{ fontWeight: 600, color: '#10b981' }}>
                  {formatAmount(selectedProject.finance?.receivedAmount || 0)}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.5rem', borderTop: '1px solid var(--border-color)' }}>
                <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Pending Amount:</span>
                <span style={{ fontWeight: 700, color: '#ef4444', fontSize: '1rem' }}>
                  {formatAmount((selectedProject.finance?.totalBudget || 0) - (selectedProject.finance?.receivedAmount || 0))}
                </span>
              </div>
            </div>
          )}
          
          <DatePicker
            label="Date"
            value={transactionForm.datetime}
            onChange={(value) => setTransactionForm({ ...transactionForm, datetime: value })}
            placeholder="Select date"
            required
            info="Select the date when this payment was received or made"
          />

          <AmountInput
            label="Amount"
            value={transactionForm.amount}
            onChange={(value) => setTransactionForm({ ...transactionForm, amount: value })}
            placeholder="Enter amount"
            required
            info={transactionForm.nature === 'received' 
              ? "Amount received from customer. Cannot exceed pending amount" 
              : "Amount paid for project expenses or vendor payments"}
            error={
              transactionForm.nature === 'received' && 
              transactionForm.amount && 
              selectedProject &&
              parseFloat(transactionForm.amount) > ((selectedProject.finance?.totalBudget || 0) - (selectedProject.finance?.receivedAmount || 0))
                ? `Cannot exceed pending amount of ${formatAmount((selectedProject.finance?.totalBudget || 0) - (selectedProject.finance?.receivedAmount || 0))}`
                : undefined
            }
          />

          <Select
            label="Type"
            value={transactionForm.nature}
            onChange={(value) => setTransactionForm({ ...transactionForm, nature: value as 'received' | 'paid' })}
            options={[
              { value: 'received', label: 'Received' },
              { value: 'paid', label: 'Paid' }
            ]}
            required
            info="Choose 'Received' for payments from customer, 'Paid' for expenses"
          />

          <Textarea
            label="Comment"
            value={transactionForm.comment}
            onChange={(e) => setTransactionForm({ ...transactionForm, comment: e.target.value })}
            placeholder="Add a comment (optional)"
            rows={3}
            maxLength={500}
            showCharCount={true}
            info="Optional notes about this transaction (e.g., payment method, purpose)"
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
                background: isSubmitting ? '#d1d5db' : '#6366f1',
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
