import { useState, useEffect } from 'react';
import type { ClientEvent } from '@/types/shared';
import { Modal, Input, Textarea, SearchableSelect, Button, MultiSelect, DatePicker } from '../../../components/ui';
import type { SelectOption } from '../../../components/ui';
import styles from './EventModal.module.css';

interface EventModalProps {
  isOpen: boolean;
  event?: ClientEvent | null;
  projects: Array<{ projectId: string; projectName: string }>;
  eventTypes: Map<string, { eventId: string; eventDesc: string; eventAlias?: string }>;
  teamMembers: Map<string, { memberId: string; firstName: string; lastName: string }>;
  eventDeliveryStatuses: Map<string, { statusId: string; statusDescription: string }>;
  onClose: () => void;
  onSave: (eventData: any) => Promise<void>;
  onDelete?: (eventId: string) => Promise<void>;
}

export const EventModal: React.FC<EventModalProps> = ({
  isOpen,
  event,
  projects,
  eventTypes,
  teamMembers,
  eventDeliveryStatuses,
  onClose,
  onSave,
  onDelete,
}) => {
  const [formData, setFormData] = useState({
    projectId: '',
    eventId: '',
    eventDeliveryStatusId: '',
    fromDate: '',
    fromTime: '',
    duration: 4,
    venue: '',
    venueMapUrl: '',
    city: '',
    teamMembersAssigned: [] as string[],
    notes: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setErrors({});
    if (event) {
      const fromDate = event.fromDatetime ? new Date(event.fromDatetime) : null;
      const toDate = event.toDatetime ? new Date(event.toDatetime) : null;

      // Calculate duration from existing dates if available
      let duration = 4;
      if (fromDate && toDate) {
        duration = Math.round((toDate.getTime() - fromDate.getTime()) / (60 * 60 * 1000));
      }

      setFormData({
        projectId: event.projectId || '',
        eventId: event.eventId || '',
        eventDeliveryStatusId: event.eventDeliveryStatusId || '',
        fromDate: fromDate ? fromDate.toISOString().split('T')[0] : '',
        fromTime: fromDate ? fromDate.toTimeString().slice(0, 5) : '',
        duration: duration,
        venue: event.venue || '',
        venueMapUrl: event.venueMapUrl || '',
        city: event.city || '',
        teamMembersAssigned: event.teamMembersAssigned || [],
        notes: event.notes || '',
      });
    } else {
      // Reset for new event
      setFormData({
        projectId: '',
        eventId: '',
        eventDeliveryStatusId: '',
        fromDate: '',
        fromTime: '',
        duration: 4,
        venue: '',
        venueMapUrl: '',
        city: '',
        teamMembersAssigned: [],
        notes: '',
      });
    }
  }, [event, isOpen]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.projectId) newErrors.projectId = 'Project is required';
    if (!formData.eventId) newErrors.eventId = 'Event type is required';
    if (!formData.fromDate) newErrors.fromDate = 'From date is required';
    if (!formData.venue?.trim()) newErrors.venue = 'Venue is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // Calculate toDate and toTime based on duration
      const fromDateTime = new Date(`${formData.fromDate}T${formData.fromTime || '00:00'}:00`);
      const toDateTime = new Date(fromDateTime.getTime() + formData.duration * 60 * 60 * 1000);

      const eventData = {
        projectId: formData.projectId,
        eventId: formData.eventId,
        eventDeliveryStatusId: formData.eventDeliveryStatusId || undefined,
        fromDatetime: fromDateTime,
        toDatetime: toDateTime,
        venue: formData.venue || undefined,
        venueMapUrl: formData.venueMapUrl || undefined,
        city: formData.city || undefined,
        teamMembersAssigned: formData.teamMembersAssigned,
        notes: formData.notes || undefined,
      };

      await onSave(eventData);
      onClose();
    } catch (error) {
      console.error('Error saving event:', error);
      alert('Failed to save event. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!event || !onDelete) return;
    if (!confirm('Are you sure you want to delete this event?')) return;

    setIsLoading(true);
    try {
      await onDelete(event.clientEventId);
      onClose();
    } catch (error) {
      console.error('Error deleting event:', error);
      alert('Failed to delete event. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const eventTypesList = Array.from(eventTypes.values());
  const statusesList = Array.from(eventDeliveryStatuses.values()).sort((a, b) => 
    ((a as any).step || 0) - ((b as any).step || 0)
  );
  const teamMembersList = Array.from(teamMembers.values());

  // Prepare options for Select components
  const projectOptions: SelectOption[] = projects.map(p => ({
    value: p.projectId,
    label: p.projectName
  }));

  const eventTypeOptions: SelectOption[] = eventTypesList.map(t => ({
    value: t.eventId,
    label: t.eventDesc
  }));

  const statusOptions: SelectOption[] = statusesList.map(s => ({
    value: s.statusId,
    label: s.statusDescription
  }));

  const teamMemberOptions = teamMembersList.map(m => ({
    value: m.memberId,
    label: `${m.firstName} ${m.lastName}${(m as any).profile?.name ? ` - ${(m as any).profile.name}` : ''}`
  }));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={event ? 'Event Details' : 'New Event'}
      size="medium"
    >
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGrid}>
          {/* Project */}
          <div className={styles.fullWidth}>
            <SearchableSelect
              label="Project"
              value={formData.projectId}
              onChange={(value) => handleChange('projectId', value)}
              options={projectOptions}
              placeholder="Select Project"
              error={errors.projectId}
              required
              info="Select the project this event belongs to"
            />
          </div>

          {/* Event Type */}
          <div className={styles.fullWidth}>
            <SearchableSelect
              label="Event Type"
              value={formData.eventId}
              onChange={(value) => handleChange('eventId', value)}
              options={eventTypeOptions}
              placeholder="Select Event Type"
              error={errors.eventId}
              required
              info="Choose the type of event (e.g., Wedding, Reception, Engagement)"
            />
          </div>

          {/* Date & Time */}
          <div className={styles.dateTimeGroup}>
            <DatePicker
              label="From Date"
              value={formData.fromDate}
              onChange={(value) => handleChange('fromDate', value)}
              placeholder="Select date"
              includeTime={true}
              timeValue={formData.fromTime}
              onTimeChange={(value) => handleChange('fromTime', value)}
              error={errors.fromDate}
              required
              info="Event start date and time"
            />
          </div>

          <div className={styles.dateTimeGroup}>
            <Input
              label="Duration (hours)"
              type="number"
              min="0.5"
              max="24"
              step="0.5"
              value={formData.duration === 0 ? '' : String(formData.duration || 4)}
              onChange={(e) => {
                const value = e.target.value;
                if (value === '') {
                  handleChange('duration', 0); // Temporarily allow empty
                } else {
                  const numValue = parseFloat(value);
                  if (!isNaN(numValue)) {
                    if (numValue > 24) {
                      handleChange('duration', 24);
                    } else {
                      handleChange('duration', numValue);
                    }
                  }
                }
              }}
              onBlur={() => {
                // On blur, enforce minimum or set to default
                if (formData.duration === 0 || formData.duration < 0.5) {
                  handleChange('duration', 4);
                } else if (formData.duration < 0.5) {
                  handleChange('duration', 0.5);
                }
              }}
              placeholder="4"
              info="Expected duration of the event (0.5 to 24 hours)"
              required
            />
          </div>

          {/* Team Members */}
          <div className={styles.fullWidth}>
            <MultiSelect
              label="Team Members Assigned"
              value={formData.teamMembersAssigned}
              onChange={(values) => handleChange('teamMembersAssigned', values)}
              options={teamMemberOptions}
              placeholder="Select team members"
              info="Team members who will be working on this event"
            />
          </div>

          {/* Venue */}
          <div className={styles.fullWidth}>
            <Textarea
              label="Venue"
              value={formData.venue}
              onChange={(e) => handleChange('venue', e.target.value)}
              placeholder="Event venue"
              error={errors.venue}
              required
              info="Name of the venue where the event will take place"
              maxLength={200}
              showCharCount
            />
          </div>

          {/* City */}
          <div className={styles.fullWidth}>
            <Input
              type="text"
              label="City"
              value={formData.city}
              onChange={(e) => handleChange('city', e.target.value)}
              placeholder="City"
              info="City where the event will be held"
              maxLength={50}
              showCharCount
            />
          </div>

          {/* Venue Map URL */}
          <div className={styles.fullWidth}>
            <Input
              type="url"
              label="Venue Map URL"
              value={formData.venueMapUrl}
              onChange={(e) => handleChange('venueMapUrl', e.target.value)}
              placeholder="Google Maps link"
              info="Link to the venue location on Google Maps for easy navigation"
              maxLength={200}
              showCharCount
            />
          </div>

          {/* Notes */}
          <div className={styles.fullWidth}>
            <Textarea
              label="Notes"
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="Add notes about this event..."
              rows={4}
              info="Additional notes or special instructions for this event"
              maxLength={200}
              showCharCount
            />
          </div>
        </div>

        {/* Actions */}
        <div className={styles.actions}>
          <button
            type="submit"
            disabled={isLoading}
            className={styles.submitButton}
          >
            {isLoading ? 'Saving...' : (event ? 'Update Event' : 'Create Event')}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className={styles.cancelButton}
          >
            Cancel
          </button>
        </div>
      </form>
    </Modal>
  );
};
