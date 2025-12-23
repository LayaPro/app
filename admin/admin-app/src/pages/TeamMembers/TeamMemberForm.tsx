import { useState, useEffect } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Checkbox } from '../../components/ui/Checkbox';
import type { SelectOption } from '../../components/ui/Select';
import styles from './Form.module.css';

export interface TeamMemberFormData {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  profileId?: string;
  address?: string;
  isFreelancer: boolean;
}

interface TeamMemberFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: TeamMemberFormData) => Promise<void>;
  member: any;
  profiles: any[];
}

export const TeamMemberForm: React.FC<TeamMemberFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  member,
  profiles,
}) => {
  const [formData, setFormData] = useState<TeamMemberFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    profileId: '',
    address: '',
    isFreelancer: false,
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string>('');

  useEffect(() => {
    if (member) {
      setFormData({
        firstName: member.firstName || '',
        lastName: member.lastName || '',
        email: member.email || '',
        phoneNumber: member.phoneNumber || '',
        profileId: member.profileId || '',
        address: member.address || '',
        isFreelancer: member.isFreelancer || false,
      });
    } else {
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phoneNumber: '',
        profileId: '',
        address: '',
        isFreelancer: false,
      });
    }
    setErrors({});
    setSubmitError('');
  }, [member, isOpen]);

  const handleChange = (field: keyof TeamMemberFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setLoading(true);
    setSubmitError('');
    try {
      await onSubmit(formData);
      onClose();
    } catch (error: any) {
      setSubmitError(error.message || 'Failed to save team member. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={member ? 'Edit Team Member' : 'Add Team Member'} size="medium">
      <form onSubmit={handleSubmit} className={styles.form}>
        {submitError && (
          <div style={{
            padding: '12px 16px',
            backgroundColor: '#fee',
            border: '1px solid #fcc',
            borderRadius: '8px',
            color: '#c00',
            fontSize: '14px',
            marginBottom: '16px'
          }}>
            {submitError}
          </div>
        )}

        <div className={styles.formGroup}>
          <Input
            label="First Name"
            value={formData.firstName}
            onChange={(e) => handleChange('firstName', e.target.value)}
            error={errors.firstName}
            required
          />
        </div>

        <div className={styles.formGroup}>
          <Input
            label="Last Name"
            value={formData.lastName}
            onChange={(e) => handleChange('lastName', e.target.value)}
            error={errors.lastName}
            required
          />
        </div>

        <div className={styles.formGroup}>
          <Input
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            error={errors.email}
            required
          />
        </div>

        <div className={styles.formGroup}>
          <Input
            label="Phone Number"
            type="tel"
            value={formData.phoneNumber || ''}
            onChange={(e) => handleChange('phoneNumber', e.target.value)}
            placeholder="Optional"
          />
        </div>

        <div className={styles.formGroup}>
          <Select
            label="Work Profile"
            value={formData.profileId || ''}
            onChange={(value) => handleChange('profileId', value)}
            options={[
              { value: '', label: 'Select profile...' },
              ...profiles.map((profile): SelectOption => ({
                value: profile.profileId,
                label: profile.name
              }))
            ]}
            placeholder="Optional"
          />
        </div>

        <div className={styles.formGroup}>
          <Input
            label="Address"
            value={formData.address || ''}
            onChange={(e) => handleChange('address', e.target.value)}
            placeholder="Optional"
          />
        </div>

        <div className={styles.formGroup}>
          <Checkbox
            label="Freelancer"
            checked={formData.isFreelancer}
            onChange={(e) => handleChange('isFreelancer', e.target.checked)}
          />
        </div>

        <div className={styles.formActions}>
          <button
            type="button"
            onClick={onClose}
            className={styles.cancelButton}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className={styles.submitButton}
            disabled={loading}
          >
            {loading ? 'Saving...' : member ? 'Update' : 'Create'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
