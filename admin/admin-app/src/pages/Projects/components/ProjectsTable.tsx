import { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { projectApi, eventDeliveryStatusApi, proposalApi } from '../../../services/api';
import { DataTable } from '../../../components/ui/DataTable';
import type { Column } from '../../../components/ui/DataTable';
import { DatePicker } from '../../../components/ui/DatePicker';
import { Modal } from '../../../components/ui/Modal';
import { useAppDispatch } from '../../../store/index.js';
import { setEditingProject } from '../../../store/slices/projectSlice.js';
import { formatIndianAmount } from '../../../utils/formatAmount';
import { AssignEditorModal, type AssignEditorModalHandle } from './AssignEditorModal';
import { AssignDesignerModal, type AssignDesignerModalHandle } from './AssignDesignerModal';
import { useToast } from '../../../context/ToastContext';
import styles from './ProjectsTable.module.css';

// Project Status Constants
export const PROJECT_STATUS = {
  ACTIVE: 'Active',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled'
} as const;

export type ProjectStatus = typeof PROJECT_STATUS[keyof typeof PROJECT_STATUS];

interface Project {
  projectId: string;
  projectName: string;
  brideFirstName?: string;
  groomFirstName?: string;
  brideLastName?: string;
  groomLastName?: string;
  contactPerson?: string;
  phoneNumber?: string;
  email?: string;
  address?: string;
  city?: string;
  referredBy?: string;
  budget?: number;
  deliveryDueDate?: string;
  displayPic?: string;
  coverPhoto?: string;
  createdAt?: string;
  events?: any[];
  finance?: any;
  accessPin?: string;
  accessCode?: string;
  proposalId?: string;
  status?: ProjectStatus;
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
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; right: number } | null>(null);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [eventDeliveryStatuses, setEventDeliveryStatuses] = useState<Map<string, any>>(new Map());
  const [totalStatuses, setTotalStatuses] = useState(0);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const exportRef = useRef<HTMLDivElement>(null);
  const dateRangeRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
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
      const statuses = response?.eventDeliveryStatuses || response?.statuses || [];
      
      // Create a map for easy lookup: statusId -> status object
      const statusMap = new Map<string, any>(
        statuses.map((status: any) => [status.statusId as string, status])
      );
      
      setEventDeliveryStatuses(statusMap);
      setTotalStatuses(statuses.length);
    } catch (error) {
      console.error('Error fetching statuses:', error);
      setTotalStatuses(0);
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

    const handleScroll = () => {
      if (openActionDropdown) {
        setOpenActionDropdown(null);
      }
    };

    if (openActionDropdown || isExportOpen || isDateRangeOpen) {
      // Use timeout to allow click events to fire first
      setTimeout(() => {
        document.addEventListener('click', handleClickOutside);
        window.addEventListener('scroll', handleScroll, true);
      }, 0);
      return () => {
        document.removeEventListener('click', handleClickOutside);
        window.removeEventListener('scroll', handleScroll, true);
      };
    }
  }, [openActionDropdown, isExportOpen, isDateRangeOpen]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await projectApi.getAll();
      console.log('Fetched projects:', response?.projects?.length);
      // Log first project's events to verify duration field
      if (response?.projects?.[0]?.events?.[0]) {
        console.log('Sample event from first project:', {
          clientEventId: response.projects[0].events[0].clientEventId,
          duration: response.projects[0].events[0].duration,
          fromDatetime: response.projects[0].events[0].fromDatetime,
          toDatetime: response.projects[0].events[0].toDatetime
        });
      }
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
    return project.projectName
      .split(' ')
      .filter(word => word.toLowerCase() !== '&' && word.toLowerCase() !== 'and')
      .map(word => word.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('');
  };

  const getAvatarColors = (name: string) => {
    const colors = [
      { bg: 'rgba(99, 102, 241, 0.1)', text: '#4f46e5', border: 'rgba(99, 102, 241, 0.2)' },    // indigo
      { bg: 'rgba(59, 130, 246, 0.1)', text: '#2563eb', border: 'rgba(59, 130, 246, 0.2)' },    // blue
      { bg: 'rgba(34, 197, 94, 0.1)', text: '#16a34a', border: 'rgba(34, 197, 94, 0.2)' },      // green
      { bg: 'rgba(245, 158, 11, 0.1)', text: '#d97706', border: 'rgba(245, 158, 11, 0.2)' },    // amber
      { bg: 'rgba(239, 68, 68, 0.1)', text: '#dc2626', border: 'rgba(239, 68, 68, 0.2)' },      // red
      { bg: 'rgba(236, 72, 153, 0.1)', text: '#db2777', border: 'rgba(236, 72, 153, 0.2)' },    // pink
      { bg: 'rgba(6, 182, 212, 0.1)', text: '#0891b2', border: 'rgba(6, 182, 212, 0.2)' },      // cyan
      { bg: 'rgba(20, 184, 166, 0.1)', text: '#0d9488', border: 'rgba(20, 184, 166, 0.2)' },    // teal
      { bg: 'rgba(249, 115, 22, 0.1)', text: '#ea580c', border: 'rgba(249, 115, 22, 0.2)' },    // orange
      { bg: 'rgba(168, 85, 247, 0.1)', text: '#9333ea', border: 'rgba(168, 85, 247, 0.2)' },    // violet
      { bg: 'rgba(234, 179, 8, 0.1)', text: '#ca8a04', border: 'rgba(234, 179, 8, 0.2)' },      // yellow
      { bg: 'rgba(14, 165, 233, 0.1)', text: '#0284c7', border: 'rgba(14, 165, 233, 0.2)' },    // sky
      { bg: 'rgba(16, 185, 129, 0.1)', text: '#059669', border: 'rgba(16, 185, 129, 0.2)' },    // emerald
      { bg: 'rgba(244, 63, 94, 0.1)', text: '#e11d48', border: 'rgba(244, 63, 94, 0.2)' },      // rose
    ];
    
    let hash = 0;
    for (let i = 0; i < (name?.length || 0); i++) {
      hash = ((hash << 5) - hash) + name.charCodeAt(i);
      hash = hash & hash;
    }
    return colors[Math.abs(hash) % colors.length];
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
      render: (project) => {
        const colors = getAvatarColors(project.projectName);
        return (
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
                style={{ 
                  backgroundColor: colors.bg,
                  border: `1.5px solid ${colors.border}`,
                  color: colors.text
                }}
              >
                {getInitials(project)}
              </div>
            )}
            <div>
              <div className={styles.customerName}>{project.projectName}</div>
              <div className={styles.customerSubtext}>{project.contactPerson || getCustomerName(project)}</div>
            </div>
          </div>
        );
      },
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
      key: 'accessPin',
      header: 'PIN',
      render: (project) => (
        <span className={styles.pinText}>{project.accessPin || '—'}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (project) => (
        <span className={styles.statusBadge}>
          {project.status || PROJECT_STATUS.ACTIVE}
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
      key: 'deliveryDueDate',
      header: 'Delivery Due',
      sortable: true,
      render: (project) => {
        return (
          <div className={styles.dateWithIcon}>
            <svg className={styles.calendarIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className={styles.dateText}>
              {project.deliveryDueDate ? formatDate(project.deliveryDueDate) : '—'}
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
          // Look up the status to get the step number
          const status = eventDeliveryStatuses.get(event.eventDeliveryStatusId);
          const step = status?.step || 0;
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
      key: 'actions',
      header: 'Actions',
      render: (project) => {
        const handleDropdownClick = (e: React.MouseEvent<HTMLButtonElement>) => {
          e.stopPropagation();
          const button = e.currentTarget;
          const rect = button.getBoundingClientRect();
          
          if (openActionDropdown === project.projectId) {
            setOpenActionDropdown(null);
            setDropdownPosition(null);
          } else {
            setOpenActionDropdown(project.projectId);
            setDropdownPosition({
              top: rect.bottom + 4,
              right: window.innerWidth - rect.right
            });
          }
        };

        return (
          <div className={styles.actionsCell} onClick={(e) => e.stopPropagation()}>
            <div className={styles.actionsDropdownContainer}>
              <button 
                className={styles.actionsDropdownButton}
                onClick={handleDropdownClick}
              >
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
              </button>
              {openActionDropdown === project.projectId && dropdownPosition && createPortal(
              <>
                <div 
                  className={styles.dropdownBackdrop}
                  onClick={() => setOpenActionDropdown(null)}
                />
                <div 
                  ref={dropdownRef}
                  className={styles.actionsDropdownMenu}
                  style={{
                    top: `${dropdownPosition.top}px`,
                    right: `${dropdownPosition.right}px`
                  }}
                >
                  <button 
                    className={styles.actionsDropdownItem}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedProject(project);
                      setViewModalOpen(true);
                      setOpenActionDropdown(null);
                    }}
                  >
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    View
                  </button>
                  <button 
                    className={styles.actionsDropdownItem}
                    onClick={(e) => {
                      e.stopPropagation();
                      console.log('Edit clicked, project:', project);
                      console.log('Project events:', project.events);
                      if (project.events && project.events.length > 0) {
                        project.events.forEach((event: any, index: number) => {
                          console.log(`Event ${index}: duration=${event.duration}, fromDatetime=${event.fromDatetime}, toDatetime=${event.toDatetime}`);
                        });
                      }
                      dispatch(setEditingProject(project));
                      setOpenActionDropdown(null);
                    }}
                  >
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit
                </button>
                <button 
                  className={styles.actionsDropdownItem}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleVisitPortal(project);
                  }}
                >
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                  </svg>
                  Visit website
                </button>
                <button 
                  className={styles.actionsDropdownItem}
                  onClick={() => {
                    setOpenActionDropdown(null);
                    window.open(`/calendar?projectId=${project.projectId}&view=list`, '_blank');
                  }}
                >
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  See Events
                </button>
                <button 
                  className={styles.actionsDropdownItem}
                  onClick={() => {
                    setOpenActionDropdown(null);
                    window.open(`/finances?customer=${project.projectId}`, '_blank');
                  }}
                >
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Finances
                </button>
                <button 
                  className={styles.actionsDropdownItem}
                  onClick={() => {
                    setOpenActionDropdown(null);
                    window.open(`/albums?projectId=${project.projectId}`, '_blank');
                  }}
                >
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
              </>,
              document.body
              )}
          </div>
        </div>
        );
      },
    },
  ];

  const getEventStatus = (event: any) => {
    // Look up the status from eventDeliveryStatuses map
    const status = eventDeliveryStatuses.get(event.eventDeliveryStatusId);
    return status || null;
  };

  const getStatusColor = (step: number, totalSteps: number) => {
    if (totalSteps === 0) return { bg: 'rgba(148, 163, 184, 0.1)', text: '#94a3b8' }; // gray
    
    const progress = step / totalSteps;
    
    if (progress === 1) {
      // Completed
      return { bg: 'rgba(34, 197, 94, 0.1)', text: '#22c55e' }; // green
    } else if (progress >= 0.7) {
      // Near completion
      return { bg: 'rgba(59, 130, 246, 0.1)', text: '#3b82f6' }; // blue
    } else if (progress >= 0.4) {
      // In progress
      return { bg: 'rgba(245, 158, 11, 0.1)', text: '#f59e0b' }; // amber
    } else {
      // Early stage
      return { bg: 'rgba(99, 102, 241, 0.1)', text: '#6366f1' }; // indigo
    }
  };

  const handleVisitPortal = async (project: Project) => {
    try {
      if (!project.proposalId) {
        showToast('error', 'This project was not created from a proposal');
        return;
      }

      // Fetch proposal details to get access code
      const proposalData = await proposalApi.getById(project.proposalId);
      const accessCode = proposalData?.proposal?.accessCode;

      if (!accessCode) {
        showToast('error', 'No portal access code found');
        return;
      }

      const customerAppUrl = import.meta.env.VITE_CUSTOMER_APP_URL || 'http://localhost:5174';
      const portalUrl = `${customerAppUrl}/${accessCode}`;
      window.open(portalUrl, '_blank');
      setOpenActionDropdown(null);
    } catch (error) {
      console.error('Error opening portal:', error);
      showToast('error', 'Failed to open customer portal');
    }
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
            const statusColors = getStatusColor(status?.step || 0, totalStatuses);
            
            return (
              <div key={idx} className={styles.eventCard}>
                <div className={styles.eventCardHeader}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
                    <div className={styles.eventTitleRow}>
                      <svg className={styles.eventCardIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <h4 className={styles.eventCardTitle}>
                        {event.eventTitle || 'Untitled Event'}
                      </h4>
                    </div>
                    <span 
                      className={styles.eventStatusBadge}
                      style={{
                        backgroundColor: statusColors.bg,
                        color: statusColors.text,
                        alignSelf: 'flex-start'
                      }}
                    >
                      {status?.statusDescription || 'No Status'}
                    </span>
                  </div>
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
                  
                  {/* Progress Bar */}
                  <div className={styles.eventCardRow} style={{ marginTop: '8px' }}>
                    <div className={styles.eventCardLabel}>Progress:</div>
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div className={styles.progressBar} style={{ flex: 1 }}>
                        <div 
                          className={styles.progressFill}
                          style={{ 
                            width: `${totalStatuses > 0 ? ((status?.step || 0) / totalStatuses) * 100 : 0}%`,
                            backgroundColor: statusColors.text
                          }}
                        />
                      </div>
                      <span className={styles.eventCardValue} style={{ minWidth: 'fit-content' }}>
                        {status?.step || 0}/{totalStatuses}
                      </span>
                    </div>
                  </div>
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
      const active = filteredProjects.filter(p => p.status !== PROJECT_STATUS.COMPLETED).length;
      const completed = filteredProjects.filter(p => p.status === PROJECT_STATUS.COMPLETED).length;
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

  const handleClearFilters = () => {
    setStartDate('');
    setEndDate('');
    setIsDateRangeOpen(false);
  };

  const handleExportCSV = () => {
    const csvData = filteredProjects.map(project => ({
      Customer: getCustomerName(project),
      Phone: project.phoneNumber || '',
      Status: project.status || PROJECT_STATUS.ACTIVE,
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
        onRowClick={(project) => {
          setSelectedProject(project);
          setViewModalOpen(true);
        }}
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

      <Modal
        isOpen={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
        title="Project Details"
        size="large"
      >
        {selectedProject && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Customer Header with Avatar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              {selectedProject.displayPic ? (
                <img 
                  src={selectedProject.displayPic} 
                  alt="Profile"
                  style={{ 
                    width: '56px', 
                    height: '56px', 
                    borderRadius: '50%', 
                    objectFit: 'cover' 
                  }}
                />
              ) : (
                <div 
                  style={{ 
                    width: '56px', 
                    height: '56px', 
                    borderRadius: '50%', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    fontWeight: '600',
                    fontSize: '18px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    backgroundColor: getAvatarColors(selectedProject.projectName).bg,
                    border: `1.5px solid ${getAvatarColors(selectedProject.projectName).border}`,
                    color: getAvatarColors(selectedProject.projectName).text
                  }}
                >
                  {selectedProject.projectName
                    .split(' ')
                    .filter(word => word.toLowerCase() !== '&' && word.toLowerCase() !== 'and')
                    .map(word => word.charAt(0).toUpperCase())
                    .slice(0, 2)
                    .join('')}
                </div>
              )}
              <div>
                <div style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '4px' }}>
                  {selectedProject.contactPerson || 
                   (selectedProject.brideFirstName && selectedProject.groomFirstName 
                     ? `${selectedProject.brideFirstName} & ${selectedProject.groomFirstName}`
                     : selectedProject.projectName)}
                </div>
                <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                  {selectedProject.projectName}
                </div>
              </div>
            </div>

            {/* Basic Information */}
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                {selectedProject.phoneNumber && (
                  <div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Phone</div>
                    <div style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: '500' }}>{selectedProject.phoneNumber}</div>
                  </div>
                )}
                {selectedProject.email && (
                  <div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Email</div>
                    <div style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: '500' }}>{selectedProject.email}</div>
                  </div>
                )}
                {(selectedProject.groomFirstName || selectedProject.groomLastName) && (
                  <div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Groom</div>
                    <div style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: '500' }}>
                      {[selectedProject.groomFirstName, selectedProject.groomLastName].filter(Boolean).join(' ')}
                    </div>
                  </div>
                )}
                {(selectedProject.brideFirstName || selectedProject.brideLastName) && (
                  <div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Bride</div>
                    <div style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: '500' }}>
                      {[selectedProject.brideFirstName, selectedProject.brideLastName].filter(Boolean).join(' ')}
                    </div>
                  </div>
                )}
                {selectedProject.address && (
                  <div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Address</div>
                    <div style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: '500' }}>{selectedProject.address}</div>
                  </div>
                )}
                {selectedProject.city && (
                  <div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>City</div>
                    <div style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: '500' }}>{selectedProject.city}</div>
                  </div>
                )}
                {selectedProject.referredBy && (
                  <div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Referral Source</div>
                    <div style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: '500' }}>{selectedProject.referredBy}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Events */}
            {selectedProject.events && selectedProject.events.length > 0 && (
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: 'var(--text-primary)' }}>
                  Events ({selectedProject.events.length})
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {selectedProject.events.map((event: any, index: number) => (
                    <div 
                      key={index}
                      style={{
                        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.03), rgba(139, 92, 246, 0.03))',
                        border: '1px solid var(--border-color)',
                        borderRadius: '8px',
                        padding: '12px'
                      }}
                    >
                      <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '8px' }}>
                        {event.eventTitle || event.eventName || `Event ${index + 1}`}
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                        {event.fromDatetime && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <strong>From:</strong> {new Date(event.fromDatetime).toLocaleString('en-US', { 
                              month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true 
                            })}
                          </div>
                        )}
                        {event.toDatetime && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <strong>To:</strong> {new Date(event.toDatetime).toLocaleString('en-US', { 
                              month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true 
                            })}
                          </div>
                        )}
                        {event.duration && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <strong>Duration:</strong> {event.duration}h
                          </div>
                        )}
                        {event.venue && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexBasis: '100%' }}>
                            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            {event.venue}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Financial Information */}
            {selectedProject.finance && (
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: 'var(--text-primary)' }}>
                  Financial Information
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                  {selectedProject.finance.totalBudget && (
                    <div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Total Budget</div>
                      <div style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: '600' }}>
                        ₹{formatIndianAmount(selectedProject.finance.totalBudget)}
                      </div>
                    </div>
                  )}
                  {selectedProject.finance.receivedAmount !== undefined && (
                    <div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Advance Received</div>
                      <div style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: '600' }}>
                        ₹{formatIndianAmount(selectedProject.finance.receivedAmount)}
                      </div>
                    </div>
                  )}
                  {selectedProject.finance.receivedDate && (
                    <div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Advance Date</div>
                      <div style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: '500' }}>
                        {new Date(selectedProject.finance.receivedDate).toLocaleDateString('en-US', { 
                          month: 'short', day: 'numeric', year: 'numeric' 
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Images */}
            {(selectedProject.displayPic || selectedProject.coverPhoto) && (
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: 'var(--text-primary)' }}>
                  Photos
                </h3>
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                  {selectedProject.displayPic && (
                    <div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Display Picture</div>
                      <img 
                        src={selectedProject.displayPic} 
                        alt="Display" 
                        style={{ 
                          width: '120px', 
                          height: '120px', 
                          objectFit: 'cover', 
                          borderRadius: '8px',
                          border: '2px solid var(--border-color)'
                        }} 
                      />
                    </div>
                  )}
                  {selectedProject.coverPhoto && (
                    <div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Cover Photo</div>
                      <img 
                        src={selectedProject.coverPhoto} 
                        alt="Cover" 
                        style={{ 
                          width: '200px', 
                          height: '120px', 
                          objectFit: 'cover', 
                          borderRadius: '8px',
                          border: '2px solid var(--border-color)'
                        }} 
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Created Date */}
            {selectedProject.createdAt && (
              <div style={{ paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  Created on {new Date(selectedProject.createdAt).toLocaleDateString('en-US', { 
                    month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true 
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </>
  );
};
