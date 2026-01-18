import { Button } from '../../../components/ui/index.js';
import type { ProposalFormData } from '../ProposalWizard';
import styles from '../ProposalWizard.module.css';

interface ReviewStepProps {
  formData: ProposalFormData;
  onEdit: (step: number) => void;
}

export const ReviewStep: React.FC<ReviewStepProps> = ({ formData, onEdit }) => {
  const calculateTotal = (): number => {
    const addOnsTotal = formData.addOns.reduce((sum, addOn) => sum + (addOn.price || 0), 0);
    // Base amount would come from events pricing in a real implementation
    return addOnsTotal;
  };

  return (
    <div className={styles.form}>
      {/* Basic Details */}
      <div className={styles.reviewSection}>
        <div className={styles.reviewHeader}>
          <h3>Basic Details</h3>
          <Button onClick={() => onEdit(1)} variant="ghost" size="sm">
            Edit
          </Button>
        </div>
        <div className={styles.reviewContent}>
          <div className={styles.reviewItem}>
            <span className={styles.reviewLabel}>Client Name:</span>
            <span className={styles.reviewValue}>{formData.clientName}</span>
          </div>
          <div className={styles.reviewItem}>
            <span className={styles.reviewLabel}>Client Email:</span>
            <span className={styles.reviewValue}>{formData.clientEmail}</span>
          </div>
          {formData.clientPhone && (
            <div className={styles.reviewItem}>
              <span className={styles.reviewLabel}>Client Phone:</span>
              <span className={styles.reviewValue}>{formData.clientPhone}</span>
            </div>
          )}
          <div className={styles.reviewItem}>
            <span className={styles.reviewLabel}>Project Name:</span>
            <span className={styles.reviewValue}>{formData.projectName}</span>
          </div>
          {formData.weddingDate && (
            <div className={styles.reviewItem}>
              <span className={styles.reviewLabel}>Wedding Date:</span>
              <span className={styles.reviewValue}>{formData.weddingDate}</span>
            </div>
          )}
          {formData.venue && (
            <div className={styles.reviewItem}>
              <span className={styles.reviewLabel}>Venue:</span>
              <span className={styles.reviewValue}>{formData.venue}</span>
            </div>
          )}
        </div>
      </div>

      {/* Events */}
      <div className={styles.reviewSection}>
        <div className={styles.reviewHeader}>
          <h3>Events</h3>
          <Button onClick={() => onEdit(2)} variant="ghost" size="sm">
            Edit
          </Button>
        </div>
        <div className={styles.reviewContent}>
          {formData.events.length === 0 ? (
            <p className={styles.emptyText}>No events added</p>
          ) : (
            formData.events.map((event, index) => (
              <div key={event.eventId} className={styles.eventItem}>
                <h4>Event {index + 1}</h4>
                <div className={styles.reviewItem}>
                  <span className={styles.reviewLabel}>Name:</span>
                  <span className={styles.reviewValue}>{event.eventName || 'Not specified'}</span>
                </div>
                <div className={styles.reviewItem}>
                  <span className={styles.reviewLabel}>Date:</span>
                  <span className={styles.reviewValue}>{event.date || 'Not specified'}</span>
                </div>
                <div className={styles.reviewItem}>
                  <span className={styles.reviewLabel}>Venue:</span>
                  <span className={styles.reviewValue}>{event.venue || 'Not specified'}</span>
                </div>
                <div className={styles.reviewItem}>
                  <span className={styles.reviewLabel}>Coverage:</span>
                  <span className={styles.reviewValue}>
                    {event.photographer} Photographer(s), {event.videographer} Videographer(s), {event.hours} hours
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Terms */}
      <div className={styles.reviewSection}>
        <div className={styles.reviewHeader}>
          <h3>Terms & Policies</h3>
          <Button onClick={() => onEdit(3)} variant="ghost" size="sm">
            Edit
          </Button>
        </div>
        <div className={styles.reviewContent}>
          {formData.paymentTerms && (
            <div className={styles.reviewItem}>
              <span className={styles.reviewLabel}>Payment Terms:</span>
              <span className={styles.reviewValue}>{formData.paymentTerms}</span>
            </div>
          )}
          {formData.cancellationPolicy && (
            <div className={styles.reviewItem}>
              <span className={styles.reviewLabel}>Cancellation Policy:</span>
              <span className={styles.reviewValue}>{formData.cancellationPolicy}</span>
            </div>
          )}
          {formData.deliveryTimeline && (
            <div className={styles.reviewItem}>
              <span className={styles.reviewLabel}>Delivery Timeline:</span>
              <span className={styles.reviewValue}>{formData.deliveryTimeline}</span>
            </div>
          )}
          {!formData.paymentTerms && !formData.cancellationPolicy && !formData.deliveryTimeline && (
            <p className={styles.emptyText}>No terms defined</p>
          )}
        </div>
      </div>

      {/* Add-ons */}
      <div className={styles.reviewSection}>
        <div className={styles.reviewHeader}>
          <h3>Add-ons</h3>
          <Button onClick={() => onEdit(4)} variant="ghost" size="sm">
            Edit
          </Button>
        </div>
        <div className={styles.reviewContent}>
          {formData.addOns.length === 0 ? (
            <p className={styles.emptyText}>No add-ons</p>
          ) : (
            formData.addOns.map((addOn, index) => (
              <div key={index} className={styles.addOnItem}>
                <div className={styles.reviewItem}>
                  <span className={styles.reviewLabel}>{addOn.name}:</span>
                  <span className={styles.reviewValue}>₹{addOn.price.toLocaleString()}</span>
                </div>
                {addOn.description && (
                  <p className={styles.addOnDescription}>{addOn.description}</p>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Total */}
      <div className={styles.totalSection}>
        <div className={styles.totalRow}>
          <span className={styles.totalLabel}>Total Amount:</span>
          <span className={styles.totalValue}>₹{calculateTotal().toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
};
