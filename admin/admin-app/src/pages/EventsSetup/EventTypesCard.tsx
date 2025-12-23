import { useState } from 'react';
import { DataTable } from '../../components/ui/DataTable.js';
import type { Column } from '../../components/ui/DataTable.js';
import { Modal } from '../../components/ui/Modal.js';
import { CollapsibleCard } from '../../components/ui/CollapsibleCard.js';
import { EventForm } from '../../components/forms/EventForm.js';
import { eventApi } from '../../services/api.js';
import styles from './EventCard.module.css';

interface EventTypesCardProps {
  eventTypes: any[];
  loading: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
  onRefresh: () => void;
}

export const EventTypesCard: React.FC<EventTypesCardProps> = ({
  eventTypes,
  loading,
  isExpanded,
  onToggle,
  onSuccess,
  onError,
  onRefresh,
}) => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateEvent = async (data: { eventCode: string; eventDesc: string; eventAlias?: string }) => {
    try {
      setIsSubmitting(true);
      await eventApi.create(data);
      onSuccess('Event type created successfully');
      setIsCreateModalOpen(false);
      onRefresh();
    } catch (error: any) {
      onError(error.message || 'Failed to create event');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditEvent = async (data: { eventCode: string; eventDesc: string; eventAlias?: string }) => {
    if (!selectedEvent) return;
    
    try {
      setIsSubmitting(true);
      await eventApi.update(selectedEvent.eventId, data);
      onSuccess('Event type updated successfully');
      setIsEditModalOpen(false);
      setSelectedEvent(null);
      onRefresh();
    } catch (error: any) {
      onError(error.message || 'Failed to update event');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this event type?')) {
      return;
    }

    try {
      await eventApi.delete(eventId);
      onSuccess('Event type deleted successfully');
      onRefresh();
    } catch (error: any) {
      onError(error.message || 'Failed to delete event');
    }
  };

  const openEditModal = (event: any) => {
    setSelectedEvent(event);
    setIsEditModalOpen(true);
  };

  const eventTypesColumns: Column<any>[] = [
    {
      key: 'eventCode',
      header: 'Code',
      sortable: true,
    },
    {
      key: 'eventDesc',
      header: 'Description',
      sortable: true,
    },
    {
      key: 'eventAlias',
      header: 'Alias',
      sortable: true,
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <div className={styles.actions}>
          <button 
            className={styles.editButton} 
            title="Edit"
            onClick={() => openEditModal(row)}
          >
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button 
            className={styles.deleteButton} 
            title="Delete"
            onClick={() => handleDeleteEvent(row.eventId)}
          >
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
      <CollapsibleCard
        icon={
          <svg className={styles.cardIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        }
        title="Event Types"
        subtitle="Manage different types of events (Wedding, Birthday, Corporate, etc.)"
        isExpanded={isExpanded}
        onToggle={onToggle}
      >
        <DataTable
          columns={eventTypesColumns}
          data={eventTypes}
          itemsPerPage={10}
          emptyMessage={loading ? "Loading..." : "No event types found"}
          onCreateClick={() => setIsCreateModalOpen(true)}
          createButtonText="Add Event Type"
        />
      </CollapsibleCard>

      {/* Create Event Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create Event Type"
        size="medium"
      >
        <EventForm
          onSubmit={handleCreateEvent}
          onCancel={() => setIsCreateModalOpen(false)}
          isLoading={isSubmitting}
        />
      </Modal>

      {/* Edit Event Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedEvent(null);
        }}
        title="Edit Event Type"
        size="medium"
      >
        <EventForm
          event={selectedEvent}
          onSubmit={handleEditEvent}
          onCancel={() => {
            setIsEditModalOpen(false);
            setSelectedEvent(null);
          }}
          isLoading={isSubmitting}
        />
      </Modal>
    </>
  );
};
