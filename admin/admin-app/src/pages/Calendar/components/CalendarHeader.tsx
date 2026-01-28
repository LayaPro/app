import type { CalendarView } from '../../../utils/calendar';
import { formatDateString } from '../../../utils/calendar';
import { DatePicker } from '../../../components/ui/DatePicker';
import styles from '../Calendar.module.css';

interface CalendarHeaderProps {
  currentView: CalendarView;
  onViewChange: (view: CalendarView) => void;
  title: string;
  currentDate: Date;
  onPrevious: () => void;
  onNext: () => void;
  onToday: () => void;
  onMonthChange: (date: Date) => void;
  onNewEvent: () => void;
}

export const CalendarHeader: React.FC<CalendarHeaderProps> = ({
  currentView,
  onViewChange,
  title,
  currentDate,
  onPrevious,
  onNext,
  onToday,
  onMonthChange,
  onNewEvent,
}) => {
  const handleDateChange = (dateStr: string) => {
    if (dateStr) {
      const date = new Date(dateStr);
      onMonthChange(date);
    }
  };

  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        {/* View Switcher */}
        <div className={styles.viewSwitcher}>
          <button
            className={`${styles.viewButton} ${currentView === 'list' ? styles.active : ''}`}
            onClick={() => onViewChange('list')}
          >
            List
          </button>
          <button
            className={`${styles.viewButton} ${currentView === 'month' ? styles.active : ''}`}
            onClick={() => onViewChange('month')}
          >
            Month
          </button>
          <button
            className={`${styles.viewButton} ${currentView === 'week' ? styles.active : ''}`}
            onClick={() => onViewChange('week')}
          >
            Week
          </button>
          <button
            className={`${styles.viewButton} ${currentView === 'day' ? styles.active : ''}`}
            onClick={() => onViewChange('day')}
          >
            Day
          </button>
        </div>

        {/* New Event Button */}
        <button className={styles.newEventButton} onClick={onNewEvent}>
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          New Event
        </button>
      </div>
    </div>
  );
};
