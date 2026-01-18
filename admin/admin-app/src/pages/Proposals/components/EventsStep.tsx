import { Button } from '../../../components/ui/index.js';
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
  const addEvent = () => {
    const newEvent = {
      eventId: `evt-${Date.now()}`,
      eventName: '',
      date: '',
      venue: '',
      photographer: 1,
      videographer: 1,
      hours: 8,
    };
    updateFormData('events', [...formData.events, newEvent]);
  };

  const removeEvent = (index: number) => {
    const updatedEvents = formData.events.filter((_, i) => i !== index);
    updateFormData('events', updatedEvents);
  };

  return (
    <div className={styles.form}>
      {errors.events && (
        <div className={styles.errorMessage}>{errors.events}</div>
      )}

      <div className={styles.formSection}>
        {formData.events.map((event, index) => (
          <div key={event.eventId} className={styles.eventCard}>
            <div className={styles.eventHeader}>
              <h3>Event {index + 1}</h3>
              <button
                onClick={() => removeEvent(index)}
                className={styles.removeButton}
              >
                Remove
              </button>
            </div>
            <p className={styles.placeholder}>Event configuration coming soon</p>
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

        <Button onClick={addEvent} variant="secondary">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Event
        </Button>
      </div>
    </div>
  );
};
