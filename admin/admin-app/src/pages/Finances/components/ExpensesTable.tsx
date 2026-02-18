import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { DataTable } from '../../../components/ui/DataTable';
import type { Column } from '../../../components/ui/DataTable';
import { ConfirmationModal } from '../../../components/ui/ConfirmationModal';
import { useToast } from '../../../context/ToastContext';
import { expenseApi, teamApi, projectApi, expenseTypeApi } from '../../../services/api';
import { getAvatarColors, getInitials } from '../../../utils/avatarColors';
import { SearchableSelect } from '../../../components/ui/SearchableSelect';
import { ExpenseModal } from './ExpenseModal';
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

export const ExpensesTable = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [itemsPerPage] = useState(8);
  // Filters
  const [filterMemberId, setFilterMemberId] = useState('');
  const [filterExpenseTypeId, setFilterExpenseTypeId] = useState('');
  const [filterProjectId, setFilterProjectId] = useState('');
  // Filter options
  const [memberOptions, setMemberOptions] = useState<{ value: string; label: string }[]>([]);
  const [expenseTypeOptions, setExpenseTypeOptions] = useState<{ value: string; label: string }[]>([]);
  const [projectOptions, setProjectOptions] = useState<{ value: string; label: string }[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();

  useEffect(() => {
    fetchExpenses();
    fetchFilterOptions();
  }, []);

  useEffect(() => {
    fetchExpenses(currentPage, filterMemberId, filterExpenseTypeId, filterProjectId);
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

  const fetchExpenses = async (
    page = currentPage,
    memberId = filterMemberId,
    expenseTypeId = filterExpenseTypeId,
    projectId = filterProjectId,
  ) => {
    try {
      setLoading(true);
      const response = await expenseApi.getAll({
        limit: itemsPerPage,
        page,
        memberId: memberId || undefined,
        expenseTypeId: expenseTypeId || undefined,
        projectId: projectId || undefined,
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

  const fetchFilterOptions = async () => {
    try {
      const [membersRes, expenseTypesRes, projectsRes] = await Promise.all([
        teamApi.getAll(),
        expenseTypeApi.getAll(),
        projectApi.getAll(),
      ]);
      setMemberOptions([
        { value: '', label: 'All Members' },
        ...(membersRes?.teamMembers || []).map((m: any) => ({ value: m.memberId, label: `${m.firstName} ${m.lastName}` })),
      ]);
      setExpenseTypeOptions([
        { value: '', label: 'All Types' },
        ...(expenseTypesRes?.expenseTypes || []).map((t: any) => ({ value: t.expenseTypeId, label: t.name })),
      ]);
      setProjectOptions([
        { value: '', label: 'All Projects' },
        ...(projectsRes?.projects || []).map((p: any) => ({ value: p.projectId, label: p.projectName })),
      ]);
    } catch (error) {
      console.error('Error fetching filter options:', error);
    }
  };

  const handleAddExpense = () => {
    setEditingExpense(null);
    setIsAddModalOpen(true);
  };

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setIsAddModalOpen(true);
  };

  const handleDeleteExpense = async () => {
    if (!expenseToDelete) return;

    try {
      setIsDeleting(true);
      await expenseApi.delete(expenseToDelete.expenseId);
      showToast('success', 'Expense deleted successfully');
      setExpenseToDelete(null);
      setCurrentPage(1);
      fetchExpenses(1, filterMemberId, filterExpenseTypeId, filterProjectId);
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
                  className={`${styles.actionsDropdownItem} ${styles.actionsDropdownItemDanger}`}
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

  if (loading && expenses.length === 0) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Loading expenses...</p>
      </div>
    );
  }

  const handleFilterChange = (key: 'member' | 'type' | 'project', value: string) => {
    const newMember = key === 'member' ? value : filterMemberId;
    const newType = key === 'type' ? value : filterExpenseTypeId;
    const newProject = key === 'project' ? value : filterProjectId;
    if (key === 'member') setFilterMemberId(value);
    if (key === 'type') setFilterExpenseTypeId(value);
    if (key === 'project') setFilterProjectId(value);
    setCurrentPage(1);
    fetchExpenses(1, newMember, newType, newProject);
  };

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
        onPageChange={(page) => {
          setCurrentPage(page);
          fetchExpenses(page, filterMemberId, filterExpenseTypeId, filterProjectId);
        }}
        hideSearch
        customActions={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '150px' }}>
              <SearchableSelect
                value={filterMemberId}
                onChange={(v) => handleFilterChange('member', v)}
                options={memberOptions}
                placeholder="All Members"
                compact
              />
            </div>
            <div style={{ width: '140px' }}>
              <SearchableSelect
                value={filterExpenseTypeId}
                onChange={(v) => handleFilterChange('type', v)}
                options={expenseTypeOptions}
                placeholder="All Types"
                compact
              />
            </div>
            <div style={{ width: '150px' }}>
              <SearchableSelect
                value={filterProjectId}
                onChange={(v) => handleFilterChange('project', v)}
                options={projectOptions}
                placeholder="All Projects"
                compact
              />
            </div>
            <button
              onClick={handleAddExpense}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '10px 16px', background: '#6366f1', color: '#ffffff',
                border: 'none', borderRadius: '8px', fontSize: '14px',
                fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
              }}
            >
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Expense
            </button>
          </div>
        }
      />

      <ExpenseModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingExpense(null);
        }}
        onSuccess={() => {
          setCurrentPage(1);
          fetchExpenses(1, filterMemberId, filterExpenseTypeId, filterProjectId);
        }}
        mode="expense"
        editingExpense={editingExpense}
      />

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
