import { Button } from '../../../components/ui/index.js';
import { AmountInput } from '../../../components/ui/AmountInput.js';
import { formatIndianAmount } from '../../../utils/formatAmount.js';
import type { ProposalFormData } from '../ProposalWizard';
import styles from '../ProposalWizard.module.css';

interface ReviewStepProps {
  formData: ProposalFormData;
  onEdit: (step: number) => void;
  updateFormData: (field: string, value: any) => void;
}

export const ReviewStep: React.FC<ReviewStepProps> = ({ formData, onEdit, updateFormData }) => {
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
              <div key={event?.eventId || index} className={styles.eventItem}>
                <h4>Event {index + 1}</h4>
                <div className={styles.reviewItem}>
                  <span className={styles.reviewLabel}>Name:</span>
                  <span className={styles.reviewValue}>{String(event?.eventName || 'Not specified')}</span>
                </div>
                <div className={styles.reviewItem}>
                  <span className={styles.reviewLabel}>Date:</span>
                  <span className={styles.reviewValue}>{String(event?.date || 'Not specified')}</span>
                </div>
                <div className={styles.reviewItem}>
                  <span className={styles.reviewLabel}>Venue:</span>
                  <span className={styles.reviewValue}>{String(event?.venue || 'Not specified')}</span>
                </div>
                
                {event.photographyServices && event.photographyServices.length > 0 && (
                  <div className={styles.reviewItem}>
                    <span className={styles.reviewLabel}>Photography:</span>
                    <span className={styles.reviewValue}>
                      {event.photographyServices.map((s, i) => `${String(s?.label || 'Service')} (${String(s?.count || 0)})`).join(', ')}
                    </span>
                  </div>
                )}
                
                {event.videographyServices && event.videographyServices.length > 0 && (
                  <div className={styles.reviewItem}>
                    <span className={styles.reviewLabel}>Videography:</span>
                    <span className={styles.reviewValue}>
                      {event.videographyServices.map((s, i) => `${String(s?.label || 'Service')} (${String(s?.count || 0)})`).join(', ')}
                    </span>
                  </div>
                )}
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
          {formData.termsOfService && (
            <div className={styles.reviewItem}>
              <span className={styles.reviewLabel}>Terms of Service:</span>
              <span className={styles.reviewValue} style={{ whiteSpace: 'pre-line' }}>{formData.termsOfService}</span>
            </div>
          )}
          {formData.paymentTerms && (
            <div className={styles.reviewItem}>
              <span className={styles.reviewLabel}>Terms of Payment:</span>
              <span className={styles.reviewValue} style={{ whiteSpace: 'pre-line' }}>{formData.paymentTerms}</span>
            </div>
          )}
          {formData.deliverables && (
            <div className={styles.reviewItem}>
              <span className={styles.reviewLabel}>Deliverables:</span>
              <span className={styles.reviewValue} style={{ whiteSpace: 'pre-line' }}>{formData.deliverables}</span>
            </div>
          )}
          {!formData.termsOfService && !formData.paymentTerms && !formData.deliverables && (
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
                  <span className={styles.reviewLabel}>{String(addOn?.name || 'Item')}:</span>
                  <span className={styles.reviewValue}>
                    {addOn?.price ? `₹${Number(addOn.price).toLocaleString()}` : 'Price not set'}
                  </span>
                </div>
                {addOn?.description && (
                  <p className={styles.addOnDescription}>{String(addOn.description)}</p>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Total */}
      <div className={styles.reviewSection}>
        <div className={styles.reviewHeader}>
          <h3>Final Quotation</h3>
        </div>
        <div className={styles.reviewContent}>
          <div className={styles.formGroup}>
            <AmountInput
              label="Final Quotation Price"
              value={formData.totalAmount?.toString() || ''}
              onChange={(value) => updateFormData('totalAmount', parseFloat(value) || 0)}
              placeholder="0"
              required
              info="Total amount to be quoted to the client"
            />
          </div>
          {formData.totalAmount && formData.totalAmount > 0 && (
            <div style={{ 
              marginTop: '16px', 
              padding: '16px', 
              backgroundColor: 'var(--background-secondary)', 
              borderRadius: '8px',
              border: '1px solid var(--border-color)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-secondary)' }}>
                  Amount:
                </span>
                <span style={{ fontSize: '24px', fontWeight: '700', color: 'var(--color-primary)' }}>
                  ₹{formatIndianAmount(formData.totalAmount)}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
