import { useState, useEffect, useMemo, useRef } from 'react';
import { Breadcrumb } from '../../components/ui/index.js';
import { CalendarHeader } from './components/CalendarHeader';
import { MonthView } from './components/MonthView';
import { WeekView } from './components/WeekView';
import { DayView } from './components/DayView';
import { ListView } from './components/ListView';
import { EventModal } from './components/EventModal';
import { clientEventApi, eventApi, teamApi, projectApi, eventDeliveryStatusApi } from '../../services/api';
import type { ClientEvent } from '@/types/shared';
import type { CalendarView } from '../../utils/calendar';
import {
  MONTH_NAMES,
  getWeekStart,
  getWeekEnd,
  addDays,
  addMonths,
  getDateRangeString,
} from '../../utils/calendar';
import styles from '../Page.module.css';
import calendarStyles from './Calendar.module.css';

const Calendar = () => {
  // State
  const [currentView, setCurrentView] = useState<CalendarView>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [weekStart, setWeekStart] = useState(getWeekStart(new Date()));
  const [events, setEvents] = useState<ClientEvent[]>([]);
  const [eventTypes, setEventTypes] = useState<Map<string, any>>(new Map());
  const [teamMembers, setTeamMembers] = useState<Map<string, any>>(new Map());
  const [projects, setProjects] = useState<Array<{ projectId: string; projectName: string }>>([]);
  const [projectsMap, setProjectsMap] = useState<Map<string, any>>(new Map());
  const [statuses, setStatuses] = useState<Map<string, any>>(new Map());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<ClientEvent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const previousViewRef = useRef<CalendarView>('month');

  // Fetch initial data
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

      // Set events
      setEvents(eventsRes.clientEvents || []);

      // Map event types
      const typesMap = new Map();
      (eventTypesRes.events || []).forEach((type: any) => {
        typesMap.set(type.eventId, type);
      });
      setEventTypes(typesMap);

      // Map team members
      const membersMap = new Map();
      (teamRes.teamMembers || []).forEach((member: any) => {
        membersMap.set(member.memberId, member);
      });
      setTeamMembers(membersMap);

      // Set projects
      setProjects(projectsRes.projects || []);

      // Map projects
      const projectsMapping = new Map();
      (projectsRes.projects || []).forEach((project: any) => {
        projectsMapping.set(project.projectId, project);
      });
      setProjectsMap(projectsMapping);

      // Map statuses
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

  // Navigation handlers
  const handlePrevious = () => {
    setIsTransitioning(true);
    
    setTimeout(() => {
      if (currentView === 'month') {
        setCurrentDate(addMonths(currentDate, -1));
      } else if (currentView === 'week') {
        setWeekStart(addDays(weekStart, -7));
      } else if (currentView === 'day') {
        setCurrentDate(addDays(currentDate, -1));
      }
      setTimeout(() => {
        setIsTransitioning(false);
      }, 50);
    }, 150);
  };

  const handleNext = () => {
    setIsTransitioning(true);
    
    setTimeout(() => {
      if (currentView === 'month') {
        setCurrentDate(addMonths(currentDate, 1));
      } else if (currentView === 'week') {
        setWeekStart(addDays(weekStart, 7));
      } else if (currentView === 'day') {
        setCurrentDate(addDays(currentDate, 1));
      }
      setTimeout(() => {
        setIsTransitioning(false);
      }, 50);
    }, 150);
  };

  const handleToday = () => {
    setIsTransitioning(true);
    
    setTimeout(() => {
      const today = new Date();
      setCurrentDate(today);
      setWeekStart(getWeekStart(today));
      setTimeout(() => {
        setIsTransitioning(false);
      }, 50);
    }, 150);
  };

  const handleMonthChange = (date: Date) => {
    setIsTransitioning(true);
    
    setTimeout(() => {
      setCurrentDate(date);
      setWeekStart(getWeekStart(date));
      setTimeout(() => {
        setIsTransitioning(false);
      }, 50);
    }, 150);
  };

  const handleViewChange = (view: CalendarView) => {
    if (view === currentView) return;
    
    previousViewRef.current = currentView;
    setIsTransitioning(true);
    
    setTimeout(() => {
      setCurrentView(view);
      if (view === 'week') {
        setWeekStart(getWeekStart(currentDate));
      }
      setTimeout(() => {
        setIsTransitioning(false);
      }, 50);
    }, 150);
  };

  // Get header title based on current view
  const headerTitle = useMemo(() => {
    if (currentView === 'month') {
      return `${MONTH_NAMES[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    } else if (currentView === 'week') {
      const weekEnd = getWeekEnd(weekStart);
      return getDateRangeString(weekStart, weekEnd);
    } else if (currentView === 'day') {
      return `${MONTH_NAMES[currentDate.getMonth()]} ${currentDate.getDate()}, ${currentDate.getFullYear()}`;
    }
    return 'Calendar';
  }, [currentView, currentDate, weekStart]);

  // Event handlers
  const handleEventClick = (event: ClientEvent) => {
    setSelectedEvent(event);
    setIsModalOpen(true);
  };

  const handleDayClick = (date: Date) => {
    setCurrentDate(date);
    setCurrentView('day');
  };

  const handleNewEvent = () => {
    setSelectedEvent(null);
    setIsModalOpen(true);
  };

  const handleSaveEvent = async (eventData: any) => {
    try {
      if (selectedEvent) {
        // Update existing event
        await clientEventApi.update(selectedEvent.clientEventId, eventData);
      } else {
        // Create new event
        await clientEventApi.create(eventData);
      }
      // Refresh events
      await fetchData();
      setIsModalOpen(false);
      setSelectedEvent(null);
    } catch (error) {
      console.error('Error saving event:', error);
      throw error;
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    try {
      await clientEventApi.delete(eventId);
      await fetchData();
      setIsModalOpen(false);
      setSelectedEvent(null);
    } catch (error) {
      console.error('Error deleting event:', error);
      throw error;
    }
  };

  if (isLoading) {
    return (
      <div className={styles.pageContainer}>
        <Breadcrumb items={[{ label: 'Calendar' }]} />
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
      <Breadcrumb />

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
      />

      <div className={`${calendarStyles.viewContainer} ${isTransitioning ? calendarStyles.viewExiting : calendarStyles.viewEntering}`}>
        {currentView === 'month' && (
          <MonthView
            currentDate={currentDate}
            events={events}
            eventTypes={eventTypes}
            projects={projectsMap}
            onEventClick={handleEventClick}
            onDayClick={handleDayClick}
          />
        )}

        {currentView === 'week' && (
          <WeekView
            weekStart={weekStart}
            events={events}
            eventTypes={eventTypes}
            projects={projectsMap}
            onEventClick={handleEventClick}
          />
        )}

        {currentView === 'day' && (
          <DayView
            currentDate={currentDate}
            events={events}
            eventTypes={eventTypes}
            projects={projectsMap}
            onEventClick={handleEventClick}
          />
        )}

        {currentView === 'list' && (
          <ListView
            events={events}
            eventTypes={eventTypes}
            projects={projectsMap}
            teamMembers={teamMembers}
            eventDeliveryStatuses={statuses}
            onEventClick={handleEventClick}
            onStatusChange={fetchData}
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
        onClose={() => {
          setIsModalOpen(false);
          setSelectedEvent(null);
        }}
        onSave={handleSaveEvent}
        onDelete={selectedEvent ? handleDeleteEvent : undefined}
      />
    </div>
  );
};

export default Calendar;
