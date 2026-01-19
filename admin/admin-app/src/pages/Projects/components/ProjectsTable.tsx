import { useState, useEffect, useRef, useMemo } from 'react';
import { projectApi, eventDeliveryStatusApi } from '../../../services/api';
import { DataTable } from '../../../components/ui/DataTable';
import type { Column } from '../../../components/ui/DataTable';
import { DatePicker } from '../../../components/ui/DatePicker';
import { useAppDispatch } from '../../../store/index.js';
import { setEditingProject } from '../../../store/slices/projectSlice.js';
import { formatIndianAmount } from '../../../utils/formatAmount';
import { AssignEditorModal, type AssignEditorModalHandle } from './AssignEditorModal';
import { AssignDesignerModal, type AssignDesignerModalHandle } from './AssignDesignerModal';
import { useToast } from '../../../context/ToastContext';
import styles from './ProjectsTable.module.css';

interface Project {
  projectId: string;
  projectName: string;
  brideFirstName?: string;
  groomFirstName?: string;
  brideLastName?: string;
  groomLastName?: string;
  phoneNumber?: string;
  budget?: number;
  displayPic?: string;
  coverPhoto?: string;
  createdAt?: string;
  events?: any[];
  finance?: any;
}

interface ProjectsTableProps {
  onStatsUpdate?: (stats: {
    active: number;
    completed: number;
    revenue: number;
    dueSoon: number;
  }) => void;
}

export const ProjectsTable = ({ onStatsUpdate }: ProjectsTableProps = {}) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isDateRangeOpen, setIsDateRangeOpen] = useState(false);
  const [openActionDropdown, setOpenActionDropdown] = useState<string | null>(null);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [totalStatuses, setTotalStatuses] = useState(13); // Will be fetched from DB
  const dropdownRef = useRef<HTMLDivElement>(null);
  const exportRef = useRef<HTMLDivElement>(null);
  const dateRangeRef = useRef<HTMLDivElement>(null);
  const assignEditorModalRef = useRef<AssignEditorModalHandle>(null);
  const assignDesignerModalRef = useRef<AssignDesignerModalHandle>(null);
  const dispatch = useAppDispatch();
  const { showToast } = useToast();

  useEffect(() => {
    fetchProjects();
    fetchStatuses();
  }, []);

  const fetchStatuses = async () => {
    try {
      const response = await eventDeliveryStatusApi.getAll();
      const statuses = response?.statuses || [];
      setTotalStatuses(statuses.length);
    } catch (error) {
      console.error('Error fetching statuses:', error);
      setTotalStatuses(13); // Fallback to default
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      
      // Don't close if clicking on a dropdown button or menu item
      if (target.closest('button[class*="actionsDropdownButton"]') || 
          target.closest('button[class*="actionsDropdownItem"]')) {
        return;
      }
      
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenActionDropdown(null);
      }
      if (exportRef.current && !exportRef.current.contains(event.target as Node)) {
        setIsExportOpen(false);
      }
      if (dateRangeRef.current && !dateRangeRef.current.contains(event.target as Node)) {
        setIsDateRangeOpen(false);
      }
    };

    if (openActionDropdown || isExportOpen || isDateRangeOpen) {
      // Use timeout to allow click events to fire first
      setTimeout(() => {
        document.addEventListener('click', handleClickOutside);
      }, 0);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [openActionDropdown, isExportOpen, isDateRangeOpen]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await projectApi.getAll();
      setProjects(response?.projects || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCustomerName = (project: Project) => {
    if (project.brideFirstName && project.groomFirstName) {
      return `${project.brideFirstName} & ${project.groomFirstName}`;
    }
    return project.projectName;
  };

  const getInitials = (project: Project) => {
    const bride = project.brideFirstName?.[0] || '';
    const groom = project.groomFirstName?.[0] || '';
    return (bride + groom) || project.projectName.substring(0, 2).toUpperCase();
  };

  const getAvatarGradient = (name: string) => {
    const gradients = [
      'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', // indigo to purple
      'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', // blue
      'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)', // green
      'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', // amber
      'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', // red
      'linear-gradient(135deg, #ec4899 0%, #db2777 100%)', // pink
      'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)', // cyan
      'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)', // teal
      'linear-gradient(135deg, #f97316 0%, #ea580c 100%)', // orange
      'linear-gradient(135deg, #a855f7 0%, #9333ea 100%)', // violet
      'linear-gradient(135deg, #eab308 0%, #ca8a04 100%)', // yellow
      'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)', // purple to indigo
      'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)', // sky blue
      'linear-gradient(135deg, #10b981 0%, #059669 100%)', // emerald
      'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)', // rose
      'linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)', // purple to violet
    ];
    
    // Better hash function for more even distribution
    let hash = 0;
    for (let i = 0; i < (name?.length || 0); i++) {
      hash = ((hash << 5) - hash) + name.charCodeAt(i);
      hash = hash & hash;
    }
    return gradients[Math.abs(hash) % gradients.length];
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const formatDateTime = (dateString: string | undefined) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getEarliestEventDate = (project: Project) => {
    if (!project.events || project.events.length === 0) return null;
    const dates = project.events
      .map(e => e.fromDatetime)
      .filter(d => d)
      .map(d => new Date(d).getTime());
    if (dates.length === 0) return null;
    return new Date(Math.min(...dates)).toISOString();
  };

  const getLatestEventDate = (project: Project) => {
    if (!project.events || project.events.length === 0) return null;
    const dates = project.events
      .map(e => e.toDatetime || e.fromDatetime)
      .filter(d => d)
      .map(d => new Date(d).getTime());
    if (dates.length === 0) return null;
    return new Date(Math.max(...dates)).toISOString();
  };

  const columns: Column<Project>[] = [
    {
      key: 'projectName',
      header: 'Customer',
      sortable: true,
      render: (project) => (
        <div className={styles.customerCell}>
          {project.displayPic ? (
            <img 
              src={project.displayPic} 
              alt="Profile"
              className={styles.avatar}
              style={{ objectFit: 'cover' }}
            />
          ) : (
            <div 
              className={styles.avatar}
              style={{ background: getAvatarGradient(project.projectName) }}
            >
              {getInitials(project)}
            </div>
          )}
          <div>
            <div className={styles.customerName}>{getCustomerName(project)}</div>
            <div className={styles.customerSubtext}>{project.projectName}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'phoneNumber',
      header: 'Phone',
      sortable: true,
      render: (project) => (
        <span className={styles.phoneText}>{project.phoneNumber || '—'}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (project) => (
        <span className={styles.statusBadge}>
          {(project as any).status || 'Active'}
        </span>
      ),
    },
    {
      key: 'startDate',
      header: 'Start Date',
      sortable: true,
      render: (project) => {
        const startDate = getEarliestEventDate(project);
        return (
          <div className={styles.dateWithIcon}>
            <svg className={styles.calendarIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className={styles.dateText}>
              {formatDate(startDate || undefined)}
            </span>
          </div>
        );
      },
    },
    {
      key: 'endDate',
      header: 'End Date',
      sortable: true,
      render: (project) => {
        const endDate = getLatestEventDate(project);
        return (
          <div className={styles.dateWithIcon}>
            <svg className={styles.calendarIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className={styles.dateText}>
              {formatDate(endDate || undefined)}
            </span>
          </div>
        );
      },
    },
    {
      key: 'events',
      header: 'Events',
      render: (project) => (
        <span className={styles.badge}>{project.events?.length || 0} events</span>
      ),
    },
    {
      key: 'tasks',
      header: 'Overall Tasks',
      render: (project) => {
        const numEvents = project.events?.length || 0;
        const totalTasks = numEvents * totalStatuses; // Each event has totalStatuses tasks
        
        // Calculate completed tasks: sum of step numbers of current status for each event
        const completedTasks = project.events?.reduce((count, event: any) => {
          // Use the step number of the current status
          const step = event.statusStep || 0;
          return count + step;
        }, 0) || 0;
        
        return (
          <div className={styles.tasksCell}>
            <span className={styles.tasksText}>{completedTasks}/{totalTasks}</span>
            <div className={styles.progressBar}>
              <div 
                className={styles.progressFill}
                style={{ width: `${totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0}%` }}
              />
            </div>
          </div>
        );
      },
    },
    {
      key: 'budget',
      header: 'Budget',
      sortable: true,
      render: (project) => {
        const budget = project.finance?.totalBudget || project.budget;
        return (
          <span className={styles.budgetText}>
            {budget ? `₹${formatIndianAmount(budget)}` : '—'}
          </span>
        );
      },
    },
    {
      key: 'createdAt',
      header: 'Created',
      sortable: true,
      render: (project) => (
        <div className={styles.dateWithIcon}>
          <svg className={styles.calendarIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className={styles.dateText}>
            {formatDate(project.createdAt)}
          </span>
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (project) => {
        const handleDropdownClick = (e: React.MouseEvent<HTMLButtonElement>) => {
          e.stopPropagation();
          setOpenActionDropdown(
            openActionDropdown === project.projectId ? null : project.projectId
          );
        };

        return (
          <div className={styles.actionsCell}>
            <div className={styles.actionsDropdownContainer} ref={dropdownRef}>
              <button 
                className={styles.actionsDropdownButton}
                onClick={handleDropdownClick}
              >
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
              </button>
              {openActionDropdown === project.projectId && (
              <>
                <div 
                  className={styles.dropdownBackdrop}
                  onClick={() => setOpenActionDropdown(null)}
                />
                <div className={styles.actionsDropdownMenu}>
                  <button 
                    className={styles.actionsDropdownItem}
                    onClick={(e) => {
                      e.stopPropagation();
                      console.log('Edit clicked, project:', project);
                      dispatch(setEditingProject(project));
                      setOpenActionDropdown(null);
                    }}
                  >
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit
                </button>
                <button className={styles.actionsDropdownItem}>
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                  </svg>
                  Visit website
                </button>
                <button className={styles.actionsDropdownItem}>
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  See Events
                </button>
                <button className={styles.actionsDropdownItem}>
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Finances
                </button>
                <button className={styles.actionsDropdownItem}>
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Visit albums
                </button>
                <button 
                  className={styles.actionsDropdownItem}
                  onClick={() => {
                    setOpenActionDropdown(null);
                    assignEditorModalRef.current?.open(project);
                  }}
                >
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Assign Editor
                </button>
                <button 
                  className={styles.actionsDropdownItem}
                  onClick={() => {
                    setOpenActionDropdown(null);
                    assignDesignerModalRef.current?.open(project);
                  }}
                >
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                  </svg>
                  Assign Designer
                </button>
                <div className={styles.actionsDropdownDivider} />
                <button className={`${styles.actionsDropdownItem} ${styles.actionsDropdownItemDanger}`}>
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete
                </button>
                </div>
              </>
              )}
          </div>
        </div>
        );
      },
    },
  ];

  const getEventStatus = (event: any) => {
    // Use the status set by the user, default to 'Scheduled' if not set
    return event.status || 'Scheduled';
  };

  const renderExpandedRow = (project: Project) => {
    if (!project.events || project.events.length === 0) {
      return (
        <div className={styles.expandedContent}>
          <p className={styles.noEventsText}>No events scheduled for this project</p>
        </div>
      );
    }

    // Sort events by date
    const sortedEvents = [...project.events].sort((a, b) => {
      if (!a.fromDatetime) return 1;
      if (!b.fromDatetime) return -1;
      return new Date(a.fromDatetime).getTime() - new Date(b.fromDatetime).getTime();
    });

    return (
      <div className={styles.expandedContent}>
        <div className={styles.eventsGrid}>
          {sortedEvents.map((event: any, idx: number) => {
            const status = getEventStatus(event);
            console.log('Event data:', event);
            return (
              <div key={idx} className={styles.eventCard}>
                <div className={styles.eventCardHeader}>
                  <div className={styles.eventTitleRow}>
                    <svg className={styles.eventCardIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <h4 className={styles.eventCardTitle}>
                      {event.eventTitle || 'Untitled Event'}
                    </h4>
                  </div>
                  <span className={`${styles.eventStatusBadge} ${styles[`status${status}`]}`}>
                    {status}
                  </span>
                </div>
                <div className={styles.eventCardBody}>
                  <div className={styles.eventCardRow}>
                    <div className={styles.eventCardLabel}>
                      <svg className={styles.eventCardRowIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Start:
                    </div>
                    <span className={styles.eventCardValue}>
                      {formatDateTime(event.fromDatetime)}
                    </span>
                  </div>
                  <div className={styles.eventCardRow}>
                    <div className={styles.eventCardLabel}>
                      <svg className={styles.eventCardRowIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      End:
                    </div>
                    <span className={styles.eventCardValue}>
                      {formatDateTime(event.toDatetime)}
                    </span>
                  </div>
                  <div className={styles.eventCardRow}>
                    <div className={styles.eventCardLabel}>
                      <svg className={styles.eventCardRowIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Venue:
                    </div>
                    <span className={styles.eventCardValue}>{event.venue || '—'}</span>
                  </div>
                  {event.teamMembersAssigned && event.teamMembersAssigned.length > 0 && (
                    <div className={styles.eventCardRow}>
                      <div className={styles.eventCardLabel}>
                        <svg className={styles.eventCardRowIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        Team:
                      </div>
                      <span className={styles.eventCardValue}>
                        {event.teamMembersAssigned.length} members assigned
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Filter by date range - must be before early returns for hooks
  const filteredProjects = useMemo(() => {
    return projects.filter(project => {
      if (!startDate && !endDate) return true;
      if (!project.createdAt) return false;
      
      const projectDate = new Date(project.createdAt);
      if (startDate && projectDate < new Date(startDate)) return false;
      if (endDate) {
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999);
        if (projectDate > endDateTime) return false;
      }
      return true;
    });
  }, [projects, startDate, endDate]);

  // Calculate and update stats whenever filteredProjects changes
  useEffect(() => {
    if (onStatsUpdate && !loading) {
      const active = filteredProjects.filter(p => (p as any).status !== 'Completed').length;
      const completed = filteredProjects.filter(p => (p as any).status === 'Completed').length;
      const revenue = filteredProjects.reduce((sum, p) => sum + (p.finance?.totalBudget || p.budget || 0), 0);
      const dueSoon = filteredProjects.filter(p => {
        const endDate = getLatestEventDate(p);
        if (!endDate) return false;
        const daysUntil = Math.ceil((new Date(endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
        return daysUntil > 0 && daysUntil <= 7;
      }).length;
      
      onStatsUpdate({ active, completed, revenue, dueSoon });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredProjects, loading]);

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Loading projects...</p>
      </div>
    );
  }

  if (projects.length === 0) {
    return null;
  }

  const handleClearFilters = () => {
    setStartDate('');
    setEndDate('');
    setIsDateRangeOpen(false);
  };

  const handleExportCSV = () => {
    const csvData = filteredProjects.map(project => ({
      Customer: getCustomerName(project),
      Phone: project.phoneNumber || '',
      Status: (project as any).status || 'Active',
      'Start Date': formatDate(getEarliestEventDate(project) || undefined),
      'End Date': formatDate(getLatestEventDate(project) || undefined),
      Events: project.events?.length || 0,
      Budget: project.finance?.totalBudget || project.budget || 0,
      Created: formatDate(project.createdAt),
    }));

    const headers = Object.keys(csvData[0] || {});
    const csv = [
      headers.join(','),
      ...csvData.map(row => headers.map(h => `\"${row[h as keyof typeof row]}\"`).join(','))
    ].join('\\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `projects-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    setIsExportOpen(false);
  };

  const handleExportPDF = () => {
    // TODO: Implement PDF export
    console.log('Export as PDF');
    setIsExportOpen(false);
  };

  const handlePrint = () => {
    window.print();
    setIsExportOpen(false);
  };

  return (
    <>
      <DataTable
        columns={columns}
        data={filteredProjects}
      renderExpandedRow={renderExpandedRow}
      getRowKey={(project) => project.projectId}
      emptyMessage="No projects found"
      itemsPerPage={8}
      customFilters={
        <>
          {/* Date Range Filter */}
          <div className={styles.dateRangeContainer} ref={dateRangeRef}>
            <button
              className={styles.dateRangeButton}
              onClick={() => setIsDateRangeOpen(!isDateRangeOpen)}
            >
              <svg className={styles.dateIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>Date Range</span>
              {(startDate || endDate) && <span className={styles.filterBadge}>•</span>}
            </button>
            
            {/* Quick Clear Button */}
            {(startDate || endDate) && (
              <button
                className={styles.quickClearButton}
                onClick={handleClearFilters}
                title="Clear date filters"
              >
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
            
            {isDateRangeOpen && (
              <div className={styles.dateRangeDropdown}>
                <div className={styles.dateRangeContent}>
                  <div className={styles.datePickerWrapper}>
                    <label className={styles.dateLabel}>Start Date</label>
                    <DatePicker
                      value={startDate}
                      onChange={setStartDate}
                      placeholder="Select start date"
                      includeTime={false}
                    />
                  </div>
                  <div className={styles.datePickerWrapper}>
                    <label className={styles.dateLabel}>End Date</label>
                    <DatePicker
                      value={endDate}
                      onChange={setEndDate}
                      placeholder="Select end date"
                      minDate={startDate}
                      includeTime={false}
                    />
                  </div>
                </div>
                <div className={styles.dateRangeActions}>
                  <button 
                    className={styles.dateRangeClear}
                    onClick={handleClearFilters}
                  >
                    Clear
                  </button>
                  <button 
                    className={styles.dateRangeApply}
                    onClick={() => setIsDateRangeOpen(false)}
                  >
                    Apply
                  </button>
                </div>
              </div>
            )}
          </div>
          <div className={styles.exportContainer} ref={exportRef}>
            <button 
              className={styles.exportButton}
              onClick={(e) => {
                const button = e.currentTarget;
                const rect = button.getBoundingClientRect();
                setIsExportOpen(!isExportOpen);
                
                if (!isExportOpen) {
                  setTimeout(() => {
                    const dropdown = button.nextElementSibling as HTMLElement;
                    if (dropdown) {
                      dropdown.style.top = `${rect.bottom + 4}px`;
                      dropdown.style.right = `${window.innerWidth - rect.right}px`;
                    }
                  }, 0);
                }
              }}
            >
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export
            </button>
            {isExportOpen && (
              <div className={styles.exportDropdown}>
                <button 
                  className={styles.exportDropdownItem}
                  onClick={handleExportCSV}
                >
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Export as CSV
                </button>
                <button 
                  className={styles.exportDropdownItem}
                  onClick={handleExportPDF}
                >
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  Export as PDF
                </button>
                <div className={styles.exportDropdownDivider} />
                <button 
                  className={styles.exportDropdownItem}
                  onClick={handlePrint}
                >
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  Print
                </button>
              </div>
            )}
          </div>
        </>
      }
      />
      
      <AssignEditorModal 
        ref={assignEditorModalRef} 
        onSuccess={() => {
          showToast('success', 'Album editors assigned successfully!');
          fetchProjects();
        }}
      />
      <AssignDesignerModal 
        ref={assignDesignerModalRef} 
        onSuccess={() => {
          showToast('success', 'Album designers assigned successfully!');
          fetchProjects();
        }}
      />
    </>
  );
};
