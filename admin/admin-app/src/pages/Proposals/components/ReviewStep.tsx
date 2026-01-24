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
          <Button onClick={() => onEdit(1)} variant="secondary" size="sm">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
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
          <Button onClick={() => onEdit(2)} variant="secondary" size="sm">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit
          </Button>
        </div>
        <div className={styles.reviewContent}>
          {formData.events.length === 0 ? (
            <p className={styles.emptyText}>No events added</p>
          ) : (
            formData.events.map((event, index) => (
              <div key={event?.eventId || index} className={styles.eventItem} style={{ marginBottom: index < formData.events.length - 1 ? '24px' : '0' }}>
                <h4 style={{ marginBottom: '12px' }}>Event {index + 1}</h4>
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
                
                {((event.photographyServices && event.photographyServices.length > 0) || (event.videographyServices && event.videographyServices.length > 0)) && (
                  <div className={styles.reviewItem}>
                    <span className={styles.reviewLabel}>Services:</span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
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
          <Button onClick={() => onEdit(3)} variant="secondary" size="sm">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit
          </Button>
        </div>
        <div className={styles.reviewContent}>
          {formData.termsOfService && (
            <div style={{ marginBottom: '16px' }}>
              <div className={styles.reviewLabel} style={{ marginBottom: '8px' }}>Terms of Service:</div>
              <ul style={{ margin: 0, paddingLeft: '20px', color: 'var(--text-primary)' }}>
                {formData.termsOfService.split('\n').filter(line => line.trim()).map((line, index) => (
                  <li key={index} style={{ marginBottom: '4px' }}>{line.trim()}</li>
                ))}
              </ul>
            </div>
          )}
          {formData.paymentTerms && (
            <div style={{ marginBottom: '16px' }}>
              <div className={styles.reviewLabel} style={{ marginBottom: '8px' }}>Terms of Payment:</div>
              <ul style={{ margin: 0, paddingLeft: '20px', color: 'var(--text-primary)' }}>
                {formData.paymentTerms.split('\n').filter(line => line.trim()).map((line, index) => (
                  <li key={index} style={{ marginBottom: '4px' }}>{line.trim()}</li>
                ))}
              </ul>
            </div>
          )}
          {formData.deliverables && (
            <div style={{ marginBottom: '16px' }}>
              <div className={styles.reviewLabel} style={{ marginBottom: '8px' }}>Deliverables:</div>
              <ul style={{ margin: 0, paddingLeft: '20px', color: 'var(--text-primary)' }}>
                {formData.deliverables.split('\n').filter(line => line.trim()).map((line, index) => (
                  <li key={index} style={{ marginBottom: '4px' }}>{line.trim()}</li>
                ))}
              </ul>
            </div>
          )}
          {!formData.termsOfService && !formData.paymentTerms && !formData.deliverables && (
            <p className={styles.emptyText}>No terms defined</p>
          )}
        </div>
      </div>

      {/* Deliverables */}
      <div className={styles.reviewSection}>
        <div className={styles.reviewHeader}>
          <h3>Deliverables</h3>
          <Button onClick={() => onEdit(4)} variant="secondary" size="sm">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit
          </Button>
        </div>
        <div className={styles.reviewContent}>
          {formData.addOns.length === 0 ? (
            <p className={styles.emptyText}>No deliverables</p>
          ) : (
            formData.addOns.map((addOn, index) => (
              <div key={index} className={styles.reviewItem}>
                <span className={styles.reviewLabel}>{String(addOn?.name || 'Item')}:</span>
                <span className={styles.reviewValue}>{String(addOn?.description || '')}</span>
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
              value={formData.totalAmount ? formData.totalAmount.toString() : ''}
              onChange={(value) => updateFormData('totalAmount', value ? parseFloat(value) : null)}
              placeholder="Enter amount"
              required
              info="Total amount to be quoted to the client"
            />
          </div>
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
                {formData.totalAmount && formData.totalAmount > 0 ? `₹${formatIndianAmount(formData.totalAmount)}` : '—'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
