import React, { useRef, useState } from 'react';
import styles from './ImageUpload.module.css';

interface ImageUploadProps {
  images: string[];
  onChange: (images: string[]) => void;
  maxFiles?: number;
  maxSizeMB?: number;
  label?: string;
  info?: string;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  images,
  onChange,
  maxFiles = 4,
  maxSizeMB = 2,
  label = 'Images',
  info
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;

    const fileArray = Array.from(files);
    
    // Check total count
    if (fileArray.length + images.length > maxFiles) {
      alert(`Maximum ${maxFiles} images allowed`);
      return;
    }

    // Validate file sizes and types
    const maxBytes = maxSizeMB * 1024 * 1024;
    const invalidFiles = fileArray.filter(f => 
      f.size > maxBytes || !f.type.startsWith('image/')
    );
    
    if (invalidFiles.length > 0) {
      alert(`Some files are invalid. Ensure all files are images under ${maxSizeMB}MB.`);
      return;
    }

    // Convert all files to base64
    const readers = fileArray.map(file => {
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          resolve(event.target?.result as string);
        };
        reader.readAsDataURL(file);
      });
    });

    Promise.all(readers).then(results => {
      onChange([...images, ...results]);
    });
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeImage = (index: number) => {
    onChange(images.filter((_, i) => i !== index));
  };

  return (
    <div className={styles.container}>
      <div className={styles.labelRow}>
        <label className={styles.label}>
          {label}
          {info && (
            <span className={styles.info} title={info}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M8 7V11M8 5V5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </span>
          )}
        </label>
        <span className={styles.counter}>
          {images.length}/{maxFiles}
        </span>
      </div>

      <div
        className={`${styles.dropzone} ${isDragging ? styles.dragging : ''}`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileInput}
          className={styles.hiddenInput}
        />
        
        {images.length === 0 && (
          <div 
            className={styles.dropzoneContent} 
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                fileInputRef.current?.click();
              }
            }}
            role="button"
            tabIndex={0}
            aria-label="Upload images"
          >
            <svg className={styles.uploadIcon} width="48" height="48" viewBox="0 0 48 48" fill="none">
              <path d="M24 14V34M24 14L18 20M24 14L30 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M8 30V38C8 39.1046 8.89543 40 10 40H38C39.1046 40 40 39.1046 40 38V30" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <div className={styles.dropzoneText}>
              <span className={styles.dropzonePrimary}>
                {isDragging ? 'Drop images here' : 'Click to upload or drag and drop'}
              </span>
              <span className={styles.dropzoneSecondary}>
                PNG, JPG up to {maxSizeMB}MB (max {maxFiles} images)
              </span>
            </div>
          </div>
        )}

        {images.length > 0 && (
          <div className={styles.galleryContainer}>
            <div className={styles.thumbnailGrid}>
              {images.map((img, index) => (
                <div key={`uploaded-${index}`} className={styles.thumbnail}>
                  <img src={img} alt={`Image ${index + 1}`} />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className={styles.thumbnailRemove}
                    title="Remove"
                  >
                    ×
                  </button>
                </div>
              ))}
              {images.length < maxFiles && (
                <button
                  type="button"
                  className={styles.addMoreButton}
                  onClick={() => fileInputRef.current?.click()}
                  aria-label="Add more images"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
