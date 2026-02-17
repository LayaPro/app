import { AmountInput } from '../../../components/ui/AmountInput';
import { DatePicker } from '../../../components/ui/DatePicker';
import type { ProjectFormData } from '../ProjectWizard';
import styles from '../ProjectWizard.module.css';
import { useMemo } from 'react';

interface PaymentStepProps {
  formData: ProjectFormData;
  onChange: (field: string, value: any) => void;
  errors: Record<string, string>;
  isEditing?: boolean;
  editingProject?: any;
  teamMembers?: any[];
}

export const PaymentStep: React.FC<PaymentStepProps> = ({ formData, onChange, errors, isEditing, editingProject, teamMembers = [] }) => {
  const handleReceivedAmountChange = (value: string) => {
    const receivedAmount = parseFloat(value) || 0;
    const totalBudget = parseFloat(formData.totalBudget?.toString() || '0') || 0;
    
    if (receivedAmount > totalBudget) {
      onChange('receivedAmount', value);
      // Set error through the parent's error handling
      // The parent will validate this on next/submit
    } else {
      onChange('receivedAmount', value);
    }
  };

  // Only disable if editing an existing project (has projectId), not when creating from proposal
  const isEditingExistingProject = isEditing && editingProject?.projectId;

  // Extract team members from events and calculate payables
  const teamPayables = useMemo(() => {
    const payableMap = new Map<string, {
      memberId: string;
      name: string;
      paymentType: string;
      salary: number;
      eventCount: number;
      totalPayable: number;
    }>();

    if (formData.events && Array.isArray(formData.events)) {
      formData.events.forEach((event: any) => {
        if (event.teamMembers && Array.isArray(event.teamMembers)) {
          event.teamMembers.forEach((memberId: string) => {
            const member = teamMembers.find((tm: any) => tm.memberId === memberId);
            if (member) {
              if (!payableMap.has(memberId)) {
                const salary = parseFloat(member.salary) || 0;
                // Count how many events this specific member is assigned to
                const assignedEventCount = formData.events.filter((e: any) => 
                  e.teamMembers && Array.isArray(e.teamMembers) && e.teamMembers.includes(memberId)
                ).length;
                const totalPayable = member.paymentType === 'per-event' ? salary * assignedEventCount : salary;
                payableMap.set(memberId, {
                  memberId,
                  name: `${member.firstName} ${member.lastName}`,
                  paymentType: member.paymentType || 'Not set',
                  salary,
                  eventCount: assignedEventCount,
                  totalPayable
                });
              }
            }
          });
        }
      });
    }

    return Array.from(payableMap.values());
  }, [formData.events, teamMembers]);

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className={styles.form}>
      {/* Receivable Section */}
      <div className={styles.formSection} style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '20px' }}>
        <div style={{ marginBottom: '12px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)', margin: 0 }}>Receivable</h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>Receivable from customer</p>
        </div>
        <div className={styles.formRow3Col}>
          <div className={styles.formGroup}>
            <AmountInput
              label="Total Budget"
              value={formData.totalBudget?.toString() || ''}
              onChange={(value) => onChange('totalBudget', value)}
              error={errors.totalBudget}
              placeholder="e.g., 1,50,000"
              info="Total project budget amount in INR"
              required
            />
          </div>
          
          <div className={styles.formGroup}>
            <AmountInput
              label="Advance Received"
              value={formData.receivedAmount ? formData.receivedAmount.toString() : ''}
              onChange={handleReceivedAmountChange}
              placeholder="0"
              info="Amount received as advance payment"
              error={errors.receivedAmount}
              disabled={isEditingExistingProject}
            />
          </div>

          <div className={styles.formGroup}>
            <DatePicker
              label="Advance Received Date"
              value={formData.receivedDate || ''}
              onChange={(value) => onChange('receivedDate', value)}
              placeholder="Select date"
              info="Date when the advance payment was received"
              includeTime={false}
            />
          </div>
        </div>
      </div>

      {/* Payable Section */}
      {teamPayables.length > 0 && (
        <div className={styles.formSection} style={{ marginTop: '0px', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '20px' }}>
          <div style={{ marginBottom: '8px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)', margin: 0 }}>Payable</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>Team members from events</p>
          </div>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '16px'
          }}>
            {teamPayables.map((payable) => (
              <div
                key={payable.memberId}
                style={{
                  padding: '16px',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  backgroundColor: 'var(--bg-primary-neutral)'
                }}
              >
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>
                    {payable.name}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#059669' }}>
                      {formatCurrency(payable.salary)}
                    </div>
                    <span style={{
                      display: 'inline-block',
                      padding: '2px 8px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: '600',
                      backgroundColor: payable.paymentType === 'per-month' ? '#eff6ff' :
                                       payable.paymentType === 'per-event' ? '#fef3c7' : '#f3f4f6',
                      color: payable.paymentType === 'per-month' ? '#1e40af' :
                             payable.paymentType === 'per-event' ? '#92400e' : '#6b7280',
                      whiteSpace: 'nowrap'
                    }}>
                      {payable.paymentType === 'per-month' ? 'Per Month' :
                       payable.paymentType === 'per-event' ? 'Per Event' : 'Not set'}
                    </span>
                  </div>

                  {payable.paymentType === 'per-event' && (
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Events</div>
                      <div style={{ fontSize: '13px', color: 'var(--text-primary)' }}>
                        {payable.eventCount} event{payable.eventCount !== 1 ? 's' : ''}
                      </div>
                    </div>
                  )}

                  <div style={{ paddingTop: '8px', borderTop: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Total Payable</div>
                    <div style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)' }}>
                      {formatCurrency(payable.totalPayable)}
                    </div>
                    {payable.paymentType === 'per-month' && (
                      <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '4px', fontStyle: 'italic' }}>
                        Per month payable
                      </div>
                    )}
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
