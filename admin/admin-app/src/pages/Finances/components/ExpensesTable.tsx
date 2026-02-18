import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { DataTable } from '../../../components/ui/DataTable';
import type { Column } from '../../../components/ui/DataTable';
import { Modal } from '../../../components/ui/Modal';
import { ConfirmationModal } from '../../../components/ui/ConfirmationModal';
import { Button } from '../../../components/ui/Button';
import { Select } from '../../../components/ui/Select';
import { SearchableSelect } from '../../../components/ui/SearchableSelect';
import { AmountInput } from '../../../components/ui/AmountInput';
import { Textarea } from '../../../components/ui/Textarea';
import { DatePicker } from '../../../components/ui/DatePicker';
import { useToast } from '../../../context/ToastContext';
import { projectApi, eventApi, expenseApi, expenseTypeApi, teamApi, clientEventApi, teamFinanceApi } from '../../../services/api';
import { getAvatarColors, getInitials } from '../../../utils/avatarColors';
import styles from './FinanceTables.module.css';

interface Expense {
  expenseId: string;
  projectId?: string;
  projectName?: string;
  eventId?: string;
  eventName?: string;
  memberId?: string;
  memberName?: string;
  expenseTypeId?: string;
  expenseTypeName?: string;
  amount: number;
  comment: string;
  date: string;
  category?: string;
  createdAt: string;
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

export const ExpensesTable = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [itemsPerPage] = useState(8);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [projectEvents, setProjectEvents] = useState<any[]>([]);
  const [clientEvents, setClientEvents] = useState<any[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<any[]>([]);
  const [expenseTypes, setExpenseTypes] = useState<ExpenseType[]>([]);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [teamFinances, setTeamFinances] = useState<any[]>([]);
  const [selectedMemberPendingPayable, setSelectedMemberPendingPayable] = useState<number | null>(null);
  const [selectedProjectEventCount, setSelectedProjectEventCount] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();

  const [expenseForm, setExpenseForm] = useState({
    expenseTypeId: '',
    projectId: '',
    eventId: '',
    memberId: '',
    amount: '',
    comment: '',
    date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchExpenses();
    fetchProjects();
    fetchEvents();
    fetchExpenseTypes();
    fetchTeamMembers();
    fetchClientEvents();
    fetchTeamFinances();
  }, []);

  useEffect(() => {
    fetchExpenses(currentPage);
  }, [currentPage]);

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
    if (expenseForm.memberId && clientEvents.length > 0) {
      // Find all events where this member is assigned
      const memberEventsByProject = clientEvents.filter((event: any) =>
        event.teamMembersAssigned &&
        Array.isArray(event.teamMembersAssigned) &&
        event.teamMembersAssigned.includes(expenseForm.memberId)
      );

      // Get unique project IDs
      const projectIds = [...new Set(memberEventsByProject.map((event: any) => event.projectId))];

      // Filter projects
      const filtered = projects.filter(p => projectIds.includes(p.projectId));
      setFilteredProjects(filtered);
      
      // Reset project and event if current selection is not in filtered list
      if (expenseForm.projectId && !projectIds.includes(expenseForm.projectId)) {
        setExpenseForm(prev => ({ ...prev, projectId: '', eventId: '' }));
      }
    } else {
      setFilteredProjects(projects);
    }
  }, [expenseForm.memberId, clientEvents, projects]);

  useEffect(() => {
    if (expenseForm.projectId) {
      const selectedProject = projects.find(p => p.projectId === expenseForm.projectId);
      if (selectedProject && selectedProject.events) {
        // Map events to include the event type name from events master
        let mappedEvents = selectedProject.events.map((projectEvent: any) => {
          const eventType = events.find(e => e.eventId === projectEvent.eventId);
          return {
            ...projectEvent,
            eventName: projectEvent.eventName || eventType?.eventDesc || eventType?.eventCode || 'Unnamed Event'
          };
        });

        // If a team member is selected, filter to only events where they are assigned
        if (expenseForm.memberId) {
          const memberClientEventIds = clientEvents
            .filter((ce: any) =>
              ce.projectId === expenseForm.projectId &&
              ce.teamMembersAssigned &&
              Array.isArray(ce.teamMembersAssigned) &&
              ce.teamMembersAssigned.includes(expenseForm.memberId)
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
      setExpenseForm(prev => ({ ...prev, eventId: '' }));
    } else {
      setProjectEvents([]);
    }
  }, [expenseForm.projectId, expenseForm.memberId, projects, events, clientEvents]);

  // Calculate pending payable for selected member and project
  useEffect(() => {
    console.log('Calculating pending amount:', {
      memberId: expenseForm.memberId,
      projectId: expenseForm.projectId,
      teamMembersCount: teamMembers.length,
      clientEventsCount: clientEvents.length,
      expensesCount: expenses.length
    });

    if (expenseForm.memberId && expenseForm.projectId && teamMembers.length > 0 && clientEvents.length > 0) {
      const member = teamMembers.find((tm: any) => tm.memberId === expenseForm.memberId);
      
      console.log('Found member:', member);
      
      if (member) {
        console.log('Member payment details:', {
          paymentType: member.paymentType,
          salary: member.salary
        });
        
        // Get events for this project where the member is assigned
        const projectMemberEvents = clientEvents.filter(
          (event: any) => 
            event.projectId === expenseForm.projectId && 
            event.teamMembersAssigned && 
            event.teamMembersAssigned.includes(expenseForm.memberId)
        );
        
        console.log('Project member events:', projectMemberEvents.length);
        
        const eventCount = projectMemberEvents.length;
        setSelectedProjectEventCount(eventCount);
        
        if (eventCount > 0 && member.salary) {
          // Calculate payable for this project only
          let projectPayable = 0;
          const salaryAmount = parseFloat(member.salary) || 0;
          
          if (member.paymentType === 'per-month') {
            // For per-month, count unique months in this project
            const uniqueMonths = new Set(
              projectMemberEvents.map((event: any) => {
                const eventDate = new Date(event.eventDate);
                return `${eventDate.getFullYear()}-${eventDate.getMonth()}`;
              })
            );
            projectPayable = uniqueMonths.size * salaryAmount;
          } else if (member.paymentType === 'per-event') {
            // For per-event, multiply by event count for this project
            projectPayable = eventCount * salaryAmount;
          }
          
          console.log('Project payable:', projectPayable, 'Salary amount:', salaryAmount, 'Event count:', eventCount);
          
          // Get already paid amount for this project
          const projectExpenses = expenses.filter(
            (exp: any) => 
              exp.memberId === expenseForm.memberId && 
              exp.projectId === expenseForm.projectId
          );
          const paidForProject = projectExpenses.reduce((sum: number, exp: any) => sum + (exp.amount || 0), 0);
          
          console.log('Paid for project:', paidForProject, 'Expenses count:', projectExpenses.length);
          
          const pending = projectPayable - paidForProject;
          console.log('Pending amount:', pending);
          
          setSelectedMemberPendingPayable(pending > 0 ? pending : 0);
        } else {
          console.log('No events for this member on this project');
          setSelectedMemberPendingPayable(null);
          setSelectedProjectEventCount(0);
        }
      } else {
        console.log('Member not found');
        setSelectedMemberPendingPayable(null);
        setSelectedProjectEventCount(0);
      }
    } else {
      console.log('Missing required data');
      setSelectedMemberPendingPayable(null);
      setSelectedProjectEventCount(0);
    }
  }, [expenseForm.memberId, expenseForm.projectId, teamMembers, clientEvents, expenses]);

  const fetchExpenses = async (page = currentPage) => {
    try {
      setLoading(true);
      const response = await expenseApi.getAll({ 
        limit: itemsPerPage, 
        page: page
      });
      setExpenses(response.expenses || []);
      setTotalCount(response.pagination?.totalItems || 0);
    } catch (error: any) {
      console.error('Error fetching expenses:', error);
      showToast('error', 'Failed to load expenses');
    } finally {
      setLoading(false);
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

  const fetchEvents = async () => {
    try {
      const response = await eventApi.getAll();
      setEvents(response.events || []);
    } catch (error) {
      console.error('Error fetching events:', error);
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

  const fetchTeamMembers = async () => {
    try {
      const response = await teamApi.getAll();
      setTeamMembers(response.teamMembers || []);
    } catch (error) {
      console.error('Error fetching team members:', error);
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

  const fetchTeamFinances = async () => {
    try {
      const response = await teamFinanceApi.getAll();
      setTeamFinances(response.teamFinances || []);
    } catch (error) {
      console.error('Error fetching team finances:', error);
    }
  };

  const handleAddExpense = () => {
    setEditingExpense(null);
    setExpenseForm({
      expenseTypeId: '',
      projectId: '',
      eventId: '',
      memberId: '',
      amount: '',
      comment: '',
      date: new Date().toISOString().split('T')[0]
    });
    setIsAddModalOpen(true);
  };

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setExpenseForm({
      expenseTypeId: expense.expenseTypeId || '',
      projectId: expense.projectId || '',
      eventId: expense.eventId || '',
      memberId: expense.memberId || '',
      amount: expense.amount?.toString() || '',
      comment: expense.comment || '',
      date: expense.date ? new Date(expense.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
    });
    setIsAddModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!expenseForm.expenseTypeId) {
      showToast('error', 'Please select an expense type');
      return;
    }

    const selectedExpenseType = expenseTypes.find(et => et.expenseTypeId === expenseForm.expenseTypeId);
    
    if (selectedExpenseType?.requiresProject && !expenseForm.projectId) {
      showToast('error', 'Project is required for this expense type');
      return;
    }

    if (selectedExpenseType?.requiresEvent && !expenseForm.eventId) {
      showToast('error', 'Event is required for this expense type');
      return;
    }

    if (selectedExpenseType?.requiresMember && !expenseForm.memberId) {
      showToast('error', 'Team member is required for this expense type');
      return;
    }

    if (!expenseForm.amount || parseFloat(expenseForm.amount) <= 0) {
      showToast('error', 'Please enter a valid amount');
      return;
    }

    if (!expenseForm.comment.trim()) {
      showToast('error', 'Please enter a comment');
      return;
    }

    try {
      setIsSubmitting(true);
      
      const expenseData = {
        expenseTypeId: expenseForm.expenseTypeId,
        projectId: expenseForm.projectId || undefined,
        eventId: expenseForm.eventId || undefined,
        memberId: expenseForm.memberId || undefined,
        amount: parseFloat(expenseForm.amount),
        comment: expenseForm.comment,
        date: expenseForm.date
      };

      if (editingExpense) {
        await expenseApi.update(editingExpense.expenseId, expenseData);
        showToast('success', 'Expense updated successfully');
      } else {
        await expenseApi.create(expenseData);
        showToast('success', 'Expense added successfully');
      }
      setIsAddModalOpen(false);
      setEditingExpense(null);
      setExpenseForm({
        expenseTypeId: '',
        projectId: '',
        eventId: '',
        memberId: '',
        amount: '',
        comment: '',
        date: new Date().toISOString().split('T')[0]
      });
      
      // Refresh expenses list
      setCurrentPage(1);
      fetchExpenses(1);
    } catch (error: any) {
      console.error('Error adding expense:', error);
      showToast('error', error.message || 'Failed to add expense');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteExpense = async () => {
    if (!expenseToDelete) return;

    try {
      setIsDeleting(true);
      await expenseApi.delete(expenseToDelete.expenseId);
      showToast('success', 'Expense deleted successfully');
      setExpenseToDelete(null);
      setCurrentPage(1);
      fetchExpenses(1);
    } catch (error: any) {
      console.error('Error deleting expense:', error);
      showToast('error', error.message || 'Failed to delete expense');
    } finally {
      setIsDeleting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  const columns: Column<Expense>[] = [
    {
      key: 'memberName',
      header: 'Team Member',
      sortable: true,
      render: (expense) => {
        if (!expense.memberName) {
          return <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>-</span>;
        }
        const colors = getAvatarColors(expense.memberName);
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              minWidth: '36px',
              minHeight: '36px',
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
              {getInitials(expense.memberName)}
            </div>
            <span style={{ fontSize: '14px' }}>{expense.memberName}</span>
          </div>
        );
      }
    },
    {
      key: 'expenseTypeName',
      header: 'Type',
      sortable: true,
      render: (expense) => (
        <div style={{ fontSize: '14px', fontWeight: '500' }}>
          {expense.expenseTypeName || <span style={{ color: 'var(--text-secondary)' }}>-</span>}
        </div>
      )
    },
    {
      key: 'projectName',
      header: 'Project',
      sortable: true,
      render: (expense) => (
        <div style={{ fontSize: '14px' }}>
          {expense.projectName || <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>General</span>}
        </div>
      )
    },
    {
      key: 'eventName',
      header: 'Event',
      sortable: true,
      render: (expense) => (
        <div style={{ fontSize: '14px' }}>
          {expense.eventName || <span style={{ color: 'var(--text-secondary)' }}>-</span>}
        </div>
      )
    },
    {
      key: 'amount',
      header: 'Amount',
      sortable: true,
      render: (expense) => (
        <div style={{ 
          fontSize: '14px', 
          fontWeight: '600',
          color: '#ef4444'
        }}>
          {formatCurrency(expense.amount)}
        </div>
      )
    },
    {
      key: 'date',
      header: 'Date',
      sortable: true,
      render: (expense) => (
        <div style={{ fontSize: '14px' }}>
          {formatDate(expense.date)}
        </div>
      )
    },
    {
      key: 'comment',
      header: 'Comment',
      render: (expense) => (
        <div style={{ 
          fontSize: '14px',
          maxWidth: '300px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}>
          {expense.comment}
        </div>
      )
    },
    {
      key: 'expenseId',
      header: 'Actions',
      render: (expense) => (
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
              setOpenMenuId(openMenuId === expense.expenseId ? null : expense.expenseId);
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </button>

          {openMenuId === expense.expenseId && createPortal(
            <>
              <div
                className={styles.dropdownBackdrop}
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
                    handleEditExpense(expense);
                    setOpenMenuId(null);
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit
                </button>
                <button
                  className={styles.actionsDropdownItem}
                  onClick={(e) => {
                    e.stopPropagation();
                    setExpenseToDelete(expense);
                    setOpenMenuId(null);
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete
                </button>
              </div>
            </>,
            document.body
          )}
        </div>
      )
    }
  ];

  const projectOptions = [
    { value: '', label: 'General Expense (No Project)' },
    ...filteredProjects.map(p => ({
      value: p.projectId,
      label: p.projectName
    }))
  ];

  const eventOptions = [
    { value: '', label: 'No Event' },
    ...projectEvents.map(e => ({
      value: e.eventId,
      label: e.eventName || 'Unnamed Event'
    }))
  ];

  const expenseTypeOptions = expenseTypes
    .filter(et => et.isActive)
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .map(et => ({
      value: et.expenseTypeId,
      label: et.name
    }));

  const selectedExpenseType = expenseTypes.find(et => et.expenseTypeId === expenseForm.expenseTypeId);

  const teamMemberOptions = teamMembers.map(m => ({
    value: m.memberId,
    label: `${m.firstName} ${m.lastName}`
  }));

  if (loading && expenses.length === 0) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Loading expenses...</p>
      </div>
    );
  }

  return (
    <>
      <DataTable
        title="Expenses"
        titleIcon={
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        }
        data={expenses}
        columns={columns}
        emptyMessage="No expenses recorded yet"
        itemsPerPage={itemsPerPage}
        serverSide={true}
        currentPage={currentPage}
        totalPages={Math.ceil(totalCount / itemsPerPage)}
        totalItems={totalCount}
        onPageChange={setCurrentPage}
        onCreateClick={handleAddExpense}
        createButtonText="Add Expense"
      />

      <Modal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingExpense(null);
        }}
        title={editingExpense ? 'Edit Expense' : 'Add New Expense'}
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
              value={expenseForm.expenseTypeId}
              onChange={(value) => setExpenseForm(prev => ({ ...prev, expenseTypeId: value, projectId: '', eventId: '' }))}
              options={expenseTypeOptions}
              placeholder="Select expense type"
            />
          </div>

          {selectedExpenseType?.requiresMember && (
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
                value={expenseForm.memberId}
                onChange={(value) => setExpenseForm(prev => ({ ...prev, memberId: value, projectId: '', eventId: '' }))}
                options={teamMemberOptions}
                placeholder="Select team member"
              />
              {expenseForm.memberId && (
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
              value={expenseForm.projectId}
              onChange={(value) => setExpenseForm(prev => ({ ...prev, projectId: value }))}
              options={projectOptions}
              placeholder={selectedExpenseType?.requiresProject ? "Select project" : "Select project or leave for general expense"}
              disabled={selectedExpenseType?.requiresMember && !expenseForm.memberId}
            />
          </div>

          {expenseForm.projectId && projectEvents.length > 0 && (
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
                value={expenseForm.eventId}
                onChange={(value) => setExpenseForm(prev => ({ ...prev, eventId: value }))}
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
              value={expenseForm.date}
              onChange={(value) => setExpenseForm(prev => ({ ...prev, date: value }))}
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
              value={expenseForm.amount}
              onChange={(value) => setExpenseForm(prev => ({ ...prev, amount: value }))}
              placeholder="Enter amount"
            />
            {selectedMemberPendingPayable !== null && selectedMemberPendingPayable > 0 && selectedExpenseType?.requiresMember && expenseForm.projectId && (
              <div style={{
                marginTop: '8px',
                padding: '10px 12px',
                backgroundColor: '#fef3c7',
                borderLeft: '3px solid #f59e0b',
                borderRadius: '4px'
              }}>
                <p style={{ 
                  fontSize: '13px',
                  color: '#92400e',
                  margin: 0,
                  fontWeight: '500'
                }}>
                  ₹{selectedMemberPendingPayable.toLocaleString('en-IN')} pending on this project • {selectedProjectEventCount} event{selectedProjectEventCount !== 1 ? 's' : ''} assigned
                </p>
              </div>
            )}
          </div>

          <div>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontSize: '14px',
              fontWeight: '500',
              color: 'var(--text-primary)'
            }}>
              Comment <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <Textarea
              value={expenseForm.comment}
              onChange={(e) => setExpenseForm(prev => ({ ...prev, comment: e.target.value }))}
              placeholder="Enter expense details..."
              rows={3}
            />
          </div>

          <div style={{ 
            display: 'flex', 
            gap: '12px', 
            justifyContent: 'flex-end',
            marginTop: '12px'
          }}>
            <Button
              variant="secondary"
              onClick={() => {
                setIsAddModalOpen(false);
                setEditingExpense(null);
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (editingExpense ? 'Saving...' : 'Adding...') : (editingExpense ? 'Save Changes' : 'Add Expense')}
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmationModal
        isOpen={!!expenseToDelete}
        onClose={() => setExpenseToDelete(null)}
        onConfirm={handleDeleteExpense}
        title="Delete Expense"
        message={`Are you sure you want to delete this expense? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
        isLoading={isDeleting}
      />
    </>
  );
};
