import type { ProjectFormData } from '../ProjectWizard';
import styles from '../ProjectWizard.module.css';

interface ReviewStepProps {
  formData: ProjectFormData;
  onEdit: (step: number) => void;
}

export const ReviewStep: React.FC<ReviewStepProps> = ({ formData, onEdit }) => {
  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatTime = (timeStr: string) => {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  return (
    <div className={styles.reviewContainer}>
      {/* Basic Details */}
      <div className={styles.reviewSection}>
        <div className={styles.reviewHeader}>
          <div>
            <h3 className={styles.reviewSectionTitle}>Basic Details</h3>
            <p className={styles.reviewSectionSubtitle}>Project and contact information</p>
          </div>
          <button className={styles.editButton} onClick={() => onEdit(1)}>
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit
          </button>
        </div>
        <div className={styles.reviewGrid}>
          <div className={styles.reviewItem}>
            <div className={styles.reviewLabel}>Project Name</div>
            <div className={styles.reviewValue}>{formData.projectName || 'N/A'}</div>
          </div>
          <div className={styles.reviewItem}>
            <div className={styles.reviewLabel}>Contact Person</div>
            <div className={styles.reviewValue}>{formData.contactPerson || 'N/A'}</div>
          </div>
          <div className={styles.reviewItem}>
            <div className={styles.reviewLabel}>Bride</div>
            <div className={styles.reviewValue}>{formData.brideFirstName && formData.brideLastName ? `${formData.brideFirstName} ${formData.brideLastName}` : 'N/A'}</div>
          </div>
          <div className={styles.reviewItem}>
            <div className={styles.reviewLabel}>Groom</div>
            <div className={styles.reviewValue}>{formData.groomFirstName && formData.groomLastName ? `${formData.groomFirstName} ${formData.groomLastName}` : 'N/A'}</div>
          </div>
          <div className={styles.reviewItem}>
            <div className={styles.reviewLabel}>Email</div>
            <div className={styles.reviewValue}>{formData.email || 'N/A'}</div>
          </div>
          <div className={styles.reviewItem}>
            <div className={styles.reviewLabel}>Phone</div>
            <div className={styles.reviewValue}>{formData.phoneNumber || 'N/A'}</div>
          </div>
          <div className={styles.reviewItem}>
            <div className={styles.reviewLabel}>City</div>
            <div className={styles.reviewValue}>{formData.city || 'N/A'}</div>
          </div>
          <div className={styles.reviewItem}>
            <div className={styles.reviewLabel}>Referral Source</div>
            <div className={styles.reviewValue}>{formData.referredBy || 'N/A'}</div>
          </div>
        </div>
        {formData.address && (
          <div className={styles.reviewFullItem}>
            <div className={styles.reviewLabel}>Address</div>
            <div className={styles.reviewValue}>{formData.address}</div>
          </div>
        )}
      </div>

      {/* Events */}
      <div className={styles.reviewSection}>
        <div className={styles.reviewHeader}>
          <div>
            <h3 className={styles.reviewSectionTitle}>Events</h3>
            <p className={styles.reviewSectionSubtitle}>{formData.events.length} event{formData.events.length !== 1 ? 's' : ''} scheduled</p>
          </div>
          <button className={styles.editButton} onClick={() => onEdit(2)}>
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit
          </button>
        </div>
        <div className={styles.reviewEventsList}>
          {formData.events.length > 0 ? (
            formData.events.map((event: any, index: number) => (
              <div key={index} className={styles.reviewEventCard}>
                <div className={styles.reviewEventHeader}>
                  <div className={styles.reviewEventName}>{event.eventName}</div>
                </div>
                <div className={styles.reviewEventDetails}>
                  <div className={styles.reviewEventMeta}>
                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <strong>From:</strong> {formatDate(event.fromDate)}{event.fromTime && `, ${formatTime(event.fromTime)}`}
                  </div>
                  {(event.toDate || event.toTime) && (
                    <div className={styles.reviewEventMeta}>
                      <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <strong>To:</strong> {event.toDate ? formatDate(event.toDate) : formatDate(event.fromDate)}{event.toTime && `, ${formatTime(event.toTime)}`}
                    </div>
                  )}
                  <div className={styles.reviewEventMeta}>
                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    </svg>
                    {event.venue}
                  </div>
                </div>
                {event.teamMembers && event.teamMembers.length > 0 && (
                  <div className={styles.reviewEventTeam}>
                    <div className={styles.reviewEventTeamLabel}>Team:</div>
                    <div className={styles.reviewEventTeamMembers}>
                      {event.teamMembers.length} member{event.teamMembers.length !== 1 ? 's' : ''} assigned
                    </div>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className={styles.reviewEmptyState}>No events added</div>
          )}
        </div>
      </div>

      {/* Payment */}
      <div className={styles.reviewSection}>
        <div className={styles.reviewHeader}>
          <div>
            <h3 className={styles.reviewSectionTitle}>Payment Details</h3>
            <p className={styles.reviewSectionSubtitle}>Budget and payment information</p>
          </div>
          <button className={styles.editButton} onClick={() => onEdit(3)}>
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit
          </button>
        </div>
        <div className={styles.reviewGrid}>
          <div className={styles.reviewItem}>
            <div className={styles.reviewLabel}>Total Budget</div>
            <div className={styles.reviewValue}>₹{formData.totalBudget || '0'}</div>
          </div>
          <div className={styles.reviewItem}>
            <div className={styles.reviewLabel}>Advance Received</div>
            <div className={styles.reviewValue}>₹{formData.receivedAmount || '0'}</div>
          </div>
          <div className={styles.reviewItem}>
            <div className={styles.reviewLabel}>Advance Date</div>
            <div className={styles.reviewValue}>{formatDate(formData.receivedDate as any)}</div>
          </div>
          <div className={styles.reviewItem}>
            <div className={styles.reviewLabel}>Next Payment Date</div>
            <div className={styles.reviewValue}>{formatDate(formData.nextDueDate as any)}</div>
          </div>
        </div>
        {formData.paymentTerms && (
          <div className={styles.reviewFullItem}>
            <div className={styles.reviewLabel}>Payment Terms</div>
            <div className={styles.reviewValue}>{formData.paymentTerms}</div>
          </div>
        )}
      </div>
    </div>
  );
};
