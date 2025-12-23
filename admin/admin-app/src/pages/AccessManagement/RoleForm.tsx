import { useState, useEffect } from 'react';
import { Modal } from '../../components/ui/Modal';
import styles from './Form.module.css';

interface RoleFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: RoleFormData) => Promise<void>;
  role?: any;
}

export interface RoleFormData {
  name: string;
  description: string;
}

export const RoleForm: React.FC<RoleFormProps> = ({ isOpen, onClose, onSubmit, role }) => {
  const [formData, setFormData] = useState<RoleFormData>({
    name: '',
    description: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string>('');

  useEffect(() => {
    if (role) {
      setFormData({
        name: role.name || role.roleName || '',
        description: role.description || role.roleDescription || '',
      });
    } else {
      setFormData({
        name: '',
        description: '',
      });
    }
    setErrors({});
    setSubmitError('');
  }, [role, isOpen]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Role name is required';
    } else if (formData.name.length < 2) {
      newErrors.name = 'Role name must be at least 2 characters';
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
      onClose(); // Only close on success
    } catch (error: any) {
      setSubmitError(error.message || 'Failed to save role. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof RoleFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={role ? 'Edit Role' : 'Create Role'} size="medium">
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
          <label htmlFor="name" className={styles.label}>
            Role Name <span className={styles.required}>*</span>
          </label>
          <input
            id="name"
            type="text"
            className={`${styles.input} ${errors.name ? styles.inputError : ''}`}
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            disabled={loading}
            placeholder="e.g., Editor, Photographer"
          />
          {errors.name && <span className={styles.error}>{errors.name}</span>}
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="description" className={styles.label}>
            Description
          </label>
          <textarea
            id="description"
            className={styles.textarea}
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            disabled={loading}
            placeholder="Brief description of this role"
            rows={4}
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
            {loading ? 'Saving...' : role ? 'Update Role' : 'Create Role'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
