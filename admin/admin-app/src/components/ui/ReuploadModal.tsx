import React, { useState, useRef, useEffect } from 'react';
import styles from './ReuploadModal.module.css';

interface UploadError {
  fileName: string;
  message: string;
}

interface ReuploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (files: File[]) => void;
  isLoading?: boolean;
  selectedCount: number;
  errors?: UploadError[];
}

const ReuploadModal: React.FC<ReuploadModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
  selectedCount,
  errors = [],
}) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Clear files when modal closes or on successful upload
  useEffect(() => {
    if (!isOpen || (errors.length === 0 && !isLoading && selectedFiles.length > 0)) {
      setSelectedFiles([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [isOpen, errors, isLoading]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles(files);
  };

  const handleSubmit = () => {
    if (selectedFiles.length === 0) {
      alert('Please select files to upload');
      return;
    }
    
    onSubmit(selectedFiles);
  };

  const handleClose = () => {
    setSelectedFiles([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={handleClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>Re-upload Edited Images</h2>
          <button className={styles.closeButton} onClick={handleClose} disabled={isLoading}>
            ×
          </button>
        </div>
        
        <div className={styles.modalBody}>
          <p className={styles.info}>
            Selected {selectedCount} image{selectedCount !== 1 ? 's' : ''} for re-upload.
            Choose the edited files to replace them.
          </p>
          
          <div className={styles.uploadArea}>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileSelect}
              className={styles.fileInput}
            />
            
            <div className={styles.uploadPrompt}>
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className={styles.uploadIcon}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className={styles.uploadText}>
                {selectedFiles.length === 0 ? (
                  <>
                    Drag and drop files here or <button type="button" onClick={handleBrowseClick} className={styles.browseButton}>browse</button>
                  </>
                ) : (
                  <>
                    {selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''} selected
                    <button type="button" onClick={handleBrowseClick} className={styles.changeButton}>
                      Change
                    </button>
                  </>
                )}
              </p>
            </div>
            
            {selectedFiles.length > 0 && (
              <div className={styles.fileList}>
                {selectedFiles.map((file, index) => (
                  <div key={index} className={styles.fileItem}>
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>{file.name}</span>
                    <span className={styles.fileSize}>
                      {(file.size / (1024 * 1024)).toFixed(2)} MB
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <p className={styles.helpText}>
            <strong>Note:</strong> Files will be matched by filename. Make sure edited files have the same names as the originals.
          </p>

          {/* Error List */}
          {errors.length > 0 && (
            <div className={styles.errorSection}>
              <div className={styles.errorHeader}>
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className={styles.errorIcon}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h4>Upload Errors ({errors.length})</h4>
              </div>
              <div className={styles.errorList}>
                {errors.map((error, index) => (
                  <div key={index} className={styles.errorItem}>
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className={styles.errorItemIcon}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <div className={styles.errorContent}>
                      <span className={styles.errorFileName}>{error.fileName}</span>
                      <span className={styles.errorMessage}>{error.message}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        <div className={styles.modalFooter}>
          <button 
            onClick={handleClose} 
            className={styles.cancelButton}
            disabled={isLoading}
          >
            Cancel
          </button>
          <button 
            onClick={handleSubmit} 
            className={styles.submitButton}
            disabled={isLoading || selectedFiles.length === 0}
          >
            {isLoading ? 'Uploading...' : 'Upload & Replace'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReuploadModal;
