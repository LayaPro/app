import type { FC } from 'react';
import { useMemo, useState } from 'react';
import styles from './EventCard.module.css';
import { DataTable } from '../../components/ui/DataTable.js';
import type { Column } from '../../components/ui/DataTable.js';
import { Modal } from '../../components/ui/Modal.js';
import { Textarea } from '../../components/ui/Textarea.js';
import { Button } from '../../components/ui/Button.js';
import { eventDeliveryStatusApi } from '../../services/api.js';
import { sanitizeTextInput } from '../../utils/sanitize.js';

interface EventWorkflowCardProps {
  eventStatuses: any[];
  loading: boolean;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
  onRefresh: () => void;
}

export const EventWorkflowCard: FC<EventWorkflowCardProps> = ({
  eventStatuses,
  loading,
  onSuccess,
  onError,
  onRefresh,
}) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<any>(null);
  const [customerNote, setCustomerNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const displayStatuses = useMemo(() => {
    return [...eventStatuses]
      .filter((status) => !status.isHidden)
      .sort((a, b) => (a.step ?? 0) - (b.step ?? 0));
  }, [eventStatuses]);

  // Function to calculate progressive color from purple to green
  const getStepColor = (step: number, totalSteps: number) => {
    if (totalSteps <= 1) return 'rgb(147, 51, 234)'; // Purple for single step
    
    // Normalize step (0 to 1)
    const progress = (step - 1) / (totalSteps - 1);
    
    // Define vibrant color stops for eye-catching progression
    const colorStops = [
      { pos: 0.0, r: 147, g: 51, b: 234 },   // Purple
      { pos: 0.25, r: 59, g: 130, b: 246 },  // Bright Blue
      { pos: 0.5, r: 6, g: 182, b: 212 },    // Cyan
      { pos: 0.75, r: 251, g: 146, b: 60 },  // Orange
      { pos: 1.0, r: 34, g: 197, b: 94 }     // Green
    ];
    
    // Find the two color stops to interpolate between
    let startStop = colorStops[0];
    let endStop = colorStops[colorStops.length - 1];
    
    for (let i = 0; i < colorStops.length - 1; i++) {
      if (progress >= colorStops[i].pos && progress <= colorStops[i + 1].pos) {
        startStop = colorStops[i];
        endStop = colorStops[i + 1];
        break;
      }
    }
    
    // Calculate local progress between the two stops
    const localProgress = (progress - startStop.pos) / (endStop.pos - startStop.pos);
    
    // Interpolate between the two colors
    const r = Math.round(startStop.r + (endStop.r - startStop.r) * localProgress);
    const g = Math.round(startStop.g + (endStop.g - startStop.g) * localProgress);
    const b = Math.round(startStop.b + (endStop.b - startStop.b) * localProgress);
    
    return `rgb(${r}, ${g}, ${b})`;
  };

  const handleEditClick = (status: any) => {
    setSelectedStatus(status);
    setCustomerNote(status.statusCustomerNote || '');
    setIsEditModalOpen(true);
  };

  const handleUpdateCustomerNote = async () => {
    if (!selectedStatus) return;
    
    const sanitizedNote = sanitizeTextInput(customerNote);
    
    if (!sanitizedNote.trim()) {
      onError('Customer note is required');
      return;
    }

    try {
      setIsSubmitting(true);
      await eventDeliveryStatusApi.update(selectedStatus.statusId, {
        statusCustomerNote: sanitizedNote,
      });
      onSuccess('Customer note updated successfully');
      setIsEditModalOpen(false);
      setSelectedStatus(null);
      setCustomerNote('');
      onRefresh();
    } catch (error: any) {
      onError(error.message || 'Failed to update customer note');
    } finally {
      setIsSubmitting(false);
    }
  };

  const workflowColumns: Column<any>[] = [
    {
      key: 'step',
      header: 'Step',
      render: (row) => {
        const isLastStep = row.step === displayStatuses.length;
        
        return (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center',
            alignItems: 'center',
            position: 'relative',
            paddingLeft: '12px',
            width: '64px',
          }}>
            <span style={{ 
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: '600',
              color: '#64748b',
              backgroundColor: '#f8fafc',
              border: '2px solid #e2e8f0',
              position: 'relative',
              zIndex: 1,
            }}>
              {row.step}
            </span>
            {!isLastStep && (
              <svg 
                width="24" 
                height="35" 
                viewBox="0 0 24 35" 
                fill="none" 
                style={{ 
                  position: 'absolute',
                  top: '40px',
                  left: '26px',
                  pointerEvents: 'none',
                  zIndex: 0,
                }}
              >
                <line 
                  x1="12" 
                  y1="0" 
                  x2="12" 
                  y2="20" 
                  stroke="#cbd5e1" 
                  strokeWidth="2"
                  opacity="0.6"
                />
                <path 
                  d="M12 28 L8 24 M12 28 L16 24" 
                  stroke="#cbd5e1" 
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  opacity="0.6"
                />
              </svg>
            )}
          </div>
        );
      },
    },
    {
      key: 'statusDescription',
      header: 'Description',
      render: (row) => {
        const color = getStepColor(row.step, displayStatuses.length);
        // Extract RGB values to create a very faint background and darker text/border
        const rgbMatch = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
        const bgColor = rgbMatch 
          ? `rgba(${rgbMatch[1]}, ${rgbMatch[2]}, ${rgbMatch[3]}, 0.05)`
          : 'rgba(147, 51, 234, 0.05)';
        
        // Make text and border darker (70% of original)
        const darkColor = rgbMatch
          ? `rgb(${Math.round(parseInt(rgbMatch[1]) * 0.7)}, ${Math.round(parseInt(rgbMatch[2]) * 0.7)}, ${Math.round(parseInt(rgbMatch[3]) * 0.7)})`
          : 'rgb(103, 36, 164)';
        
        return (
          <span style={{ 
            display: 'inline-block',
            padding: '4px 12px',
            borderRadius: '6px',
            fontSize: '0.875rem',
            fontWeight: '600',
            color: darkColor,
            backgroundColor: bgColor,
            border: `1.5px solid ${darkColor}`,
          }}>
            {row.statusDescription}
          </span>
        );
      },
    },
    {
      key: 'statusExplaination',
      header: 'Explanation',
      render: (row) => row.statusExplaination || '-',
    },
    {
      key: 'statusCustomerNote',
      header: 'Customer Note',
      render: (row) => row.statusCustomerNote || '-',
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <div className={styles.actions}>
          <button 
            className={styles.editButton} 
            title="Edit Customer Note"
            onClick={() => handleEditClick(row)}
          >
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
      <div className={styles.contentWrapper}>
        <div className={styles.infoText}>
          <svg className={styles.infoIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Event workflow steps are guided by the delivery journey and update automatically. Statuses reflect where the event sits in the delivery journey.</span>
        </div>

        <DataTable
          columns={workflowColumns}
          data={displayStatuses}
          itemsPerPage={1000}
          emptyMessage={loading ? "Loading workflow..." : "Workflow steps are managed by the system."}
        />
      </div>

      {/* Edit Customer Note Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedStatus(null);
          setCustomerNote('');
        }}
        title="Edit Customer Note"
        size="medium"
      >
        <div style={{ padding: '20px' }}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ 
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '8px', 
              fontWeight: '500',
              color: 'var(--text-primary)'
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2"/>
              </svg>
              Step: {selectedStatus?.step} - {selectedStatus?.statusDescription}
            </label>
          </div>
          
          <Textarea
            label="Customer Note"
            value={customerNote}
            onChange={(e) => setCustomerNote(e.target.value)}
            placeholder="Enter customer note..."
            rows={4}
            required
            maxLength={200}
            showCharCount
            info="This note will be visible to the customer regarding this workflow step"
          />

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
            <Button
              type="button"
              variant="primary"
              onClick={handleUpdateCustomerNote}
              disabled={isSubmitting || !customerNote.trim()}
            >
              {isSubmitting ? 'Saving...' : 'Update'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setIsEditModalOpen(false);
                setSelectedStatus(null);
                setCustomerNote('');
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};