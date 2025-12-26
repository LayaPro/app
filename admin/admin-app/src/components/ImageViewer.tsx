import React, { useEffect, useCallback } from 'react';
import styles from './ImageViewer.module.css';

interface ImageViewerProps {
  images: Array<{
    url: string;
    originalUrl: string;
    filename: string;
  }>;
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (newIndex: number) => void;
}

const ImageViewer: React.FC<ImageViewerProps> = ({
  images,
  currentIndex,
  isOpen,
  onClose,
  onNavigate,
}) => {
  const currentImage = images[currentIndex];

  const handlePrevious = useCallback(() => {
    const newIndex = currentIndex === 0 ? images.length - 1 : currentIndex - 1;
    onNavigate(newIndex);
  }, [currentIndex, images.length, onNavigate]);

  const handleNext = useCallback(() => {
    const newIndex = currentIndex === images.length - 1 ? 0 : currentIndex + 1;
    onNavigate(newIndex);
  }, [currentIndex, images.length, onNavigate]);

  const handleDownload = useCallback(async () => {
    if (!currentImage) return;

    try {
      const response = await fetch(currentImage.originalUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = currentImage.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
    }
  }, [currentImage]);

  // Preload adjacent images for smooth navigation
  useEffect(() => {
    if (!isOpen) return;

    const preloadImage = (url: string) => {
      const img = new Image();
      img.src = url;
    };

    // Preload previous image
    const prevIndex = currentIndex === 0 ? images.length - 1 : currentIndex - 1;
    if (images[prevIndex]) {
      preloadImage(images[prevIndex].url);
    }

    // Preload next image
    const nextIndex = currentIndex === images.length - 1 ? 0 : currentIndex + 1;
    if (images[nextIndex]) {
      preloadImage(images[nextIndex].url);
    }
  }, [isOpen, currentIndex, images]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          handlePrevious();
          break;
        case 'ArrowRight':
          handleNext();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    
    // Prevent background scroll
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose, handlePrevious, handleNext]);

  if (!isOpen || !currentImage) return null;

  return (
    <div className={styles.viewer}>
      <div className={styles.backdrop} onClick={onClose} />
      
      <div className={styles.container}>
        {/* Close Button */}
        <button
          onClick={onClose}
          className={`${styles.button} ${styles.closeButton}`}
          aria-label="Close viewer"
        >
          <svg
            className={styles.icon}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {/* Download Button */}
        <button
          onClick={handleDownload}
          className={`${styles.button} ${styles.downloadButton}`}
          aria-label="Download image"
        >
          <svg
            className={styles.icon}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
        </button>

        {/* Previous Button */}
        <button
          onClick={handlePrevious}
          className={`${styles.button} ${styles.navButton} ${styles.prevButton}`}
          aria-label="Previous image"
        >
          <svg
            className={`${styles.icon} ${styles.navIcon}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>

        {/* Next Button */}
        <button
          onClick={handleNext}
          className={`${styles.button} ${styles.navButton} ${styles.nextButton}`}
          aria-label="Next image"
        >
          <svg
            className={`${styles.icon} ${styles.navIcon}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>

        {/* Image Container */}
        <div className={styles.imageContainer}>
          <img
            src={currentImage.url}
            alt={currentImage.filename}
            className={styles.image}
          />

          {/* Image Info */}
          <div className={styles.info}>
            <p className={styles.infoText}>
              <span className={styles.filename}>{currentImage.filename}</span>
              <span className={styles.separator}>•</span>
              <span className={styles.position}>
                {currentIndex + 1} of {images.length}
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageViewer;
