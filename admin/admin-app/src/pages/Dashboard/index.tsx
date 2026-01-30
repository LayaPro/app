import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { dashboardStatsApi } from '../../services/api';
import { ROUTES, API_BASE_URL } from '../../utils/constants';
import styles from './Dashboard.module.css';
import pageStyles from '../Page.module.css';

interface DashboardStats {
  totalProjects: number;
  activeProjects: number;
  totalRevenue: number;
  pendingReceivable: number;
  totalProposals: number;
  pendingProposals: number;
  upcomingEvents: number;
  comparisons: {
    projects: { change: number; changePercent: number };
    revenue: { change: number; changePercent: number };
    proposals: { change: number; changePercent: number };
    events: { change: number; changePercent: number };
  };
}

const Dashboard = () => {
  const location = useLocation();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);

  useEffect(() => {
    fetchDashboardStats();
    fetchUpcomingEvents();
    fetchTeamAssignments();
  }, [location.pathname]); // Refetch when navigating back to dashboard

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const response = await dashboardStatsApi.getComparisonStats();
      setStats(response?.stats || null);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUpcomingEvents = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/dashboard/upcoming-events`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        console.error('Failed to fetch upcoming events, status:', response.status);
        return;
      }

      const data = await response.json();
      console.log('Upcoming events response:', data);
      
      setUpcomingEvents(data.upcomingEvents || []);
    } catch (error) {
      console.error('Error fetching upcoming events:', error);
    }
  };

  const fetchTeamAssignments = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/dashboard/team-assignments`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        console.error('Failed to fetch team assignments, status:', response.status);
        return;
      }

      const data = await response.json();
      setTeamMembers(data.teamMembers || []);
    } catch (error) {
      console.error('Error fetching team assignments:', error);
    }
  };

  const formatEventDate = (event: any) => {
    const fromDate = new Date(event.fromDatetime);
    const toDate = event.toDatetime ? new Date(event.toDatetime) : fromDate;
    
    const monthFrom = fromDate.toLocaleDateString('en-US', { month: 'short' });
    const dayFrom = fromDate.getDate();
    const dayTo = toDate.getDate();
    const year = fromDate.getFullYear();
    const time = fromDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    
    // Use duration field
    const daysText = event.duration === 1 ? '1 hour' : `${event.duration} hours`;
    
    if (dayFrom === dayTo) {
      return `${monthFrom} ${dayFrom}, ${year} • ${time} • ${daysText}`;
    }
    return `${monthFrom} ${dayFrom}-${dayTo}, ${year} • ${time} • ${daysText}`;
  };

  const getEventColor = (event: any) => {
    // If event is ongoing (shoot in progress), use blue color
    if (event.isOngoing) {
      return '#3b82f6'; // blue - matching calendar today/ongoing events
    }
    
    // For upcoming/future events, always use purple
    return '#8b5cf6'; // purple - matching calendar future events
  };

  const getStatusColor = (statusCode: string) => {
    const colorMap: Record<string, string> = {
      'SHOOT_SCHEDULED': '#8b5cf6', // purple - matching calendar future/scheduled events
      'SCHEDULED': '#8b5cf6', // purple - matching calendar future/scheduled events
      'SHOOT_IN_PROGRESS': '#3b82f6', // blue - matching calendar today/in-progress events
      'IN_PROGRESS': '#3b82f6', // blue - matching calendar today/in-progress events
      'SHOOT_COMPLETED': '#10b981', // green - matching calendar past/completed events
      'DELIVERED': '#10b981', // green - delivered is completed
    };
    return colorMap[statusCode] || '#8b5cf6'; // default purple for scheduled
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  if (loading || !stats) {
    return (
      <div className={pageStyles.pageContainer}>
        <div className={styles.metricsGrid}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className={styles.metricCard} style={{ opacity: 0.5 }}>
              <div className={styles.skeleton} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const metricsCards = [
    {
      title: 'Total Projects',
      value: stats.totalProjects.toString(),
      subtitle: `${stats.activeProjects} Active`,
      trend: { 
        value: Math.abs(stats.comparisons.projects.change), 
        isPositive: stats.comparisons.projects.change >= 0,
        isCount: true
      },
      icon: (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      ),
      color: '#6366f1',
      link: ROUTES.PROJECTS,
    },
    {
      title: 'Total Revenue',
      value: formatCurrency(stats.totalRevenue),
      subtitle: 'Received',
      trend: { 
        value: Math.abs(stats.comparisons.revenue.changePercent), 
        isPositive: stats.comparisons.revenue.changePercent >= 0,
        isCount: false
      },
      icon: (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: '#10b981',
      link: ROUTES.FINANCES,
    },
    {
      title: 'Proposals',
      value: stats.totalProposals.toString(),
      subtitle: `${stats.pendingProposals} Pending`,
      trend: { 
        value: Math.abs(stats.comparisons.proposals.change), 
        isPositive: stats.comparisons.proposals.change >= 0,
        isCount: true
      },
      icon: (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      color: '#f59e0b',
      link: ROUTES.PROPOSALS,
    },
    {
      title: 'Events',
      value: stats.upcomingEvents.toString(),
      subtitle: 'This Month',
      trend: { 
        value: Math.abs(stats.comparisons.events.change), 
        isPositive: stats.comparisons.events.change >= 0,
        isCount: true
      },
      icon: (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      color: '#8b5cf6',
      link: ROUTES.CALENDAR,
    },
  ];

  return (
    <div className={pageStyles.pageContainer}>
      <div className={styles.metricsGrid}>
        {metricsCards.map((card) => (
          <Link
            key={card.title}
            to={card.link}
            className={styles.metricCard}
            style={{ '--card-color': card.color } as any}
          >
            <div className={styles.metricIcon}>
              {card.icon}
            </div>
            <div className={styles.metricContent}>
              <h3 className={styles.metricTitle}>{card.title}</h3>
              <div className={styles.metricValue}>{card.value}</div>
              <div className={styles.metricFooter}>
                <span className={styles.metricSubtitle}>{card.subtitle}</span>
                <div className={styles.metricTrendWrapper}>
                  <span 
                    className={styles.metricTrend}
                    data-positive={card.trend.isPositive}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={3} 
                        d={card.trend.isPositive ? "M5 10l7-7m0 0l7 7m-7-7v18" : "M19 14l-7 7m0 0l-7-7m7 7V3"}
                      />
                    </svg>
                    {card.trend.isCount ? card.trend.value : `${card.trend.value}%`}
                  </span>
                  <span className={styles.metricCompare}>vs last month</span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Events and Upcoming Events Grid */}
      <div className={styles.contentGrid}>
        <div className={styles.eventsPlaceholder}>
          {/* Placeholder for future Events section */}
        </div>

        <div className={styles.upcomingEventsSection}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTitleWrapper}>
              <svg
                className={styles.sectionIcon}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <h2 className={styles.sectionTitle}>Upcoming/Ongoing Events</h2>
            </div>
            <Link to={`${ROUTES.CALENDAR}?view=list`} className={styles.viewAllLink}>
              View All →
            </Link>
          </div>
          <div className={styles.eventsGrid}>
            {upcomingEvents.length > 0 ? (
              upcomingEvents.map((event, index) => {
                const eventColor = getEventColor(event);
                return (
                  <div 
                    key={event.clientEventId} 
                    className={styles.eventCard}
                    style={{ 
                      borderLeftColor: eventColor,
                      '--event-color': eventColor
                    } as any}
                  >
                    <div className={styles.eventCardHeader}>
                      <h3 className={styles.eventTitle}>
                        {event.eventType || 'Event'} - {event.projectName || 'Unnamed Project'}
                      </h3>
                      <div className={styles.eventStatusWrapper}>
                        {event.statusCode === 'SHOOT_IN_PROGRESS' && (
                          <span className={styles.glowingDot}></span>
                        )}
                        <span 
                          className={styles.eventStatus}
                          style={{ 
                            borderColor: event.statusCode ? getStatusColor(event.statusCode) : '#8b5cf6',
                            color: event.statusCode ? getStatusColor(event.statusCode) : '#8b5cf6'
                          }}
                        >
                          {event.statusDesc || 'Scheduled'}
                        </span>
                      </div>
                    </div>
                    <p className={styles.eventDate}>
                      {formatEventDate(event)}
                    </p>
                    {event.venue && (
                      <div className={styles.eventVenue}>
                        <svg
                          className={styles.venueIcon}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                        <span>{event.venue}{event.city ? `, ${event.city}` : ''}</span>
                      </div>
                    )}
                    {event.teamMembers && event.teamMembers.length > 0 && (
                      <div className={styles.eventTeam}>
                        <svg
                          className={styles.teamIcon}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                          />
                        </svg>
                        {event.teamMembers.map((member: any, idx: number) => (
                          <span 
                            key={idx} 
                            className={styles.teamMemberBadge}
                            style={{ borderColor: eventColor }}
                          >
                            {member.firstName} {member.lastName}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className={styles.noEvents}>
                <img 
                  src="/nodata.svg" 
                  alt="No events" 
                  style={{ width: '120px', height: '120px', opacity: 0.5, marginBottom: '16px' }}
                />
                <p>No upcoming events in the next 30 days</p>
              </div>
            )}
          </div>
        </div>

        {/* Team Assignments Section */}
        <div className={styles.upcomingEventsSection}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTitleWrapper}>
              <svg
                className={styles.sectionIcon}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              <h2 className={styles.sectionTitle}>Team Assignments</h2>
            </div>
            <Link to={ROUTES.TEAM_MEMBERS} className={styles.viewAllLink}>
              View All →
            </Link>
          </div>
          <div className={styles.teamGrid}>
            {teamMembers.length > 0 ? (
              teamMembers.slice(0, 6).map((member, index) => {
                const getInitials = (firstName: string, lastName: string) => {
                  return `${firstName?.[0] || ''}${lastName?.[0] || ''}`;
                };

                const getAvatarColors = (name: string) => {
                  const colors = [
                    { bg: 'rgba(99, 102, 241, 0.1)', text: '#4f46e5', border: 'rgba(99, 102, 241, 0.2)' },
                    { bg: 'rgba(59, 130, 246, 0.1)', text: '#2563eb', border: 'rgba(59, 130, 246, 0.2)' },
                    { bg: 'rgba(34, 197, 94, 0.1)', text: '#16a34a', border: 'rgba(34, 197, 94, 0.2)' },
                    { bg: 'rgba(245, 158, 11, 0.1)', text: '#d97706', border: 'rgba(245, 158, 11, 0.2)' },
                    { bg: 'rgba(239, 68, 68, 0.1)', text: '#dc2626', border: 'rgba(239, 68, 68, 0.2)' },
                    { bg: 'rgba(236, 72, 153, 0.1)', text: '#db2777', border: 'rgba(236, 72, 153, 0.2)' },
                    { bg: 'rgba(6, 182, 212, 0.1)', text: '#0891b2', border: 'rgba(6, 182, 212, 0.2)' },
                    { bg: 'rgba(20, 184, 166, 0.1)', text: '#0d9488', border: 'rgba(20, 184, 166, 0.2)' },
                    { bg: 'rgba(249, 115, 22, 0.1)', text: '#ea580c', border: 'rgba(249, 115, 22, 0.2)' },
                    { bg: 'rgba(168, 85, 247, 0.1)', text: '#9333ea', border: 'rgba(168, 85, 247, 0.2)' },
                  ];
                  let hash = 0;
                  for (let i = 0; i < (name?.length || 0); i++) {
                    hash = ((hash << 5) - hash) + name.charCodeAt(i);
                    hash = hash & hash;
                  }
                  return colors[Math.abs(hash) % colors.length];
                };

                const initials = getInitials(member.firstName, member.lastName);
                const colors = getAvatarColors(`${member.firstName} ${member.lastName}`);
                
                return (
                  <div key={member.memberId} className={styles.teamMemberRow}>
                    <div className={styles.teamMemberLeft}>
                      <div 
                        className={styles.teamAvatar}
                        style={{ 
                          backgroundColor: colors.bg,
                          border: `1.5px solid ${colors.border}`,
                          color: colors.text
                        }}
                      >
                        {initials}
                      </div>
                      <div className={styles.teamMemberDetails}>
                        <p className={styles.teamMemberName}>
                          {member.firstName} {member.lastName}
                        </p>
                        <p className={styles.teamMemberMeta}>
                          {member.eventsCount} {member.eventsCount === 1 ? 'event' : 'events'} • {member.projectsCount} {member.projectsCount === 1 ? 'project' : 'projects'}
                        </p>
                      </div>
                    </div>
                    {member.projects.length > 0 && (
                      <div className={styles.teamMemberProjects}>
                        {member.projects.slice(0, 2).map((project: any) => (
                          <span key={project.projectId} className={styles.teamProjectBadge} title={project.projectName}>
                            {project.projectName}
                          </span>
                        ))}
                        {member.projects.length > 2 && (
                          <span className={styles.teamProjectBadge}>
                            +{member.projects.length - 2}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className={styles.noEvents}>
                <img 
                  src="/nodata.svg" 
                  alt="No team members" 
                  style={{ width: '120px', height: '120px', opacity: 0.5, marginBottom: '16px' }}
                />
                <p>No team members found</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
