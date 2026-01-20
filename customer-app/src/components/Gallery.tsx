import React, { useState, useEffect, useRef, useCallback } from 'react';
import './Gallery.css';
import { customerPortalApi } from '../services/api';

interface AlbumImage {
  imageId: string;
  thumbnailUrl: string;
  compressedUrl: string;
  originalUrl: string;
  eventId?: string;
  selectedByClient?: boolean;
}

interface EventInfo {
  eventId: string;
  eventName: string;
  statusCode?: string;
  statusCustomerNote?: string;
  statusDescription?: string;
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
  const [selectedEvent, setSelectedEvent] = useState(events.length > 0 ? events[0].eventId : '');
  const [likedImages, setLikedImages] = useState<Set<string>>(new Set());
  const [showDock, setShowDock] = useState(false);
  const [showEventMenu, setShowEventMenu] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [coverLoaded, setCoverLoaded] = useState(false);
  const [columns, setColumns] = useState<AlbumImage[][]>([[], [], [], [], []]);
  const [loadedCount, setLoadedCount] = useState(30);
  const imagesPerLoad = 30;

  // Get current event data
  const currentEvent = events.find(e => e.eventId === selectedEvent);
  
  // Published and onwards: PUBLISHED, CLIENT_SELECTION_DONE, ALBUM_DESIGN_ONGOING, 
  // ALBUM_DESIGN_COMPLETE, ALBUM_PRINTING, DELIVERY
  const publishedStatuses = [
    'PUBLISHED', 
    'CLIENT_SELECTION_DONE', 
    'ALBUM_DESIGN_ONGOING',
    'ALBUM_DESIGN_COMPLETE',
    'ALBUM_PRINTING',
    'DELIVERY'
  ];

  const isEventPublished = currentEvent?.statusCode && 
    publishedStatuses.includes(currentEvent.statusCode);
  
  // Filter images for the selected event, only if published
  const currentEventImages = isEventPublished 
    ? albumImages.filter(img => img.eventId === selectedEvent)
    : [];
  
  // Count liked images for current event only
  const currentEventLikedCount = currentEventImages.filter(img => likedImages.has(img.imageId)).length;
  
  const gridRef = useRef<HTMLDivElement>(null);
  const eventMenuRef = useRef<HTMLDivElement>(null);
  const optionsMenuRef = useRef<HTMLDivElement>(null);
  const eventHeadingRef = useRef<HTMLDivElement>(null);

  // Scroll to event heading when event changes
  const scrollToEventHeading = () => {
    // Use a small delay to ensure DOM is ready
    setTimeout(() => {
      const hero = document.querySelector('.gallery-hero') as HTMLElement;
      const heroHeight = hero ? hero.offsetHeight : window.innerHeight;
      const currentScroll = window.scrollY;
      
      // If we're currently viewing the cover (scrolled less than hero height),
      // always scroll past it completely
      if (currentScroll < heroHeight) {
        window.scrollTo({ top: heroHeight, behavior: 'smooth' });
      }
    }, 100);
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

  // Initialize liked images from backend data
  useEffect(() => {
    const selectedImages = new Set(
      albumImages.filter(img => img.selectedByClient).map(img => img.imageId)
    );
    setLikedImages(selectedImages);
  }, [albumImages]);

  // Reset loaded count when event changes
  useEffect(() => {
    setLoadedCount(30);
    setColumns([[], [], [], [], []]);
    scrollToEventHeading();
  }, [selectedEvent]);

  // Load images based on loadedCount
  useEffect(() => {
    if (currentEventImages.length === 0) return;

    const loadImages = async () => {
      const imagesToLoad = currentEventImages.slice(0, loadedCount);
      console.log(`Loading ${imagesToLoad.length} images for event ${selectedEvent}...`);
      
      // Load images to get dimensions
      const loadPromises = imagesToLoad.map((img, index) => {
        return new Promise<{ image: AlbumImage; width: number; height: number; index: number }>((resolve) => {
          const imageEl = new Image();
          const timeout = setTimeout(() => {
            resolve({ image: img, width: 800, height: 1000, index });
          }, 3000);
          
          imageEl.onload = () => {
            clearTimeout(timeout);
            resolve({
              image: img,
              width: imageEl.naturalWidth,
              height: imageEl.naturalHeight,
              index
            });
          };
          imageEl.onerror = () => {
            clearTimeout(timeout);
            resolve({ image: img, width: 800, height: 1000, index });
          };
          imageEl.src = img.thumbnailUrl || img.compressedUrl;
        });
      });

      const loadedImages = await Promise.all(loadPromises);
      console.log(`Loaded ${loadedImages.length} images`);

      // Distribute to columns using shortest-column algorithm
      const newCols: AlbumImage[][] = [[], [], [], [], []];
      const GAP_HEIGHT = 8;
      const columnHeights = [0, 0, 0, 0, 0];

      loadedImages.forEach(({ image, width, height, index }) => {
        const shortestCol = columnHeights.indexOf(Math.min(...columnHeights));
        const aspectRatio = width > 0 ? height / width : 1;
        const imageWithAspect = { ...image, _aspectRatio: aspectRatio } as any;
        
        newCols[shortestCol].push(imageWithAspect);
        columnHeights[shortestCol] += aspectRatio + GAP_HEIGHT / 100;
      });

      setColumns(newCols);
    };

    loadImages();
  }, [currentEventImages, loadedCount, selectedEvent]);

  // Load more images
  const loadMoreImages = () => {
    const newCount = Math.min(loadedCount + imagesPerLoad, currentEventImages.length);
    console.log(`Loading more: ${loadedCount} -> ${newCount}`);
    setLoadedCount(newCount);
  };

  const hasMore = loadedCount < currentEventImages.length;
  console.log(`hasMore: ${hasMore}, loadedCount: ${loadedCount}, total: ${currentEventImages.length}`);

  // Toggle like (client selection)
  const toggleLike = async (imageId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    const isCurrentlyLiked = likedImages.has(imageId);
    const newSelected = !isCurrentlyLiked;
    
    // Optimistically update UI
    setLikedImages(prev => {
      const newSet = new Set(prev);
      if (newSelected) {
        newSet.add(imageId);
      } else {
        newSet.delete(imageId);
      }
      return newSet;
    });
    
    // Sync with backend
    try {
      await customerPortalApi.toggleImageSelection([imageId], newSelected);
    } catch (error) {
      console.error('Failed to toggle image selection:', error);
      // Revert on error
      setLikedImages(prev => {
        const newSet = new Set(prev);
        if (isCurrentlyLiked) {
          newSet.add(imageId);
        } else {
          newSet.delete(imageId);
        }
        return newSet;
      });
    }
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

  // Show dock on scroll - appears when cover is 50% scrolled past
  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY > window.innerHeight * 0.5;
      setShowDock(scrolled);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
  }, [columns]);

  // Close event menu on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (eventMenuRef.current && !eventMenuRef.current.contains(event.target as Node)) {
        setShowEventMenu(false);
      }
      if (optionsMenuRef.current && !optionsMenuRef.current.contains(event.target as Node)) {
        setShowOptionsMenu(false);
      }
    };

    if (showEventMenu || showOptionsMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showEventMenu, showOptionsMenu]);

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
              data-tooltip={currentEvent?.eventName || 'Select Event'}
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
                    className={`gallery-event-option ${selectedEvent === event.eventId ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedEvent(event.eventId);
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

          {/* Selected Images Count */}
          <div className="gallery-dock-item">
            <button className="gallery-dock-button" data-tooltip={`${currentEventLikedCount} Selected`}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="#E74C3C" stroke="#E74C3C" strokeWidth="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
              </svg>
              {currentEventLikedCount > 0 && <span className="gallery-dock-badge">{currentEventLikedCount}</span>}
            </button>
          </div>

          {/* Download All */}
          <div className="gallery-dock-item">
            <button className="gallery-dock-button" data-tooltip="Download Selected">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
            </button>
          </div>

          {/* Divider */}
          <div className="gallery-dock-divider"></div>

          {/* Options Menu */}
          <div className="gallery-dock-item" ref={optionsMenuRef}>
            <button 
              className="gallery-dock-button" 
              data-tooltip="More Options"
              onClick={() => setShowOptionsMenu(!showOptionsMenu)}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="1.5" fill="currentColor"></circle>
                <circle cx="12" cy="5" r="1.5" fill="currentColor"></circle>
                <circle cx="12" cy="19" r="1.5" fill="currentColor"></circle>
              </svg>
            </button>
            
            {showOptionsMenu && (
              <div className="gallery-event-menu">
                <button
                  className="gallery-event-option"
                  onClick={() => {
                    setShowOptionsMenu(false);
                    // TODO: Implement album selection done functionality
                    console.log('Album selection done clicked');
                  }}
                >
                  Album selection done
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Event Heading Section */}
      <div className="gallery-event-heading" ref={eventHeadingRef}>
        <div className="gallery-event-heading-content">
          <div className="gallery-event-heading-line"></div>
          <h2 key={selectedEvent} className="gallery-event-heading-text">{currentEvent?.eventName || 'Gallery'}</h2>
          <div className="gallery-event-heading-line"></div>
        </div>
        <p key={`${selectedEvent}-subtitle`} className="gallery-event-heading-subtitle">
          {currentEventImages.length > 0 ? `${currentEventImages.length} precious moments` : ''}
        </p>
      </div>

      {/* Empty State - No Images */}
      {currentEventImages.length === 0 && (
        <div style={{
          padding: '80px 20px',
          textAlign: 'center',
          maxWidth: '600px',
          margin: '0 auto',
          minHeight: 'calc(100vh - 100px)'
        }}>
          {/* Status Card */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(201, 169, 97, 0.05) 0%, rgba(212, 163, 115, 0.05) 100%)',
            border: '2px solid rgba(201, 169, 97, 0.2)',
            borderRadius: '24px',
            padding: '48px 32px',
            boxShadow: '0 8px 32px rgba(44, 36, 22, 0.08)',
            backdropFilter: 'blur(10px)',
            animation: 'fadeInUp 0.6s ease-out'
          }}>
            {/* Animated Icon */}
            <div style={{
              width: '120px',
              height: '120px',
              margin: '0 auto 32px',
              background: 'linear-gradient(135deg, #C9A961 0%, #D4A373 100%)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '56px',
              animation: 'pulse 2s ease-in-out infinite',
              boxShadow: '0 8px 24px rgba(201, 169, 97, 0.3)'
            }}>
              ⏳
            </div>
            
            {/* Status Message */}
            {currentEvent?.statusCustomerNote ? (
              <p style={{
                fontSize: '18px',
                color: '#2C2416',
                lineHeight: '1.8',
                whiteSpace: 'pre-line',
                fontWeight: '400',
                margin: '0'
              }}>
                {currentEvent.statusCustomerNote}
              </p>
            ) : (
              <p style={{
                fontSize: '18px',
                color: '#6B6355',
                lineHeight: '1.8',
                margin: '0'
              }}>
                Images for this event haven't been uploaded yet. Please check back later.
              </p>
            )}
          </div>

          {/* Add keyframes for animations */}
          <style>{`
            @keyframes fadeInUp {
              from {
                opacity: 0;
                transform: translateY(30px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }
            
            @keyframes pulse {
              0%, 100% {
                transform: scale(1);
                box-shadow: 0 8px 24px rgba(201, 169, 97, 0.3);
              }
              50% {
                transform: scale(1.05);
                box-shadow: 0 12px 32px rgba(201, 169, 97, 0.4);
              }
            }
          `}</style>
        </div>
      )}

      {/* Image Grid - Column-based Masonry */}
      {currentEventImages.length > 0 && (
        <div className="gallery-grid" ref={gridRef}>
        {columns.map((column, colIndex) => (
          <div key={colIndex} className="gallery-column">
            {column.map((image) => (
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
        ))}
      </div>
      )}

      {/* Load More Button */}
      {hasMore && currentEventImages.length > 0 && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '60px 20px 80px',
          gap: '16px'
        }}>
          <div style={{
            fontSize: '14px',
            fontWeight: '500',
            color: '#6B6355',
            letterSpacing: '0.5px',
            textTransform: 'uppercase',
            marginBottom: '8px'
          }}>
            {currentEventImages.length - loadedCount} more photos
          </div>
          
          <button
            onClick={loadMoreImages}
            style={{
              position: 'relative',
              padding: '18px 48px',
              fontSize: '15px',
              fontWeight: '600',
              color: '#FAF8F5',
              background: 'linear-gradient(135deg, #C9A961 0%, #D4A373 100%)',
              border: 'none',
              borderRadius: '16px',
              cursor: 'pointer',
              boxShadow: '0 8px 24px -4px rgba(201, 169, 97, 0.4), 0 0 0 1px rgba(255,255,255,0.2) inset',
              transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
              fontFamily: 'inherit',
              overflow: 'hidden',
              backdropFilter: 'blur(10px)'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-3px) scale(1.02)';
              e.currentTarget.style.boxShadow = '0 16px 32px -8px rgba(201, 169, 97, 0.5), 0 0 0 1px rgba(255,255,255,0.3) inset';
              e.currentTarget.style.background = 'linear-gradient(135deg, #D4A373 0%, #E8D4A8 100%)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0) scale(1)';
              e.currentTarget.style.boxShadow = '0 8px 24px -4px rgba(201, 169, 97, 0.4), 0 0 0 1px rgba(255,255,255,0.2) inset';
              e.currentTarget.style.background = 'linear-gradient(135deg, #C9A961 0%, #D4A373 100%)';
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px) scale(0.98)';
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.transform = 'translateY(-3px) scale(1.02)';
            }}
          >
            <span style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
              Load More
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </span>
          </button>
          
          <div style={{
            fontSize: '13px',
            color: '#8B7355',
            fontWeight: '400'
          }}>
            Showing {loadedCount} of {currentEventImages.length}
          </div>
        </div>
      )}

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
