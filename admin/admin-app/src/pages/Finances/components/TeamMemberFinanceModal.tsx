import { useState, useEffect } from 'react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { clientEventApi, projectApi, expenseApi } from '../../../services/api';
import { getAvatarColors } from '../../../utils/avatarColors';

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
  finance?: {
    financeId?: string;
    memberId?: string;
    totalPayable?: number;
    paidAmount?: number;
    pendingAmount?: number;
    transactions?: any[];
  };
  projectCount?: number;
  eventCount?: number;
}

interface ProjectBreakdown {
  projectId: string;
  projectName: string;
  eventCount: number;
  uniqueMonths: number;
  payable: number;
  paid: number;
  pending: number;
  events: { clientEventId: string; eventName?: string; eventDate?: string }[];
  payments: any[];
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  member: TeamMemberWithFinance | null;
  onMakePayment: (member: TeamMemberWithFinance) => void;
}

const formatCurrency = (amount: number) =>
  `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

const formatDate = (d: string | Date) =>
  new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

export const TeamMemberFinanceModal = ({ isOpen, onClose, member, onMakePayment }: Props) => {
  const [projects, setProjects] = useState<any[]>([]);
  const [clientEvents, setClientEvents] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedProject, setExpandedProject] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && member) {
      setLoading(true);
      Promise.all([
        clientEventApi.getAll(),
        projectApi.getAll(),
        expenseApi.getAll({ limit: 1000 }),
      ])
        .then(([evRes, prRes, exRes]) => {
          setClientEvents(evRes.clientEvents || []);
          setProjects(prRes.projects || []);
          setExpenses(exRes.expenses || []);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
    if (!isOpen) {
      setExpandedProject(null);
    }
  }, [isOpen, member?.memberId]);

  if (!member) return null;

  const memberName = `${member.firstName} ${member.lastName}`;
  const colors = getAvatarColors(memberName);
  const initials = `${member.firstName[0]}${member.lastName[0]}`.toUpperCase();
  const salaryAmount = parseFloat(String(member.salary || '0')) || 0;

  // ── Per-project breakdown ─────────────────────────────────────────────────
  const memberClientEvents = clientEvents.filter(
    (ce: any) =>
      ce.teamMembersAssigned &&
      Array.isArray(ce.teamMembersAssigned) &&
      ce.teamMembersAssigned.includes(member.memberId)
  );

  const projectMap = new Map<string, ProjectBreakdown>();
  memberClientEvents.forEach((ce: any) => {
    const proj = projects.find((p: any) => p.projectId === ce.projectId);
    if (!projectMap.has(ce.projectId)) {
      projectMap.set(ce.projectId, {
        projectId: ce.projectId,
        projectName: proj?.projectName || 'Unknown Project',
        eventCount: 0,
        uniqueMonths: 0,
        payable: 0,
        paid: 0,
        pending: 0,
        events: [],
        payments: [],
      });
    }
    const entry = projectMap.get(ce.projectId)!;
    entry.eventCount += 1;
    entry.events.push({
      clientEventId: ce.clientEventId,
      eventName: ce.eventName || ce.eventCode || 'Unnamed Event',
      eventDate: ce.eventDate,
    });
  });

  // Calculate payable per project
  projectMap.forEach((entry) => {
    if (member.paymentType === 'per-event') {
      entry.payable = entry.eventCount * salaryAmount;
    } else if (member.paymentType === 'per-month') {
      const months = new Set(
        entry.events.map((e) => {
          if (!e.eventDate) return 'unknown';
          const d = new Date(e.eventDate);
          return `${d.getFullYear()}-${d.getMonth()}`;
        })
      );
      months.delete('unknown');
      entry.uniqueMonths = months.size;
      entry.payable = months.size * salaryAmount;
    }
  });

  // Attach payments (expenses) per project
  const memberExpenses = expenses.filter((e: any) => e.memberId === member.memberId);
  memberExpenses.forEach((exp: any) => {
    if (exp.projectId && projectMap.has(exp.projectId)) {
      projectMap.get(exp.projectId)!.payments.push(exp);
    }
  });

  projectMap.forEach((entry) => {
    entry.paid = entry.payments.reduce((sum, e) => sum + (e.amount || 0), 0);
    entry.pending = entry.payable - entry.paid;
  });

  const projectBreakdowns = [...projectMap.values()].sort(
    (a, b) => b.pending - a.pending
  );

  // General payments (no project)
  const generalPayments = memberExpenses
    .filter((e: any) => !e.projectId)
    .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const totalPaid = member.finance?.paidAmount || 0;
  const totalPayable = member.finance?.totalPayable || 0;
  const totalPending = totalPayable - totalPaid;

  const paymentTypeLabel =
    member.paymentType === 'per-month'
      ? 'Per Month'
      : member.paymentType === 'per-event'
      ? 'Per Event'
      : 'Not set';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Team Member Finances"
      size="large"
    >
      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem', gap: '0.75rem' }}>
          <div style={{
            width: '20px', height: '20px',
            border: '2px solid var(--border-color)',
            borderTopColor: 'var(--color-primary)',
            borderRadius: '50%',
            animation: 'spin 0.6s linear infinite'
          }} />
          <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Loading finance details...</span>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

          {/* ── Member header ────────────────────────────────────────────── */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            padding: '16px',
            background: 'var(--bg-secondary)',
            borderRadius: '12px',
            border: '1px solid var(--border-color)',
          }}>
            <div style={{
              width: '56px', height: '56px', borderRadius: '50%', flexShrink: 0,
              background: colors.bg, border: `2px solid ${colors.border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '18px', fontWeight: 700, color: colors.text,
            }}>
              {initials}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {memberName}
                </span>
                {member.isFreelancer && (
                  <span style={{
                    fontSize: '11px', fontWeight: 600,
                    padding: '2px 8px', borderRadius: '4px',
                    background: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b',
                  }}>
                    Freelancer
                  </span>
                )}
                <span style={{
                  fontSize: '11px', fontWeight: 600,
                  padding: '2px 8px', borderRadius: '4px',
                  background: member.paymentType === 'per-month' ? 'rgba(59, 130, 246, 0.12)' : member.paymentType === 'per-event' ? 'rgba(245, 158, 11, 0.12)' : 'var(--bg-secondary)',
                  color: member.paymentType === 'per-month' ? '#3b82f6' : member.paymentType === 'per-event' ? '#f59e0b' : 'var(--text-secondary)',
                }}>
                  {paymentTypeLabel}
                  {salaryAmount > 0 && ` · ${formatCurrency(salaryAmount)}`}
                </span>
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                {member.profileName && <span>{member.profileName}</span>}
                {member.profileName && member.email && <span style={{ margin: '0 6px' }}>·</span>}
                {member.email && <span>{member.email}</span>}
                {member.phoneNumber && <span style={{ marginLeft: '8px', color: 'var(--text-tertiary)' }}>· {member.phoneNumber}</span>}
              </div>
            </div>
            <Button
              variant="primary"
              onClick={() => onMakePayment(member)}
            >
              <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ marginRight: '6px' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Make Payment
            </Button>
          </div>

          {/* ── Finance summary cards ─────────────────────────────────────── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
            {[
              { label: 'Total Payable', value: totalPayable, color: '#10b981', bg: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)', border: 'rgba(16, 185, 129, 0.2)' },
              { label: 'Total Paid', value: totalPaid, color: '#3b82f6', bg: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(59, 130, 246, 0.05) 100%)', border: 'rgba(59, 130, 246, 0.2)' },
              { label: 'Pending', value: totalPending, color: totalPending > 0 ? '#ef4444' : 'var(--text-secondary)', bg: totalPending > 0 ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(239, 68, 68, 0.05) 100%)' : 'var(--bg-secondary)', border: totalPending > 0 ? 'rgba(239, 68, 68, 0.2)' : 'var(--border-color)' },
            ].map(({ label, value, color, bg, border }) => (
              <div key={label} style={{
                padding: '16px', borderRadius: '10px',
                background: bg, border: `1px solid ${border}`,
                textAlign: 'center',
              }}>
                <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                  {label}
                </div>
                <div style={{ fontSize: '20px', fontWeight: 700, color }}>
                  {formatCurrency(value)}
                </div>
              </div>
            ))}
          </div>

          {/* ── Project breakdown ─────────────────────────────────────────── */}
          <div>
            <SectionHeading icon={
              <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
            } title="Project Breakdown" count={projectBreakdowns.length} />

            {projectBreakdowns.length === 0 ? (
              <EmptyState message="No projects assigned" />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
                {projectBreakdowns.map((proj) => {
                  const isExpanded = expandedProject === proj.projectId;
                  const pendingColor = proj.pending > 0 ? '#ef4444' : proj.pending < 0 ? '#10b981' : 'var(--text-secondary)';
                  return (
                    <div key={proj.projectId} style={{
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      overflow: 'hidden',
                    }}>
                      {/* Project row */}
                      <div
                        onClick={() => setExpandedProject(isExpanded ? null : proj.projectId)}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '2fr 1fr 1fr 1fr auto',
                          alignItems: 'center',
                          gap: '12px',
                          padding: '12px 16px',
                          background: 'var(--bg-primary)',
                          cursor: 'pointer',
                          transition: 'background 0.15s',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--bg-primary)')}
                      >
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' }}>
                            {proj.projectName}
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                            {proj.eventCount} event{proj.eventCount !== 1 ? 's' : ''}
                            {member.paymentType === 'per-month' && proj.uniqueMonths > 0 &&
                              ` · ${proj.uniqueMonths} month${proj.uniqueMonths !== 1 ? 's' : ''}`}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '2px' }}>Payable</div>
                          <div style={{ fontWeight: 600, fontSize: '13px', color: '#10b981' }}>{formatCurrency(proj.payable)}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '2px' }}>Paid</div>
                          <div style={{ fontWeight: 600, fontSize: '13px', color: '#3b82f6' }}>{formatCurrency(proj.paid)}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '2px' }}>Pending</div>
                          <div style={{ fontWeight: 600, fontSize: '13px', color: pendingColor }}>{formatCurrency(proj.pending)}</div>
                        </div>
                        <svg
                          width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                          style={{
                            color: 'var(--text-tertiary)',
                            transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                            flexShrink: 0,
                          }}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>

                      {/* Expanded: payments for this project */}
                      {/* Expanded: payments for this project */}
                      <div style={{
                        display: 'grid',
                        gridTemplateRows: isExpanded ? '1fr' : '0fr',
                        transition: 'grid-template-rows 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      }}>
                        <div style={{ overflow: 'hidden' }}>
                        <div style={{
                          borderTop: '1px solid var(--border-color)',
                          background: 'var(--bg-secondary)',
                          padding: '12px 16px',
                        }}>
                          {proj.payments.length === 0 ? (
                            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, fontStyle: 'italic' }}>
                              No payments recorded for this project yet.
                            </p>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                              {/* Header */}
                              <div style={{
                                display: 'grid',
                                gridTemplateColumns: '1.2fr 0.8fr 1fr 1.5fr',
                                gap: '8px',
                                padding: '4px 8px 8px',
                                fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)',
                                textTransform: 'uppercase', letterSpacing: '0.05em',
                              }}>
                                <div>Date</div>
                                <div style={{ textAlign: 'right' }}>Amount</div>
                                <div>Type</div>
                                <div>Comment</div>
                              </div>
                              {proj.payments
                                .slice()
                                .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
                                .map((p: any) => (
                                  <div key={p.expenseId} style={{
                                    display: 'grid',
                                    gridTemplateColumns: '1.2fr 0.8fr 1fr 1.5fr',
                                    gap: '8px',
                                    padding: '7px 8px',
                                    borderRadius: '6px',
                                    fontSize: '13px',
                                    background: 'var(--bg-primary)',
                                    marginBottom: '4px',
                                    alignItems: 'center',
                                  }}>
                                    <div style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                                      {formatDate(p.date)}
                                    </div>
                                    <div style={{ fontWeight: 700, color: '#ef4444', textAlign: 'right' }}>
                                      {formatCurrency(p.amount)}
                                    </div>
                                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                                      {p.expenseTypeName || '—'}
                                    </div>
                                    <div style={{
                                      fontSize: '12px',
                                      color: p.comment ? 'var(--text-primary)' : 'var(--text-tertiary)',
                                      fontStyle: p.comment ? 'normal' : 'italic',
                                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                    }}>
                                      {p.comment || 'No comment'}
                                    </div>
                                  </div>
                                ))}
                            </div>
                          )}
                        </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── General payments (no project) ─────────────────────────────── */}
          {generalPayments.length > 0 && (
            <div>
              <SectionHeading icon={
                <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              } title="General Payments" count={generalPayments.length} />
              <div style={{
                marginTop: '10px',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                overflow: 'hidden',
              }}>
                {/* Header */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1.2fr 0.8fr 1fr 1.5fr',
                  gap: '8px',
                  padding: '10px 16px',
                  background: 'var(--bg-secondary)',
                  fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)',
                  textTransform: 'uppercase', letterSpacing: '0.05em',
                  borderBottom: '1px solid var(--border-color)',
                }}>
                  <div>Date</div>
                  <div style={{ textAlign: 'right' }}>Amount</div>
                  <div>Type</div>
                  <div>Comment</div>
                </div>
                {generalPayments.map((p: any, i: number) => (
                  <div key={p.expenseId} style={{
                    display: 'grid',
                    gridTemplateColumns: '1.2fr 0.8fr 1fr 1.5fr',
                    gap: '8px',
                    padding: '10px 16px',
                    fontSize: '13px',
                    alignItems: 'center',
                    borderBottom: i < generalPayments.length - 1 ? '1px solid var(--border-color)' : 'none',
                    background: 'var(--bg-primary)',
                    transition: 'background 0.15s',
                  }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--bg-primary)')}
                  >
                    <div style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{formatDate(p.date)}</div>
                    <div style={{ fontWeight: 700, color: '#ef4444', textAlign: 'right' }}>{formatCurrency(p.amount)}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{p.expenseTypeName || '—'}</div>
                    <div style={{
                      fontSize: '12px',
                      color: p.comment ? 'var(--text-primary)' : 'var(--text-tertiary)',
                      fontStyle: p.comment ? 'normal' : 'italic',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {p.comment || 'No comment'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── No activity ───────────────────────────────────────────────── */}
          {projectBreakdowns.length === 0 && generalPayments.length === 0 && (
            <EmptyState message="No finance activity found for this member" />
          )}

        </div>
      )}
    </Modal>
  );
};

// ── Small helpers ────────────────────────────────────────────────────────────

const SectionHeading = ({ icon, title, count }: { icon: React.ReactNode; title: string; count?: number }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
    <span style={{ color: 'var(--text-secondary)', display: 'flex' }}>{icon}</span>
    <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
      {title}
    </span>
    {count !== undefined && (
      <span style={{
        marginLeft: 'auto',
        padding: '1px 8px',
        background: 'var(--color-primary)',
        color: 'white',
        fontSize: '11px', fontWeight: 600,
        borderRadius: '9999px',
      }}>
        {count}
      </span>
    )}
  </div>
);

const EmptyState = ({ message }: { message: string }) => (
  <div style={{
    padding: '2rem', textAlign: 'center',
    color: 'var(--text-tertiary)', fontSize: '13px', fontStyle: 'italic',
    marginTop: '10px',
    border: '1px dashed var(--border-color)',
    borderRadius: '8px',
  }}>
    {message}
  </div>
);
