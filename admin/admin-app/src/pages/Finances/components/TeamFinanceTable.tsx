import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { teamApi, teamFinanceApi, clientEventApi, expenseApi, expenseTypeApi, projectApi } from '../../../services/api';
import { DataTable } from '../../../components/ui/DataTable';
import type { Column } from '../../../components/ui/DataTable';
import { Modal } from '../../../components/ui/Modal';
import { useToast } from '../../../context/ToastContext';
import { Input } from '../../../components/ui/Input';
import { DatePicker } from '../../../components/ui/DatePicker';
import { Select } from '../../../components/ui/Select';
import { SearchableSelect } from '../../../components/ui/SearchableSelect';
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
  totalPayable?: number; // Total amount owed to team member across all projects
  paidAmount?: number; // Total already paid through expenses
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
  projectCount?: number;
  eventCount?: number;
}

interface ExpenseType {
  expenseTypeId: string;
  name: string;
  description?: string;
  requiresProject: boolean;
  requiresEvent: boolean;
  requiresMember: boolean;
  displayOrder: number;
  isActive: boolean;
}

export const TeamFinanceTable = () => {
  const [teamMembers, setTeamMembers] = useState<TeamMemberWithFinance[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddPaymentModalOpen, setIsAddPaymentModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMemberWithFinance | null>(null);
  const [expenseTypes, setExpenseTypes] = useState<ExpenseType[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [projectEvents, setProjectEvents] = useState<any[]>([]);
  const [clientEvents, setClientEvents] = useState<any[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<any[]>([]);
  const [selectedMemberPendingPayable, setSelectedMemberPendingPayable] = useState<number | null>(null);
  const [transactionForm, setTransactionForm] = useState({
    datetime: new Date().toISOString().split('T')[0],
    time: '',
    amount: '',
    comment: '',
    nature: 'paid' as 'paid' | 'bonus' | 'deduction',
    expenseTypeId: '',
    projectId: '',
    eventId: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const menuRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();

  useEffect(() => {
    fetchTeamMembersWithFinances();
    fetchExpenses();
    fetchExpenseTypes();
    fetchProjects();
    fetchClientEvents();
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

  // Filter projects based on selected team member
  useEffect(() => {
    if (transactionForm.expenseTypeId && selectedMember?.memberId && clientEvents.length > 0) {
      const memberEventsByProject = clientEvents.filter((event: any) =>
        event.teamMembersAssigned &&
        Array.isArray(event.teamMembersAssigned) &&
        event.teamMembersAssigned.includes(selectedMember.memberId)
      );

      const projectIds = [...new Set(memberEventsByProject.map((event: any) => event.projectId))];
      const filtered = projects.filter(p => projectIds.includes(p.projectId));
      setFilteredProjects(filtered);

      if (transactionForm.projectId && !projectIds.includes(transactionForm.projectId)) {
        setTransactionForm(prev => ({ ...prev, projectId: '', eventId: '' }));
      }
    } else {
      setFilteredProjects(projects);
    }
  }, [transactionForm.expenseTypeId, selectedMember?.memberId, clientEvents, projects]);

  useEffect(() => {
    if (transactionForm.projectId) {
      const selectedProject = projects.find(p => p.projectId === transactionForm.projectId);
      if (selectedProject && selectedProject.events) {
        let mappedEvents = selectedProject.events.map((projectEvent: any) => ({
          ...projectEvent,
          eventName: projectEvent.eventName || 'Unnamed Event'
        }));

        if (selectedMember?.memberId) {
          const memberClientEventIds = clientEvents
            .filter((ce: any) =>
              ce.projectId === transactionForm.projectId &&
              ce.teamMembersAssigned &&
              Array.isArray(ce.teamMembersAssigned) &&
              ce.teamMembersAssigned.includes(selectedMember.memberId)
            )
            .map((ce: any) => ce.clientEventId);

          mappedEvents = mappedEvents.filter((pe: any) =>
            memberClientEventIds.includes(pe.clientEventId)
          );
        }

        setProjectEvents(mappedEvents);
      } else {
        setProjectEvents([]);
      }
      setTransactionForm(prev => ({ ...prev, eventId: '' }));
    } else {
      setProjectEvents([]);
    }
  }, [transactionForm.projectId, selectedMember?.memberId, projects, clientEvents]);

  const fetchTeamMembersWithFinances = async () => {
    try {      setLoading(true);      const [teamResponse, financeResponse, eventsResponse] = await Promise.all([
        teamApi.getAll(),
        teamFinanceApi.getAll(),
        clientEventApi.getAll()
      ]);

      const membersData = teamResponse?.teamMembers || [];
      const financesData = financeResponse?.teamFinances || [];
      const eventsData = eventsResponse?.clientEvents || [];

      // Calculate project and event counts per member
      const membersWithFinances = membersData.map((member: any) => {
        // Find all events where this member is assigned
        const memberEvents = eventsData.filter((event: any) => 
          event.teamMembersAssigned && 
          Array.isArray(event.teamMembersAssigned) && 
          event.teamMembersAssigned.includes(member.memberId)
        );
        
        // Count unique projects
        const uniqueProjects = new Set(memberEvents.map((event: any) => event.projectId));
        
        return {
          ...member,
          finance: financesData.find((f: TeamFinance) => f.memberId === member.memberId),
          projectCount: uniqueProjects.size,
          eventCount: memberEvents.length
        };
      });

      setTeamMembers(membersWithFinances);
    } catch (error) {
      console.error('Error fetching team members with finances:', error);
      showToast('error', 'Failed to load finance data');
    } finally {
      setLoading(false);
    }
  };

  const fetchExpenses = async () => {
    try {
      const response = await expenseApi.getAll({ limit: 500 });
      setExpenses(response.expenses || []);
    } catch (error) {
      console.error('Error fetching expenses:', error);
    }
  };

  const fetchExpenseTypes = async () => {
    try {
      const response = await expenseTypeApi.getAll();
      setExpenseTypes(response.expenseTypes || []);
    } catch (error) {
      console.error('Error fetching expense types:', error);
    }
  };

  const fetchProjects = async () => {
    try {
      const response = await projectApi.getAll();
      setProjects(response.projects || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const fetchClientEvents = async () => {
    try {
      const response = await clientEventApi.getAll();
      setClientEvents(response.clientEvents || []);
    } catch (error) {
      console.error('Error fetching client events:', error);
    }
  };

  const getMemberName = (member: TeamMemberWithFinance) => {
    return `${member.firstName} ${member.lastName}`;
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Loading team finance data...</p>
      </div>
    );
  }

  const formatCurrency = (amount?: number) => {
    if (amount === undefined || amount === null) return '—';
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const handleOpenModal = (member?: TeamMemberWithFinance) => {
    if (member) {
      setSelectedMember(member);
    }
    const now = new Date();
    setTransactionForm({
      datetime: now.toISOString().split('T')[0],
      time: '',
      amount: '',
      comment: '',
      nature: 'paid',
      expenseTypeId: '',
      projectId: '',
      eventId: ''
    });
    setProjectEvents([]);
    setSelectedMemberPendingPayable(null);
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
      nature: 'paid',
      expenseTypeId: '',
      projectId: '',
      eventId: ''
    });
    setProjectEvents([]);
    setSelectedMemberPendingPayable(null);
  };

  const handleSubmitTransaction = async () => {
    if (!selectedMember || !transactionForm.amount || !transactionForm.expenseTypeId) {
      showToast('error', 'Please fill in all required fields');
      return;
    }

    try {
      setIsSubmitting(true);

      await expenseApi.create({
        expenseTypeId: transactionForm.expenseTypeId,
        projectId: transactionForm.projectId || undefined,
        eventId: transactionForm.eventId || undefined,
        memberId: selectedMember.memberId,
        amount: parseFloat(transactionForm.amount),
        comment: transactionForm.comment,
        date: transactionForm.datetime
      });

      showToast('success', 'Payment added successfully');
      handleCloseModal();
      fetchExpenses(); // Refresh data
      fetchTeamMembersWithFinances();
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

  // Build options for expense form
  const expenseTypeOptions = expenseTypes
    .filter(et => et.isActive && et.requiresMember)
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .map(et => ({
      value: et.expenseTypeId,
      label: et.name
    }));

  const selectedExpenseType = expenseTypes.find(et => et.expenseTypeId === transactionForm.expenseTypeId);

  const projectOptions = filteredProjects.map(p => ({
    value: p.projectId,
    label: p.projectName
  }));

  const eventOptions = [
    { value: '', label: 'No Event' },
    ...projectEvents.map(e => ({
      value: e.eventId || e.clientEventId,
      label: e.eventName || 'Unnamed Event'
    }))
  ];

  const teamMemberOptions = teamMembers.map(m => ({
    value: m.memberId,
    label: `${m.firstName} ${m.lastName}`
  }));

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
      key: 'totalPayable',
      header: 'Total Payable',
      sortable: true,
      render: (row) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ fontWeight: 600, color: '#059669' }}>
            {formatCurrency(row.finance?.totalPayable)}
          </span>
          {(row.projectCount || row.eventCount) ? (
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
              {row.projectCount || 0} project{row.projectCount !== 1 ? 's' : ''} • {row.eventCount || 0} event{row.eventCount !== 1 ? 's' : ''}
            </span>
          ) : null}
        </div>
      )
    },
    {
      key: 'paidAmount',
      header: 'Paid Amount',
      sortable: true,
      render: (row) => (
        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
          {formatCurrency(row.finance?.paidAmount)}
        </span>
      )
    },
    {
      key: 'pendingAmount',
      header: 'Pending',
      sortable: true,
      render: (row) => {
        const totalPayable = row.finance?.totalPayable || 0;
        const paidAmount = row.finance?.paidAmount || 0;
        const pending = totalPayable - paidAmount;
        return (
          <span style={{ 
            color: pending > 0 ? '#dc2626' : pending < 0 ? '#059669' : '#6b7280',
            fontWeight: pending !== 0 ? 600 : 400
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

    // Filter expenses for this member
    const memberExpenses = expenses.filter(exp => exp.memberId === member.memberId);
    const sortedExpenses = [...memberExpenses].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    return (
      <div style={{ 
        padding: '0',
        background: 'var(--bg-secondary)',
      }}>
        {sortedTransactions.length > 0 && (
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

        {/* Expenses Section */}
        <div style={{
          padding: '0.25rem 1.5rem 0',
          borderTop: sortedTransactions.length > 0 ? '1px solid var(--border-color)' : 'none'
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.375rem'
          }}>
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ color: 'var(--color-primary)' }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
            </svg>
            <h3 style={{ 
              margin: 0, 
              fontSize: '0.75rem', 
              fontWeight: 600, 
              color: 'var(--text-secondary)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              Expense Payments
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
              {sortedExpenses.length}
            </span>
          </div>
        </div>
        
        {sortedExpenses.length === 0 ? (
          <div style={{ 
            padding: '2rem 1.5rem', 
            textAlign: 'center',
            color: 'var(--text-tertiary)'
          }}>
            <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" style={{ margin: '0 auto 0.5rem', opacity: 0.5 }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
            </svg>
            <p style={{ margin: 0, fontSize: '0.8125rem', fontWeight: 500 }}>No expenses yet</p>
          </div>
        ) : (
          <div style={{ padding: '0.25rem 1.5rem 0.5rem' }}>
            <div style={{ 
              background: 'var(--bg-primary)',
              borderRadius: '0.375rem',
              overflow: 'hidden',
              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
              border: '1px solid var(--border-color)'
            }}>
              {sortedExpenses.map((expense, index) => (
                <div 
                  key={expense.expenseId} 
                  style={{ 
                    display: 'grid',
                    gridTemplateColumns: '1.75fr 1fr 1fr 2fr',
                    gap: '0.5rem',
                    padding: '0.5rem 0.75rem',
                    borderBottom: index < sortedExpenses.length - 1 ? '1px solid var(--border-color)' : 'none',
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
                      background: 'rgba(239, 68, 68, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <svg width="14" height="14" fill="none" stroke="#ef4444" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 19.5v-15m0 0l-6.75 6.75M12 4.5l6.75 6.75" />
                      </svg>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.0625rem' }}>
                        {new Date(expense.date).toLocaleDateString('en-IN', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </div>
                      <div style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)' }}>
                        {expense.expenseTypeName || 'N/A'}
                      </div>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <div style={{ 
                      fontSize: '0.8125rem', 
                      fontWeight: 700, 
                      color: '#ef4444'
                    }}>
                      - ₹{expense.amount.toLocaleString('en-IN')}
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <div style={{ 
                      fontSize: '0.6875rem', 
                      color: 'var(--text-secondary)',
                      fontWeight: 500
                    }}>
                      {expense.projectName || '—'}
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <div style={{ 
                      fontSize: '0.75rem', 
                      color: expense.comment ? '#475569' : '#94a3b8',
                      fontStyle: expense.comment ? 'normal' : 'italic',
                      lineHeight: '1.4',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {expense.comment || 'No comment'}
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

  return (
    <>
      <DataTable
        title="Team Finance"
        titleIcon={
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        }
        columns={columns}
        data={teamMembers}
        renderExpandedRow={renderExpandedRow}
        emptyMessage="No team members found"
        itemsPerPage={5}
        onCreateClick={() => handleOpenModal()}
        createButtonText="Add Payment"
      />

      <Modal
        isOpen={isAddPaymentModalOpen}
        onClose={handleCloseModal}
        title={`Make Payment - ${selectedMember ? getMemberName(selectedMember) : 'Select Member'}`}
        size="medium"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontSize: '14px',
              fontWeight: '500',
              color: 'var(--text-primary)'
            }}>
              Expense Type <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <SearchableSelect
              value={transactionForm.expenseTypeId}
              onChange={(value) => setTransactionForm(prev => ({ ...prev, expenseTypeId: value, projectId: '', eventId: '' }))}
              options={expenseTypeOptions}
              placeholder="Select expense type (team member payments)"
            />
          </div>

          {selectedExpenseType?.requiresMember && !selectedMember?.memberId && (
            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                fontSize: '14px',
                fontWeight: '500',
                color: 'var(--text-primary)'
              }}>
                Team Member <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <SearchableSelect
                value={selectedMember?.memberId || ''}
                onChange={(value) => {
                  const member = teamMembers.find(m => m.memberId === value);
                  if (member) {
                    setSelectedMember(member);
                  }
                }}
                options={teamMemberOptions}
                placeholder="Select team member"
              />
              {selectedMember?.memberId && (
                <p style={{ 
                  fontSize: '12px', 
                  color: 'var(--text-secondary)', 
                  marginTop: '6px',
                  fontStyle: 'italic'
                }}>
                  Projects and events filtered to show only those where this member is assigned
                </p>
              )}
            </div>
          )}

          {selectedExpenseType?.requiresMember && selectedMember?.memberId && (
            <div style={{
              padding: '12px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px'
            }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                fontSize: '14px',
                fontWeight: '500',
                color: 'var(--text-primary)'
              }}>
                Team Member
              </label>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: getAvatarColors(getMemberName(selectedMember)).bg,
                  border: `2px solid ${getAvatarColors(getMemberName(selectedMember)).border}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: getAvatarColors(getMemberName(selectedMember)).text,
                  flexShrink: 0
                }}>
                  {getMemberName(selectedMember)
                    .split(' ')
                    .map(n => n[0])
                    .join('')
                    .toUpperCase()}
                </div>
                <div>
                  <div style={{ 
                    fontWeight: 600, 
                    color: 'var(--text-primary)' 
                  }}>
                    {getMemberName(selectedMember)}
                  </div>
                  <div style={{ 
                    fontSize: '0.875rem', 
                    color: 'var(--text-secondary)' 
                  }}>
                    {selectedMember.profileName || 'No Profile'}
                  </div>
                </div>
              </div>
              <p style={{ 
                fontSize: '12px', 
                color: 'var(--text-secondary)', 
                marginTop: '8px',
                marginBottom: 0,
                fontStyle: 'italic'
              }}>
                Projects and events filtered to show only those where this member is assigned
              </p>
            </div>
          )}

          <div>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontSize: '14px',
              fontWeight: '500',
              color: 'var(--text-primary)'
            }}>
              Project {selectedExpenseType?.requiresProject && <span style={{ color: '#ef4444' }}>*</span>}
            </label>
            <SearchableSelect
              value={transactionForm.projectId}
              onChange={(value) => setTransactionForm(prev => ({ ...prev, projectId: value }))}
              options={projectOptions}
              placeholder={selectedExpenseType?.requiresProject ? "Select project" : "Select project or leave for general payment"}
              disabled={selectedExpenseType?.requiresMember && !selectedMember?.memberId}
            />
            {transactionForm.projectId && selectedMemberPendingPayable !== null && (
              <p style={{ 
                fontSize: '12px', 
                color: 'var(--text-secondary)', 
                marginTop: '6px',
                fontStyle: 'italic'
              }}>
                Pending payable for this project: ₹{selectedMemberPendingPayable.toLocaleString('en-IN')}
              </p>
            )}
          </div>

          {transactionForm.projectId && projectEvents.length > 0 && (
            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                fontSize: '14px',
                fontWeight: '500',
                color: 'var(--text-primary)'
              }}>
                Event {selectedExpenseType?.requiresEvent && <span style={{ color: '#ef4444' }}>*</span>}
              </label>
              <Select
                value={transactionForm.eventId}
                onChange={(value) => setTransactionForm(prev => ({ ...prev, eventId: value }))}
                options={eventOptions}
                placeholder={selectedExpenseType?.requiresEvent ? "Select event" : "Select event (optional)"}
              />
            </div>
          )}

          <div>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontSize: '14px',
              fontWeight: '500',
              color: 'var(--text-primary)'
            }}>
              Date
            </label>
            <DatePicker
              value={transactionForm.datetime}
              onChange={(value) => setTransactionForm({ ...transactionForm, datetime: value })}
            />
          </div>

          <div>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontSize: '14px',
              fontWeight: '500',
              color: 'var(--text-primary)'
            }}>
              Amount <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <AmountInput
              value={transactionForm.amount}
              onChange={(value) => setTransactionForm(prev => ({ ...prev, amount: value }))}
              placeholder="Enter amount"
            />
          </div>

          <div>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontSize: '14px',
              fontWeight: '500',
              color: 'var(--text-primary)'
            }}>
              Notes
            </label>
            <Textarea
              value={transactionForm.comment}
              onChange={(e) => setTransactionForm(prev => ({ ...prev, comment: e.target.value }))}
              placeholder="Add notes (optional)"
              rows={3}
              maxLength={500}
              showCharCount={true}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
            <button
              onClick={handleCloseModal}
              disabled={isSubmitting}
              style={{
                padding: '0.625rem 1.25rem',
                background: 'var(--bg-tertiary)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-color)',
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
              disabled={isSubmitting || !transactionForm.amount || !transactionForm.expenseTypeId}
              style={{
                padding: '0.625rem 1.25rem',
                background: isSubmitting || !transactionForm.amount || !transactionForm.expenseTypeId ? '#d1d5db' : '#6366f1',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: isSubmitting || !transactionForm.amount || !transactionForm.expenseTypeId ? 'not-allowed' : 'pointer',
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
