import { Loading } from '../../../components/ui';
import styles from '../Albums.module.css';

interface UploadedImage {
  id: string;
  url: string;
  file?: File;
}

interface UploadSectionProps {
  isExpanded: boolean;
  onToggle: () => void;
  uploadedImages: UploadedImage[];
  isUploading: boolean;
  uploadedCount: number;
  failedImages: Set<string>;
  fileInputRef: React.RefObject<HTMLInputElement>;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onCancel: () => void;
  onUpload: () => void;
}

export const UploadSection: React.FC<UploadSectionProps> = ({
  isExpanded,
  onToggle,
  uploadedImages,
  isUploading,
  uploadedCount,
  failedImages,
  fileInputRef,
  onFileSelect,
  onCancel,
  onUpload
}) => {
  const hasFailedImages = failedImages.size > 0;
  const failedImagesList = uploadedImages.filter(img => failedImages.has(img.id));

  return (
    <div className={`${styles.uploadContainer} ${isExpanded ? styles.uploadContainerExpanded : ''}`}>
      <button onClick={onToggle} className={styles.uploadHeader}>
        <div className={styles.uploadHeaderLeft}>
          <svg
            className={`${styles.uploadChevron} ${isExpanded ? styles.uploadChevronExpanded : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
          <div className={styles.uploadHeaderIcon}>
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
          </div>
          <div className={styles.uploadHeaderText}>
            <h3>Upload New Images</h3>
            <p>
              {isExpanded
                ? 'Drag and drop files or click Choose Files'
                : 'Click to expand upload area'}
            </p>
          </div>
        </div>
        <div className={styles.uploadHeaderRight}>
          {uploadedImages.length > 0 && (
            <span className={styles.uploadCount}>{uploadedImages.length} images selected</span>
          )}
        </div>
      </button>

      {isExpanded && (
        <div className={styles.uploadContent}>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={onFileSelect}
            style={{ display: 'none' }}
          />

          {uploadedImages.length === 0 ? (
            <div className={styles.uploadDropzone} onClick={() => fileInputRef.current?.click()}>
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              <p>Drop images here or click to browse</p>
              <span>Support for multiple image files</span>
            </div>
          ) : (
            <>
              {hasFailedImages && (
                <div className={styles.failedImagesNotice}>
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <div>
                    <strong>Failed to upload {failedImages.size} image(s):</strong>
                    <ul>
                      {failedImagesList.map(img => (
                        <li key={img.id}>{img.file?.name || 'Unknown file'}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {isUploading && (
                <div className={styles.uploadProgress}>
                  <div className={styles.uploadProgressBar}>
                    <div
                      className={styles.uploadProgressFill}
                      style={{ width: `${(uploadedCount / uploadedImages.length) * 100}%` }}
                    />
                  </div>
                  <p>{Math.round((uploadedCount / uploadedImages.length) * 100)}% complete</p>
                </div>
              )}

              <div className={styles.uploadPreviewGrid}>
                {uploadedImages.map((image) => (
                  <div
                    key={image.id}
                    className={`${styles.uploadPreviewItem} ${
                      failedImages.has(image.id) ? styles.failedImage : ''
                    }`}
                  >
                    <img src={image.url} alt="Upload preview" />
                    {failedImages.has(image.id) && (
                      <div className={styles.failedBadge}>Failed</div>
                    )}
                  </div>
                ))}
              </div>

              <div className={styles.uploadActions}>
                <button onClick={onCancel} className={styles.cancelButton} disabled={isUploading}>
                  Cancel
                </button>
                <button onClick={() => fileInputRef.current?.click()} className={styles.addMoreButton}>
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add More
                </button>
                <button onClick={onUpload} className={styles.uploadButton} disabled={isUploading}>
                  {isUploading ? (
                    <>
                      <Loading size="small" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                        />
                      </svg>
                      Upload Images
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
