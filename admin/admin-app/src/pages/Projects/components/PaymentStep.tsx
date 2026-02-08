import { AmountInput } from '../../../components/ui/AmountInput';
import { DatePicker } from '../../../components/ui/DatePicker';
import type { ProjectFormData } from '../ProjectWizard';
import styles from '../ProjectWizard.module.css';

interface PaymentStepProps {
  formData: ProjectFormData;
  onChange: (field: string, value: any) => void;
  errors: Record<string, string>;
  isEditing?: boolean;
}

export const PaymentStep: React.FC<PaymentStepProps> = ({ formData, onChange, errors, isEditing }) => {
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

  return (
    <div className={styles.form}>
      <div className={styles.formSection}>
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
              value={formData.receivedAmount?.toString() || ''}
              onChange={handleReceivedAmountChange}
              placeholder="0"
              info="Amount received as advance payment"
              error={errors.receivedAmount}
              disabled={isEditing}
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
    </div>
  );
};
