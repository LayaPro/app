import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '../../components/ui/index.js';
import { PageHeader, HelpPanel } from '../../components/help/index.js';
import { getHelpContent } from '../../data/helpContent.js';
import { ListView } from './components/ListView';
import { EventModal } from './components/EventModal';
import { clientEventApi, eventApi, teamApi, projectApi, eventDeliveryStatusApi } from '../../services/api';
import type { ClientEvent } from '@/types/shared';
import styles from '../Page.module.css';

const EventsList = () => {
  const [searchParams] = useSearchParams();
  const urlProjectId = searchParams.get('projectId');

  const [eventTypes, setEventTypes] = useState<Map<string, any>>(new Map());
  const [teamMembers, setTeamMembers] = useState<Map<string, any>>(new Map());
  const [projects, setProjects] = useState<Array<{ projectId: string; projectName: string }>>([]);
  const [projectsMap, setProjectsMap] = useState<Map<string, any>>(new Map());
  const [statuses, setStatuses] = useState<Map<string, any>>(new Map());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<ClientEvent | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const helpContent = getHelpContent('calendar');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [eventTypesRes, teamRes, projectsRes, statusesRes] = await Promise.all([
        eventApi.getAll(),
        teamApi.getAll(),
        projectApi.getAll(),
        eventDeliveryStatusApi.getAll(),
      ]);

      const typesMap = new Map();
      (eventTypesRes.events || []).forEach((type: any) => {
        typesMap.set(type.eventId, type);
      });
      setEventTypes(typesMap);

      const membersMap = new Map();
      (teamRes.teamMembers || []).forEach((member: any) => {
        membersMap.set(member.memberId, member);
      });
      setTeamMembers(membersMap);

      setProjects(projectsRes.projects || []);

      const projectsMapping = new Map();
      (projectsRes.projects || []).forEach((project: any) => {
        projectsMapping.set(project.projectId, project);
      });
      setProjectsMap(projectsMapping);

      const statusesMap = new Map();
      (statusesRes.eventDeliveryStatuses || []).forEach((status: any) => {
        statusesMap.set(status.statusId, status);
      });
      setStatuses(statusesMap);
    } catch (error) {
      console.error('Error fetching events list data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    try {
      await clientEventApi.delete(eventId);
      setRefreshKey(k => k + 1);
    } catch (error) {
      console.error('Error deleting event:', error);
    }
  };

  const handleSaveEvent = async (eventData: any) => {
    try {
      if (selectedEvent) {
        await clientEventApi.update(selectedEvent.clientEventId, eventData);
      } else {
        await clientEventApi.create(eventData);
      }
      setRefreshKey(k => k + 1);
      setIsModalOpen(false);
      setSelectedEvent(null);
    } catch (error) {
      console.error('Error saving event:', error);
      throw error;
    }
  };

  if (isLoading) {
    return (
      <div className={styles.pageContainer}>
        <PageHeader onHelpClick={() => setShowHelp(true)} />
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <div style={{
            width: '48px', height: '48px',
            border: '4px solid var(--border-color)',
            borderTopColor: 'var(--color-primary)',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      <PageHeader onHelpClick={() => setShowHelp(true)} />

      <ListView
        eventTypes={eventTypes}
        projects={projectsMap}
        teamMembers={teamMembers}
        eventDeliveryStatuses={statuses}
        onEventClick={(event) => { setSelectedEvent(event); setIsModalOpen(true); }}
        onEventDelete={() => setRefreshKey(k => k + 1)}
        onAddEvent={() => { setSelectedEvent(null); setIsModalOpen(true); }}
        initialProjectFilter={urlProjectId || ''}
        refreshKey={refreshKey}
      />

      <EventModal
        isOpen={isModalOpen}
        event={selectedEvent}
        projects={projects}
        eventTypes={eventTypes}
        teamMembers={teamMembers}
        eventDeliveryStatuses={statuses}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedEvent(null);
        }}
        onSave={handleSaveEvent}
        onDelete={selectedEvent ? handleDeleteEvent : undefined}
      />

      {showHelp && helpContent && (
        <HelpPanel help={helpContent} onClose={() => setShowHelp(false)} />
      )}
    </div>
  );
};

export default EventsList;
