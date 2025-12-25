import { Input } from '../../../components/ui/Input';
import { DatePicker } from '../../../components/ui/DatePicker';
import type { ProjectFormData } from '../ProjectWizard';
import styles from '../ProjectWizard.module.css';

interface PaymentStepProps {
  formData: ProjectFormData;
  onChange: (field: string, value: any) => void;
  errors: Record<string, string>;
}

export const PaymentStep: React.FC<PaymentStepProps> = ({ formData, onChange, errors }) => {
  return (
    <div className={styles.form}>
      <div className={styles.formSection}>
        <div className={styles.formRow3Col}>
          <div className={styles.formGroup}>
            <Input
              label="Total Budget"
              type="number"
              value={formData.totalBudget}
              onChange={(e) => onChange('totalBudget', e.target.value)}
              error={errors.totalBudget}
              placeholder="e.g., 150000"
              required
            />
          </div>
          
          <div className={styles.formGroup}>
            <Input
              label="Advance Received"
              type="number"
              value={formData.receivedAmount}
              onChange={(e) => onChange('receivedAmount', e.target.value)}
              placeholder="e.g., 50000"
            />
          </div>

          <div className={styles.formGroup}>
            <DatePicker
              label="Advance Received Date"
              value={formData.receivedDate || ''}
              onChange={(value) => onChange('receivedDate', value)}
              placeholder="Select date"
              includeTime={false}
            />
          </div>
        </div>

        <div className={styles.formRow3Col}>
          <div className={styles.formGroup}>
            <DatePicker
              label="Next Payment Date"
              value={formData.nextDueDate || ''}
              onChange={(value) => onChange('nextDueDate', value)}
              placeholder="Select date"
              includeTime={false}
            />
          </div>

          <div className={styles.formGroup}>
            <Input
              label="Payment Terms"
              value={formData.paymentTerms}
              onChange={(e) => onChange('paymentTerms', e.target.value)}
              placeholder="e.g., 50% advance, 50% on delivery"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
