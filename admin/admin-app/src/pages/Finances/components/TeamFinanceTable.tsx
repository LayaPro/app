import { useState, useEffect, useRef } from 'react';
import { teamApi, teamFinanceApi } from '../../../services/api';
import { DataTable } from '../../../components/ui/DataTable';
import type { Column } from '../../../components/ui/DataTable';
import { Modal } from '../../../components/ui/Modal';
import { useToast } from '../../../context/ToastContext';
import { Input } from '../../../components/ui/Input';
import { DatePicker } from '../../../components/ui/DatePicker';
import { Select } from '../../../components/ui/Select';
import { Textarea } from '../../../components/ui/Textarea';

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
  const menuRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();

  useEffect(() => {
    fetchTeamMembersWithFinances();
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

  const columns: Column<TeamMemberWithFinance>[] = [
    {
      key: 'memberName',
      header: 'Name',
      sortable: true,
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 600,
            fontSize: '0.875rem',
          }}>
            {row.firstName[0]}{row.lastName[0]}
          </div>
          <div>
            <div style={{ fontWeight: 600, color: '#1f2937' }}>{getMemberName(row)}</div>
            <div style={{ fontSize: '0.8125rem', color: '#6b7280' }}>
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
      )
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
              setOpenMenuId(openMenuId === row.memberId ? null : row.memberId);
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
          {openMenuId === row.memberId && (
            <div
              ref={menuRef}
              style={{
                position: 'absolute',
                right: 0,
                top: '100%',
                marginTop: '0.25rem',
                background: 'white',
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
                  handleOpenModal(row);
                  setOpenMenuId(null);
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Make Payment
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
                  // TODO: Edit salary functionality
                  setOpenMenuId(null);
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit Salary
              </button>
            </div>
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
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <DatePicker
              label="Date"
              value={transactionForm.datetime}
              onChange={(value) => setTransactionForm({ ...transactionForm, datetime: value })}
              required
            />
            <Input
              label="Time"
              type="time"
              value={transactionForm.time}
              onChange={(e) => setTransactionForm({ ...transactionForm, time: e.target.value })}
            />
          </div>

          <Input
            label="Amount"
            type="number"
            value={transactionForm.amount}
            onChange={(e) => setTransactionForm({ ...transactionForm, amount: e.target.value })}
            placeholder="Enter amount"
            required
          />

          <Select
            label="Payment Type"
            value={transactionForm.nature}
            onChange={(value) => setTransactionForm({ ...transactionForm, nature: value as any })}
            options={[
              { value: 'paid', label: 'Regular Payment' },
              { value: 'bonus', label: 'Bonus' },
              { value: 'deduction', label: 'Deduction' }
            ]}
            required
          />

          <Textarea
            label="Comment"
            value={transactionForm.comment}
            onChange={(e) => setTransactionForm({ ...transactionForm, comment: e.target.value })}
            placeholder="Add a note (optional)"
            rows={3}
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
                background: isSubmitting || !transactionForm.amount ? '#d1d5db' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
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
