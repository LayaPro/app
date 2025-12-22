import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './EventsSetup.module.css';
import { DataTable } from '../components/ui/DataTable.js';
import type { Column } from '../components/ui/DataTable.js';
import { eventApi, eventDeliveryStatusApi } from '../services/api.js';
import { Alert, Modal } from '../components/ui/index.js';
import { EventForm } from '../components/forms/EventForm.js';

const EventsSetup = () => {
  const navigate = useNavigate();
  const [expandedCard, setExpandedCard] = useState<string | null>('eventTypes');
  const [eventTypes, setEventTypes] = useState<any[]>([]);
  const [eventStatuses, setEventStatuses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [eventsResponse, statusesResponse] = await Promise.all([
        eventApi.getAll(),
        eventDeliveryStatusApi.getAll(),
      ]);
      
      setEventTypes(eventsResponse.events || []);
      setEventStatuses(statusesResponse.eventDeliveryStatuses || []);
    } catch (error: any) {
      console.error('Error fetching data:', error);
      // Use dummy data as fallback
      setEventTypes([
        { eventId: '1', eventCode: 'WED', eventDesc: 'Wedding', eventAlias: 'Marriage Ceremony', createdAt: '2024-12-01' },
        { eventId: '2', eventCode: 'BDAY', eventDesc: 'Birthday', eventAlias: 'Birthday Party', createdAt: '2024-12-05' },
        { eventId: '3', eventCode: 'CORP', eventDesc: 'Corporate Event', eventAlias: 'Business Event', createdAt: '2024-12-10' },
      ]);
      setEventStatuses([
        { statusId: '1', step: 1, statusCode: 'BOOKING', lastUpdatedDate: '2024-12-15' },
        { statusId: '2', step: 2, statusCode: 'SHOOTING', lastUpdatedDate: '2024-12-16' },
        { statusId: '3', step: 3, statusCode: 'EDITING', lastUpdatedDate: '2024-12-18' },
      ]);
      
      if (error.message.includes('token') || error.message.includes('expired')) {
        setError('Session expired. Showing sample data. Please login to see real data.');
      } else {
        setError('Unable to connect to server. Showing sample data.');
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleCard = (cardId: string) => {
    setExpandedCard(prev => prev === cardId ? null : cardId);
  };

  const handleCreateEvent = async (data: { eventCode: string; eventDesc: string; eventAlias?: string }) => {
    try {
      setIsSubmitting(true);
      await eventApi.create(data);
      setSuccess('Event type created successfully');
      setIsCreateModalOpen(false);
      fetchData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (error: any) {
      setError(error.message || 'Failed to create event');
      setTimeout(() => setError(null), 5000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditEvent = async (data: { eventCode: string; eventDesc: string; eventAlias?: string }) => {
    if (!selectedEvent) return;
    
    try {
      setIsSubmitting(true);
      await eventApi.update(selectedEvent.eventId, data);
      setSuccess('Event type updated successfully');
      setIsEditModalOpen(false);
      setSelectedEvent(null);
      fetchData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (error: any) {
      setError(error.message || 'Failed to update event');
      setTimeout(() => setError(null), 5000);
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
      setSuccess('Event type deleted successfully');
      fetchData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (error: any) {
      setError(error.message || 'Failed to delete event');
      setTimeout(() => setError(null), 5000);
    }
  };

  const openEditModal = (event: any) => {
    setSelectedEvent(event);
    setIsEditModalOpen(true);
  };

  // Define columns for Event Types table
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

  // Define columns for Event Delivery Status table
  const eventStatusColumns: Column<any>[] = [
    {
      key: 'step',
      header: 'Step',
      sortable: true,
    },
    {
      key: 'statusCode',
      header: 'Status Code',
      sortable: true,
    },
    {
      key: 'lastUpdatedDate',
      header: 'Last Updated',
      sortable: true,
      render: (row) => row.lastUpdatedDate ? new Date(row.lastUpdatedDate).toLocaleDateString() : '-',
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <div className={styles.actions}>
          <button 
            className={styles.editButton} 
            title="Edit"
            onClick={() => console.log('Edit status', row)}
          >
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button 
            className={styles.deleteButton} 
            title="Delete"
            onClick={() => console.log('Delete status', row)}
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
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Events Setup</h1>
        <p className={styles.pageDescription}>
          Configure event types and delivery workflow statuses for your photography business
        </p>
      </div>

      {error && <Alert type="warning" message={error} />}
      {success && <Alert type="success" message={success} />}

      <div className={styles.cardsContainer}>
        {/* Event Types Card */}
        <div className={styles.card}>
          <button
            className={styles.cardHeader}
            onClick={() => toggleCard('eventTypes')}
          >
            <div className={styles.cardHeaderContent}>
              <svg className={styles.cardIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <div>
                <h2 className={styles.cardTitle}>Event Types</h2>
                <p className={styles.cardSubtitle}>Manage different types of events (Wedding, Birthday, Corporate, etc.)</p>
              </div>
            </div>
            <svg
              className={`${styles.chevron} ${expandedCard === 'eventTypes' ? styles.chevronExpanded : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          <div className={`${styles.cardContent} ${expandedCard === 'eventTypes' ? styles.cardContentExpanded : ''}`}>
            <div className={styles.contentInner}>
              <DataTable
                columns={eventTypesColumns}
                data={eventTypes}
                itemsPerPage={5}
                emptyMessage={loading ? "Loading..." : "No event types configured yet"}
                onCreateClick={() => setIsCreateModalOpen(true)}
                createButtonText="Add Event Type"
                additionalSortOptions={[
                  { key: 'createdAt', label: 'Date Created' },
                ]}
                emptyIcon={
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                }
              />
            </div>
          </div>
        </div>

        {/* Event Delivery Status Card */}
        <div className={styles.card}>
          <button
            className={styles.cardHeader}
            onClick={() => toggleCard('eventStatus')}
          >
            <div className={styles.cardHeaderContent}>
              <svg className={styles.cardIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h2 className={styles.cardTitle}>Event Delivery Status</h2>
                <p className={styles.cardSubtitle}>Define workflow steps for event delivery (Booking → Shooting → Editing → Delivered)</p>
              </div>
            </div>
            <svg
              className={`${styles.chevron} ${expandedCard === 'eventStatus' ? styles.chevronExpanded : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          <div className={`${styles.cardContent} ${expandedCard === 'eventStatus' ? styles.cardContentExpanded : ''}`}>
            <div className={styles.contentInner}>
              <DataTable
                columns={eventStatusColumns}
                data={eventStatuses}
                itemsPerPage={5}
                emptyMessage={loading ? "Loading..." : "No delivery status steps defined yet"}
                onCreateClick={() => console.log('Create Status Step')}
                createButtonText="Add Status Step"
                additionalSortOptions={[
                  { key: 'lastUpdatedDate', label: 'Last Updated' },
                  { key: 'step', label: 'Step Number' },
                ]}
                emptyIcon={
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                }
              />
            </div>
          </div>
        </div>
      </div>

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
    </div>
  );
};

export default EventsSetup;
