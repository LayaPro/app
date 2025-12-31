import { useState, useEffect, forwardRef, useImperativeHandle, useMemo } from 'react';
import { Modal } from '../../../components/ui/Modal';
import { SearchableSelect } from '../../../components/ui/SearchableSelect';
import { teamApi, clientEventApi, eventApi, profileApi } from '../../../services/api';
import styles from './AssignEditorModal.module.css';

export interface AssignEditorModalHandle {
  open: (project: any) => void;
}

interface AssignEditorModalProps {
  onSuccess?: () => void;
}

interface TeamMember {
  memberId: string;
  firstName: string;
  lastName: string;
  emailId: string;
  profileId?: string;
}

interface EventEditorMapping {
  clientEventId: string;
  eventName: string;
  editorId: string;
}

export const AssignEditorModal = forwardRef<AssignEditorModalHandle, AssignEditorModalProps>(
  ({ onSuccess }: AssignEditorModalProps, ref) => {
  const [isOpen, setIsOpen] = useState(false);
  const [project, setProject] = useState<any>(null);
  const [mode, setMode] = useState<'single' | 'per-event'>('single');
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [validationError, setValidationError] = useState('');
  
  // Single editor mode
  const [selectedEditor, setSelectedEditor] = useState('');
  
  // Per-event mode
  const [eventMappings, setEventMappings] = useState<EventEditorMapping[]>([]);

  useImperativeHandle(ref, () => ({
    open: (proj: any) => {
      setProject(proj);
      setIsOpen(true);
    }
  }));

  useEffect(() => {
    if (isOpen && project) {
      fetchData();
    }
  }, [isOpen, project]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [teamResponse, eventsResponse, eventTypesResponse, profilesResponse] = await Promise.all([
        teamApi.getAll(),
        clientEventApi.getByProject(project.projectId),
        eventApi.getAll(),
        profileApi.getAll()
      ]);

      setTeamMembers(teamResponse.teamMembers || []);
      setProfiles(profilesResponse.profiles || []);
      const fetchedEvents = eventsResponse.clientEvents || [];
      setEvents(fetchedEvents);

      // Create event types map
      const typesMap = new Map<string, { eventDesc: string }>(
        (eventTypesResponse.events || []).map((et: any) => [
          et.eventId,
          { eventDesc: et.eventDesc || 'Event' }
        ])
      );

      // Initialize event mappings with current editors
      const mappings = fetchedEvents.map((event: any) => ({
        clientEventId: event.clientEventId,
        eventName: typesMap.get(event.eventId)?.eventDesc || 'Event',
        editorId: event.albumEditor || ''
      }));
      setEventMappings(mappings);

      // If all events have the same editor, set it as the selected editor for single mode
      const editors = mappings.map((m: EventEditorMapping) => m.editorId).filter((id: string) => id !== '');
      const uniqueEditors = Array.from(new Set(editors));
      if (uniqueEditors.length === 1 && editors.length === mappings.length) {
        // All events have the same editor
        setSelectedEditor(uniqueEditors[0] as string);
      } else {
        setSelectedEditor('');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getProfileName = (profileId?: string) => {
    if (!profileId) return '';
    const profile = profiles.find(p => p.profileId === profileId);
    return profile?.name || '';
  };

  const editorOptions = useMemo(() => {
    return [
      { value: '', label: '-- No Editor --' },
      ...teamMembers.map(member => {
        const profileName = getProfileName(member.profileId);
        return {
          value: member.memberId,
          label: `${member.firstName} ${member.lastName}${profileName ? ` - ${profileName}` : ''}`
        };
      })
    ];
  }, [teamMembers, profiles]);

  const isValid = useMemo(() => {
    if (mode === 'single') {
      // Valid if an editor is selected OR if all events already have editors assigned
      return selectedEditor !== '' || eventMappings.every(mapping => mapping.editorId !== '');
    } else {
      return eventMappings.every(mapping => mapping.editorId !== '');
    }
  }, [mode, selectedEditor, eventMappings]);

  const getUnassignedCount = () => {
    if (mode === 'single') {
      return selectedEditor ? 0 : events.length;
    }
    return eventMappings.filter(m => !m.editorId).length;
  };

  const handleSave = async () => {
    if (!isValid) {
      setValidationError('Please assign an editor to all events before saving.');
      return;
    }
    setValidationError('');
    setSaving(true);
    try {
      if (mode === 'single') {
        // Assign same editor to all events
        await Promise.all(
          events.map(event =>
            clientEventApi.update(event.clientEventId, {
              albumEditor: selectedEditor || null
            })
          )
        );
      } else {
        // Assign different editors per event
        await Promise.all(
          eventMappings.map(mapping =>
            clientEventApi.update(mapping.clientEventId, {
              albumEditor: mapping.editorId || null
            })
          )
        );
      }

      if (onSuccess) {
        onSuccess();
      }
      handleClose();
    } catch (error) {
      console.error('Error assigning editors:', error);
      alert('Failed to assign editors. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setProject(null);
    setMode('single');
    setSelectedEditor('');
    setEventMappings([]);
    setValidationError('');
  };

  const updateEventEditor = (clientEventId: string, editorId: string) => {
    setEventMappings(prev =>
      prev.map(mapping =>
        mapping.clientEventId === clientEventId
          ? { ...mapping, editorId }
          : mapping
      )
    );
  };

  if (loading) {
    return (
      <Modal isOpen={isOpen} onClose={handleClose} title="Assign Album Editor" size="medium">
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <div className={styles.spinner}></div>
          <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>Loading...</p>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Assign Album Editor" size="medium">
      <div className={styles.modalContent}>
        <div className={styles.projectInfo}>
          <strong>{project?.projectName || 'Project'}</strong>
          <span className={styles.eventCount}>{events.length} event{events.length !== 1 ? 's' : ''}</span>
        </div>

        <div className={styles.modeSelector}>
          <button
            type="button"
            className={`${styles.modeButton} ${mode === 'single' ? styles.modeButtonActive : ''}`}
            onClick={() => setMode('single')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
            <div>
              <div className={styles.modeTitle}>Single Editor</div>
              <div className={styles.modeDesc}>Assign one editor for all events</div>
            </div>
          </button>
          <button
            type="button"
            className={`${styles.modeButton} ${mode === 'per-event' ? styles.modeButtonActive : ''}`}
            onClick={() => setMode('per-event')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
            </svg>
            <div>
              <div className={styles.modeTitle}>Per Event</div>
              <div className={styles.modeDesc}>Assign different editors per event</div>
            </div>
          </button>
        </div>

        {mode === 'single' ? (
          <div className={styles.singleEditorSection}>
            <label className={styles.label}>Select Editor</label>
            <SearchableSelect
              id="single-editor-select"
              options={editorOptions}
              value={selectedEditor}
              onChange={(value) => setSelectedEditor(value)}
              placeholder="Select an editor..."
            />
            <p className={styles.helperText}>
              This editor will be assigned to all {events.length} events
            </p>
            
            <div className={styles.eventPreviewSection}>
              <label className={styles.label}>Events ({events.length})</label>
              <div className={styles.eventList}>
                {eventMappings.map((mapping) => {
                  const editorToShow = selectedEditor || mapping.editorId;
                  const currentEditor = teamMembers.find(m => m.memberId === editorToShow);
                  return (
                    <div key={mapping.clientEventId} className={styles.eventRow}>
                      <div className={styles.eventInfo}>
                        <span className={styles.eventName}>{mapping.eventName}</span>
                      </div>
                      <span className={styles.currentEditor}>
                        {currentEditor ? `${currentEditor.firstName} ${currentEditor.lastName}` : 'No editor assigned'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className={styles.perEventSection}>
            <label className={styles.label}>Assign Editor Per Event</label>
            <div className={styles.eventList}>
              {eventMappings.map((mapping) => {
                const currentEditor = teamMembers.find(m => m.memberId === mapping.editorId);
                return (
                  <div key={mapping.clientEventId} className={styles.eventRow}>
                    <div className={styles.eventInfo}>
                      <span className={styles.eventName}>{mapping.eventName}</span>
                      {currentEditor && (
                        <span className={styles.currentEditorSmall}>
                          Current: {currentEditor.firstName} {currentEditor.lastName}
                        </span>
                      )}
                    </div>
                    <div className={styles.eventSelector}>
                      <SearchableSelect
                        id={`event-editor-${mapping.clientEventId}`}
                        options={editorOptions}
                        value={mapping.editorId || ''}
                        onChange={(value) => updateEventEditor(mapping.clientEventId, value)}
                        placeholder="Select editor..."
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {validationError && (
          <div className={styles.validationError}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            {validationError}
          </div>
        )}

        {!isValid && (
          <div className={styles.validationWarning}>
            {getUnassignedCount()} event{getUnassignedCount() !== 1 ? 's' : ''} without an editor assigned
          </div>
        )}

        <div className={styles.actions}>
          <button
            type="button"
            onClick={handleClose}
            disabled={saving}
            className={styles.cancelButton}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !isValid}
            className={styles.saveButton}
          >
            {saving ? 'Saving...' : 'Assign Editor'}
          </button>
        </div>
      </div>
    </Modal>
  );
});

AssignEditorModal.displayName = 'AssignEditorModal';
