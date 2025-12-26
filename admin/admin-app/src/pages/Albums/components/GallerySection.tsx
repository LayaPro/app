import { Loading } from '../../../components/ui';
import type { ImageData } from '../types.ts';
import styles from '../Albums.module.css';

interface GallerySectionProps {
  images: ImageData[];
  isLoading: boolean;
  isLoadingPreviews: boolean;
  loadedGalleryImages: Set<string>;
  selectedImages: Set<string>;
  draggedIndex: number | null;
  dragOverIndex: number | null;
  onImageLoad: (imageId: string) => void;
  onImageClick: (index: number) => void;
  onSelectImage: (imageId: string) => void;
  onSelectAll: () => void;
  onDragStart: (e: React.DragEvent, index: number) => void;
  onDragOver: (e: React.DragEvent, index: number) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent, index: number) => void;
  onDragEnd: () => void;
  onDownload: (image: ImageData) => void;
  onRefresh: () => void;
  onSaveSortOrder: () => void;
  hasUnsavedOrder: boolean;
  isSavingOrder: boolean;
  eventName: string;
}

export const GallerySection: React.FC<GallerySectionProps> = ({
  images,
  isLoading,
  isLoadingPreviews,
  loadedGalleryImages,
  selectedImages,
  draggedIndex,
  dragOverIndex,
  onImageLoad,
  onImageClick,
  onSelectImage,
  onSelectAll,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
  onDownload,
  onRefresh,
  onSaveSortOrder,
  hasUnsavedOrder,
  isSavingOrder,
  eventName
}) => {
  return (
    <>
      <div className={styles.actionsSection}>
        <div className={styles.actionsLeft}>
          <div className={styles.bulkActionsContainer}>
            <button
              className={`${styles.bulkActionsButton} ${selectedImages.size === 0 ? styles.disabled : ''}`}
              disabled={selectedImages.size === 0}
            >
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>Bulk Actions</span>
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>

          <div className={styles.sortContainer}>
            <button className={styles.sortButton}>
              <span>Sort by</span>
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>

          <button
            className={styles.saveSortButton}
            onClick={onSaveSortOrder}
            disabled={!hasUnsavedOrder || isSavingOrder}
            title={hasUnsavedOrder ? "Save custom image order" : "No changes to save"}
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
            </svg>
            {isSavingOrder ? 'Saving...' : 'Save Sort Order'}
          </button>

          <button
            className={styles.refreshButton}
            onClick={onRefresh}
            disabled={isLoading}
            title="Refresh gallery"
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {isLoading ? 'Loading...' : 'Refresh'}
          </button>

          <div className={styles.selectionCounter}>
            <span>{selectedImages.size}</span> / <span>{images.length}</span> selected
          </div>

          <button className={styles.selectAllButton} onClick={onSelectAll}>
            {selectedImages.size === images.length ? 'Deselect All' : 'Select All'}
          </button>
        </div>
      </div>

      <div className={styles.imagesHeader}>
        <h2 className={styles.imagesTitle}>{eventName} ({images.length})</h2>
      </div>

      <div className={styles.imageGrid}>
        {isLoading ? (
          <div className={styles.galleryLoading}>
            <Loading />
            <p>Loading gallery...</p>
          </div>
        ) : images.length === 0 ? (
          <div className={styles.emptyState}>
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <p>No images uploaded yet. Use the upload section above to add images.</p>
          </div>
        ) : isLoadingPreviews ? (
          <>
            <div className={styles.galleryLoading}>
              <Loading />
              <div className={styles.loadingProgress}>
                <div className={styles.uploadProgressBar}>
                  <div
                    className={styles.uploadProgressFill}
                    style={{ width: `${(loadedGalleryImages.size / images.length) * 100}%` }}
                  />
                </div>
                <p>Loading previews: {loadedGalleryImages.size} of {images.length} images</p>
              </div>
            </div>
            <div style={{ display: 'none' }}>
              {images.map((image) => (
                <img
                  key={image.imageId}
                  src={image.compressedUrl || image.originalUrl}
                  alt=""
                  onLoad={() => onImageLoad(image.imageId)}
                  onError={() => onImageLoad(image.imageId)}
                />
              ))}
            </div>
          </>
        ) : (
          images.map((image, index) => (
            <div
              key={image.imageId}
              className={`${styles.imageItem} ${selectedImages.has(image.imageId) ? styles.selectedImage : ''} ${dragOverIndex === index ? styles.dragOver : ''} ${draggedIndex === index ? styles.dragging : ''}`}
              draggable
              onDragStart={(e) => onDragStart(e, index)}
              onDragOver={(e) => onDragOver(e, index)}
              onDragLeave={onDragLeave}
              onDrop={(e) => onDrop(e, index)}
              onDragEnd={onDragEnd}
            >
              <div className={styles.imageCheckbox}>
                <input
                  type="checkbox"
                  checked={selectedImages.has(image.imageId)}
                  onChange={() => onSelectImage(image.imageId)}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
              <button
                className={styles.imageDownloadButton}
                onClick={(e) => {
                  e.stopPropagation();
                  onDownload(image);
                }}
                aria-label="Download image"
              >
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </button>
              <img
                src={image.compressedUrl || image.originalUrl}
                alt={image.fileName || 'Photo'}
                onClick={(e) => {
                  e.stopPropagation();
                  onImageClick(index);
                }}
                style={{ cursor: 'pointer' }}
              />
            </div>
          ))
        )}
      </div>
    </>
  );
};
