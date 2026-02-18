import { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Modal, Button } from '../../../components/ui/index.js';
import { PageHeader, HelpPanel } from '../../../components/help/index.js';
import { getHelpContent } from '../../../data/helpContent.js';
import { CalendarHeader } from './CalendarHeader';
import { MonthView } from './MonthView';
import { MobileMonthView } from './MobileMonthView';
import { WeekView } from './WeekView';
import { DayView } from './DayView';
import { EventModal } from './EventModal';
import { clientEventApi, eventApi, teamApi, projectApi, eventDeliveryStatusApi } from '../../../services/api';
import type { ClientEvent } from '@/types/shared';
import type { CalendarView } from '../../../utils/calendar';
import {
  MONTH_NAMES,
  getWeekStart,
  getWeekEnd,
  addDays,
  addMonths,
  getDateRangeString,
} from '../../../utils/calendar';
import styles from '../../Page.module.css';
import calendarStyles from '../Calendar.module.css';

interface CalendarPageBaseProps {
  filterEvents?: (events: ClientEvent[]) => ClientEvent[];
  extraHeader?: React.ReactNode;
  onDataLoaded?: (membersMap: Map<string, any>) => void;
}

const CalendarPageBase = ({ filterEvents, extraHeader, onDataLoaded }: CalendarPageBaseProps) => {
  const [searchParams] = useSearchParams();
  const urlView = searchParams.get('view') as CalendarView | null;

  const [currentView, setCurrentView] = useState<CalendarView>(urlView && ['month', 'week', 'day'].includes(urlView) ? urlView : 'month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [weekStart, setWeekStart] = useState(getWeekStart(new Date()));
  const [rawEvents, setRawEvents] = useState<ClientEvent[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const events = useMemo(() => {
    let filtered = filterEvents ? filterEvents(rawEvents) : rawEvents;
    if (selectedMemberId) {
      filtered = filtered.filter(
        (e) => e.teamMembersAssigned && e.teamMembersAssigned.includes(selectedMemberId)
      );
    }
    return filtered;
  }, [rawEvents, filterEvents, selectedMemberId]);
  const [eventTypes, setEventTypes] = useState<Map<string, any>>(new Map());
  const [teamMembers, setTeamMembers] = useState<Map<string, any>>(new Map());
  const [projects, setProjects] = useState<Array<{ projectId: string; projectName: string }>>([]);
  const [projectsMap, setProjectsMap] = useState<Map<string, any>>(new Map());
  const [statuses, setStatuses] = useState<Map<string, any>>(new Map());
  const memberOptions = useMemo(() => [
    { value: '', label: 'All Team Members' },
    ...Array.from(teamMembers.values()).map((m: any) => ({
      value: m.memberId,
      label: `${m.firstName} ${m.lastName}`,
    })),
  ], [teamMembers]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<ClientEvent | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const helpContent = getHelpContent('calendar');
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedEventForView, setSelectedEventForView] = useState<ClientEvent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const previousViewRef = useRef<CalendarView>('month');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [eventsRes, eventTypesRes, teamRes, projectsRes, statusesRes] = await Promise.all([
        clientEventApi.getAll(),
        eventApi.getAll(),
        teamApi.getAll(),
        projectApi.getAll(),
        eventDeliveryStatusApi.getAll(),
      ]);

      const allEvents: ClientEvent[] = eventsRes.clientEvents || [];
      setRawEvents(allEvents);

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
      onDataLoaded?.(membersMap);

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
      console.error('Error fetching calendar data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrevious = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      if (currentView === 'month') setCurrentDate(addMonths(currentDate, -1));
      else if (currentView === 'week') setWeekStart(addDays(weekStart, -7));
      else if (currentView === 'day') setCurrentDate(addDays(currentDate, -1));
      setTimeout(() => setIsTransitioning(false), 50);
    }, 150);
  };

  const handleNext = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      if (currentView === 'month') setCurrentDate(addMonths(currentDate, 1));
      else if (currentView === 'week') setWeekStart(addDays(weekStart, 7));
      else if (currentView === 'day') setCurrentDate(addDays(currentDate, 1));
      setTimeout(() => setIsTransitioning(false), 50);
    }, 150);
  };

  const handleToday = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      const today = new Date();
      setCurrentDate(today);
      setWeekStart(getWeekStart(today));
      setTimeout(() => setIsTransitioning(false), 50);
    }, 150);
  };

  const handleMonthChange = (date: Date) => {
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentDate(date);
      setWeekStart(getWeekStart(date));
      setTimeout(() => setIsTransitioning(false), 50);
    }, 150);
  };

  const handleViewChange = (view: CalendarView) => {
    if (view === currentView) return;
    previousViewRef.current = currentView;
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentView(view);
      if (view === 'week') setWeekStart(getWeekStart(currentDate));
      setTimeout(() => setIsTransitioning(false), 50);
    }, 150);
  };

  const headerTitle = useMemo(() => {
    if (currentView === 'month') return `${MONTH_NAMES[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    if (currentView === 'week') return getDateRangeString(weekStart, getWeekEnd(weekStart));
    if (currentView === 'day') return `${MONTH_NAMES[currentDate.getMonth()]} ${currentDate.getDate()}, ${currentDate.getFullYear()}`;
    return 'Calendar';
  }, [currentView, currentDate, weekStart]);

  const handleEventClick = (event: ClientEvent) => {
    setSelectedEvent(event);
    setIsModalOpen(true);
  };

  const handleEventView = (event: ClientEvent) => {
    setSelectedEventForView(event);
    setViewModalOpen(true);
  };

  const handleDayClick = (date: Date) => {
    setCurrentDate(date);
    setCurrentView('day');
  };

  const handleNewEvent = () => {
    setSelectedEvent(null);
    setIsModalOpen(true);
  };

  const handleDeleteEvent = async (eventId: string) => {
    try {
      await clientEventApi.delete(eventId);
      await fetchData();
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
      await fetchData();
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
          <div style={{ textAlign: 'center', color: '#6b7280' }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Loading calendar...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      <PageHeader onHelpClick={() => setShowHelp(true)} />

      <div className={calendarStyles.desktopOnly}>
        <CalendarHeader
          currentView={currentView}
          onViewChange={handleViewChange}
          title={headerTitle}
          currentDate={currentDate}
          onPrevious={handlePrevious}
          onNext={handleNext}
          onToday={handleToday}
          onMonthChange={handleMonthChange}
          onNewEvent={handleNewEvent}
          memberOptions={memberOptions}
          selectedMemberId={selectedMemberId}
          onMemberChange={setSelectedMemberId}
        />
      </div>

      <div className={calendarStyles.tabletOnly}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div className={calendarStyles.viewSwitcher}>
            <button className={`${calendarStyles.viewButton} ${currentView === 'month' ? calendarStyles.active : ''}`} onClick={() => handleViewChange('month')}>Month</button>
            <button className={`${calendarStyles.viewButton} ${currentView === 'week' ? calendarStyles.active : ''}`} onClick={() => handleViewChange('week')}>Week</button>
            <button className={`${calendarStyles.viewButton} ${currentView === 'day' ? calendarStyles.active : ''}`} onClick={() => handleViewChange('day')}>Day</button>
          </div>
          <button className={calendarStyles.newEventButton} onClick={handleNewEvent}>
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            New Event
          </button>
        </div>
      </div>

      {extraHeader}

      <div className={`${calendarStyles.viewContainer} ${isTransitioning ? calendarStyles.viewExiting : calendarStyles.viewEntering}`}>
        {currentView === 'month' && (
          <>
            <MonthView
              currentDate={currentDate}
              events={events}
              eventTypes={eventTypes}
              projects={projectsMap}
              onEventClick={handleEventClick}
              onDayClick={handleDayClick}
              onPrevMonth={handlePrevious}
              onNextMonth={handleNext}
              onMonthChange={handleMonthChange}
            />
            <MobileMonthView
              currentDate={currentDate}
              events={events}
              eventTypes={eventTypes}
              projects={projectsMap}
              onEventClick={handleEventView}
              onEventEdit={(event) => { setSelectedEvent(event); setIsModalOpen(true); }}
              onPrevMonth={handlePrevious}
              onNextMonth={handleNext}
              onMonthChange={handleMonthChange}
            />
          </>
        )}

        {currentView === 'week' && (
          <WeekView
            weekStart={weekStart}
            events={events}
            eventTypes={eventTypes}
            projects={projectsMap}
            onEventClick={handleEventClick}
            onPrevWeek={handlePrevious}
            onNextWeek={handleNext}
            onDateChange={handleMonthChange}
          />
        )}

        {currentView === 'day' && (
          <DayView
            currentDate={currentDate}
            events={events}
            eventTypes={eventTypes}
            projects={projectsMap}
            onEventClick={handleEventClick}
            onPrevDay={handlePrevious}
            onNextDay={handleNext}
            onDateChange={handleMonthChange}
          />
        )}
      </div>

      <EventModal
        isOpen={isModalOpen}
        event={selectedEvent}
        projects={projects}
        eventTypes={eventTypes}
        teamMembers={teamMembers}
        eventDeliveryStatuses={statuses}
        onClose={() => { setIsModalOpen(false); setSelectedEvent(null); }}
        onSave={handleSaveEvent}
        onDelete={selectedEvent ? handleDeleteEvent : undefined}
      />

      <Modal
        isOpen={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
        title="Event Details"
        size="medium"
      >
        {selectedEventForView && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <button
              onClick={() => { setSelectedEvent(selectedEventForView); setViewModalOpen(false); setIsModalOpen(true); }}
              style={{ padding: '8px 16px', background: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', alignSelf: 'flex-start' }}
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit
            </button>

            <div style={{ padding: '14px 16px', background: 'var(--bg-secondary)', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--color-primary)', flexShrink: 0 }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              <div>
                <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>Event Type</div>
                <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>{eventTypes.get(selectedEventForView.eventId)?.eventDesc || 'N/A'}</div>
              </div>
            </div>

            <div style={{ padding: '14px 16px', background: 'var(--bg-secondary)', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--color-primary)', flexShrink: 0 }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
              <div>
                <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>Project</div>
                <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>{projectsMap.get(selectedEventForView.projectId)?.projectName || 'N/A'}</div>
              </div>
            </div>

            <div style={{ padding: '16px', background: 'var(--bg-secondary)', borderRadius: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--color-primary)' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>Schedule</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '4px' }}>From</div>
                  <div style={{ fontSize: '14px', fontWeight: 500 }}>{selectedEventForView.fromDatetime ? new Date(selectedEventForView.fromDatetime).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : 'N/A'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '4px' }}>To</div>
                  <div style={{ fontSize: '14px', fontWeight: 500 }}>{selectedEventForView.toDatetime ? new Date(selectedEventForView.toDatetime).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : 'N/A'}</div>
                </div>
              </div>
            </div>

            {(selectedEventForView.venue || selectedEventForView.city) && (
              <div style={{ padding: '16px', background: 'var(--bg-secondary)', borderRadius: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--color-primary)' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>Location</div>
                </div>
                {selectedEventForView.venue && <div style={{ marginBottom: '8px' }}><div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '4px' }}>Venue</div><div style={{ fontSize: '14px', fontWeight: 500 }}>{selectedEventForView.venue}</div></div>}
                {selectedEventForView.city && <div><div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '4px' }}>City</div><div style={{ fontSize: '14px', fontWeight: 500 }}>{selectedEventForView.city}</div></div>}
              </div>
            )}

            {selectedEventForView.notes && (
              <div style={{ padding: '16px', background: 'var(--bg-secondary)', borderRadius: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--color-primary)' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>Notes</div>
                </div>
                <div style={{ fontSize: '14px', lineHeight: '1.6', whiteSpace: 'pre-wrap', color: 'var(--text-secondary)' }}>{selectedEventForView.notes}</div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', paddingTop: '8px', borderTop: '1px solid var(--border-color)' }}>
              <Button variant="secondary" onClick={() => setViewModalOpen(false)}>Close</Button>
            </div>
          </div>
        )}
      </Modal>

      {showHelp && helpContent && (
        <HelpPanel help={helpContent} onClose={() => setShowHelp(false)} />
      )}
    </div>
  );
};

export default CalendarPageBase;
