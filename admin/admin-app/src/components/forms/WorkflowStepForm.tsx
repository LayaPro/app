import React, { useState, useEffect } from 'react';
import { Button } from '../ui/Button.js';
import { Input } from '../ui/Input.js';
import styles from './EventForm.module.css';

interface WorkflowStepFormProps {
  step?: {
    statusId?: string;
    statusCode: string;
    statusDescription?: string;
  };
  onSubmit: (data: { statusCode: string; statusDescription?: string }) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export const WorkflowStepForm: React.FC<WorkflowStepFormProps> = ({ 
  step, 
  onSubmit, 
  onCancel,
  isLoading = false 
}) => {
  const [formData, setFormData] = useState({
    statusCode: step?.statusCode || '',
    statusDescription: step?.statusDescription || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (step) {
      setFormData({
        statusCode: step.statusCode,
        statusDescription: step.statusDescription || '',
      });
    }
  }, [step]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.statusCode.trim()) {
      newErrors.statusCode = 'Status name is required';
    } else if (formData.statusCode.length > 50) {
      newErrors.statusCode = 'Status name must be 50 characters or less';
    }

    if (formData.statusDescription && formData.statusDescription.length > 200) {
      newErrors.statusDescription = 'Description must be 200 characters or less';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) {
      return;
    }

    await onSubmit(formData);
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.formGroup}>
        <label htmlFor="statusCode" className={styles.label}>
          Status Name <span className={styles.required}>*</span>
        </label>
        <Input
          id="statusCode"
          type="text"
          value={formData.statusCode}
          onChange={(e) => handleChange('statusCode', e.target.value)}
          placeholder="e.g., Not Started, In Progress, Completed"
          error={errors.statusCode}
          disabled={isLoading}
        />
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="statusDescription" className={styles.label}>
          Description (Optional)
        </label>
        <Input
          id="statusDescription"
          type="text"
          value={formData.statusDescription}
          onChange={(e) => handleChange('statusDescription', e.target.value)}
          placeholder="Brief description of this workflow step"
          error={errors.statusDescription}
          disabled={isLoading}
        />
      </div>

      <div className={styles.buttonGroup}>
        <Button 
          type="button" 
          variant="outline" 
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button 
          type="submit" 
          variant="primary"
          disabled={isLoading}
        >
          {isLoading ? 'Saving...' : (step?.statusId ? 'Update Step' : 'Add Step')}
        </Button>
      </div>
    </form>
  );
};
