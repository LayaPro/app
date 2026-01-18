import { Textarea } from '../../../components/ui/index.js';
import type { ProposalFormData } from '../ProposalWizard';
import styles from '../ProposalWizard.module.css';

interface TermsStepProps {
  formData: ProposalFormData;
  updateFormData: (field: string, value: any) => void;
}

export const TermsStep: React.FC<TermsStepProps> = ({
  formData,
  updateFormData,
}) => {
  return (
    <div className={styles.form}>
      <div className={styles.formSection}>
        <div className={styles.formGroup}>
          <Textarea
            label="Payment Terms"
            rows={4}
            placeholder="e.g., 30% advance, 40% on event day, 30% on delivery"
            value={formData.paymentTerms || ''}
            onChange={(e) => updateFormData('paymentTerms', e.target.value)}
            showCharCount={true}
            maxLength={500}
            info="Define the payment schedule and terms for this proposal"
          />
        </div>

        <div className={styles.formGroup}>
          <Textarea
            label="Cancellation Policy"
            rows={4}
            placeholder="e.g., Full refund if cancelled 30 days before event"
            value={formData.cancellationPolicy || ''}
            onChange={(e) => updateFormData('cancellationPolicy', e.target.value)}
            showCharCount={true}
            maxLength={500}
            info="Specify the cancellation terms and refund policy"
          />
        </div>

        <div className={styles.formGroup}>
          <Textarea
            label="Delivery Timeline"
            rows={4}
            placeholder="e.g., Edited photos within 4 weeks, album within 8 weeks"
            value={formData.deliveryTimeline || ''}
            onChange={(e) => updateFormData('deliveryTimeline', e.target.value)}
            showCharCount={true}
            maxLength={500}
            info="Outline when the client can expect deliverables"
          />
        </div>
      </div>
    </div>
  );
};
