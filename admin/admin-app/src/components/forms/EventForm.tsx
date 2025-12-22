import React, { useState, useEffect } from 'react';
import { Button } from '../ui/Button.js';
import { Input } from '../ui/Input.js';
import styles from './EventForm.module.css';

interface EventFormProps {
  event?: {
    eventId?: string;
    eventCode: string;
    eventDesc: string;
    eventAlias?: string;
  };
  onSubmit: (data: { eventCode: string; eventDesc: string; eventAlias?: string }) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export const EventForm: React.FC<EventFormProps> = ({ 
  event, 
  onSubmit, 
  onCancel,
  isLoading = false 
}) => {
  const [formData, setFormData] = useState({
    eventCode: event?.eventCode || '',
    eventDesc: event?.eventDesc || '',
    eventAlias: event?.eventAlias || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (event) {
      setFormData({
        eventCode: event.eventCode,
        eventDesc: event.eventDesc,
        eventAlias: event.eventAlias || '',
      });
    }
  }, [event]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.eventCode.trim()) {
      newErrors.eventCode = 'Event code is required';
    } else if (formData.eventCode.length > 20) {
      newErrors.eventCode = 'Event code must be 20 characters or less';
    }

    if (!formData.eventDesc.trim()) {
      newErrors.eventDesc = 'Event description is required';
    } else if (formData.eventDesc.length > 100) {
      newErrors.eventDesc = 'Description must be 100 characters or less';
    }

    if (formData.eventAlias && formData.eventAlias.length > 100) {
      newErrors.eventAlias = 'Alias must be 100 characters or less';
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
        <label htmlFor="eventCode" className={styles.label}>
          Event Code <span className={styles.required}>*</span>
        </label>
        <Input
          id="eventCode"
          type="text"
          value={formData.eventCode}
          onChange={(e) => handleChange('eventCode', e.target.value)}
          placeholder="e.g., WED, BDAY, CORP"
          error={errors.eventCode}
          disabled={isLoading}
        />
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="eventDesc" className={styles.label}>
          Description <span className={styles.required}>*</span>
        </label>
        <Input
          id="eventDesc"
          type="text"
          value={formData.eventDesc}
          onChange={(e) => handleChange('eventDesc', e.target.value)}
          placeholder="e.g., Wedding, Birthday Party"
          error={errors.eventDesc}
          disabled={isLoading}
        />
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="eventAlias" className={styles.label}>
          Alias (Optional)
        </label>
        <Input
          id="eventAlias"
          type="text"
          value={formData.eventAlias}
          onChange={(e) => handleChange('eventAlias', e.target.value)}
          placeholder="e.g., Marriage Ceremony"
          error={errors.eventAlias}
          disabled={isLoading}
        />
      </div>

      <div className={styles.actions}>
        <Button 
          type="button" 
          variant="secondary" 
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
          {isLoading ? 'Saving...' : event ? 'Update Event' : 'Create Event'}
        </Button>
      </div>
    </form>
  );
};
