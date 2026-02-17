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
import { projectApi, eventApi, expenseApi } from '../../../services/api';
import styles from './FinanceTables.module.css';

interface Expense {
  expenseId: string;
  projectId?: string;
  projectName?: string;
  eventId?: string;
  eventName?: string;
  amount: number;
  comment: string;
  date: string;
  createdAt: string;
}

export const ExpensesTable = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [projectEvents, setProjectEvents] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();

  const [expenseForm, setExpenseForm] = useState({
    projectId: '',
    eventId: '',
    amount: '',
    comment: '',
    date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchExpenses();
    fetchProjects();
    fetchEvents();
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

  useEffect(() => {
    if (expenseForm.projectId) {
      const selectedProject = projects.find(p => p.projectId === expenseForm.projectId);
      if (selectedProject && selectedProject.events) {
        // Map events to include the event type name from events master
        const mappedEvents = selectedProject.events.map((projectEvent: any) => {
          const eventType = events.find(e => e.eventId === projectEvent.eventId);
          return {
            ...projectEvent,
            eventName: projectEvent.eventName || eventType?.eventDesc || eventType?.eventCode || 'Unnamed Event'
          };
        });
        setProjectEvents(mappedEvents);
      } else {
        setProjectEvents([]);
      }
      setExpenseForm(prev => ({ ...prev, eventId: '' }));
    } else {
      setProjectEvents([]);
    }
  }, [expenseForm.projectId, projects, events]);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const response = await expenseApi.getAll({ limit: 100 });
      setExpenses(response.expenses || []);
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

  const handleAddExpense = () => {
    setEditingExpense(null);
    setExpenseForm({
      projectId: '',
      eventId: '',
      amount: '',
      comment: '',
      date: new Date().toISOString().split('T')[0]
    });
    setIsAddModalOpen(true);
  };

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setExpenseForm({
      projectId: expense.projectId || '',
      eventId: expense.eventId || '',
      amount: expense.amount?.toString() || '',
      comment: expense.comment || '',
      date: expense.date ? new Date(expense.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
    });
    setIsAddModalOpen(true);
  };

  const handleSubmit = async () => {
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
        projectId: expenseForm.projectId || undefined,
        eventId: expenseForm.eventId || undefined,
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
        projectId: '',
        eventId: '',
        amount: '',
        comment: '',
        date: new Date().toISOString().split('T')[0]
      });
      
      // Refresh expenses list
      fetchExpenses();
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
      fetchExpenses();
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
    ...projects.map(p => ({
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

  return (
    <>
      <DataTable
        data={expenses}
        columns={columns}
        emptyMessage="No expenses recorded yet"
        itemsPerPage={10}
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
          </div>

          <div>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontSize: '14px',
              fontWeight: '500',
              color: 'var(--text-primary)'
            }}>
              Project (Optional)
            </label>
            <SearchableSelect
              value={expenseForm.projectId}
              onChange={(value) => setExpenseForm(prev => ({ ...prev, projectId: value }))}
              options={projectOptions}
              placeholder="Select project or leave for general expense"
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
                Event (Optional)
              </label>
              <Select
                value={expenseForm.eventId}
                onChange={(value) => setExpenseForm(prev => ({ ...prev, eventId: value }))}
                options={eventOptions}
                placeholder="Select event"
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
