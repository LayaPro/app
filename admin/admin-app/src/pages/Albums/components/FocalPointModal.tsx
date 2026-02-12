import { useState, useRef, useEffect } from 'react';
import { Modal, InfoBox, Button } from '../../../components/ui';
import styles from './FocalPointModal.module.css';

interface FocalPointModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  imageName?: string;
  initialFocalPoint?: { x: number; y: number };
  onConfirm: (focalPoint: { x: number; y: number }) => void;
  isLoading?: boolean;
}

export const FocalPointModal = ({ 
  isOpen, 
  onClose, 
  imageUrl, 
  imageName,
  initialFocalPoint,
  onConfirm,
  isLoading = false
}: FocalPointModalProps) => {
  const [focalPoint, setFocalPoint] = useState<{ x: number; y: number }>(initialFocalPoint || { x: 50, y: 50 });
  const [imageLoaded, setImageLoaded] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setFocalPoint(initialFocalPoint || { x: 50, y: 50 }); // Use existing or reset to center
      setImageLoaded(false);
    }
  }, [isOpen, initialFocalPoint]);

  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageRef.current || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setFocalPoint({
      x: Math.max(0, Math.min(100, x)),
      y: Math.max(0, Math.min(100, y))
    });
  };

  const handleConfirm = () => {
    onConfirm(focalPoint);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Set Cover Photo Focal Point" size="large">
      <div className={styles.modalContent}>
        <InfoBox>
          Click on the image to set the focal point. This point will remain centered across all device screen sizes.
        </InfoBox>

        <div className={styles.mainContent}>
          {/* Left side - Main image selector */}
          <div className={styles.imageContainer}>
            {!imageLoaded && (
              <div className={styles.imageLoader}>
                <div className={styles.spinner}></div>
                <p>Loading image...</p>
              </div>
            )}
            
            <div 
              ref={containerRef}
              className={`${styles.imageWrapper} ${imageLoaded ? styles.loaded : ''}`}
              onClick={handleImageClick}
            >
              <img
                ref={imageRef}
                src={imageUrl}
                alt="Select focal point"
                className={styles.image}
                onLoad={() => setImageLoaded(true)}
              />
              
              {imageLoaded && (
                <div 
                  className={styles.focalPoint}
                  style={{
                    left: `${focalPoint.x}%`,
                    top: `${focalPoint.y}%`
                  }}
                >
                  <div className={styles.crosshairVertical}></div>
                  <div className={styles.crosshairHorizontal}></div>
                  <div className={styles.centerDot}></div>
                </div>
              )}
            </div>
            
            {/* Coordinates display */}
            {imageLoaded && (
              <div className={styles.coordinates}>
                <span className={styles.coordinateLabel}>Focal Point:</span>
                <span className={styles.coordinateValue}>X: {focalPoint.x.toFixed(1)}%</span>
                <span className={styles.coordinateValue}>Y: {focalPoint.y.toFixed(1)}%</span>
              </div>
            )}
          </div>

          {/* Right side - Device previews */}
          {imageLoaded && (
            <div className={styles.previewsContainer}>
              {/* Desktop Preview */}
              <div className={styles.previewCard}>
                <div className={styles.previewLabel}>
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Desktop (16:9)
                </div>
                <div className={styles.previewFrameWrapper} style={{ aspectRatio: '16/9' }}>
                  <img 
                    src={imageUrl} 
                    alt="Desktop preview"
                    style={{ objectPosition: `${focalPoint.x}% ${focalPoint.y}%` }}
                  />
                </div>
              </div>

              {/* Tablet Preview */}
              <div className={styles.previewCard}>
                <div className={styles.previewLabel}>
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  Tablet (4:3)
                </div>
                <div className={styles.previewFrameWrapper} style={{ aspectRatio: '4/3' }}>
                  <img 
                    src={imageUrl} 
                    alt="Tablet preview"
                    style={{ objectPosition: `${focalPoint.x}% ${focalPoint.y}%` }}
                  />
                </div>
              </div>

              {/* Mobile Preview */}
              <div className={styles.previewCard}>
                <div className={styles.previewLabel}>
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  Mobile (9:16)
                </div>
                <div className={styles.previewFrameWrapper} style={{ aspectRatio: '9/16' }}>
                  <img 
                    src={imageUrl} 
                    alt="Mobile preview"
                    style={{ objectPosition: `${focalPoint.x}% ${focalPoint.y}%` }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className={styles.actions}>
          <Button 
            variant="secondary"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button 
            variant="primary"
            onClick={handleConfirm}
            disabled={isLoading || !imageLoaded}
            isLoading={isLoading}
          >
            Set as Cover Photo
          </Button>
        </div>
      </div>
    </Modal>
  );
};
