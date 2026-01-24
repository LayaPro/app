import { Input, PhoneInput, DatePicker, Textarea } from '../../../components/ui/index.js';
import type { ProposalFormData } from '../ProposalWizard';
import styles from '../ProposalWizard.module.css';

interface BasicDetailsStepProps {
  formData: ProposalFormData;
  updateFormData: (field: string, value: any) => void;
  errors: Record<string, string>;
}

export const BasicDetailsStep: React.FC<BasicDetailsStepProps> = ({
  formData,
  updateFormData,
  errors,
}) => {
  return (
    <div className={styles.form}>
      <div className={styles.formSection}>
        <div className={styles.formRow3Col}>
          <div className={styles.formGroup}>
            <Input
              label="Project Name"
              value={formData.projectName}
              onChange={(e) => updateFormData('projectName', e.target.value)}
              error={errors.projectName}
              placeholder="e.g., Rahul & Priya Wedding"
              required
              info="Descriptive name for this project"
              maxLength={50}
              showCharCount={true}
            />
          </div>

          <div className={styles.formGroup}>
            <Input
              label="Client Name"
              value={formData.clientName}
              onChange={(e) => updateFormData('clientName', e.target.value)}
              error={errors.clientName}
              placeholder="Enter client name"
              required
              info="Primary contact person for this proposal"
              maxLength={50}
              showCharCount={true}
            />
          </div>

          <div className={styles.formGroup}>
            <Input
              label="Client Email"
              type="email"
              value={formData.clientEmail}
              onChange={(e) => updateFormData('clientEmail', e.target.value)}
              error={errors.clientEmail}
              placeholder="Enter client email"
              required
              info="Email address where proposal will be sent"
              maxLength={50}
              showCharCount={true}
            />
          </div>

          <div className={styles.formGroup}>
            <PhoneInput
              label="Client Phone"
              value={formData.clientPhone || ''}
              onChange={(value) => updateFormData('clientPhone', value)}
              error={errors.clientPhone}
              required
              info="Contact number for follow-ups"
            />
          </div>

          <div className={styles.formGroup}>
            <DatePicker
              label="Event Date"
              value={formData.weddingDate || ''}
              onChange={(value) => updateFormData('weddingDate', value)}
              placeholder="Select event date"
            />
          </div>

          <div className={styles.formGroup}>
            <Textarea
              label="Venue"
              value={formData.venue || ''}
              onChange={(e) => updateFormData('venue', e.target.value)}
              placeholder="Enter venue name and address"
              info="Primary venue location"
              maxLength={50}
              showCharCount={true}
              rows={3}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
