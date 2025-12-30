import type { ChangeEvent, DragEvent, FC, ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';
import { Modal } from './Modal.js';
import styles from './DocumentUploadModal.module.css';

interface DocumentUploadModalProps {
  isOpen: boolean;
  title: string;
  description?: string;
  contextLabel?: string;
  existingFileName?: string;
  existingFileUrl?: string;
  accept?: string;
  maxSizeMb?: number;
  submitLabel?: string;
  cancelLabel?: string;
  isSubmitting?: boolean;
  onClose: () => void;
  onSubmit: (file: File) => Promise<void> | void;
  extraContent?: ReactNode;
}

const DEFAULT_ACCEPT = 'application/pdf';

export const DocumentUploadModal: FC<DocumentUploadModalProps> = ({
  isOpen,
  title,
  description,
  contextLabel,
  existingFileName,
  existingFileUrl,
  accept = DEFAULT_ACCEPT,
  maxSizeMb,
  submitLabel = 'Upload File',
  cancelLabel = 'Cancel',
  isSubmitting = false,
  onClose,
  onSubmit,
  extraContent,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [isDragActive, setIsDragActive] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      resetState();
    }
  }, [isOpen]);

  const resetState = () => {
    setSelectedFile(null);
    setError('');
    setIsDragActive(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;
    resetState();
    onClose();
  };

  const validateFile = (file: File) => {
    const accepted = accept
      .split(',')
      .map((token) => token.trim())
      .filter(Boolean);

    if (accepted.length > 0) {
      const isAllowed = accepted.some((rule) => {
        if (rule.startsWith('.')) {
          return file.name.toLowerCase().endsWith(rule.toLowerCase());
        }
        return file.type === rule;
      });

      if (!isAllowed) {
        return `Only ${accepted.join(', ')} files are allowed.`;
      }
    }

    if (maxSizeMb && file.size > maxSizeMb * 1024 * 1024) {
      return `File must be smaller than ${maxSizeMb} MB.`;
    }

    return '';
  };

  const handleFileSelection = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) {
      setSelectedFile(null);
      return;
    }

    const file = fileList[0];
    const validationMessage = validateFile(file);
    if (validationMessage) {
      setError(validationMessage);
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
    setError('');
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

  const handleConfirm = async () => {
    if (!selectedFile) {
      setError('Please choose a file to upload.');
      return;
    }

    setError('');
    try {
      await onSubmit(selectedFile);
      resetState();
    } catch (err: any) {
      const message = err?.message || 'Failed to upload file. Please try again.';
      setError(message);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={title} size="small">
      <div className={styles.modalBody}>
        {(description || contextLabel || existingFileName || existingFileUrl) && (
          <div className={styles.info}>
            {contextLabel && <span className={styles.contextLabel}>{contextLabel}</span>}
            {description && <div>{description}</div>}
            {maxSizeMb && (
              <div style={{ marginTop: '0.35rem' }}>Max size: {maxSizeMb} MB</div>
            )}
            {existingFileName && (
              <div className={styles.currentFile}>
                Current file: <strong>{existingFileName}</strong>
              </div>
            )}
            {existingFileUrl && (
              <a
                href={existingFileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.currentLink}
              >
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: '16px', height: '16px' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                View current file
              </a>
            )}
          </div>
        )}

        {extraContent}

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
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            onChange={handleFileInputChange}
            disabled={isSubmitting}
          />
        </label>

        {selectedFile && (
          <div className={styles.fileChip}>
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v8m0 0l-3-3m3 3l3-3M5 9V5a2 2 0 012-2h10a2 2 0 012 2v4" />
            </svg>
            <span>{selectedFile.name}</span>
          </div>
        )}

        {error && (
          <div className={styles.error}>
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: '18px', height: '18px' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        <div className={styles.actions}>
          <button
            onClick={handleClose}
            style={{
              padding: '0.6rem 1.2rem',
              border: '1px solid var(--border-color)',
              borderRadius: '0.5rem',
              background: 'transparent',
              color: 'var(--text-primary)',
              fontWeight: 600,
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              opacity: isSubmitting ? 0.6 : 1,
            }}
            disabled={isSubmitting}
          >
            {cancelLabel}
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
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              opacity: isSubmitting ? 0.7 : 1,
            }}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Uploading…' : submitLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
};
