import { useState, useEffect } from 'react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Select } from '../../../components/ui/Select';
import { SearchableSelect } from '../../../components/ui/SearchableSelect';
import { AmountInput } from '../../../components/ui/AmountInput';
import { Textarea } from '../../../components/ui/Textarea';
import { DatePicker } from '../../../components/ui/DatePicker';
import { useToast } from '../../../context/ToastContext';
import { projectApi, eventApi, expenseApi, expenseTypeApi, teamApi, clientEventApi } from '../../../services/api';
import { getAvatarColors } from '../../../utils/avatarColors';

interface Expense {
  expenseId: string;
  projectId?: string;
  eventId?: string;
  memberId?: string;
  expenseTypeId?: string;
  amount: number;
  comment: string;
  date: string;
}

interface ExpenseType {
  expenseTypeId: string;
  name: string;
  requiresProject: boolean;
  requiresEvent: boolean;
  requiresMember: boolean;
  displayOrder: number;
  isActive: boolean;
}

export interface PreselectedMember {
  memberId: string;
  firstName: string;
  lastName: string;
  profileName?: string;
}

export interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  /** 'expense' = full expense form (all types, comment required)
   *  'payment' = team payment form (requiresMember types only, comment optional) */
  mode?: 'expense' | 'payment';
  /** When provided, member is pre-locked (shown as info card, not selector) */
  preselectedMember?: PreselectedMember | null;
  /** When provided, modal is in edit mode */
  editingExpense?: Expense | null;
}

const getInitialForm = (editingExpense?: Expense | null, preselectedMemberId?: string) => ({
  expenseTypeId: editingExpense?.expenseTypeId || '',
  projectId: editingExpense?.projectId || '',
  eventId: editingExpense?.eventId || '',
  memberId: editingExpense?.memberId || preselectedMemberId || '',
  amount: editingExpense?.amount?.toString() || '',
  comment: editingExpense?.comment || '',
  date: editingExpense?.date
    ? new Date(editingExpense.date).toISOString().split('T')[0]
    : new Date().toISOString().split('T')[0],
});

export const ExpenseModal = ({
  isOpen,
  onClose,
  onSuccess,
  mode = 'expense',
  preselectedMember,
  editingExpense,
}: ExpenseModalProps) => {
  const isPaymentMode = mode === 'payment';

  const [expenseForm, setExpenseForm] = useState(
    getInitialForm(editingExpense, preselectedMember?.memberId)
  );
  const [projects, setProjects] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [projectEvents, setProjectEvents] = useState<any[]>([]);
  const [clientEvents, setClientEvents] = useState<any[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<any[]>([]);
  const [expenseTypes, setExpenseTypes] = useState<ExpenseType[]>([]);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [allExpenses, setAllExpenses] = useState<any[]>([]);
  const [selectedMemberPendingPayable, setSelectedMemberPendingPayable] = useState<number | null>(null);
  const [selectedProjectEventCount, setSelectedProjectEventCount] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [commentError, setCommentError] = useState('');
  const { showToast } = useToast();

  // Fetch reference data once on mount
  useEffect(() => {
    fetchExpenseTypes();
    fetchProjects();
    fetchEvents();
    fetchTeamMembers();
    fetchClientEvents();
    fetchAllExpenses();
  }, []);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setExpenseForm(getInitialForm(editingExpense, preselectedMember?.memberId));
      setProjectEvents([]);
      setSelectedMemberPendingPayable(null);
      setSelectedProjectEventCount(0);
      setCommentError('');
    }
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  // Filter projects based on the active member
  useEffect(() => {
    const activeMemberId = preselectedMember?.memberId || expenseForm.memberId;
    if (activeMemberId && clientEvents.length > 0 && projects.length > 0) {
      const memberEventsByProject = clientEvents.filter(
        (event: any) =>
          event.teamMembersAssigned &&
          Array.isArray(event.teamMembersAssigned) &&
          event.teamMembersAssigned.includes(activeMemberId)
      );
      const projectIds = [
        ...new Set(memberEventsByProject.map((event: any) => event.projectId)),
      ];
      const filtered = projects.filter((p) => projectIds.includes(p.projectId));
      setFilteredProjects(filtered);

      // Only reset selection if projects are loaded and current selection is invalid
      if (
        projects.length > 0 &&
        expenseForm.projectId &&
        !projectIds.includes(expenseForm.projectId)
      ) {
        setExpenseForm((prev) => ({ ...prev, projectId: '', eventId: '' }));
      }
    } else {
      setFilteredProjects(projects);
    }
  }, [expenseForm.memberId, preselectedMember?.memberId, clientEvents, projects]);

  // Load events for selected project
  useEffect(() => {
    const activeMemberId = preselectedMember?.memberId || expenseForm.memberId;
    if (expenseForm.projectId) {
      const selectedProject = projects.find((p) => p.projectId === expenseForm.projectId);
      if (selectedProject?.events) {
        let mappedEvents = selectedProject.events.map((projectEvent: any) => {
          const eventType = events.find((e) => e.eventId === projectEvent.eventId);
          return {
            ...projectEvent,
            eventName:
              projectEvent.eventName ||
              eventType?.eventDesc ||
              eventType?.eventCode ||
              'Unnamed Event',
          };
        });

        if (activeMemberId) {
          const memberClientEventIds = clientEvents
            .filter(
              (ce: any) =>
                ce.projectId === expenseForm.projectId &&
                ce.teamMembersAssigned &&
                Array.isArray(ce.teamMembersAssigned) &&
                ce.teamMembersAssigned.includes(activeMemberId)
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
      setExpenseForm((prev) => ({ ...prev, eventId: '' }));
    } else {
      setProjectEvents([]);
    }
  }, [expenseForm.projectId, expenseForm.memberId, preselectedMember?.memberId, projects, events, clientEvents]);

  // Calculate pending payable for the active member + project
  useEffect(() => {
    const activeMemberId = preselectedMember?.memberId || expenseForm.memberId;
    if (
      activeMemberId &&
      expenseForm.projectId &&
      teamMembers.length > 0 &&
      clientEvents.length > 0
    ) {
      const member = teamMembers.find((tm: any) => tm.memberId === activeMemberId);
      if (member) {
        const projectMemberEvents = clientEvents.filter(
          (event: any) =>
            event.projectId === expenseForm.projectId &&
            event.teamMembersAssigned &&
            event.teamMembersAssigned.includes(activeMemberId)
        );
        const eventCount = projectMemberEvents.length;
        setSelectedProjectEventCount(eventCount);

        if (eventCount > 0 && member.salary) {
          let projectPayable = 0;
          const salaryAmount = parseFloat(member.salary) || 0;

          if (member.paymentType === 'per-month') {
            const uniqueMonths = new Set(
              projectMemberEvents.map((event: any) => {
                const d = new Date(event.eventDate);
                return `${d.getFullYear()}-${d.getMonth()}`;
              })
            );
            projectPayable = uniqueMonths.size * salaryAmount;
          } else if (member.paymentType === 'per-event') {
            projectPayable = eventCount * salaryAmount;
          }

          const projectExpenses = allExpenses.filter(
            (exp: any) =>
              exp.memberId === activeMemberId && exp.projectId === expenseForm.projectId
          );
          const paidForProject = projectExpenses.reduce(
            (sum: number, exp: any) => sum + (exp.amount || 0),
            0
          );
          const pending = projectPayable - paidForProject;
          setSelectedMemberPendingPayable(pending > 0 ? pending : 0);
        } else {
          setSelectedMemberPendingPayable(null);
          setSelectedProjectEventCount(0);
        }
      } else {
        setSelectedMemberPendingPayable(null);
        setSelectedProjectEventCount(0);
      }
    } else {
      setSelectedMemberPendingPayable(null);
      setSelectedProjectEventCount(0);
    }
  }, [expenseForm.memberId, expenseForm.projectId, preselectedMember?.memberId, teamMembers, clientEvents, allExpenses]);

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

  const fetchEvents = async () => {
    try {
      const response = await eventApi.getAll();
      setEvents(response.events || []);
    } catch (error) {
      console.error('Error fetching events:', error);
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

  const fetchAllExpenses = async () => {
    try {
      const response = await expenseApi.getAll({ limit: 500 });
      setAllExpenses(response.expenses || []);
    } catch (error) {
      console.error('Error fetching expenses for calculation:', error);
    }
  };

  const handleSubmit = async () => {
    if (!expenseForm.expenseTypeId) {
      showToast('error', 'Please select an expense type');
      return;
    }

    const selectedExpenseType = expenseTypes.find(
      (et) => et.expenseTypeId === expenseForm.expenseTypeId
    );
    const activeMemberId = preselectedMember?.memberId || expenseForm.memberId;

    if (selectedExpenseType?.requiresProject && !expenseForm.projectId) {
      showToast('error', 'Project is required for this expense type');
      return;
    }
    if (selectedExpenseType?.requiresEvent && !expenseForm.eventId) {
      showToast('error', 'Event is required for this expense type');
      return;
    }
    if (selectedExpenseType?.requiresMember && !activeMemberId) {
      showToast('error', 'Team member is required for this expense type');
      return;
    }
    if (!expenseForm.amount || parseFloat(expenseForm.amount) <= 0) {
      showToast('error', 'Please enter a valid amount');
      return;
    }
    if (!expenseForm.comment.trim()) {
      setCommentError('Comment is required');
      return;
    }

    try {
      setIsSubmitting(true);
      const expenseData = {
        expenseTypeId: expenseForm.expenseTypeId,
        projectId: expenseForm.projectId || undefined,
        eventId: expenseForm.eventId || undefined,
        memberId: activeMemberId || undefined,
        amount: parseFloat(expenseForm.amount),
        comment: expenseForm.comment,
        date: expenseForm.date,
      };

      if (editingExpense) {
        await expenseApi.update(editingExpense.expenseId, expenseData);
        showToast('success', 'Expense updated successfully');
      } else {
        await expenseApi.create(expenseData);
        showToast(
          'success',
          isPaymentMode ? 'Payment added successfully' : 'Expense added successfully'
        );
      }
      onClose();
      onSuccess();
    } catch (error: any) {
      console.error('Error saving expense:', error);
      showToast(
        'error',
        error.message || (isPaymentMode ? 'Failed to add payment' : 'Failed to save expense')
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Derived values ──────────────────────────────────────────────────────────

  const selectedExpenseType = expenseTypes.find(
    (et) => et.expenseTypeId === expenseForm.expenseTypeId
  );
  const activeMemberId = preselectedMember?.memberId || expenseForm.memberId;

  const expenseTypeOptions = expenseTypes
    .filter((et) => et.isActive && (!isPaymentMode || et.requiresMember))
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .map((et) => ({ value: et.expenseTypeId, label: et.name }));

  const projectOptions = [
    ...(isPaymentMode ? [] : [{ value: '', label: 'General Expense (No Project)' }]),
    ...filteredProjects.map((p) => ({ value: p.projectId, label: p.projectName })),
  ];

  const eventOptions = [
    { value: '', label: 'No Event' },
    ...projectEvents.map((e) => ({
      value: e.eventId || e.clientEventId,
      label: e.eventName || 'Unnamed Event',
    })),
  ];

  const teamMemberOptions = teamMembers.map((m) => ({
    value: m.memberId,
    label: `${m.firstName} ${m.lastName}`,
  }));

  const preselectedMemberName = preselectedMember
    ? `${preselectedMember.firstName} ${preselectedMember.lastName}`
    : null;

  const modalTitle = isPaymentMode
    ? `Make Payment${preselectedMemberName ? ` - ${preselectedMemberName}` : ''}`
    : editingExpense
    ? 'Edit Expense'
    : 'Add New Expense';

  // Resolve member card data (pre-selected or selected via selector in payment mode)
  const memberCardData = (() => {
    if (!isPaymentMode || !selectedExpenseType?.requiresMember || !activeMemberId) return null;
    if (preselectedMember?.memberId) return preselectedMember;
    const found = teamMembers.find((m) => m.memberId === activeMemberId);
    return found
      ? { memberId: found.memberId, firstName: found.firstName, lastName: found.lastName, profileName: found.profileName }
      : null;
  })();

  const memberCardName = memberCardData
    ? `${memberCardData.firstName} ${memberCardData.lastName}`
    : '';
  const memberCardColors = memberCardName ? getAvatarColors(memberCardName) : null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={modalTitle} size="medium">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* ── Expense Type ─────────────────────────────────────────────────── */}
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)' }}>
            Expense Type <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <SearchableSelect
            value={expenseForm.expenseTypeId}
            onChange={(value) =>
              setExpenseForm((prev) => ({ ...prev, expenseTypeId: value, projectId: '', eventId: '' }))
            }
            options={expenseTypeOptions}
            placeholder={
              isPaymentMode
                ? 'Select expense type (team member payments)'
                : 'Select expense type'
            }
          />
        </div>

        {/* ── Team Member: selector (expense mode) ─────────────────────────── */}
        {!isPaymentMode && selectedExpenseType?.requiresMember && (
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)' }}>
              Team Member <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <SearchableSelect
              value={expenseForm.memberId}
              onChange={(value) =>
                setExpenseForm((prev) => ({ ...prev, memberId: value, projectId: '', eventId: '' }))
              }
              options={teamMemberOptions}
              placeholder="Select team member"
            />
            {expenseForm.memberId && (
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '6px', fontStyle: 'italic' }}>
                Projects and events filtered to show only those where this member is assigned
              </p>
            )}
          </div>
        )}

        {/* ── Team Member: selector (payment mode, no member yet) ───────────── */}
        {isPaymentMode &&
          selectedExpenseType?.requiresMember &&
          !activeMemberId && (
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)' }}>
              Team Member <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <SearchableSelect
              value={expenseForm.memberId}
              onChange={(value) =>
                setExpenseForm((prev) => ({ ...prev, memberId: value, projectId: '', eventId: '' }))
              }
              options={teamMemberOptions}
              placeholder="Select team member"
            />
          </div>
        )}

        {/* ── Team Member: info card (payment mode, member set) ─────────────── */}
        {memberCardData && memberCardColors && (
          <div
            style={{
              padding: '12px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
            }}
          >
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)' }}>
              Team Member
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: memberCardColors.bg,
                  border: `2px solid ${memberCardColors.border}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: memberCardColors.text,
                  flexShrink: 0,
                }}
              >
                {memberCardName
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase()}
              </div>
              <div>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                  {memberCardName}
                </div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  {memberCardData.profileName || 'No Profile'}
                </div>
              </div>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px', marginBottom: 0, fontStyle: 'italic' }}>
              Projects and events filtered to show only those where this member is assigned
            </p>
          </div>
        )}

        {/* ── Project ──────────────────────────────────────────────────────── */}
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)' }}>
            Project{' '}
            {selectedExpenseType?.requiresProject && (
              <span style={{ color: '#ef4444' }}>*</span>
            )}
          </label>
          <SearchableSelect
            value={expenseForm.projectId}
            onChange={(value) => setExpenseForm((prev) => ({ ...prev, projectId: value }))}
            options={projectOptions}
            placeholder={
              selectedExpenseType?.requiresProject
                ? 'Select project'
                : isPaymentMode
                ? 'Select project or leave for general payment'
                : 'Select project or leave for general expense'
            }
            disabled={selectedExpenseType?.requiresMember && !activeMemberId}
          />
        </div>

        {/* ── Event ────────────────────────────────────────────────────────── */}
        {expenseForm.projectId && projectEvents.length > 0 && (
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)' }}>
              Event{' '}
              {selectedExpenseType?.requiresEvent && (
                <span style={{ color: '#ef4444' }}>*</span>
              )}
            </label>
            <Select
              value={expenseForm.eventId}
              onChange={(value) => setExpenseForm((prev) => ({ ...prev, eventId: value }))}
              options={eventOptions}
              placeholder={
                selectedExpenseType?.requiresEvent ? 'Select event' : 'Select event (optional)'
              }
            />
          </div>
        )}

        {/* ── Date ─────────────────────────────────────────────────────────── */}
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)' }}>
            Date
          </label>
          <DatePicker
            value={expenseForm.date}
            onChange={(value) => setExpenseForm((prev) => ({ ...prev, date: value }))}
          />
        </div>

        {/* ── Amount ───────────────────────────────────────────────────────── */}
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)' }}>
            Amount <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <AmountInput
            value={expenseForm.amount}
            onChange={(value) => setExpenseForm((prev) => ({ ...prev, amount: value }))}
            placeholder="Enter amount"
          />
          {/* Pending hint — shown for both modes near the amount field */}
          {selectedMemberPendingPayable !== null &&
            expenseForm.projectId && (
              <div
                style={{
                  marginTop: '8px',
                  padding: '10px 12px',
                  backgroundColor: selectedMemberPendingPayable > 0 ? '#fef3c7' : '#f0fdf4',
                  borderLeft: `3px solid ${selectedMemberPendingPayable > 0 ? '#f59e0b' : '#22c55e'}`,
                  borderRadius: '4px',
                }}
              >
                <p style={{ fontSize: '13px', color: selectedMemberPendingPayable > 0 ? '#92400e' : '#166534', margin: 0, fontWeight: '500' }}>
                  {selectedMemberPendingPayable > 0
                    ? <>₹{selectedMemberPendingPayable.toLocaleString('en-IN')} pending on this project • {selectedProjectEventCount} event{selectedProjectEventCount !== 1 ? 's' : ''} assigned</>
                    : <>No pending amount on this project • {selectedProjectEventCount} event{selectedProjectEventCount !== 1 ? 's' : ''} assigned</>
                  }
                </p>
              </div>
            )}
        </div>

        {/* ── Comment / Notes ──────────────────────────────────────────────── */}
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)' }}>
            <>
              Comment <span style={{ color: '#ef4444' }}>*</span>
            </>
          </label>
          <Textarea
            value={expenseForm.comment}
            onChange={(e) => {
              setCommentError('');
              setExpenseForm((prev) => ({ ...prev, comment: e.target.value }));
            }}
            placeholder={isPaymentMode ? 'Enter payment details...' : 'Enter expense details...'}
            rows={3}
            maxLength={isPaymentMode ? 500 : undefined}
            showCharCount={isPaymentMode}
            error={commentError || undefined}
          />
        </div>

        {/* ── Actions ──────────────────────────────────────────────────────── */}
        {isPaymentMode && expenseForm.projectId && selectedMemberPendingPayable === 0 && (
          <p style={{ fontSize: '13px', color: '#dc2626', margin: '0 0 -8px', fontWeight: '500', textAlign: 'right' }}>
            Nothing is pending for this project
          </p>
        )}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '12px' }}>
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={
              isSubmitting ||
              !expenseForm.amount ||
              !expenseForm.expenseTypeId ||
              (isPaymentMode && expenseForm.projectId !== '' && selectedMemberPendingPayable === 0)
            }
          >
            {isSubmitting
              ? editingExpense
                ? 'Saving...'
                : isPaymentMode
                ? 'Processing...'
                : 'Adding...'
              : editingExpense
              ? 'Save Changes'
              : isPaymentMode
              ? 'Add Payment'
              : 'Add Expense'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
