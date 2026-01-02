import { useState, useEffect } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { Checkbox } from '../../components/ui/Checkbox';
import { FormError } from '../../components/ui/FormError';
import { PhoneInput } from '../../components/ui/PhoneInput';
import { SearchableSelect } from '../../components/ui/SearchableSelect';
import { InfoCard } from '../../components/ui/InfoCard';
import styles from './Form.module.css';

export interface TeamMemberFormData {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  govtIdNumber?: string;
  roleId?: string;
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
  roles: any[];
}

export const TeamMemberForm: React.FC<TeamMemberFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  member,
  profiles,
  roles,
}) => {
  const [formData, setFormData] = useState<TeamMemberFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    govtIdNumber: '',
    roleId: '',
    profileId: '',
    address: '',
    isFreelancer: false,
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string>('');
  const [selectedRoleDescription, setSelectedRoleDescription] = useState<string>('');

  useEffect(() => {
    if (member) {
      setFormData({
        firstName: member.firstName || '',
        lastName: member.lastName || '',
        email: member.email || '',
        phoneNumber: member.phoneNumber || '',
        roleId: member.roleId || '',
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
        roleId: '',
        profileId: '',
        address: '',
        isFreelancer: false,
      });
    }
    setErrors({});
    setSubmitError('');
  }, [member, isOpen]);

  useEffect(() => {
    if (formData.roleId) {
      const selectedRole = roles.find(role => role.roleId === formData.roleId);
      setSelectedRoleDescription(selectedRole?.description || '');
    } else {
      setSelectedRoleDescription('');
    }
  }, [formData.roleId, roles]);

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

    if (!formData.phoneNumber || !formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required';
    } else if (formData.phoneNumber.length < 12) {
      newErrors.phoneNumber = 'Invalid phone number';
    }

    if (!formData.roleId || !formData.roleId.trim()) {
      newErrors.roleId = 'Access role is required';
    }

    if (!formData.profileId || !formData.profileId.trim()) {
      newErrors.profileId = 'Work profile is required';
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
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={member ? 'Edit Team Member' : 'Add Team Member'} 
      size="medium"
      info="Fill in the team member details to add them to your organization. All mandatory fields must be completed before submission."
    >
      <form onSubmit={handleSubmit} className={styles.form}>
        <FormError message={submitError} onClose={() => setSubmitError('')} />

        <div className={styles.formGroup}>
          <Input
            label="First Name"
            value={formData.firstName}
            onChange={(e) => handleChange('firstName', e.target.value)}
            error={errors.firstName}
            placeholder="Enter first name"
            info="The team member's given name or first name"
            maxLength={50}
            showCharCount
            allowNumbers={false}
            required
          />
        </div>

        <div className={styles.formGroup}>
          <Input
            label="Last Name"
            value={formData.lastName}
            onChange={(e) => handleChange('lastName', e.target.value)}
            error={errors.lastName}
            placeholder="Enter last name"
            info="The team member's family name or surname"
            maxLength={50}
            showCharCount
            allowNumbers={false}
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
            placeholder="Enter email address"
            info="Primary email address for communication and notifications"
            maxLength={100}
            showCharCount
            required
          />
        </div>

        <div className={styles.formGroup}>
          <PhoneInput
            label="Phone Number"
            value={formData.phoneNumber || ''}
            onChange={(value) => handleChange('phoneNumber', value)}
            error={errors.phoneNumber}
            info="Contact number with country code for urgent communications"
            required
          />
        </div>

        <div className={styles.formGroup}>
          <Input
            label="Govt ID Number"
            value={formData.govtIdNumber || ''}
            onChange={(e) => handleChange('govtIdNumber', e.target.value)}
            placeholder="Enter government ID number"
            error={errors.govtIdNumber}
            info="Official government identification number (optional)"
            maxLength={20}
            showCharCount
          />
        </div>

        <div className={styles.formGroup}>
          <SearchableSelect
            label="Access Role"
            value={formData.roleId || ''}
            onChange={(value) => handleChange('roleId', value)}
            options={roles.map((role) => ({
              value: role.roleId,
              label: role.name.charAt(0).toUpperCase() + role.name.slice(1)
            }))}
            placeholder="Search and select access role"
            error={errors.roleId}
            info="Define system access level and permissions for this team member"
            required
          />
          <InfoCard message={selectedRoleDescription} />
        </div>

        <div className={styles.formGroup}>
          <SearchableSelect
            label="Work Profile"
            value={formData.profileId || ''}
            onChange={(value) => handleChange('profileId', value)}
            options={profiles.map((profile) => ({
              value: profile.profileId,
              label: profile.name
            }))}
            placeholder="Search and select work profile"
            error={errors.profileId}
            info="Assign a work profile to define role and responsibilities"
            required
          />
        </div>

        <div className={styles.formGroup}>
          <Textarea
            label="Address"
            value={formData.address || ''}
            onChange={(e) => handleChange('address', e.target.value)}
            placeholder="Enter full address (optional)"
            info="Physical address for official correspondence or payments"
            rows={3}
            maxLength={200}
            showCharCount
          />
        </div>

        <div className={styles.formGroup}>
          <Checkbox
            label="This member is a freelancer"
            checked={formData.isFreelancer}
            onChange={(e) => handleChange('isFreelancer', e.target.checked)}
          />
        </div>

        <div className={styles.formActions}>
          <button
            type="submit"
            className={styles.submitButton}
            disabled={loading}
          >
            {loading ? 'Saving...' : member ? 'Update' : 'Create'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className={styles.cancelButton}
            disabled={loading}
          >
            Cancel
          </button>
        </div>
      </form>
    </Modal>
  );
};
