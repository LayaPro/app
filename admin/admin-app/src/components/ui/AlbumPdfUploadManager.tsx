import {
  forwardRef,
  useImperativeHandle,
  useState,
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
  onUploadSuccess?: (albumPdf: any) => void;
}

type ModalMode = 'upload-all' | null;

interface PdfMapping {
  id: string;
  eventIds: string[];
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
      onUploadSuccess,
    },
    ref
  ) => {
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [existingPdfsInfo, setExistingPdfsInfo] = useState<any[]>([]);

    const handleExistingFound = async (checkResponse: any, _eventIds: string[]) => {
      return new Promise<boolean>((resolve) => {
        setExistingPdfsInfo(checkResponse.albumPdfs || []);
        setShowConfirmModal(true);
        
        // Store resolve function for later use
        (window as any).__albumPdfConfirmResolve = resolve;
      });
    };

    const handleConfirmReplace = () => {
      setShowConfirmModal(false);
      if ((window as any).__albumPdfConfirmResolve) {
        (window as any).__albumPdfConfirmResolve(true);
        delete (window as any).__albumPdfConfirmResolve;
      }
    };

    const handleCancelReplace = () => {
      setShowConfirmModal(false);
      setExistingPdfsInfo([]);
      if ((window as any).__albumPdfConfirmResolve) {
        (window as any).__albumPdfConfirmResolve(false);
        delete (window as any).__albumPdfConfirmResolve;
      }
    };

    const { isUploading, isChecking, uploadAlbumPdfBatch } = useAlbumPdfUpload({ 
      onUploadSuccess,
      onExistingFound: handleExistingFound,
    });

    const [modalMode, setModalMode] = useState<ModalMode>(null);
    const [pdfMappings, setPdfMappings] = useState<PdfMapping[]>([]);

    const createNewMapping = (): PdfMapping => ({
      id: `mapping-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      eventIds: [],
      file: null,
      error: '',
    });

    const resetState = () => {
      setPdfMappings([createNewMapping()]);
    };

    const closeModal = () => {
      if (isUploading || isChecking) return;
      setModalMode(null);
      resetState();
    };

    const openModal = () => {
      setModalMode('upload-all');
      resetState();
    };

    useImperativeHandle(ref, () => ({
      openForEvent: () => openModal(),
      openBulk: () => openModal(),
    }));

    const addNewMapping = () => {
      setPdfMappings([...pdfMappings, createNewMapping()]);
    };

    const removeMapping = (id: string) => {
      if (pdfMappings.length > 1) {
        setPdfMappings(pdfMappings.filter(m => m.id !== id));
      }
    };

    const updateMappingEvents = (id: string, eventIds: string[]) => {
      setPdfMappings(pdfMappings.map(m => 
        m.id === id ? { ...m, eventIds, error: '' } : m
      ));
    };

    const updateMappingFile = (id: string, file: File | null) => {
      setPdfMappings(pdfMappings.map(m => 
        m.id === id ? { ...m, file, error: '' } : m
      ));
    };

    const handleFileSelect = (id: string, file: File | null) => {
      if (!file) {
        updateMappingFile(id, null);
        return;
      }

      if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        setPdfMappings(pdfMappings.map(m => 
          m.id === id ? { ...m, error: `File exceeds ${MAX_SIZE_MB} MB limit` } : m
        ));
        return;
      }

      if (file.type !== 'application/pdf') {
        setPdfMappings(pdfMappings.map(m => 
          m.id === id ? { ...m, error: 'Only PDF files are allowed' } : m
        ));
        return;
      }

      updateMappingFile(id, file);
    };

    const validateAndUpload = async () => {
      // Validate all mappings
      let hasError = false;
      const updatedMappings = pdfMappings.map(mapping => {
        if (!mapping.file) {
          hasError = true;
          return { ...mapping, error: 'Please select a PDF file' };
        }
        if (mapping.eventIds.length === 0) {
          hasError = true;
          return { ...mapping, error: 'Please select at least one event' };
        }
        return mapping;
      });

      if (hasError) {
        setPdfMappings(updatedMappings);
        return;
      }

      // Check for duplicate events
      const allEventIds = pdfMappings.flatMap(m => m.eventIds);
      const duplicates = allEventIds.filter((id, index) => allEventIds.indexOf(id) !== index);
      if (duplicates.length > 0) {
        setPdfMappings(pdfMappings.map((m, index) => 
          index === 0 ? { ...m, error: 'Some events are selected in multiple PDFs' } : m
        ));
        return;
      }

      // Upload all PDFs in one batch request
      if (!selectedProject) return;

      try {
        const mappings = pdfMappings
          .filter(m => m.file && m.eventIds.length > 0)
          .map(m => ({
            eventIds: m.eventIds,
            file: m.file!
          }));

        await uploadAlbumPdfBatch({
          projectId: selectedProject.projectId,
          mappings,
        });
        
        closeModal();
      } catch (error) {
        // Error already handled by the hook
      }
    };

    const getAvailableEvents = (currentMappingId: string) => {
      const usedEventIds = pdfMappings
        .filter(m => m.id !== currentMappingId)
        .flatMap(m => m.eventIds);
      return events.filter(e => !usedEventIds.includes(e.clientEventId));
    };

    const renderModal = () => {
      if (modalMode !== 'upload-all') return null;

      return (
        <Modal isOpen={true} onClose={closeModal} title="Upload Album PDFs for All Events" size="large">
          <div className={styles.modalBody}>
            <div className={styles.info}>
              <span className={styles.contextLabel}>{selectedProject?.projectName || 'Project'}</span>
              <div style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                Upload PDFs for all events at once. You can assign one PDF to multiple events or upload separate PDFs for each event.
              </div>
              <div style={{ marginTop: '0.35rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                Max size per file: {MAX_SIZE_MB} MB
              </div>
            </div>

            <div style={{ marginTop: '1.5rem' }}>
              {pdfMappings.map((mapping, index) => {
                const availableEvents = getAvailableEvents(mapping.id);
                const eventOptions = availableEvents.map(evt => ({
                  value: evt.clientEventId,
                  label: getEventLabel(evt, eventTypes)
                }));

                return (
                  <div key={mapping.id} style={{
                    padding: '1rem',
                    border: '1px solid var(--border-color)',
                    borderRadius: '0.5rem',
                    marginBottom: '1rem',
                    background: 'var(--background-secondary)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>
                        PDF #{index + 1}
                      </div>
                      {pdfMappings.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeMapping(mapping.id)}
                          disabled={isUploading || isChecking}
                          style={{
                            padding: '0.4rem 0.8rem',
                            fontSize: '0.85rem',
                            border: '1px solid #dc2626',
                            borderRadius: '0.375rem',
                            background: 'transparent',
                            color: '#dc2626',
                            cursor: 'pointer',
                            fontWeight: 600
                          }}
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>
                        Select Events
                      </label>
                      <MultiSelect
                        value={mapping.eventIds}
                        onChange={(eventIds) => updateMappingEvents(mapping.id, eventIds)}
                        options={eventOptions}
                        placeholder="Choose events for this PDF"
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>
                        Upload PDF File
                      </label>
                      <input
                        type="file"
                        accept={ACCEPT}
                        onChange={(e) => handleFileSelect(mapping.id, e.target.files?.[0] || null)}
                        disabled={isUploading || isChecking}
                        style={{
                          display: 'block',
                          width: '100%',
                          padding: '0.5rem',
                          border: '1px solid var(--border-color)',
                          borderRadius: '0.375rem',
                          fontSize: '0.9rem'
                        }}
                      />
                      {mapping.file && (
                        <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                          Selected: {mapping.file.name}
                        </div>
                      )}
                    </div>

                    {mapping.error && (
                      <div style={{
                        marginTop: '0.75rem',
                        padding: '0.5rem',
                        background: '#fee2e2',
                        border: '1px solid #ef4444',
                        borderRadius: '0.375rem',
                        color: '#991b1b',
                        fontSize: '0.875rem'
                      }}>
                        {mapping.error}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              onClick={addNewMapping}
              disabled={isUploading || isChecking || pdfMappings.flatMap(m => m.eventIds).length >= events.length}
              style={{
                padding: '0.6rem 1rem',
                border: '1px dashed var(--border-color)',
                borderRadius: '0.5rem',
                background: 'transparent',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                width: '100%',
                fontWeight: 600,
                fontSize: '0.9rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                marginBottom: '1.5rem'
              }}
            >
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: '20px', height: '20px' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Another PDF
            </button>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                onClick={closeModal}
                disabled={isUploading || isChecking}
                style={{
                  padding: '0.6rem 1.2rem',
                  border: '1px solid var(--border-color)',
                  borderRadius: '0.5rem',
                  background: 'transparent',
                  color: 'var(--text-primary)',
                  fontWeight: 600,
                  cursor: (isUploading || isChecking) ? 'not-allowed' : 'pointer',
                  opacity: (isUploading || isChecking) ? 0.6 : 1,
                }}
              >
                Cancel
              </button>
              <button
                onClick={validateAndUpload}
                disabled={isUploading || isChecking}
                style={{
                  padding: '0.6rem 1.2rem',
                  borderRadius: '0.5rem',
                  border: 'none',
                  background: '#6366f1',
                  color: 'white',
                  fontWeight: 600,
                  cursor: (isUploading || isChecking) ? 'not-allowed' : 'pointer',
                  opacity: (isUploading || isChecking) ? 0.7 : 1,
                }}
              >
                {isChecking ? 'Checking...' : isUploading ? 'Uploading...' : 'Upload All PDFs'}
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
            <button type="button" className={styles.triggerButton} onClick={openModal} disabled={isUploading || isChecking}>
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Upload PDF Album</span>
            </button>
          </div>
        )}
        {renderModal()}
        
        {/* Confirmation Modal for Existing PDFs */}
        {showConfirmModal && existingPdfsInfo.length > 0 && (
          <Modal isOpen={showConfirmModal} onClose={handleCancelReplace} title="Album PDFs Already Exist">
            <div style={{ padding: '1rem' }}>
              <div style={{ 
                marginBottom: '1rem',
                padding: '0.75rem',
                background: '#fef3c7',
                border: '1px solid #fbbf24',
                borderRadius: '0.5rem'
              }}>
                <div style={{ fontWeight: 600, color: '#92400e', marginBottom: '0.5rem' }}>
                  ⚠️ Warning: All Existing PDFs Will Be Deleted
                </div>
                <div style={{ fontSize: '0.875rem', color: '#78350f' }}>
                  {existingPdfsInfo.length} album PDF{existingPdfsInfo.length > 1 ? 's' : ''} currently exist for this project.
                </div>
              </div>

              <p style={{ marginBottom: '1rem', color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                Uploading a new album PDF will <strong>delete all existing PDFs</strong> for this project. You'll need to upload fresh PDFs for all events you want to include.
              </p>
              
              <div style={{ 
                marginBottom: '1rem',
                maxHeight: '200px',
                overflowY: 'auto',
                border: '1px solid var(--border-color)',
                borderRadius: '0.5rem',
                padding: '0.5rem'
              }}>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
                  Current PDFs to be deleted:
                </div>
                {existingPdfsInfo.map((pdf: any, index: number) => (
                  <div key={pdf.albumId || index} style={{ 
                    padding: '0.5rem',
                    marginBottom: '0.5rem',
                    background: 'var(--background-secondary)',
                    borderRadius: '0.25rem',
                    fontSize: '0.875rem'
                  }}>
                    <div style={{ fontWeight: 600 }}>{pdf.albumPdfFileName}</div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                      Events: {pdf.eventIds?.length || 0} • Uploaded: {new Date(pdf.uploadedDate).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
              
              <p style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                Do you want to continue? This action cannot be undone.
              </p>
              
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button
                  onClick={handleCancelReplace}
                  style={{
                    padding: '0.6rem 1.2rem',
                    border: '1px solid var(--border-color)',
                    borderRadius: '0.5rem',
                    background: 'transparent',
                    color: 'var(--text-primary)',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmReplace}
                  style={{
                    padding: '0.6rem 1.2rem',
                    borderRadius: '0.5rem',
                    border: 'none',
                    background: '#dc2626',
                    color: 'white',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Delete All & Upload New
                </button>
              </div>
            </div>
          </Modal>
        )}
      </>
    );
  }
);

AlbumPdfUploadManager.displayName = 'AlbumPdfUploadManager';