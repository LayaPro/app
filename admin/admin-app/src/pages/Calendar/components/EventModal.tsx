import { useState, useEffect } from 'react';
import type { ClientEvent } from 'laya-shared';
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
    toDate: '',
    toTime: '',
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

      setFormData({
        projectId: event.projectId || '',
        eventId: event.eventId || '',
        eventDeliveryStatusId: event.eventDeliveryStatusId || '',
        fromDate: fromDate ? fromDate.toISOString().split('T')[0] : '',
        fromTime: fromDate ? fromDate.toTimeString().slice(0, 5) : '',
        toDate: toDate ? toDate.toISOString().split('T')[0] : '',
        toTime: toDate ? toDate.toTimeString().slice(0, 5) : '',
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
        toDate: '',
        toTime: '',
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
    if (!formData.eventDeliveryStatusId) newErrors.eventDeliveryStatusId = 'Status is required';
    if (!formData.fromDate) newErrors.fromDate = 'From date is required';
    if (!formData.toDate) newErrors.toDate = 'To date is required';
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
      // Combine date and time into datetime
      const fromDatetime = formData.fromDate && formData.fromTime
        ? new Date(`${formData.fromDate}T${formData.fromTime}:00`)
        : undefined;
      const toDatetime = formData.toDate && formData.toTime
        ? new Date(`${formData.toDate}T${formData.toTime}:00`)
        : undefined;

      const eventData = {
        projectId: formData.projectId,
        eventId: formData.eventId,
        eventDeliveryStatusId: formData.eventDeliveryStatusId || undefined,
        fromDatetime,
        toDatetime,
        venue: formData.venue || undefined,
        venueMapUrl: formData.venueMapUrl || undefined,
        city: formData.city || undefined,
        teamMembersAssigned: formData.teamMembersAssigned.length > 0 ? formData.teamMembersAssigned : undefined,
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
      size="large"
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
            />
          </div>

          {/* Status */}
          <div className={styles.fullWidth}>
            <SearchableSelect
              label="Status"
              value={formData.eventDeliveryStatusId}
              onChange={(value) => handleChange('eventDeliveryStatusId', value)}
              options={statusOptions}
              placeholder="Select Status"
              error={errors.eventDeliveryStatusId}
              required
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
            />
          </div>

          <div className={styles.dateTimeGroup}>
            <DatePicker
              label="To Date"
              value={formData.toDate}
              onChange={(value) => handleChange('toDate', value)}
              placeholder="Select date"
              includeTime={true}
              timeValue={formData.toTime}
              onTimeChange={(value) => handleChange('toTime', value)}
              error={errors.toDate}
              required
            />
          </div>

          {/* Venue */}
          <div className={styles.fullWidth}>
            <Input
              type="text"
              label="Venue"
              value={formData.venue}
              onChange={(e) => handleChange('venue', e.target.value)}
              placeholder="Event venue"
              error={errors.venue}
              required
              icon={
                <svg style={{ width: '1rem', height: '1rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              }
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
            />
          </div>
        </div>

        {/* Actions */}
        <div className={styles.actions}>
          <Button
            type="submit"
            variant="primary"
            isLoading={isLoading}
            fullWidth
          >
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
          {event && onDelete && (
            <Button
              type="button"
              variant="secondary"
              onClick={handleDelete}
              disabled={isLoading}
              style={{ background: '#ef4444', color: 'white' }}
            >
              <svg style={{ width: '1.25rem', height: '1.25rem', marginRight: '0.5rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete
            </Button>
          )}
        </div>
      </form>
    </Modal>
  );
};
