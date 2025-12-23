import { useState, useEffect } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Select } from '../../components/ui/Select';
import type { SelectOption } from '../../components/ui/Select';
import styles from './Form.module.css';

interface UserFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: UserFormData) => Promise<void>;
  user?: any;
  roles: any[];
}

export interface UserFormData {
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  roleId: string;
  isActive: boolean;
}

export const UserForm: React.FC<UserFormProps> = ({ isOpen, onClose, onSubmit, user, roles }) => {
  const [formData, setFormData] = useState<UserFormData>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    roleId: '',
    isActive: true,
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string>('');

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        password: '', // Don't pre-fill password
        roleId: user.roleId || '',
        isActive: user.isActive ?? true,
      });
    } else {
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        roleId: '',
        isActive: true,
      });
    }
    setErrors({});
    setSubmitError('');
  }, [user, isOpen]);

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

    if (!user && !formData.password) {
      newErrors.password = 'Password is required for new users';
    } else if (formData.password && formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!formData.roleId) {
      newErrors.roleId = 'Role is required';
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
      const submitData = { ...formData };
      // Don't send empty password for updates
      if (user && !submitData.password) {
        delete submitData.password;
      }
      await onSubmit(submitData);
      onClose(); // Only close on success
    } catch (error: any) {
      setSubmitError(error.message || 'Failed to save user. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof UserFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={user ? 'Edit User' : 'Create User'} size="medium">
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
          <label htmlFor="firstName" className={styles.label}>
            First Name <span className={styles.required}>*</span>
          </label>
          <input
            id="firstName"
            type="text"
            className={`${styles.input} ${errors.firstName ? styles.inputError : ''}`}
            value={formData.firstName}
            onChange={(e) => handleChange('firstName', e.target.value)}
            disabled={loading}
          />
          {errors.firstName && <span className={styles.error}>{errors.firstName}</span>}
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="lastName" className={styles.label}>
            Last Name <span className={styles.required}>*</span>
          </label>
          <input
            id="lastName"
            type="text"
            className={`${styles.input} ${errors.lastName ? styles.inputError : ''}`}
            value={formData.lastName}
            onChange={(e) => handleChange('lastName', e.target.value)}
            disabled={loading}
          />
          {errors.lastName && <span className={styles.error}>{errors.lastName}</span>}
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="email" className={styles.label}>
            Email <span className={styles.required}>*</span>
          </label>
          <input
            id="email"
            type="email"
            className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            disabled={loading || !!user}
          />
          {errors.email && <span className={styles.error}>{errors.email}</span>}
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="password" className={styles.label}>
            Password {!user && <span className={styles.required}>*</span>}
            {user && <span className={styles.optional}> (leave blank to keep current)</span>}
          </label>
          <input
            id="password"
            type="password"
            className={`${styles.input} ${errors.password ? styles.inputError : ''}`}
            value={formData.password}
            onChange={(e) => handleChange('password', e.target.value)}
            disabled={loading}
            placeholder={user ? 'Leave blank to keep current password' : ''}
          />
          {errors.password && <span className={styles.error}>{errors.password}</span>}
        </div>

        <Select
          label="Role"
          value={formData.roleId}
          onChange={(value) => handleChange('roleId', value)}
          options={roles.map((role): SelectOption => ({
            value: role.roleId,
            label: role.name || role.roleName
          }))}
          placeholder="Select a role"
          error={errors.roleId}
          disabled={loading}
          required
        />

        <div className={styles.formGroup}>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) => handleChange('isActive', e.target.checked)}
              disabled={loading}
              className={styles.checkbox}
            />
            <span>Active</span>
          </label>
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
            {loading ? 'Saving...' : user ? 'Update User' : 'Create User'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
