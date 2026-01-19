import { motion } from 'framer-motion';
import './Timeline.css';

interface Event {
  eventId: string;
  eventName: string;
  fromDate?: string;
  toDate?: string;
  fromTime?: string;
  toTime?: string;
  venue?: string;
  venueLocation?: string;
  eventDeliveryStatusId?: string;
  statusCode?: string;
  statusDescription?: string;
  statusCustomerNote?: string;
}

interface TimelineProps {
  events: Event[];
  projectName: string;
  acceptedAt?: string;
}

export const Timeline: React.FC<TimelineProps> = ({ events, projectName, acceptedAt }) => {
  // Helper to format date
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  // Helper to format time
  const formatTime = (timeStr?: string) => {
    if (!timeStr) return '';
    return timeStr;
  };

  return (
    <div className="timeline-container">
      {/* Floating Particles Background */}
      <div className="timeline-floating-particles">
        {[...Array(40)].map((_, i) => (
          <div 
            key={i} 
            className="timeline-particle"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              '--delay': `${Math.random() * 8}s`,
              '--duration': `${6 + Math.random() * 8}s`,
              '--x': `${(Math.random() - 0.5) * 150}px`,
            } as any}
          ></div>
        ))}
      </div>

      {/* Header */}
      <div className="timeline-header">
        <motion.h1 
          className="timeline-title"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {projectName}
        </motion.h1>
        <motion.p 
          className="timeline-subtitle"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          Your Journey Timeline
        </motion.p>
      </div>

      {/* Timeline */}
      <div className="timeline">
        {/* First milestone: Quotation Accepted */}
        <motion.div 
          className="timeline-item completed"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          <div className="timeline-marker">
            <div className="timeline-dot completed">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                <path 
                  stroke="currentColor" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2.5} 
                  d="M5 13l4 4L19 7" 
                />
              </svg>
            </div>
            <div className="timeline-line"></div>
          </div>
          <div className="timeline-content">
            <div className="timeline-card completed">
              <div className="timeline-card-header">
                <h3 className="timeline-event-name">Quotation Accepted</h3>
                <span className="timeline-status-badge completed">Completed</span>
              </div>
              {acceptedAt && (
                <p className="timeline-date">{formatDate(acceptedAt)}</p>
              )}
              <p className="timeline-description">
                Your quotation has been accepted. We're excited to be part of your special day!
              </p>
            </div>
          </div>
        </motion.div>

        {/* Event milestones */}
        {events.map((event, index) => {
          // Check status based on statusCode
          const isCompleted = event.statusCode === 'DELIVERED' || event.statusCode === 'COMPLETED';
          const isInProgress = event.statusCode === 'SHOOT_IN_PROGRESS' || 
                               event.statusCode === 'AWAITING_EDITING' || 
                               event.statusCode === 'IN_EDITING' || 
                               event.statusCode === 'AWAITING_CLIENT_APPROVAL';

          // Determine status label to display
          let statusLabel = 'Upcoming';
          if (isCompleted) {
            statusLabel = 'Completed';
          } else if (event.statusCode === 'SHOOT_IN_PROGRESS') {
            statusLabel = 'Shoot in Progress';
          } else if (event.statusCode === 'AWAITING_EDITING') {
            statusLabel = 'Awaiting Editing';
          } else if (event.statusCode === 'IN_EDITING') {
            statusLabel = 'In Editing';
          } else if (event.statusCode === 'AWAITING_CLIENT_APPROVAL') {
            statusLabel = 'Awaiting Your Approval';
          } else if (event.statusDescription) {
            statusLabel = event.statusDescription;
          }

          return (
            <motion.div 
              key={event.eventId}
              className={`timeline-item ${isCompleted ? 'completed' : isInProgress ? 'in-progress' : 'pending'}`}
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + (index * 0.1), duration: 0.6 }}
            >
              <div className="timeline-marker">
                <div className={`timeline-dot ${isCompleted ? 'completed' : isInProgress ? 'in-progress' : 'pending'}`}>
                  {isCompleted ? (
                    <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                      <path 
                        stroke="currentColor" 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2.5} 
                        d="M5 13l4 4L19 7" 
                      />
                    </svg>
                  ) : (
                    <span className="timeline-number">{index + 1}</span>
                  )}
                </div>
                {index < events.length - 1 && <div className="timeline-line"></div>}
              </div>
              <div className="timeline-content">
                <div className={`timeline-card ${isCompleted ? 'completed' : isInProgress ? 'in-progress' : 'pending'}`}>
                  <div className="timeline-card-header">
                    <h3 className="timeline-event-name">{event.eventName}</h3>
                  </div>
                  
                  {(event.fromDate || event.toDate) && (
                    <div className="timeline-date-range">
                      <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>
                        {formatDate(event.fromDate)}
                        {event.toDate && event.toDate !== event.fromDate && ` - ${formatDate(event.toDate)}`}
                      </span>
                    </div>
                  )}
                  
                  {(event.fromTime || event.toTime) && (
                    <div className="timeline-time-range">
                      <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>
                        {formatTime(event.fromTime)}
                        {event.toTime && ` - ${formatTime(event.toTime)}`}
                      </span>
                    </div>
                  )}
                  
                  {event.venue && (
                    <div className="timeline-venue">
                      <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span>{event.venue}</span>
                      {event.venueLocation && (
                        <a 
                          href={event.venueLocation} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="timeline-map-link"
                        >
                          View Map
                        </a>
                      )}
                    </div>
                  )}
                  
                  {event.statusCustomerNote && (
                    <div className="timeline-status-message">
                      {event.statusCustomerNote}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
