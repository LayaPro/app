import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
  clientEventId?: string;
  albumPdfUrl?: string | null;
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
  const [slideDirection, setSlideDirection] = useState<'left' | 'right' | null>(null);
  const [isInitialOpen, setIsInitialOpen] = useState(true);
  const [isClosing, setIsClosing] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(events.length > 0 ? events[0].eventId : '');
  const [likedImages, setLikedImages] = useState<Set<string>>(new Set());
  const [showDock, setShowDock] = useState(false);
  const [showEventMenu, setShowEventMenu] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [coverLoaded, setCoverLoaded] = useState(false);
  const [columnCount, setColumnCount] = useState(5); // Dynamic column count
  const [columns, setColumns] = useState<AlbumImage[][]>(() => Array(5).fill(null).map(() => []));
  const [loadedCount, setLoadedCount] = useState(30);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true); // Track initial page load
  const [hasScrolled, setHasScrolled] = useState(false); // Track if user has scrolled
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [showSwipeHint, setShowSwipeHint] = useState(false);
  const [zoomScale, setZoomScale] = useState(1);
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [lastTouchDistance, setLastTouchDistance] = useState<number | null>(null);
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
  
  // Filter images for the selected event, only if published (memoized to prevent infinite loops)
  const currentEventImages = useMemo(() => {
    return isEventPublished 
      ? albumImages.filter(img => img.eventId === selectedEvent)
      : [];
  }, [albumImages, selectedEvent, isEventPublished]);
  
  // Count liked images for current event only
  const currentEventLikedCount = currentEventImages.filter(img => likedImages.has(img.imageId)).length;
  
  const gridRef = useRef<HTMLDivElement>(null);
  const eventMenuRef = useRef<HTMLDivElement>(null);
  const optionsMenuRef = useRef<HTMLDivElement>(null);
  const eventHeadingRef = useRef<HTMLDivElement>(null);
  const menuJustClosedRef = useRef(false);

  // Scroll to event heading when event changes
  const scrollToEventHeading = () => {
    // Use a delay to ensure DOM is fully rendered with new content
    setTimeout(() => {
      if (eventHeadingRef.current) {
        // Get element position and calculate scroll target
        const rect = eventHeadingRef.current.getBoundingClientRect();
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const targetPosition = rect.top + scrollTop - 10; // Small 10px offset from top
        
        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });
      }
    }, 150);
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

  // Ensure page starts at top on initial load
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Lock body scroll when lightbox is open
  useEffect(() => {
    if (selectedImage) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [selectedImage]);

  // Responsive column count based on screen width
  useEffect(() => {
    const updateColumnCount = () => {
      const width = window.innerWidth;
      if (width <= 640) {
        // Phone: 2 columns
        setColumnCount(2);
      } else if (width <= 1024) {
        // Tablet: 3 columns
        setColumnCount(3);
      } else {
        // Desktop: 5 columns
        setColumnCount(5);
      }
    };

    updateColumnCount();
    window.addEventListener('resize', updateColumnCount);
    return () => window.removeEventListener('resize', updateColumnCount);
  }, []);

  // Reinitialize columns when column count changes
  useEffect(() => {
    setColumns(Array(columnCount).fill(null).map(() => []));
  }, [columnCount]);

  // Initialize liked images from backend data
  useEffect(() => {
    const selectedImages = new Set(
      albumImages.filter(img => img.selectedByClient).map(img => img.imageId)
    );
    setLikedImages(selectedImages);
  }, [albumImages]);

  // Reset loaded count and columns when event changes
  useEffect(() => {
    setLoadedCount(30);
    setColumns(Array(columnCount).fill(null).map(() => []));
    
    // Only scroll to event heading if this is not the initial load
    if (!isInitialLoad) {
      scrollToEventHeading();
    } else {
      setIsInitialLoad(false);
    }
  }, [selectedEvent]); // Only depend on selectedEvent, not columnCount

  // Load images based on loadedCount
  useEffect(() => {
    if (currentEventImages.length === 0) return;

    const loadImages = async () => {
      const imagesToLoad = currentEventImages.slice(0, loadedCount);
      
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

      // Distribute to columns using shortest-column algorithm
      const newCols: AlbumImage[][] = Array(columnCount).fill(null).map(() => []);
      const GAP_HEIGHT = 8;
      const columnHeights = Array(columnCount).fill(0);

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
    const newCount = loadedCount + imagesPerLoad;
    setLoadedCount(newCount);
  };

  const hasMore = loadedCount < currentEventImages.length;

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

  // Show dock on scroll - appears when scrolled past threshold
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      
      // Hide arrow as soon as any scrolling starts
      if (scrollY > 0) {
        setHasScrolled(true);
      }
      
      // Show dock after scrolling just 100px for early and consistent appearance
      const scrolled = scrollY > 100;
      setShowDock(scrolled);
      
      // Debug logging for tablet issues
      if (scrollY > 100 && scrollY < 200) {
        console.log('Dock should show. ScrollY:', scrollY, 'ShowDock:', scrolled, 'Window width:', window.innerWidth);
      }
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
      let menuWasClosed = false;
      if (eventMenuRef.current && !eventMenuRef.current.contains(event.target as Node)) {
        setShowEventMenu(false);
        menuWasClosed = true;
      }
      if (optionsMenuRef.current && !optionsMenuRef.current.contains(event.target as Node)) {
        setShowOptionsMenu(false);
        menuWasClosed = true;
      }
      
      // Set flag if a menu was closed
      if (menuWasClosed) {
        menuJustClosedRef.current = true;
        // Reset flag after a short delay
        setTimeout(() => {
          menuJustClosedRef.current = false;
        }, 100);
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
          
          {!hasScrolled && (
            <div className="gallery-hero-scroll" onClick={scrollToGallery}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#C9A961" strokeWidth="2">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </div>
          )}
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

          {/* Album PDF */}
          <div className="gallery-dock-item">
            <button 
              className="gallery-dock-button" 
              data-tooltip={currentEvent?.albumPdfUrl ? "View Album" : "Album not uploaded yet"}
              onClick={() => {
                if (currentEvent?.albumPdfUrl) {
                  window.open(currentEvent.albumPdfUrl, '_blank');
                }
              }}
              style={{
                cursor: currentEvent?.albumPdfUrl ? 'pointer' : 'not-allowed'
              }}
              disabled={!currentEvent?.albumPdfUrl}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
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
                  disabled={currentEventLikedCount === 0 || !!currentEvent?.albumPdfUrl}
                  onClick={async () => {
                    setShowOptionsMenu(false);
                    if (currentEventLikedCount === 0 || currentEvent?.albumPdfUrl) return;
                    
                    try {
                      console.log('Sending selection done for event:', selectedEvent);
                      console.log('Current event data:', currentEvent);
                      console.log('Using clientEventId:', currentEvent?.clientEventId);
                      // Use clientEventId to update the correct event
                      const result = await customerPortalApi.markSelectionDone(currentEvent?.clientEventId || selectedEvent);
                      console.log('Mark selection done result:', result);
                      setToast({ message: 'Your selection has been sent successfully!', type: 'success' });
                      setTimeout(() => setToast(null), 3000);
                    } catch (error) {
                      console.error('Failed to mark selection done:', error);
                      setToast({ message: 'Failed to send selection. Please try again.', type: 'error' });
                      setTimeout(() => setToast(null), 3000);
                    }
                  }}
                  style={{
                    opacity: (currentEventLikedCount === 0 || currentEvent?.albumPdfUrl) ? 0.5 : 1,
                    cursor: (currentEventLikedCount === 0 || currentEvent?.albumPdfUrl) ? 'not-allowed' : 'pointer'
                  }}
                >
                  Send selection
                </button>
                
                <button
                  className="gallery-event-option"
                  disabled={!currentEvent?.albumPdfUrl}
                  onClick={async () => {
                    setShowOptionsMenu(false);
                    if (!currentEvent?.albumPdfUrl) return;
                    
                    try {
                      console.log('Approving album for event:', selectedEvent);
                      console.log('Using clientEventId:', currentEvent?.clientEventId);
                      const result = await customerPortalApi.approveAlbum(currentEvent?.clientEventId || selectedEvent);
                      console.log('Approve album result:', result);
                      setToast({ message: 'Album approved successfully!', type: 'success' });
                      setTimeout(() => setToast(null), 3000);
                    } catch (error) {
                      console.error('Failed to approve album:', error);
                      setToast({ message: 'Failed to approve album. Please try again.', type: 'error' });
                      setTimeout(() => setToast(null), 3000);
                    }
                  }}
                  style={{
                    opacity: currentEvent?.albumPdfUrl ? 1 : 0.5,
                    cursor: currentEvent?.albumPdfUrl ? 'pointer' : 'not-allowed'
                  }}
                >
                  Approve album
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
                onClick={() => {
                  // If a menu was just closed, don't open lightbox
                  if (menuJustClosedRef.current) {
                    return;
                  }
                  setIsInitialOpen(true);
                  setSlideDirection(null);
                  setSelectedImage(image);
                  // Show swipe hint on mobile when opening image
                  if (window.innerWidth <= 768) {
                    setShowSwipeHint(true);
                    setTimeout(() => setShowSwipeHint(false), 3100);
                  }
                }}
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
      {currentEventImages.length > 0 && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '60px 20px 80px',
          gap: '20px'
        }}>
          <button
            onClick={loadMoreImages}
            style={{
              position: 'relative',
              padding: '12px 32px',
              fontSize: '14px',
              fontWeight: '500',
              color: '#5C4C44',
              background: 'rgba(255, 255, 255, 0.8)',
              border: '1.5px solid rgba(201, 169, 97, 0.5)',
              borderRadius: '50px',
              cursor: 'pointer',
              transition: 'all 0.5s ease',
              fontFamily: 'inherit',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              letterSpacing: '0.3px',
              boxShadow: '0 2px 8px rgba(201, 169, 97, 0.15)',
              opacity: hasMore ? 1 : 0,
              transform: hasMore ? 'translateY(0)' : 'translateY(20px)',
              pointerEvents: hasMore ? 'auto' : 'none',
              visibility: hasMore ? 'visible' : 'hidden'
            }}
            onMouseOver={(e) => {
              if (hasMore) {
                e.currentTarget.style.borderColor = '#C9A961';
                e.currentTarget.style.background = 'rgba(201, 169, 97, 0.1)';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(201, 169, 97, 0.25)';
              }
            }}
            onMouseOut={(e) => {
              if (hasMore) {
                e.currentTarget.style.borderColor = 'rgba(201, 169, 97, 0.5)';
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.8)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(201, 169, 97, 0.15)';
              }
            }}
          >
            <span>Load More</span>
            <span style={{ 
              display: 'flex', 
              flexDirection: 'column',
              gap: '0px',
              animation: 'bounceArrows 1.5s ease-in-out infinite',
              marginTop: '2px'
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginTop: '-6px' }}>
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </span>
          </button>
          
          <style>{`
            @keyframes bounceArrows {
              0%, 100% {
                transform: translateY(0);
                opacity: 1;
              }
              50% {
                transform: translateY(3px);
                opacity: 0.6;
              }
            }
          `}</style>
          
          <div style={{
            fontSize: '13px',
            color: '#A89B8F',
            fontWeight: '400',
            opacity: hasMore ? 1 : 0,
            transform: hasMore ? 'translateY(0)' : 'translateY(20px)',
            transition: 'all 0.5s ease',
            visibility: hasMore ? 'visible' : 'hidden'
          }}>
            Showing {loadedCount} of {currentEventImages.length}
          </div>
        </div>
      )}

      {/* Lightbox */}
      {selectedImage && (() => {
        // Use original API order (sliced to loadedCount) instead of flattened columns
        const currentImages = currentEventImages.slice(0, loadedCount);
        const currentIndex = currentImages.findIndex(img => img.imageId === selectedImage.imageId);
        const hasPrev = currentIndex > 0;
        const hasNext = currentIndex < currentImages.length - 1;

        const handlePrev = (e?: React.MouseEvent) => {
          e?.stopPropagation();
          if (hasPrev) {
            setIsInitialOpen(false);
            setSlideDirection('right');
            setZoomScale(1);
            setImagePosition({ x: 0, y: 0 });
            setTimeout(() => {
              setSelectedImage(currentImages[currentIndex - 1]);
            }, 50);
          }
        };

        const handleNext = (e?: React.MouseEvent) => {
          e?.stopPropagation();
          if (hasNext) {
            setIsInitialOpen(false);
            setSlideDirection('left');
            setZoomScale(1);
            setImagePosition({ x: 0, y: 0 });
            setTimeout(() => {
              setSelectedImage(currentImages[currentIndex + 1]);
            }, 50);
          }
        };

        const minSwipeDistance = 50;

        const onTouchStart = (e: React.TouchEvent) => {
          setTouchEnd(null);
          setTouchStart(e.targetTouches[0].clientX);
        };

        const onTouchMove = (e: React.TouchEvent) => {
          setTouchEnd(e.targetTouches[0].clientX);
        };

        const onTouchEnd = () => {
          if (!touchStart || !touchEnd) return;
          const distance = touchStart - touchEnd;
          const isLeftSwipe = distance > minSwipeDistance;
          const isRightSwipe = distance < -minSwipeDistance;
          if (isLeftSwipe && hasNext) {
            handleNext();
            setShowSwipeHint(false);
          }
          if (isRightSwipe && hasPrev) {
            handlePrev();
            setShowSwipeHint(false);
          }
        };

        const handleClose = () => {
          setIsClosing(true);
          setZoomScale(1);
          setImagePosition({ x: 0, y: 0 });
          setTimeout(() => {
            setSelectedImage(null);
            setIsClosing(false);
            setIsInitialOpen(true);
          }, 300);
        };

        const handleWheel = (e: React.WheelEvent) => {
          e.preventDefault();
          e.stopPropagation();
          
          const delta = e.deltaY * -0.001;
          const newScale = Math.min(Math.max(1, zoomScale + delta), 5);
          
          if (newScale !== zoomScale) {
            // Get mouse position relative to image container
            const rect = e.currentTarget.getBoundingClientRect();
            const mouseX = e.clientX - rect.left - rect.width / 2;
            const mouseY = e.clientY - rect.top - rect.height / 2;
            
            // Calculate new position to zoom towards cursor
            const scaleChange = newScale / zoomScale;
            const newX = imagePosition.x - mouseX * (scaleChange - 1) / newScale;
            const newY = imagePosition.y - mouseY * (scaleChange - 1) / newScale;
            
            setZoomScale(newScale);
            
            // Reset position if zoomed out to 1x
            if (newScale === 1) {
              setImagePosition({ x: 0, y: 0 });
            } else {
              setImagePosition({ x: newX, y: newY });
            }
          }
        };

        const handleMouseDown = (e: React.MouseEvent) => {
          if (zoomScale > 1) {
            e.preventDefault();
            setIsDragging(true);
            // Store the starting position accounting for current image position
            setDragStart({ 
              x: e.clientX, 
              y: e.clientY 
            });
          }
        };

        const handleMouseMove = (e: React.MouseEvent) => {
          if (isDragging && zoomScale > 1) {
            e.preventDefault();
            
            // Calculate movement delta with reduced sensitivity
            const sensitivity = 0.5; // Reduce drag speed to 50%
            const deltaX = (e.clientX - dragStart.x) * sensitivity;
            const deltaY = (e.clientY - dragStart.y) * sensitivity;
            
            // Calculate new position relative to previous position
            const newX = imagePosition.x + deltaX;
            const newY = imagePosition.y + deltaY;
            
            // Update drag start for next move
            setDragStart({ x: e.clientX, y: e.clientY });
            
            // Get container dimensions
            const rect = e.currentTarget.getBoundingClientRect();
            const containerWidth = rect.width;
            const containerHeight = rect.height;
            
            // Calculate strict boundaries - limit drag to 20% of container edge
            const maxOffset = Math.min(containerWidth, containerHeight) * 0.2;
            const maxX = maxOffset;
            const maxY = maxOffset;
            
            // Constrain position to boundaries
            const constrainedX = Math.max(-maxX, Math.min(maxX, newX));
            const constrainedY = Math.max(-maxY, Math.min(maxY, newY));
            
            setImagePosition({
              x: constrainedX,
              y: constrainedY
            });
          }
        };

        const handleMouseUp = () => {
          setIsDragging(false);
        };

        const getTouchDistance = (touches: React.TouchList) => {
          if (touches.length < 2) return 0;
          const touch1 = touches[0];
          const touch2 = touches[1];
          const dx = touch2.clientX - touch1.clientX;
          const dy = touch2.clientY - touch1.clientY;
          return Math.sqrt(dx * dx + dy * dy);
        };

        const handleTouchStart = (e: React.TouchEvent) => {
          if (e.touches.length === 2) {
            e.preventDefault();
            const distance = getTouchDistance(e.touches);
            setLastTouchDistance(distance);
          }
        };

        const handleTouchMove = (e: React.TouchEvent) => {
          if (e.touches.length === 2 && lastTouchDistance) {
            e.preventDefault();
            const distance = getTouchDistance(e.touches);
            const scale = distance / lastTouchDistance;
            const newScale = Math.min(Math.max(1, zoomScale * scale), 5);
            
            setZoomScale(newScale);
            setLastTouchDistance(distance);
            
            if (newScale === 1) {
              setImagePosition({ x: 0, y: 0 });
            }
          }
        };

        const handleTouchEnd = () => {
          setLastTouchDistance(null);
        };

        const handleKeyDown = (e: React.KeyboardEvent) => {
          if (e.key === 'ArrowLeft') handlePrev();
          if (e.key === 'ArrowRight') handleNext();
          if (e.key === 'Escape') handleClose();
        };

        return (
          <div 
            className="gallery-lightbox" 
            onClick={handleClose}
            onKeyDown={handleKeyDown}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            tabIndex={0}
            style={{ outline: 'none' }}
          >
            <button 
              className="gallery-lightbox-close" 
              onClick={(e) => { e.stopPropagation(); handleClose(); }}
              aria-label="Close"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>

            {showSwipeHint && (
              <div className="gallery-swipe-hint">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6"></polyline>
                </svg>
                <span>Swipe to navigate</span>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </div>
            )}

            {/* Download and Like buttons */}
            <div className="gallery-lightbox-actions">
              <button
                className="gallery-lightbox-action-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  const link = document.createElement('a');
                  link.href = selectedImage.originalUrl;
                  link.download = `image-${selectedImage.imageId}.jpg`;
                  link.click();
                }}
                aria-label="Download image"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
              </button>
              <button
                className={`gallery-lightbox-action-btn ${likedImages.has(selectedImage.imageId) ? 'liked' : ''}`}
                onClick={(e) => toggleLike(selectedImage.imageId, e)}
                aria-label={likedImages.has(selectedImage.imageId) ? "Unlike image" : "Like image"}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill={likedImages.has(selectedImage.imageId) ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                </svg>
              </button>
            </div>

            {hasPrev && (
              <button 
                className="gallery-lightbox-nav gallery-lightbox-prev"
                onClick={handlePrev}
                aria-label="Previous image"
              >
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6"></polyline>
                </svg>
              </button>
            )}

            {hasNext && (
              <button 
                className="gallery-lightbox-nav gallery-lightbox-next"
                onClick={handleNext}
                aria-label="Next image"
              >
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </button>
            )}

            <div 
              className="gallery-lightbox-content" 
              onClick={(e) => e.stopPropagation()}
              onWheel={handleWheel}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              style={{ 
                cursor: zoomScale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
                userSelect: 'none'
              }}
            >
              <img 
                key={selectedImage.imageId}
                src={selectedImage.compressedUrl || selectedImage.originalUrl} 
                alt="Full size"
                className={`gallery-lightbox-image ${
                  isClosing ? 'zoom-out' :
                  isInitialOpen ? 'zoom-in' : `slide-${slideDirection}`
                }`}
                style={{
                  transform: `scale(${zoomScale}) translate(${imagePosition.x}px, ${imagePosition.y}px)`,
                  transition: isInitialOpen || isClosing || slideDirection ? 'transform 0.3s ease' : 'none',
                  pointerEvents: 'none'
                }}
                draggable={false}
              />
            </div>

            <div className="gallery-lightbox-counter">
              {currentIndex + 1} / {currentImages.length}
            </div>
          </div>
        );
      })()}

      {/* Toast Notification */}
      {toast && (
        <div className={`gallery-toast gallery-toast-${toast.type}`}>
          <div className="gallery-toast-content">
            {toast.type === 'success' ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 6L9 17l-5-5"></path>
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Footer - Only show when all images are loaded */}
      {!hasMore && currentEventImages.length > 0 && (
        <footer className="gallery-footer" style={{
          animation: 'slideUpFadeIn 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
        }}>
          <div className="gallery-footer-content">
            <div className="gallery-footer-line"></div>
            <div className="gallery-footer-text">Laya Productions</div>
            <div className="gallery-footer-line"></div>
          </div>
          <div className="gallery-footer-tagline">Crafting Timeless Memories</div>
        </footer>
      )}
      </div>
    </div>
  );
};

export default Gallery;
