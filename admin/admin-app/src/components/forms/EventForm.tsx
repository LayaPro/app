import React, { useState, useEffect } from 'react';
import { Button } from '../ui/Button.js';
import { Input } from '../ui/Input.js';
import { sanitizeAlphanumeric, sanitizeTextInput } from '../../utils/sanitize.js';
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
    } else if (formData.eventCode.length > 10) {
      newErrors.eventCode = 'Event code must be 10 characters or less';
    } else if (/\s/.test(formData.eventCode)) {
      newErrors.eventCode = 'Event code cannot contain spaces';
    }

    if (!formData.eventDesc.trim()) {
      newErrors.eventDesc = 'Event description is required';
    } else if (formData.eventDesc.length > 50) {
      newErrors.eventDesc = 'Description must be 50 characters or less';
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

    // Sanitize all inputs before submission
    const sanitizedData = {
      eventCode: sanitizeAlphanumeric(formData.eventCode.replace(/\s/g, '')),
      eventDesc: sanitizeTextInput(formData.eventDesc),
      eventAlias: formData.eventAlias ? sanitizeTextInput(formData.eventAlias) : undefined,
    };

    await onSubmit(sanitizedData);
  };

  const handleChange = (field: string, value: string) => {
    let sanitizedValue = value;
    
    // Apply field-specific sanitization
    if (field === 'eventCode') {
      // Remove spaces and sanitize alphanumeric
      sanitizedValue = sanitizeAlphanumeric(value.replace(/\s/g, ''));
    } else if (field === 'eventDesc' || field === 'eventAlias') {
      // Sanitize text input
      sanitizedValue = sanitizeTextInput(value);
    }
    
    setFormData(prev => ({ ...prev, [field]: sanitizedValue }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.formGroup}>
        <Input
          id="eventCode"
          type="text"
          label="Event Code"
          value={formData.eventCode}
          onChange={(e) => handleChange('eventCode', e.target.value)}
          placeholder="e.g., WED, BDAY, CORP"
          error={errors.eventCode}
          disabled={isLoading}
          required
          maxLength={10}
          showCharCount={true}
          info="A short unique code to identify the event type (max 10 characters)"
        />
      </div>

      <div className={styles.formGroup}>
        <Input
          id="eventDesc"
          type="text"
          label="Description"
          value={formData.eventDesc}
          onChange={(e) => handleChange('eventDesc', e.target.value)}
          placeholder="e.g., Wedding, Birthday Party"
          error={errors.eventDesc}
          disabled={isLoading}
          required
          maxLength={50}
          showCharCount={true}
          info="A brief description of the event type (max 50 characters)"
        />
      </div>

      <div className={styles.formGroup}>
        <Input
          id="eventAlias"
          type="text"
          label="Note (Optional)"
          value={formData.eventAlias}
          onChange={(e) => handleChange('eventAlias', e.target.value)}
          placeholder="e.g., Marriage Ceremony, Anniversary Celebration"
          error={errors.eventAlias}
          disabled={isLoading}
          maxLength={100}
          showCharCount={true}
          info="Additional notes or alternative name for the event type (max 100 characters)"
        />
      </div>

      <div className={styles.actions}>
        <Button 
          type="submit" 
          variant="primary"
          disabled={isLoading}
        >
          {isLoading ? 'Saving...' : event ? 'Update Event' : 'Create Event'}
        </Button>
        <Button 
          type="button" 
          variant="secondary" 
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
};
