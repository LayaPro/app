import { useState, useEffect } from 'react';
import styles from './EventsSetup.module.css';
import { eventApi, eventDeliveryStatusApi } from '../../services/api.js';
import { Breadcrumb } from '../../components/ui/index.js';
import { EventTypesCard } from './EventTypesCard.js';
import { EventWorkflowCard } from './EventWorkflowCard.js';
import { useToast } from '../../context/ToastContext';

const EventsSetup = () => {
  const [expandedCard, setExpandedCard] = useState<string | null>('eventWorkflow');
  const [eventTypes, setEventTypes] = useState<any[]>([]);
  const [eventStatuses, setEventStatuses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
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
        showToast('warning', 'Session expired. Showing sample data. Please login to see real data.');
      } else {
        showToast('warning', 'Unable to connect to server. Showing sample data.');
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleCard = (cardId: string) => {
    setExpandedCard(prev => prev === cardId ? null : cardId);
  };

  const handleSuccess = (message: string) => {
    showToast('success', message);
  };

  const handleError = (message: string) => {
    showToast('error', message);
  };

  return (
    <div className={styles.pageContainer}>
      <Breadcrumb />

      <div className={styles.cardsContainer}>
        <EventWorkflowCard
          eventStatuses={eventStatuses}
          loading={loading}
          isExpanded={expandedCard === 'eventWorkflow'}
          onToggle={() => toggleCard('eventWorkflow')}
        />

        <EventTypesCard
          eventTypes={eventTypes}
          loading={loading}
          isExpanded={expandedCard === 'eventTypes'}
          onToggle={() => toggleCard('eventTypes')}
          onSuccess={handleSuccess}
          onError={handleError}
          onRefresh={fetchData}
        />
      </div>
    </div>
  );
};

export default EventsSetup;
