import React, { useState, useEffect, useRef } from 'react';
import './Gallery.css';

interface AlbumImage {
  imageId: string;
  thumbnailUrl: string;
  compressedUrl: string;
  originalUrl: string;
  isLiked?: boolean;
}

interface GalleryProps {
  projectName: string;
  coverPhoto: string;
  clientName: string;
  albumImages: AlbumImage[];
}

const Gallery: React.FC<GalleryProps> = ({ projectName, coverPhoto, clientName, albumImages }) => {
  const [selectedImage, setSelectedImage] = useState<AlbumImage | null>(null);
  const [selectedEvent, setSelectedEvent] = useState('Event 1');
  const [likedImages, setLikedImages] = useState<Set<string>>(new Set());
  const gridRef = useRef<HTMLDivElement>(null);

  // Random cover photo for now
  const displayCover = coverPhoto || albumImages[0]?.compressedUrl || albumImages[0]?.originalUrl || 'https://images.unsplash.com/photo-1519741497674-611481863552?w=1920';

  // Toggle like
  const toggleLike = (imageId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setLikedImages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(imageId)) {
        newSet.delete(imageId);
      } else {
        newSet.add(imageId);
      }
      return newSet;
    });
  };

  // Download image
  const downloadImage = (image: AlbumImage, e: React.MouseEvent) => {
    e.stopPropagation();
    const link = document.createElement('a');
    link.href = image.originalUrl || image.compressedUrl;
    link.download = `photo-${image.imageId}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Scroll animations for gallery items
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry, index) => {
          if (entry.isIntersecting) {
            setTimeout(() => {
              entry.target.classList.add('visible');
            }, index * 50);
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '50px'
      }
    );

    const items = document.querySelectorAll('.gallery-grid-item');
    items.forEach((item) => observer.observe(item));

    return () => observer.disconnect();
  }, [albumImages]);

  // Smooth scroll to gallery
  const scrollToGallery = () => {
    const navStrip = document.querySelector('.gallery-nav-strip');
    if (navStrip) {
      navStrip.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="gallery-container">
      {/* Floating Particles */}
      <div className="gallery-floating-particles">
        {Array.from({ length: 40 }).map((_, i) => {
          const left = Math.random() * 100;
          const duration = 8 + Math.random() * 12;
          const delay = Math.random() * 8;
          const xOffset = (Math.random() - 0.5) * 100;
          
          return (
            <div
              key={i}
              className="gallery-particle"
              style={{
                left: `${left}%`,
                bottom: '-10px',
                ['--duration' as any]: `${duration}s`,
                ['--delay' as any]: `${delay}s`,
                ['--x' as any]: `${xOffset}px`,
              }}
            />
          );
        })}
      </div>

      {/* Full Screen Hero Cover */}
      <div className="gallery-hero">
        <img src={displayCover} alt={projectName} className="gallery-hero-image" />
        <div className="gallery-hero-overlay">
          <h1 className="gallery-hero-title">{projectName}</h1>
        </div>
        
        {/* Floating Event Selector - Top Right */}
        <div className="gallery-floating-selector">
          <select 
            value={selectedEvent} 
            onChange={(e) => setSelectedEvent(e.target.value)}
            className="gallery-floating-dropdown"
          >
            <option value="Event 1">Wedding Ceremony</option>
            <option value="Event 2">Reception</option>
            <option value="Event 3">Pre-Wedding</option>
          </select>
        </div>
        
        <div className="gallery-hero-scroll" onClick={scrollToGallery}>
          <span>Scroll to view gallery</span>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </div>
      </div>

      {/* Image Grid - Masonry Layout */}
      <div className="gallery-grid" ref={gridRef}>
        {albumImages.map((image) => (
          <div 
            key={image.imageId} 
            className="gallery-grid-item"
            onClick={() => setSelectedImage(image)}
          >
            <img 
              src={image.thumbnailUrl || image.compressedUrl} 
              alt={`Photo ${image.imageId}`}
              className="gallery-grid-image"
              loading="lazy"
            />
            <div className="gallery-grid-overlay">
              <span className="gallery-grid-icon">🔍</span>
            </div>
            
            {/* Image Actions */}
            <div className="gallery-image-actions">
              <button 
                className="gallery-action-btn gallery-download-btn"
                onClick={(e) => downloadImage(image, e)}
                title="Download"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
              </button>
              
              <button 
                className={`gallery-action-btn gallery-like-btn ${likedImages.has(image.imageId) ? 'liked' : ''}`}
                onClick={(e) => toggleLike(image.imageId, e)}
                title={likedImages.has(image.imageId) ? "Unlike" : "Like"}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill={likedImages.has(image.imageId) ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {selectedImage && (
        <div className="gallery-lightbox" onClick={() => setSelectedImage(null)}>
          <div className="gallery-lightbox-content" onClick={(e) => e.stopPropagation()}>
            <button className="gallery-lightbox-close" onClick={() => setSelectedImage(null)}>
              ×
            </button>
            <img 
              src={selectedImage.compressedUrl || selectedImage.originalUrl} 
              alt="Full size"
              className="gallery-lightbox-image"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Gallery;
