import React, { useState, useEffect, useRef } from 'react';
import './Gallery.css';

interface AlbumImage {
  imageId: string;
  thumbnailUrl: string;
  compressedUrl: string;
  originalUrl: string;
  isLiked?: boolean;
}

interface EventInfo {
  eventId: string;
  eventName: string;
}

interface GalleryProps {
  projectName: string;
  coverPhoto: string;
  clientName: string;
  albumImages: AlbumImage[];
  events?: EventInfo[];
}

const Gallery: React.FC<GalleryProps> = ({ projectName, coverPhoto, clientName, albumImages, events = [] }) => {
  const [selectedImage, setSelectedImage] = useState<AlbumImage | null>(null);
  const [selectedEvent, setSelectedEvent] = useState(events.length > 0 ? events[0].eventName : '');
  const [likedImages, setLikedImages] = useState<Set<string>>(new Set());
  const [showDock, setShowDock] = useState(false);
  const [showEventMenu, setShowEventMenu] = useState(false);
  const [coverLoaded, setCoverLoaded] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);
  const eventMenuRef = useRef<HTMLDivElement>(null);
  const eventHeadingRef = useRef<HTMLDivElement>(null);

  // Scroll to event heading when event changes
  const scrollToEventHeading = () => {
    if (eventHeadingRef.current) {
      // Get the hero height to scroll past it completely
      const hero = document.querySelector('.gallery-hero') as HTMLElement;
      const heroHeight = hero ? hero.offsetHeight : window.innerHeight;
      window.scrollTo({ top: heroHeight, behavior: 'smooth' });
    }
  };

  // Random cover photo for now
  const displayCover = coverPhoto || albumImages[0]?.compressedUrl || albumImages[0]?.originalUrl || 'https://images.unsplash.com/photo-1519741497674-611481863552?w=1920';

  // Preload cover image
  useEffect(() => {
    const img = new Image();
    img.src = displayCover;
    img.onload = () => {
      setCoverLoaded(true);
    };
    img.onerror = () => {
      setCoverLoaded(true);
    };
  }, [displayCover]);

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

  // Show dock on scroll
  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY > window.innerHeight * 0.8;
      setShowDock(scrolled);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close event menu on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (eventMenuRef.current && !eventMenuRef.current.contains(event.target as Node)) {
        setShowEventMenu(false);
      }
    };

    if (showEventMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showEventMenu]);

  // Smooth scroll to gallery
  const scrollToGallery = () => {
    const navStrip = document.querySelector('.gallery-nav-strip');
    if (navStrip) {
      navStrip.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="gallery-container">
      {/* Main Content - Fade in when loaded */}
      <div className={`gallery-content ${coverLoaded ? 'loaded' : ''}`}>
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
          <div className="gallery-hero-overlay"></div>
          
          <div className="gallery-hero-scroll" onClick={scrollToGallery}>
            <span>Scroll to view gallery</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </div>
        </div>

      {/* macOS Style Floating Dock */}
      <div className={`gallery-dock ${showDock ? 'show' : ''}`}>
        <div className="gallery-dock-content">
          {/* Project Name */}
          <div className="gallery-dock-project-name">
            {projectName}
          </div>

          {/* Divider */}
          <div className="gallery-dock-divider"></div>

          {/* Album Selector with Custom Dropdown */}
          <div className="gallery-dock-item" ref={eventMenuRef}>
            <button 
              className="gallery-dock-button gallery-dock-event-btn"
              onClick={() => setShowEventMenu(!showEventMenu)}
              title={selectedEvent}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7"></rect>
                <rect x="14" y="3" width="7" height="7"></rect>
                <rect x="3" y="14" width="7" height="7"></rect>
                <rect x="14" y="14" width="7" height="7"></rect>
              </svg>
            </button>
            {showEventMenu && (
              <div className="gallery-event-menu">
                {events.map((event) => (
                  <button
                    key={event.eventId}
                    className={`gallery-event-option ${selectedEvent === event.eventName ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedEvent(event.eventName);
                      setShowEventMenu(false);
                      scrollToEventHeading();
                    }}
                  >
                    {event.eventName}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Liked Count */}
          <div className="gallery-dock-item">
            <button className="gallery-dock-button" title={`${likedImages.size} liked`}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="#E74C3C" stroke="#E74C3C" strokeWidth="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
              </svg>
              {likedImages.size > 0 && <span className="gallery-dock-badge">{likedImages.size}</span>}
            </button>
          </div>

          {/* Download All */}
          <div className="gallery-dock-item">
            <button className="gallery-dock-button" title="Download favorites">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
            </button>
          </div>

          {/* Divider */}
          <div className="gallery-dock-divider"></div>

          {/* Info */}
          <div className="gallery-dock-item">
            <button className="gallery-dock-button" title="Gallery info">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="16" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12.01" y2="8"></line>
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Event Heading Section */}
      <div className="gallery-event-heading" ref={eventHeadingRef}>
        <div className="gallery-event-heading-content">
          <div className="gallery-event-heading-line"></div>
          <h2 key={selectedEvent} className="gallery-event-heading-text">{selectedEvent}</h2>
          <div className="gallery-event-heading-line"></div>
        </div>
        <p key={`${selectedEvent}-subtitle`} className="gallery-event-heading-subtitle">{albumImages.length} precious moments</p>
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
    </div>
  );
};

export default Gallery;
