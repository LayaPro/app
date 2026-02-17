import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { teamApi, teamFinanceApi } from '../../../services/api';
import { DataTable } from '../../../components/ui/DataTable';
import type { Column } from '../../../components/ui/DataTable';
import { Modal } from '../../../components/ui/Modal';
import { useToast } from '../../../context/ToastContext';
import { Input } from '../../../components/ui/Input';
import { DatePicker } from '../../../components/ui/DatePicker';
import { Select } from '../../../components/ui/Select';
import { Textarea } from '../../../components/ui/Textarea';
import { AmountInput } from '../../../components/ui/AmountInput';
import styles from './FinanceTables.module.css';

interface SalaryTransaction {
  transactionId: string;
  datetime: string | Date;
  amount: number;
  comment?: string;
  nature: 'paid' | 'bonus' | 'deduction';
  createdAt?: string;
}

interface TeamFinance {
  financeId: string;
  memberId: string;
  monthlySalary?: number;
  totalPaid?: number;
  lastPaymentDate?: Date;
  nextPaymentDate?: Date;
  pendingAmount?: number;
  transactions?: SalaryTransaction[];
  createdAt?: string;
  updatedAt?: string;
}

interface TeamMemberWithFinance {
  memberId: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  profileName?: string;
  isFreelancer: boolean;
  paymentType?: string;
  salary?: string | number;
  finance?: TeamFinance;
}

export const TeamFinanceTable = () => {
  const [teamMembers, setTeamMembers] = useState<TeamMemberWithFinance[]>([]);
  const [isAddPaymentModalOpen, setIsAddPaymentModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMemberWithFinance | null>(null);
  const [transactionForm, setTransactionForm] = useState({
    datetime: new Date().toISOString().split('T')[0],
    time: '',
    amount: '',
    comment: '',
    nature: 'paid' as 'paid' | 'bonus' | 'deduction'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const menuRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();

  useEffect(() => {
    fetchTeamMembersWithFinances();
  }, []);

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

  const fetchTeamMembersWithFinances = async () => {
    try {
      const [teamResponse, financeResponse] = await Promise.all([
        teamApi.getAll(),
        teamFinanceApi.getAll()
      ]);

      const membersData = teamResponse?.teamMembers || [];
      const financesData = financeResponse?.teamFinances || [];

      // Map finances to team members
      const membersWithFinances = membersData.map((member: any) => ({
        ...member,
        finance: financesData.find((f: TeamFinance) => f.memberId === member.memberId)
      }));

      setTeamMembers(membersWithFinances);
    } catch (error) {
      console.error('Error fetching team members with finances:', error);
      showToast('error', 'Failed to load finance data');
    }
  };

  const getMemberName = (member: TeamMemberWithFinance) => {
    return `${member.firstName} ${member.lastName}`;
  };


  const formatCurrency = (amount?: number) => {
    if (amount === undefined || amount === null) return '—';
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const handleOpenModal = (member: TeamMemberWithFinance) => {
    setSelectedMember(member);
    const now = new Date();
    setTransactionForm({
      datetime: now.toISOString().split('T')[0],
      time: now.toTimeString().slice(0, 5),
      amount: '',
      comment: '',
      nature: 'paid'
    });
    setIsAddPaymentModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsAddPaymentModalOpen(false);
    setSelectedMember(null);
    setTransactionForm({
      datetime: new Date().toISOString().split('T')[0],
      time: '',
      amount: '',
      comment: '',
      nature: 'paid'
    });
  };

  const handleSubmitTransaction = async () => {
    if (!selectedMember || !transactionForm.amount) {
      showToast('error', 'Please fill in all required fields');
      return;
    }

    try {
      setIsSubmitting(true);
      // Combine date and time
      const datetimeString = transactionForm.time 
        ? `${transactionForm.datetime}T${transactionForm.time}:00`
        : `${transactionForm.datetime}T00:00:00`;
      
      await teamFinanceApi.addTransaction(selectedMember.memberId, {
        datetime: datetimeString,
        amount: parseFloat(transactionForm.amount),
        comment: transactionForm.comment,
        nature: transactionForm.nature
      });

      showToast('success', 'Payment added successfully');
      handleCloseModal();
      fetchTeamMembersWithFinances(); // Refresh data
    } catch (error: any) {
      console.error('Error adding payment:', error);
      showToast('error', error.message || 'Failed to add payment');
    } finally {
      setIsSubmitting(false);
    }
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

  const columns: Column<TeamMemberWithFinance>[] = [
    {
      key: 'memberName',
      header: 'Name',
      sortable: true,
      render: (row) => {
        const memberName = getMemberName(row);
        const colors = getAvatarColors(memberName);
        const initials = `${row.firstName[0]}${row.lastName[0]}`.toUpperCase();

        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
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
              {initials}
            </div>
            <div>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{memberName}</div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                {row.profileName || 'No Profile'}
                {row.isFreelancer && (
                  <span style={{
                    marginLeft: '0.5rem',
                    fontSize: '0.75rem',
                    padding: '0.125rem 0.375rem',
                    background: '#fef3c7',
                    color: '#92400e',
                    borderRadius: '0.25rem',
                    fontWeight: 500
                  }}>
                    Freelancer
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      }
    },
    {
      key: 'compensation',
      header: 'Compensation',
      sortable: true,
      render: (row) => {
        const paymentType = row.paymentType || 'Not set';
        const displayType = paymentType === 'per-month' ? 'Per Month' : paymentType === 'per-event' ? 'Per Event' : 'Not set';
        const bgColor = paymentType === 'per-month' ? '#eff6ff' : paymentType === 'per-event' ? '#fef3c7' : '#f3f4f6';
        const textColor = paymentType === 'per-month' ? '#1e40af' : paymentType === 'per-event' ? '#92400e' : '#6b7280';
        
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {row.salary ? (
              <span style={{ fontWeight: '600', color: '#059669' }}>
                {formatCurrency(parseFloat(String(row.salary)) || 0)}
              </span>
            ) : (
              <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                -
              </span>
            )}
            <span style={{
              padding: '2px 8px',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: '600',
              whiteSpace: 'nowrap',
              background: bgColor,
              color: textColor,
              display: 'inline-block',
              width: 'fit-content'
            }}>
              {displayType}
            </span>
          </div>
        );
      }
    },
    {
      key: 'totalPaid',
      header: 'Total Payable',
      sortable: true,
      render: (row) => (
        <span style={{ fontWeight: 600, color: '#1f2937' }}>
          {formatCurrency(row.finance?.totalPaid)}
        </span>
      )
    },
    {
      key: 'pendingAmount',
      header: 'Pending Payment',
      sortable: true,
      render: (row) => {
        const pending = row.finance?.pendingAmount || 0;
        return (
          <span style={{ 
            color: pending > 0 ? '#dc2626' : '#6b7280',
            fontWeight: pending > 0 ? 600 : 400
          }}>
            {formatCurrency(pending)}
          </span>
        );
      }
    },
    {
      key: 'memberId',
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
              setOpenMenuId(openMenuId === row.memberId ? null : row.memberId);
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </button>

          {openMenuId === row.memberId && createPortal(
            <>
              <div 
                className={styles.dropdownBackdrop}
                onClick={() => setOpenMenuId(null)}
              />
              <div 
                ref={menuRef} 
                className={styles.actionsDropdown}
                style={{ top: `${dropdownPosition.top}px`, left: `${dropdownPosition.left}px` }}
              >
              <button
                className={styles.actionsDropdownItem}
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenModal(row);
                  setOpenMenuId(null);
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Make Payment
              </button>
              <button
                className={styles.actionsDropdownItem}
                onClick={(e) => {
                  e.stopPropagation();
                  // TODO: View details functionality
                  setOpenMenuId(null);
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                View Details
              </button>
              <button
                className={styles.actionsDropdownItem}
                onClick={(e) => {
                  e.stopPropagation();
                  // TODO: Edit salary functionality
                  setOpenMenuId(null);
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit Salary
              </button>
            </div>
          </>,
          document.body
        )}
        </div>
      ),
    }
  ];

  const renderExpandedRow = (member: TeamMemberWithFinance) => {
    const transactions = member.finance?.transactions || [];
    const sortedTransactions = [...transactions].sort(
      (a, b) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime()
    );

    return (
      <div style={{ 
        background: 'linear-gradient(to bottom, #f9fafb, #ffffff)',
        borderRadius: '0.5rem',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0.5rem 1rem',
          borderBottom: '1px solid #e5e7eb'
        }}>
          <h3 style={{
            fontSize: '0.875rem',
            fontWeight: 700,
            color: '#1f2937',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            margin: 0
          }}>
            Transactions
          </h3>
          <button
            onClick={() => handleOpenModal(member)}
            style={{
              padding: '0.375rem 0.75rem',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '0.375rem',
              fontSize: '0.8125rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
            }}
          >
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Make Payment
          </button>
        </div>

        {/* Transactions List */}
        {sortedTransactions.length === 0 ? (
          <div style={{
            padding: '2rem',
            textAlign: 'center',
            color: '#9ca3af',
            fontSize: '0.875rem'
          }}>
            No transactions yet
          </div>
        ) : (
          <div style={{ padding: '0.5rem' }}>
            {/* Table Header */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1.75fr 1.25fr 0.75fr 2fr',
              gap: '0.5rem',
              padding: '0.5rem',
              fontSize: '0.75rem',
              fontWeight: 700,
              color: '#6b7280',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Date & Time
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Amount
              </div>
              <div>Type</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
                Comment
              </div>
            </div>

            {/* Table Rows */}
            {sortedTransactions.map((transaction, index) => (
              <div
                key={transaction.transactionId}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1.75fr 1.25fr 0.75fr 2fr',
                  gap: '0.5rem',
                  padding: '0.5rem',
                  background: index % 2 === 0 ? '#ffffff' : '#f9fafb',
                  borderRadius: '0.375rem',
                  fontSize: '0.8125rem',
                  alignItems: 'center',
                  transition: 'all 0.2s',
                  cursor: 'default'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#f3f4f6';
                  e.currentTarget.style.transform = 'translateX(2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = index % 2 === 0 ? '#ffffff' : '#f9fafb';
                  e.currentTarget.style.transform = 'translateX(0)';
                }}
              >
                <div style={{ color: '#4b5563' }}>
                  <div style={{ fontWeight: 600 }}>
                    {new Date(transaction.datetime).toLocaleDateString('en-IN', { 
                      year: 'numeric', month: 'short', day: 'numeric'
                    })}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                    {new Date(transaction.datetime).toLocaleTimeString('en-IN', { 
                      hour: '2-digit', minute: '2-digit'
                    })}
                  </div>
                </div>
                <div style={{ 
                  fontWeight: 700,
                  color: transaction.nature === 'deduction' ? '#dc2626' : '#059669'
                }}>
                  {transaction.nature === 'deduction' ? '-' : ''}₹{transaction.amount.toLocaleString('en-IN')}
                </div>
                <div>
                  <span style={{
                    padding: '0.25rem 0.5rem',
                    borderRadius: '0.25rem',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    background: transaction.nature === 'paid' ? '#dcfce7' :
                               transaction.nature === 'bonus' ? '#fef3c7' : '#fee2e2',
                    color: transaction.nature === 'paid' ? '#166534' :
                           transaction.nature === 'bonus' ? '#92400e' : '#991b1b',
                    border: `1px solid ${
                      transaction.nature === 'paid' ? '#bbf7d0' :
                      transaction.nature === 'bonus' ? '#fde68a' : '#fecaca'
                    }`,
                    textTransform: 'capitalize'
                  }}>
                    {transaction.nature}
                  </span>
                </div>
                <div style={{ color: '#6b7280', fontStyle: transaction.comment ? 'normal' : 'italic' }}>
                  {transaction.comment || 'No comment'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <DataTable
        columns={columns}
        data={teamMembers}
        renderExpandedRow={renderExpandedRow}
        emptyMessage="No team members found"
        itemsPerPage={5}
      />

      <Modal
        isOpen={isAddPaymentModalOpen}
        onClose={handleCloseModal}
        title={`Make Payment - ${selectedMember ? getMemberName(selectedMember) : ''}`}
        size="medium"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <DatePicker
            label="Date"
            value={transactionForm.datetime}
            onChange={(value) => setTransactionForm({ ...transactionForm, datetime: value })}
            required
            info="Select the date when this salary payment was made"
          />

          <AmountInput
            label="Amount"
            value={transactionForm.amount}
            onChange={(value) => setTransactionForm({ ...transactionForm, amount: value })}
            placeholder="Enter amount"
            required
            info="Enter the payment amount. Use bonus for additional payments or deduction for salary reductions"
          />

          <Select
            label="Type"
            value={transactionForm.nature}
            onChange={(value) => setTransactionForm({ ...transactionForm, nature: value as any })}
            options={[
              { value: 'paid', label: 'Regular Payment' },
              { value: 'bonus', label: 'Bonus' },
              { value: 'deduction', label: 'Deduction' }
            ]}
            required
            info="Regular Payment: Monthly salary | Bonus: Additional payment | Deduction: Amount deducted from salary"
          />

          <Textarea
            label="Comment"
            value={transactionForm.comment}
            onChange={(e) => setTransactionForm({ ...transactionForm, comment: e.target.value })}
            placeholder="Add a note (optional)"
            rows={3}
            maxLength={500}
            showCharCount={true}
            info="Optional notes about this payment (e.g., reason for bonus or deduction)"
          />

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
            <button
              onClick={handleCloseModal}
              disabled={isSubmitting}
              style={{
                padding: '0.625rem 1.25rem',
                background: '#f3f4f6',
                color: '#374151',
                border: 'none',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                opacity: isSubmitting ? 0.5 : 1
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmitTransaction}
              disabled={isSubmitting || !transactionForm.amount}
              style={{
                padding: '0.625rem 1.25rem',
                background: isSubmitting || !transactionForm.amount ? '#d1d5db' : '#6366f1',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: isSubmitting || !transactionForm.amount ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              {isSubmitting ? (
                <>
                  <div style={{
                    width: '14px',
                    height: '14px',
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: 'white',
                    borderRadius: '50%',
                    animation: 'spin 0.6s linear infinite'
                  }} />
                  Processing...
                </>
              ) : (
                <>
                  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Add Payment
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
};
