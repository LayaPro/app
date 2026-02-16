import { useState, useEffect } from 'react';
import styles from './EventsSetup.module.css';
import { eventApi, eventDeliveryStatusApi } from '../../services/api.js';
import { Tabs } from '../../components/ui/index.js';
import { PageHeader, HelpPanel } from '../../components/help/index.js';
import { getHelpContent } from '../../data/helpContent.js';
import type { Tab } from '../../components/ui/Tabs.js';
import { EventTypesCard } from './EventTypesCard.js';
import { EventWorkflowCard } from './EventWorkflowCard.js';
import { useToast } from '../../context/ToastContext';

const EventsSetup = () => {
  const [eventTypes, setEventTypes] = useState<any[]>([]);
  const [eventStatuses, setEventStatuses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();
  const [showHelp, setShowHelp] = useState(false);
  const helpContent = getHelpContent('events-setup');

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

  const handleSuccess = (message: string) => {
    showToast('success', message);
  };

  const handleError = (message: string) => {
    showToast('error', message);
  };

  const tabs: Tab[] = [
    {
      id: 'eventWorkflow',
      label: 'Album',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
      badge: eventStatuses.length,
      content: (
        <EventWorkflowCard
          eventStatuses={eventStatuses}
          loading={loading}
          onSuccess={handleSuccess}
          onError={handleError}
          onRefresh={fetchData}
        />
      ),
    },
    {
      id: 'videoWorkflow',
      label: 'Video',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      ),
      badge: 0,
      content: (
        <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" style={{ margin: '0 auto 16px', opacity: 0.5 }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          <p>Video Workflow configuration coming soon...</p>
        </div>
      ),
    },
    {
      id: 'eventTypes',
      label: 'Events',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      badge: eventTypes.length,
      content: (
        <EventTypesCard
          eventTypes={eventTypes}
          loading={loading}
          onSuccess={handleSuccess}
          onError={handleError}
          onRefresh={fetchData}
        />
      ),
    },
  ];

  return (
    <div className={styles.pageContainer}>
      <PageHeader onHelpClick={() => setShowHelp(true)} />
      <Tabs tabs={tabs} />
      {showHelp && helpContent && (
        <HelpPanel help={helpContent} onClose={() => setShowHelp(false)} />
      )}
    </div>
  );
};

export default EventsSetup;
