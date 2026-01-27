import { useState } from 'react';
import { Button } from '../../../components/ui/index.js';
import { AddEventModal } from './AddEventModal.js';
import type { ProposalFormData } from '../ProposalWizard';
import styles from '../ProposalWizard.module.css';

interface EventsStepProps {
  formData: ProposalFormData;
  updateFormData: (field: string, value: any) => void;
  errors: Record<string, string>;
}

export const EventsStep: React.FC<EventsStepProps> = ({
  formData,
  updateFormData,
  errors,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleAddEvent = (eventData: any) => {
    // Check if event already exists
    const eventExists = formData.events.some(
      (event) => event.eventType === eventData.eventType
    );

    if (eventExists) {
      // Could show a toast/error message here
      alert('This event has already been added');
      return;
    }

    updateFormData('events', [...formData.events, eventData]);
  };

  const removeEvent = (index: number) => {
    const updatedEvents = formData.events.filter((_, i) => i !== index);
    updateFormData('events', updatedEvents);
  };

  const getTotalStaff = (event: any) => {
    let total = 0;
    
    if (event.photographyServices) {
      event.photographyServices.forEach((service: any) => {
        total += service.count;
      });
    }
    
    if (event.videographyServices) {
      event.videographyServices.forEach((service: any) => {
        total += service.count;
      });
    }
    
    return total;
  };

  return (
    <div className={styles.form}>
      <div className={styles.formSection}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
          <Button 
            onClick={() => setIsModalOpen(true)} 
            variant="primary"
            style={{ width: 'auto', minWidth: '200px' }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Event
          </Button>
        </div>

        {errors.events && (
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
            padding: '14px 18px',
            backgroundColor: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            borderRadius: '8px',
            marginBottom: '20px',
            color: '#dc2626',
            fontSize: '14px',
            lineHeight: '1.6'
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, marginTop: '2px' }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{errors.events}</span>
          </div>
        )}

        {formData.events.map((event, index) => (
          <div key={event.eventId} className={styles.eventCard}>
            <div className={styles.eventHeader}>
              <div className={styles.eventInfo}>
                <div className={styles.eventTitleRow}>
                  <h3 className={styles.eventName}>{event.eventName || `Event ${index + 1}`}</h3>
                  <div className={styles.servicesChipsContainer}>
                    {event.photographyServices?.map((service: any, idx: number) => (
                      <div key={`photo-${idx}`} className={styles.serviceChip}>
                        <span className={styles.serviceType}>{service.label}</span>
                        <span className={styles.serviceCount}>{service.count}</span>
                      </div>
                    ))}
                    {event.videographyServices?.map((service: any, idx: number) => (
                      <div key={`video-${idx}`} className={styles.serviceChip}>
                        <span className={styles.serviceType}>{service.label}</span>
                        <span className={styles.serviceCount}>{service.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className={styles.eventSummary}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" style={{ marginRight: '8px', verticalAlign: 'middle' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span className={styles.totalStaffBadge}>{getTotalStaff(event)} Services</span>
                </div>
              </div>
              <button
                onClick={() => removeEvent(index)}
                className={styles.removeButton}
              >
                Remove
              </button>
            </div>
          </div>
        ))}

        {formData.events.length === 0 && (
          <div className={styles.emptyState}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p>No events added yet</p>
          </div>
        )}
      </div>

      <AddEventModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAdd={handleAddEvent}
        existingEventTypes={formData.events.map(e => e.eventType).filter(Boolean) as string[]}
      />
    </div>
  );
};
