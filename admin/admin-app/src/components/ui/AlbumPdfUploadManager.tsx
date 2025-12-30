import {
  forwardRef,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { ClientEventSummary as ClientEvent, ProjectSummary as Project } from '../../types/albums.js';
import { Modal } from './Modal.js';
import { MultiSelect } from './MultiSelect.js';
import { useAlbumPdfUpload } from '../../hooks/useAlbumPdfUpload.js';
import styles from './AlbumPdfUploadManager.module.css';

export interface AlbumPdfUploadManagerHandle {
  openForEvent: (event: ClientEvent) => void;
  openBulk: () => void;
}

interface AlbumPdfUploadManagerProps {
  selectedProject: Project | null;
  events: ClientEvent[];
  eventTypes: Map<string, any>;
  setEvents: Dispatch<SetStateAction<ClientEvent[]>>;
  setAllEvents: Dispatch<SetStateAction<ClientEvent[]>>;
  setSelectedEvent: Dispatch<SetStateAction<ClientEvent | null>>;
  showBulkTrigger?: boolean;
}

type ModalMode = 'single' | 'bulk' | null;
type BulkUploadMode = 'shared' | 'per-event';

interface PerEventEntry {
  id: string;
  eventId: string;
  file: File | null;
  error?: string;
}

const ACCEPT = 'application/pdf';
const MAX_SIZE_MB = 200;

const getEventLabel = (event: ClientEvent, eventTypes: Map<string, any>) => {
  const eventName = eventTypes.get(event.eventId)?.eventDesc || 'Event';
  const formattedDate = event.fromDatetime
    ? new Date(event.fromDatetime).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'No date';
  return `${eventName} • ${formattedDate}`;
};

export const AlbumPdfUploadManager = forwardRef<AlbumPdfUploadManagerHandle, AlbumPdfUploadManagerProps>(
  (
    {
      selectedProject,
      events,
      eventTypes,
      setEvents,
      setAllEvents,
      setSelectedEvent,
      showBulkTrigger = true,
    },
    ref
  ) => {
    const { isUploading, uploadAlbumPdf } = useAlbumPdfUpload({ setEvents, setAllEvents, setSelectedEvent });
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [modalMode, setModalMode] = useState<ModalMode>(null);
    const [focusedEvent, setFocusedEvent] = useState<ClientEvent | null>(null);
    const [primaryFile, setPrimaryFile] = useState<File | null>(null);
    const [primaryFileError, setPrimaryFileError] = useState('');
    const [bulkSelection, setBulkSelection] = useState<string[]>([]);
    const [bulkSelectionError, setBulkSelectionError] = useState('');
    const [bulkUploadMode, setBulkUploadMode] = useState<BulkUploadMode>('shared');
    const [perEventEntries, setPerEventEntries] = useState<PerEventEntry[]>([]);
    const [isDragActive, setIsDragActive] = useState(false);

    const createPerEventEntry = (): PerEventEntry => ({
      id: `entry-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      eventId: '',
      file: null,
      error: '',
    });

    const resetPrimaryFileState = () => {
      setPrimaryFile(null);
      setPrimaryFileError('');
      setIsDragActive(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };

    const resetPerEventEntries = () => {
      setPerEventEntries([]);
    };

    const closeModal = () => {
      if (isUploading) return;
      setModalMode(null);
      setFocusedEvent(null);
      setBulkSelection([]);
      setBulkSelectionError('');
      setBulkUploadMode('shared');
      resetPrimaryFileState();
      resetPerEventEntries();
    };

    const openSingleModal = (event: ClientEvent) => {
      setFocusedEvent(event);
      setModalMode('single');
      setBulkSelection([]);
      setBulkSelectionError('');
      setBulkUploadMode('shared');
      resetPrimaryFileState();
      resetPerEventEntries();
    };

    const openBulkModal = () => {
      if (!selectedProject || events.length === 0) return;
      setModalMode('bulk');
      setFocusedEvent(null);
      setBulkSelection(events.map((evt) => evt.clientEventId));
      setBulkSelectionError('');
      setBulkUploadMode('shared');
      resetPrimaryFileState();
      setPerEventEntries([createPerEventEntry()]);
    };

    useImperativeHandle(ref, () => ({
      openForEvent: (event: ClientEvent) => {
        openSingleModal(event);
      },
      openBulk: () => {
        openBulkModal();
      }
    }));

    const bulkOptions = useMemo(
      () =>
        events.map((evt) => ({
          value: evt.clientEventId,
          label: getEventLabel(evt, eventTypes),
        })),
      [events, eventTypes]
    );

    const getEventLabelById = (clientEventId: string) => {
      const event = events.find((evt) => evt.clientEventId === clientEventId);
      return event ? getEventLabel(event, eventTypes) : 'Selected event';
    };

    const validateFile = (file: File) => {
      if (file.type !== ACCEPT) {
        return 'Only PDF files are allowed.';
      }

      if (MAX_SIZE_MB && file.size > MAX_SIZE_MB * 1024 * 1024) {
        return `File must be smaller than ${MAX_SIZE_MB} MB.`;
      }

      return '';
    };

    const handleFileSelection = (fileList: FileList | null) => {
      if (!fileList || fileList.length === 0) {
        setPrimaryFile(null);
        return;
      }

      const file = fileList[0];
      const validationMessage = validateFile(file);
      if (validationMessage) {
        setPrimaryFileError(validationMessage);
        setPrimaryFile(null);
        return;
      }

      setPrimaryFile(file);
      setPrimaryFileError('');
    };

    const handleFileInputChange = (event: ChangeEvent<HTMLInputElement>) => {
      handleFileSelection(event.target.files);
      if (event.target) {
        event.target.value = '';
      }
    };

    const handleDrop = (event: DragEvent<HTMLLabelElement>) => {
      event.preventDefault();
      setIsDragActive(false);
      handleFileSelection(event.dataTransfer.files);
    };

    const handleBulkModeChange = (mode: BulkUploadMode) => {
      if (mode === bulkUploadMode) return;
      setBulkUploadMode(mode);
      if (mode === 'per-event') {
        resetPrimaryFileState();
        setPerEventEntries((prev) => (prev.length ? prev : [createPerEventEntry()]));
      } else {
        resetPerEventEntries();
      }
    };

    const updatePerEventEntry = (entryId: string, updater: (entry: PerEventEntry) => PerEventEntry) => {
      setPerEventEntries((prev) => prev.map((entry) => (entry.id === entryId ? updater(entry) : entry)));
    };

    const handlePerEventEventChange = (entryId: string, eventId: string) => {
      updatePerEventEntry(entryId, (entry) => ({
        ...entry,
        eventId,
        error: entry.error && eventId ? '' : entry.error,
      }));
    };

    const handlePerEventFileSelection = (entryId: string, fileList: FileList | null) => {
      if (!fileList || fileList.length === 0) {
        updatePerEventEntry(entryId, (entry) => ({ ...entry, file: null }));
        return;
      }

      const file = fileList[0];
      const validationMessage = validateFile(file);
      if (validationMessage) {
        updatePerEventEntry(entryId, (entry) => ({ ...entry, file: null, error: validationMessage }));
        return;
      }

      updatePerEventEntry(entryId, (entry) => ({ ...entry, file, error: '' }));
    };

    const handleAddPerEventEntry = () => {
      if (perEventEntries.length >= events.length) return;
      setPerEventEntries((prev) => [...prev, createPerEventEntry()]);
    };

    const handleRemovePerEventEntry = (entryId: string) => {
      setPerEventEntries((prev) => prev.filter((entry) => entry.id !== entryId));
    };

    const getAvailableOptionsForEntry = (entryId: string) => {
      const takenEventIds = perEventEntries
        .filter((entry) => entry.id !== entryId)
        .map((entry) => entry.eventId)
        .filter(Boolean);
      return bulkOptions.filter((option) => !takenEventIds.includes(option.value));
    };

    const description =
      "Upload a finalized album PDF (max 200 MB).";

    const renderInfoBlock = () => {
      if (modalMode === 'single' && focusedEvent) {
        const eventName = eventTypes.get(focusedEvent.eventId)?.eventDesc || 'Selected event';
        return (
          <div className={styles.info}>
            <span className={styles.contextLabel}>{eventName}</span>
            <div>{description}</div>
            <div style={{ marginTop: '0.35rem' }}>Max size: {MAX_SIZE_MB} MB</div>
            {focusedEvent.albumPdfFileName && (
              <div className={styles.currentFile}>
                Current file: <strong>{focusedEvent.albumPdfFileName}</strong>
              </div>
            )}
            {focusedEvent.albumPdfUrl && (
              <a
                href={focusedEvent.albumPdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.currentLink}
              >
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: '16px', height: '16px' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                View current PDF
              </a>
            )}
          </div>
        );
      }

      if (modalMode === 'bulk' && selectedProject) {
        return (
          <div className={styles.info}>
            <span className={styles.contextLabel}>{selectedProject.projectName}</span>
            <div>{description}</div>
            <div style={{ marginTop: '0.35rem' }}>Max size: {MAX_SIZE_MB} MB</div>
          </div>
        );
      }

      return null;
    };

    const validatePerEventEntries = () => {
      let hasError = false;
      setPerEventEntries((prev) =>
        prev.map((entry) => {
          let error = '';
          if (!entry.eventId) {
            error = 'Select an event for this PDF.';
          } else if (!entry.file) {
            error = 'Attach a PDF file for this event.';
          }
          if (!error && entry.error) {
            error = entry.error;
          }
          if (error) {
            hasError = true;
          }
          return { ...entry, error };
        })
      );
      return hasError;
    };

    const handleSharedConfirm = async () => {
      if (!primaryFile) {
        setPrimaryFileError('Please choose a file to upload.');
        return;
      }

      if (modalMode === 'bulk') {
        if (!bulkSelection.length) {
          setBulkSelectionError('Select at least one event to continue.');
          return;
        }
        if (!selectedProject) {
          setPrimaryFileError('Select a project before uploading.');
          return;
        }

        await uploadAlbumPdf({
          projectId: selectedProject.projectId,
          eventIds: bulkSelection,
          file: primaryFile,
          successMessage: `Album PDF applied to ${bulkSelection.length} event${bulkSelection.length === 1 ? '' : 's'}.`,
        });
        closeModal();
        return;
      }

      if (modalMode === 'single') {
        if (!focusedEvent) {
          setPrimaryFileError('No event selected. Please try again.');
          return;
        }

        await uploadAlbumPdf({
          projectId: focusedEvent.projectId,
          eventIds: [focusedEvent.clientEventId],
          file: primaryFile,
          successMessage: 'Album PDF uploaded successfully.',
        });
        closeModal();
      }
    };

    const handlePerEventConfirm = async () => {
      if (!selectedProject) {
        setPrimaryFileError('Select a project before uploading.');
        return;
      }

      if (!perEventEntries.length) {
        setPerEventEntries([createPerEventEntry()]);
        return;
      }

      const hasErrors = validatePerEventEntries();
      if (hasErrors) {
        return;
      }

      for (const entry of perEventEntries) {
        if (!entry.eventId || !entry.file) {
          continue;
        }
        try {
          await uploadAlbumPdf({
            projectId: selectedProject.projectId,
            eventIds: [entry.eventId],
            file: entry.file,
            successMessage: `Album PDF uploaded for ${getEventLabelById(entry.eventId)}.`,
          });
        } catch (error: any) {
          const message = error?.message || 'Failed to upload album PDF.';
          setPerEventEntries((prev) =>
            prev.map((item) => (item.id === entry.id ? { ...item, error: message } : item))
          );
          throw error;
        }
      }

      closeModal();
    };

    const handleConfirm = async () => {
      try {
        if (modalMode === 'bulk' && bulkUploadMode === 'per-event') {
          await handlePerEventConfirm();
          return;
        }

        await handleSharedConfirm();
      } catch (error: any) {
        if (modalMode !== 'bulk' || bulkUploadMode !== 'per-event') {
          setPrimaryFileError(error?.message || 'Failed to upload album PDF.');
        }
      }
    };

    const renderPerEventEntries = () => {
      const canAddEntry = perEventEntries.length < events.length;

      return (
        <div className={styles.perEventSection}>
          <div className={styles.perEventHeader}>
            <div>
              <strong>Upload individual PDFs</strong>
              <div className={styles.bulkHelper}>Match each event with its corresponding PDF file.</div>
            </div>
            <button
              type="button"
              className={styles.addEntryButton}
              onClick={handleAddPerEventEntry}
              disabled={!canAddEntry || isUploading}
            >
              Add event PDF
            </button>
          </div>
          <div className={styles.perEventList}>
            {perEventEntries.map((entry) => {
              const inputId = `${entry.id}-file`;
              const availableOptions = getAvailableOptionsForEntry(entry.id);
              return (
                <div key={entry.id} className={styles.perEventRow}>
                  <div className={styles.perEventControls}>
                    <div className={styles.perEventField}>
                      <label>Event</label>
                      <select
                        value={entry.eventId}
                        onChange={(e) => handlePerEventEventChange(entry.id, e.target.value)}
                        disabled={isUploading}
                      >
                        <option value="">Select event</option>
                        {availableOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className={styles.perEventField}>
                      <label>PDF File</label>
                      <label htmlFor={inputId} className={styles.fileButton}>
                        {entry.file ? 'Replace PDF' : 'Choose PDF'}
                      </label>
                      <input
                        id={inputId}
                        type="file"
                        accept={ACCEPT}
                        className={styles.hiddenFileInput}
                        onChange={(e) => handlePerEventFileSelection(entry.id, e.target.files)}
                        disabled={isUploading}
                      />
                      {entry.file && <span className={styles.fileName}>{entry.file.name}</span>}
                    </div>
                    {perEventEntries.length > 1 && (
                      <button
                        type="button"
                        className={styles.removeEntryButton}
                        onClick={() => handleRemovePerEventEntry(entry.id)}
                        disabled={isUploading}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  {entry.error && <div className={styles.selectionError}>{entry.error}</div>}
                </div>
              );
            })}
          </div>
        </div>
      );
    };

    const shouldShowDropzone = modalMode === 'single' || (modalMode === 'bulk' && bulkUploadMode === 'shared');
    const isBulk = modalMode === 'bulk';
    const modalTitle = 'Upload Album PDF';

    const renderModal = () => {
      if (!modalMode) return null;

      return (
        <Modal isOpen={true} onClose={closeModal} title={modalTitle} size="large">
          <div className={styles.modalBody}>
            {renderInfoBlock()}

            {isBulk && (
              <>
                <div className={styles.bulkModeToggle}>
                  <button
                    type="button"
                    className={`${styles.modeButton} ${bulkUploadMode === 'shared' ? styles.modeButtonActive : ''}`}
                    onClick={() => handleBulkModeChange('shared')}
                  >
                    <span>Use same PDF for many events</span>
                    <small>Choose multiple events and upload one PDF album</small>
                  </button>
                  <button
                    type="button"
                    className={`${styles.modeButton} ${bulkUploadMode === 'per-event' ? styles.modeButtonActive : ''}`}
                    onClick={() => handleBulkModeChange('per-event')}
                  >
                    <span>Upload event-wise album PDFs</span>
                    <small>Upload different files for each event</small>
                  </button>
                </div>

                {bulkUploadMode === 'shared' ? (
                  <div className={styles.bulkSelector}>
                    <div className={styles.bulkHeader}>
                      <div>
                        <strong>Apply to events</strong>
                        <div className={styles.bulkHelper}>Select specific events or include all of them.</div>
                      </div>
                      <button
                        type="button"
                        className={styles.selectAll}
                        onClick={() => {
                          setBulkSelection(events.map((evt) => evt.clientEventId));
                          setBulkSelectionError('');
                        }}
                        disabled={isUploading}
                      >
                        Select all
                      </button>
                    </div>
                    <MultiSelect
                      value={bulkSelection}
                      onChange={(value) => {
                        setBulkSelection(value);
                        if (value.length > 0) {
                          setBulkSelectionError('');
                        }
                      }}
                      options={bulkOptions}
                      placeholder="Choose event(s)"
                    />
                    {bulkSelectionError && <div className={styles.selectionError}>{bulkSelectionError}</div>}
                  </div>
                ) : (
                  renderPerEventEntries()
                )}
              </>
            )}

            {shouldShowDropzone && (
              <label
                className={`${styles.dropzone} ${isDragActive ? styles.dropzoneActive : ''}`}
                onDragOver={(event) => {
                  event.preventDefault();
                  event.dataTransfer.dropEffect = 'copy';
                  setIsDragActive(true);
                }}
                onDragLeave={() => setIsDragActive(false)}
                onDrop={handleDrop}
              >
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7v10a2 2 0 002 2h6a2 2 0 002-2V9l-4-4H9a2 2 0 00-2 2z" />
                </svg>
                <span>Choose a file to upload</span>
                <small>Drag & drop or click to browse your computer</small>
                <input ref={fileInputRef} type="file" accept={ACCEPT} onChange={handleFileInputChange} disabled={isUploading} />
              </label>
            )}

            {primaryFile && shouldShowDropzone && (
              <div className={styles.fileChip}>
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v8m0 0l-3-3m3 3l3-3M5 9V5a2 2 0 012-2h10a2 2 0 012 2v4" />
                </svg>
                <span>{primaryFile.name}</span>
              </div>
            )}

            {primaryFileError && shouldShowDropzone && (
              <div className={styles.error}>
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: '18px', height: '18px' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{primaryFileError}</span>
              </div>
            )}

            <div className={styles.actions}>
              <button
                onClick={closeModal}
                style={{
                  padding: '0.6rem 1.2rem',
                  border: '1px solid var(--border-color)',
                  borderRadius: '0.5rem',
                  background: 'transparent',
                  color: 'var(--text-primary)',
                  fontWeight: 600,
                  cursor: isUploading ? 'not-allowed' : 'pointer',
                  opacity: isUploading ? 0.6 : 1,
                }}
                disabled={isUploading}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                style={{
                  padding: '0.6rem 1.2rem',
                  borderRadius: '0.5rem',
                  border: 'none',
                  background: '#6366f1',
                  color: 'white',
                  fontWeight: 600,
                  cursor: isUploading ? 'not-allowed' : 'pointer',
                  opacity: isUploading ? 0.7 : 1,
                }}
                disabled={isUploading}
              >
                {isUploading
                  ? 'Uploading…'
                  : modalMode === 'bulk'
                    ? bulkUploadMode === 'per-event'
                      ? 'Upload PDFs'
                      : 'Apply to Events'
                    : 'Upload PDF'}
              </button>
            </div>
          </div>
        </Modal>
      );
    };

    const shouldShowTrigger = showBulkTrigger && selectedProject && events.length > 0;

    return (
      <>
        {shouldShowTrigger && (
          <div className={styles.headerActions}>
            <button type="button" className={styles.triggerButton} onClick={openBulkModal} disabled={isUploading}>
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Upload PDF Album</span>
            </button>
          </div>
        )}
        {renderModal()}
      </>
    );
  }
);

AlbumPdfUploadManager.displayName = 'AlbumPdfUploadManager';