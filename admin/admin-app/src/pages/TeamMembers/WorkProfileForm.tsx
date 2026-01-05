import { useState, useEffect } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import styles from './Form.module.css';

export interface WorkProfileFormData {
  name: string;
  description?: string;
}

interface WorkProfileFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: WorkProfileFormData) => Promise<void>;
  profile: any;
}

export const WorkProfileForm: React.FC<WorkProfileFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  profile,
}) => {
  const [formData, setFormData] = useState<WorkProfileFormData>({
    name: '',
    description: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string>('');

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        description: profile.description || '',
      });
    } else {
      setFormData({
        name: '',
        description: '',
      });
    }
    setErrors({});
    setSubmitError('');
  }, [profile, isOpen]);

  const handleChange = (field: keyof WorkProfileFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Profile name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Profile name must be at least 2 characters';
    }

    if (!formData.description?.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.trim().length < 5) {
      newErrors.description = 'Description must be at least 5 characters';
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
      setSubmitError(error.message || 'Failed to save work profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={profile ? 'Edit Work Profile' : 'Add Work Profile'} 
      size="small"
      info="Work profiles help categorize team members by their roles like photographer, editor, or videographer. This makes it easier to assign members to events based on their skills."
    >
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
            label="Profile Name"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            error={errors.name}
            placeholder="e.g., Photographer, Editor, Videographer"
            required
            maxLength={50}
            showCharCount
            info="Choose a clear, descriptive name for this role (max 50 characters)"
          />
        </div>

        <div className={styles.formGroup}>
          <Textarea
            label="Description"
            value={formData.description || ''}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder="Describe the responsibilities and duties..."
            rows={4}
            maxLength={200}
            showCharCount
            required
            error={errors.description}
            info="Add details about the responsibilities and duties for this role (max 200 characters)"
          />
        </div>

        <div className={styles.formActions}>
          <button
            type="submit"
            className={styles.submitButton}
            disabled={loading}
          >
            {loading ? 'Saving...' : profile ? 'Update Work Profile' : 'Create Work Profile'}
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
