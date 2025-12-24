import { Input } from '../../../components/ui/Input';
import { Textarea } from '../../../components/ui/Textarea';
import { SearchableSelect } from '../../../components/ui/SearchableSelect';
import type { ProjectFormData } from '../ProjectWizard';
import styles from '../ProjectWizard.module.css';

interface BasicDetailsStepProps {
  formData: ProjectFormData;
  onChange: (field: string, value: any) => void;
  errors: Record<string, string>;
}

export const BasicDetailsStep: React.FC<BasicDetailsStepProps> = ({ formData, onChange, errors }) => {
  const referralOptions = [
    { value: '', label: 'Select referral source' },
    { value: 'google', label: 'Google Search' },
    { value: 'social_media', label: 'Social Media' },
    { value: 'friend_family', label: 'Friend/Family' },
    { value: 'previous_client', label: 'Previous Client' },
    { value: 'website', label: 'Website' },
    { value: 'other', label: 'Other' },
  ];

  return (
    <div className={styles.form}>
      <div className={styles.formSection}>
        <div className={styles.formRow3Col}>
          <div className={styles.formGroup}>
            <Input
              label="Project Name"
              value={formData.projectName}
              onChange={(e) => onChange('projectName', e.target.value)}
              error={errors.projectName}
              placeholder="e.g., John & Jane Wedding"
              required
            />
          </div>

          <div className={styles.formGroup}>
            <Input
              label="Contact Person"
              value={formData.contactPerson}
              onChange={(e) => onChange('contactPerson', e.target.value)}
              error={errors.contactPerson}
              placeholder="Primary contact name"
              required
            />
          </div>

          <div className={styles.formGroup}>
            <Input
              label="Phone Number"
              type="tel"
              value={formData.phoneNumber}
              onChange={(e) => onChange('phoneNumber', e.target.value)}
              error={errors.phoneNumber}
              placeholder="+91 9876543210"
              required
            />
          </div>
        </div>

        <div className={styles.formRow3Col}>
          <div className={styles.formGroup}>
            <Input
              label="Bride First Name"
              value={formData.brideFirstName}
              onChange={(e) => onChange('brideFirstName', e.target.value)}
              placeholder="First name"
            />
          </div>

          <div className={styles.formGroup}>
            <Input
              label="Bride Last Name"
              value={formData.brideLastName}
              onChange={(e) => onChange('brideLastName', e.target.value)}
              placeholder="Last name"
            />
          </div>

          <div className={styles.formGroup}>
            <Input
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => onChange('email', e.target.value)}
              error={errors.email}
              placeholder="email@example.com"
              required
            />
          </div>
        </div>

        <div className={styles.formRow3Col}>
          <div className={styles.formGroup}>
            <Input
              label="Groom First Name"
              value={formData.groomFirstName}
              onChange={(e) => onChange('groomFirstName', e.target.value)}
              placeholder="First name"
            />
          </div>

          <div className={styles.formGroup}>
            <Input
              label="Groom Last Name"
              value={formData.groomLastName}
              onChange={(e) => onChange('groomLastName', e.target.value)}
              placeholder="Last name"
            />
          </div>

          <div className={styles.formGroup}>
            <SearchableSelect
              label="Referral Source"
              value={formData.referredBy || ''}
              onChange={(value) => onChange('referredBy', value)}
              options={referralOptions}
              placeholder="How did you hear about us?"
            />
          </div>
        </div>

        <div className={styles.formRow3Col}>
          <div className={styles.formGroup}>
            <Textarea
              label="Address"
              value={formData.address || ''}
              onChange={(e) => onChange('address', e.target.value)}
              placeholder="Street address, area, etc."
              rows={3}
            />
          </div>

          <div className={styles.formGroup}>
            <Input
              label="City"
              value={formData.city}
              onChange={(e) => onChange('city', e.target.value)}
              placeholder="City name"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
