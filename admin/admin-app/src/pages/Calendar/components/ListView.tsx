import { useState, useMemo, useRef, useEffect } from 'react';
import type { ClientEvent } from 'laya-shared';
import { DataTable } from '../../../components/ui/DataTable';
import type { Column } from '../../../components/ui/DataTable';
import { SearchableSelect, DatePicker, Modal, Button } from '../../../components/ui';
import { getEventColor } from '../../../utils/calendar';
import { clientEventApi } from '../../../services/api';
import styles from '../Calendar.module.css';

interface ListViewProps {
  events: ClientEvent[];
  eventTypes: Map<string, { eventDesc: string; eventAlias?: string }>;
  projects: Map<string, { projectName: string; displayPic?: string }>;
  teamMembers: Map<string, { firstName: string; lastName: string }>;
  eventDeliveryStatuses: Map<string, { statusCode: string; statusDescription: string; step: number }>;
  onEventClick: (event: ClientEvent) => void;
  onStatusChange?: () => void;
}

export const ListView: React.FC<ListViewProps> = ({
  events,
  eventTypes,
  projects,
  eventDeliveryStatuses,
  onEventClick,
  onStatusChange,
}) => {
  const [searchTerm] = useState('');
  const [selectedPeople] = useState<string[]>([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedEventType, setSelectedEventType] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [openActionDropdown, setOpenActionDropdown] = useState<string | null>(null);
  const [isChangeStatusModalOpen, setIsChangeStatusModalOpen] = useState(false);
  const [selectedEventForStatus, setSelectedEventForStatus] = useState<ClientEvent | null>(null);
  const [newStatusId, setNewStatusId] = useState('');
  const [statusError, setStatusError] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Get avatar gradient based on project name
  const getAvatarGradient = (name: string) => {
    const gradients = [
      'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
      'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
      'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
      'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
      'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
      'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
      'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
      'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)',
      'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
      'linear-gradient(135deg, #a855f7 0%, #9333ea 100%)',
      'linear-gradient(135deg, #eab308 0%, #ca8a04 100%)',
      'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
      'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
      'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)',
      'linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)',
    ];
    
    let hash = 0;
    for (let i = 0; i < (name?.length || 0); i++) {
      hash = ((hash << 5) - hash) + name.charCodeAt(i);
      hash = hash & hash;
    }
    return gradients[Math.abs(hash) % gradients.length];
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
    };

    if (openActionDropdown) {
      setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
      }, 0);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openActionDropdown]);

  // Filter events
  const filteredEvents = useMemo(() => {
    let filtered = [...events];

    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter((event) => {
        const eventType = eventTypes.get(event.eventId);
        const eventTypeName = (eventType?.eventDesc || '').toLowerCase();
        const venue = (event.venue || '').toLowerCase();
        const city = (event.city || '').toLowerCase();
        const notes = (event.notes || '').toLowerCase();
        
        return (
          eventTypeName.includes(searchLower) ||
          venue.includes(searchLower) ||
          city.includes(searchLower) ||
          notes.includes(searchLower)
        );
      });
    }

    // People filter
    if (selectedPeople.length > 0) {
      filtered = filtered.filter((event) =>
        event.teamMembersAssigned?.some((memberId) => selectedPeople.includes(memberId))
      );
    }

    // Project filter
    if (selectedProject) {
      filtered = filtered.filter((event) => event.projectId === selectedProject);
    }

    // Date range filter
    if (dateFrom) {
      const fromDate = new Date(dateFrom);
      filtered = filtered.filter(
        (event) => event.fromDatetime && new Date(event.fromDatetime) >= fromDate
      );
    }
    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(
        (event) => event.fromDatetime && new Date(event.fromDatetime) <= toDate
      );
    }

    // Event type filter
    if (selectedEventType) {
      filtered = filtered.filter((event) => event.eventId === selectedEventType);
    }

    // Status filter
    if (selectedStatus) {
      filtered = filtered.filter((event) => event.eventDeliveryStatusId === selectedStatus);
    }

    // Sort by date (ascending)
    filtered.sort((a, b) => {
      const dateA = a.fromDatetime ? new Date(a.fromDatetime).getTime() : 0;
      const dateB = b.fromDatetime ? new Date(b.fromDatetime).getTime() : 0;
      return dateA - dateB;
    });

    return filtered;
  }, [events, searchTerm, selectedPeople, selectedProject, dateFrom, dateTo, selectedEventType, selectedStatus, eventTypes]);

  // Define table columns
  const columns: Column<ClientEvent>[] = [
    {
      key: 'eventId',
      header: 'Event Name',
      sortable: true,
      render: (event) => {
        const eventType = eventTypes.get(event.eventId);
        const color = getEventColor(new Date(event.fromDatetime!));
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: color === 'green' ? '#10b981' : color === 'blue' ? '#3b82f6' : '#8b5cf6'
            }}></span>
            <span style={{ fontWeight: 500 }}>{eventType?.eventDesc || 'Unknown Event'}</span>
          </div>
        );
      }
    },
    {
      key: 'projectId',
      header: 'Project',
      sortable: true,
      render: (event) => {
        const project = projects.get(event.projectId);
        const projectName = project?.projectName || 'Unknown Project';
        const initials = projectName.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {project?.displayPic ? (
              <img
                src={project.displayPic}
                alt="Project"
                className={styles.projectAvatar}
              />
            ) : (
              <div
                className={styles.projectAvatar}
                style={{
                  background: getAvatarGradient(projectName)
                }}
              >
                {initials}
              </div>
            )}
            <span>{projectName}</span>
          </div>
        );
      }
    },
    {
      key: 'eventDeliveryStatusId',
      header: 'Status',
      sortable: true,
      render: (event) => {
        const status = eventDeliveryStatuses.get(event.eventDeliveryStatusId || '');
        return (
          <span style={{
            padding: '4px 12px',
            borderRadius: '12px',
            fontSize: '0.75rem',
            fontWeight: 500,
            backgroundColor: 'rgba(99, 102, 241, 0.1)',
            color: '#6366f1'
          }}>
            {status?.statusDescription || 'No Status'}
          </span>
        );
      }
    },
    {
      key: 'fromDatetime',
      header: 'Start Date & Time',
      sortable: true,
      render: (event) => {
        if (!event.fromDatetime) return '-';
        const date = new Date(event.fromDatetime);
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg style={{ width: '16px', height: '16px', color: '#6b7280' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <div>
              <div style={{ fontWeight: 500 }}>{date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</div>
              <div style={{ fontSize: '0.75rem', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <svg style={{ width: '12px', height: '12px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
              </div>
            </div>
          </div>
        );
      }
    },
    {
      key: 'toDatetime',
      header: 'End Date & Time',
      sortable: true,
      render: (event) => {
        if (!event.toDatetime) return '-';
        const date = new Date(event.toDatetime);
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg style={{ width: '16px', height: '16px', color: '#6b7280' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <div>
              <div style={{ fontWeight: 500 }}>{date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</div>
              <div style={{ fontSize: '0.75rem', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <svg style={{ width: '12px', height: '12px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
              </div>
            </div>
          </div>
        );
      }
    },
    {
      key: 'progress',
      header: 'Progress',
      sortable: true,
      render: (event) => {
        const currentStatus = eventDeliveryStatuses.get(event.eventDeliveryStatusId || '');
        const currentStep = currentStatus?.step || 0;
        const totalStatuses = eventDeliveryStatuses.size;
        const progressPercentage = totalStatuses > 0 ? (currentStep / totalStatuses) * 100 : 0;

        return (
          <div className={styles.tasksCell}>
            <span className={styles.tasksText}>{currentStep}/{totalStatuses}</span>
            <div className={styles.progressBar}>
              <div 
                className={styles.progressFill}
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        );
      }
    },
    {
      key: 'venue',
      header: 'Venue',
      sortable: true,
      render: (event) => {
        const hasLocation = event.venue || event.city;
        const mapUrl = event.venueMapUrl || 
          (hasLocation ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${event.venue || ''} ${event.city || ''}`.trim())}` : '');
        
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div>
              {event.venue && <div style={{ fontWeight: 500 }}>{event.venue}</div>}
              {event.city && <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{event.city}</div>}
            </div>
            {hasLocation && (
              <a
                href={mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#6366f1',
                  transition: 'color 0.2s',
                  cursor: 'pointer',
                  flexShrink: 0
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#4f46e5'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#6366f1'}
                title="View on Google Maps"
              >
                <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            )}
          </div>
        );
      }
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (event) => {
        const handleDropdownClick = (e: React.MouseEvent<HTMLButtonElement>) => {
          const button = e.currentTarget;
          const rect = button.getBoundingClientRect();
          setOpenActionDropdown(
            openActionDropdown === event.clientEventId ? null : event.clientEventId
          );
          
          // Position dropdown
          if (openActionDropdown !== event.clientEventId) {
            setTimeout(() => {
              const dropdown = button.nextElementSibling as HTMLElement;
              if (dropdown) {
                dropdown.style.top = `${rect.bottom + 4}px`;
                dropdown.style.right = `${window.innerWidth - rect.right}px`;
              }
            }, 0);
          }
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
              {openActionDropdown === event.clientEventId && (
              <div className={styles.actionsDropdownMenu}>
                <button 
                  className={styles.actionsDropdownItem}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenChangeStatus(event);
                  }}
                >
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Change status
                </button>
                <button 
                  className={styles.actionsDropdownItem}
                  onClick={(e) => {
                    e.stopPropagation();
                    onEventClick(event);
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
                    // TODO: Implement visit album
                    console.log('Visit album for event:', event);
                    setOpenActionDropdown(null);
                  }}
                >
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Visit album
                </button>
                <button 
                  className={styles.actionsDropdownItem}
                  onClick={(e) => {
                    e.stopPropagation();
                    // TODO: Implement see on map
                    console.log('See on map for event:', event);
                    setOpenActionDropdown(null);
                  }}
                >
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  See on map
                </button>
              </div>
            )}
          </div>
        </div>
        );
      },
    }
  ];

  const handleClearFilters = () => {
    setSelectedProject('');
    setSelectedEventType('');
    setDateFrom('');
    setDateTo('');
    setSelectedStatus('');
  };

  const hasActiveFilters = selectedProject || selectedEventType || dateFrom || dateTo || selectedStatus;

  // Get available next status for an event
  const getNextAvailableStatus = (currentStatusId: string | undefined) => {
    if (!currentStatusId) return null;
    const currentStatus = eventDeliveryStatuses.get(currentStatusId);
    if (!currentStatus) return null;

    // Find status with next step number
    const nextStep = currentStatus.step + 1;
    const nextStatus = Array.from(eventDeliveryStatuses.entries()).find(
      ([_, status]) => status.step === nextStep
    );

    return nextStatus ? { id: nextStatus[0], ...nextStatus[1] } : null;
  };

  // Handle opening change status modal
  const handleOpenChangeStatus = (event: ClientEvent) => {
    setSelectedEventForStatus(event);
    setNewStatusId('');
    setStatusError('');
    setIsChangeStatusModalOpen(true);
    setOpenActionDropdown(null);
  };

  // Handle status change submission
  const handleChangeStatus = async () => {
    if (!selectedEventForStatus || !newStatusId) {
      setStatusError('Please select a status');
      return;
    }

    // Validate that new status is the next one in sequence
    const currentStatus = eventDeliveryStatuses.get(selectedEventForStatus.eventDeliveryStatusId || '');
    const newStatus = eventDeliveryStatuses.get(newStatusId);

    if (!currentStatus || !newStatus) {
      setStatusError('Invalid status selection');
      return;
    }

    if (newStatus.step !== currentStatus.step + 1) {
      setStatusError(`Status must be the next in sequence: "${getNextAvailableStatus(selectedEventForStatus.eventDeliveryStatusId)?.statusDescription || 'N/A'}"`);
      return;
    }

    setIsUpdatingStatus(true);
    try {
      await clientEventApi.update(selectedEventForStatus.clientEventId, {
        eventDeliveryStatusId: newStatusId,
      });
      
      setIsChangeStatusModalOpen(false);
      setSelectedEventForStatus(null);
      setNewStatusId('');
      
      // Refresh the events list
      if (onStatusChange) {
        onStatusChange();
      }
    } catch (error) {
      console.error('Error updating status:', error);
      setStatusError('Failed to update status. Please try again.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  return (
    <div className={styles.listView}>
      <DataTable
        columns={columns}
        data={filteredEvents}
        itemsPerPage={15}
        emptyMessage="No events found matching your filters"
        getRowKey={(event) => event.clientEventId}
        customFilters={
          <div className={styles.listFilters}>
            <div className={styles.filterField}>
              <SearchableSelect
                options={[
                  { value: '', label: 'All Projects' },
                  ...Array.from(projects.entries()).map(([projectId, project]) => ({
                    value: projectId,
                    label: project.projectName
                  }))
                ]}
                value={selectedProject}
                onChange={setSelectedProject}
                placeholder="All Projects"
              />
            </div>

            <div className={styles.filterField}>
              <SearchableSelect
                options={[
                  { value: '', label: 'All Event Types' },
                  ...Array.from(eventTypes.entries()).map(([eventId, type]) => ({
                    value: eventId,
                    label: type.eventDesc
                  }))
                ]}
                value={selectedEventType}
                onChange={setSelectedEventType}
                placeholder="All Event Types"
              />
            </div>

            <div className={styles.filterField}>
              <SearchableSelect
                options={[
                  { value: '', label: 'All Statuses' },
                  ...Array.from(eventDeliveryStatuses.entries()).map(([statusId, status]) => ({
                    value: statusId,
                    label: status.statusDescription
                  }))
                ]}
                value={selectedStatus}
                onChange={setSelectedStatus}
                placeholder="All Statuses"
              />
            </div>

            <div className={styles.filterField}>
              <DatePicker
                value={dateFrom}
                onChange={setDateFrom}
                placeholder="From Date"
                includeTime={false}
              />
            </div>

            <div className={styles.filterField}>
              <DatePicker
                value={dateTo}
                onChange={setDateTo}
                placeholder="To Date"
                includeTime={false}
              />
            </div>

            {hasActiveFilters && (
              <button
                className={styles.quickClearButton}
                onClick={handleClearFilters}
                title="Clear all filters"
              >
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        }
      />

      {/* Change Status Modal */}
      <Modal
        isOpen={isChangeStatusModalOpen}
        onClose={() => {
          setIsChangeStatusModalOpen(false);
          setSelectedEventForStatus(null);
          setNewStatusId('');
          setStatusError('');
        }}
        title="Change Event Status"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {selectedEventForStatus && (
            <>
              <div style={{ 
                padding: '1rem', 
                backgroundColor: '#f9fafb', 
                borderRadius: '8px',
                border: '1px solid #e5e7eb'
              }}>
                <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>
                  Current Status
                </div>
                <div style={{ fontWeight: 600, color: '#111827' }}>
                  {eventDeliveryStatuses.get(selectedEventForStatus.eventDeliveryStatusId || '')?.statusDescription || 'No Status'}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                  Step {eventDeliveryStatuses.get(selectedEventForStatus.eventDeliveryStatusId || '')?.step || 0}
                </div>
              </div>

              <div>
                <label style={{ 
                  display: 'block', 
                  fontSize: '0.875rem', 
                  fontWeight: 500, 
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  New Status *
                </label>
                <SearchableSelect
                  options={[
                    { value: '', label: 'Select new status' },
                    ...Array.from(eventDeliveryStatuses.entries())
                      .sort((a, b) => a[1].step - b[1].step)
                      .map(([statusId, status]) => ({
                        value: statusId,
                        label: `${status.statusDescription} (Step ${status.step})`,
                      }))
                  ]}
                  value={newStatusId}
                  onChange={(value) => {
                    setNewStatusId(value);
                    setStatusError('');
                  }}
                  placeholder="Select new status"
                />
                {statusError && (
                  <div style={{ 
                    marginTop: '0.5rem', 
                    fontSize: '0.875rem', 
                    color: '#ef4444',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <svg style={{ width: '16px', height: '16px', flexShrink: 0 }} fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    {statusError}
                  </div>
                )}
              </div>

              {getNextAvailableStatus(selectedEventForStatus.eventDeliveryStatusId) && (
                <div style={{ 
                  padding: '0.75rem', 
                  backgroundColor: '#eff6ff', 
                  borderRadius: '8px',
                  border: '1px solid #bfdbfe',
                  fontSize: '0.875rem',
                  color: '#1e40af',
                  display: 'flex',
                  gap: '0.5rem',
                  alignItems: 'flex-start'
                }}>
                  <svg style={{ width: '16px', height: '16px', flexShrink: 0, marginTop: '0.125rem' }} fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <strong>Next status:</strong> {getNextAvailableStatus(selectedEventForStatus.eventDeliveryStatusId)?.statusDescription}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <Button
                  onClick={() => {
                    setIsChangeStatusModalOpen(false);
                    setSelectedEventForStatus(null);
                    setNewStatusId('');
                    setStatusError('');
                  }}
                  variant="outline"
                  disabled={isUpdatingStatus}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleChangeStatus}
                  disabled={isUpdatingStatus || !newStatusId}
                >
                  {isUpdatingStatus ? 'Updating...' : 'Update Status'}
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
};
