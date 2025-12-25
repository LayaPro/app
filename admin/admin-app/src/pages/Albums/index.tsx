import { useState, useEffect, useMemo, useRef } from 'react';
import { Breadcrumb, Input } from '../../components/ui/index.js';
import { projectApi, clientEventApi, eventApi, imageApi } from '../../services/api';
import styles from './Albums.module.css';

interface Project {
  projectId: string;
  projectName: string;
  coverPhoto?: string;
  displayPic?: string;
  startDate?: string;
  createdAt?: string;
}

interface ClientEvent {
  clientEventId: string;
  eventId: string;
  projectId: string;
  fromDatetime?: string;
  createdAt?: string;
  coverImage?: string;
}

const Albums = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [events, setEvents] = useState<ClientEvent[]>([]);
  const [allEvents, setAllEvents] = useState<ClientEvent[]>([]);
  const [allImages, setAllImages] = useState<any[]>([]);
  const [eventTypes, setEventTypes] = useState<Map<string, any>>(new Map());
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<ClientEvent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('recent');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<Array<{ id: string; url: string; file?: File }>>([]);
  const [isUploadExpanded, setIsUploadExpanded] = useState(false);
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bulkActionsRef = useRef<HTMLDivElement>(null);
  const sortDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchProjects();
    fetchEventTypes();
    fetchAllEvents();
    fetchAllImages();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      
      // Close main menu dropdown
      if (menuRef.current && !menuRef.current.contains(target)) {
        setOpenMenuId(null);
      }
      
      // Close bulk actions dropdown
      if (bulkActionsRef.current && !bulkActionsRef.current.contains(target)) {
        setShowBulkActions(false);
      }
      
      // Close sort dropdown
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(target)) {
        setShowSortDropdown(false);
      }
    };

    if (openMenuId || showBulkActions || showSortDropdown) {
      setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
      }, 0);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openMenuId, showBulkActions, showSortDropdown]);

  const fetchProjects = async () => {
    setIsLoading(true);
    try {
      const response = await projectApi.getAll();
      setProjects(response.projects || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchEventTypes = async () => {
    try {
      const response = await eventApi.getAll();
      const typesMap = new Map();
      (response.events || []).forEach((type: any) => {
        typesMap.set(type.eventId, type);
      });
      setEventTypes(typesMap);
    } catch (error) {
      console.error('Error fetching event types:', error);
    }
  };

  const fetchAllEvents = async () => {
    try {
      const response = await clientEventApi.getAll();
      setAllEvents(response.clientEvents || []);
    } catch (error) {
      console.error('Error fetching all events:', error);
    }
  };

  const fetchAllImages = async () => {
    try {
      const response = await imageApi.getAll();
      setAllImages(response.images || []);
    } catch (error) {
      console.error('Error fetching all images:', error);
    }
  };

  const fetchProjectEvents = async (projectId: string) => {
    setIsLoading(true);
    try {
      const response = await clientEventApi.getAll();
      const projectEvents = (response.clientEvents || []).filter(
        (event: ClientEvent) => event.projectId === projectId
      );
      setEvents(projectEvents);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProjectClick = (project: Project) => {
    setIsTransitioning(true);
    
    setTimeout(() => {
      setSelectedProject(project);
      setSearchTerm('');
      setCurrentPage(1);
      fetchProjectEvents(project.projectId);
      setTimeout(() => {
        setIsTransitioning(false);
      }, 50);
    }, 150);
  };

  const handleBackToProjects = () => {
    setIsTransitioning(true);
    
    setTimeout(() => {
      setSelectedProject(null);
      setEvents([]);
      setSearchTerm('');
      setCurrentPage(1);
      setTimeout(() => {
        setIsTransitioning(false);
      }, 50);
    }, 150);
  };

  const handleEventClick = (event: ClientEvent) => {
    console.log('Event clicked:', event);
    console.log('Current selectedProject:', selectedProject);
    setSelectedEvent(event);
    setIsUploadExpanded(false);
    setUploadedImages([]);
    console.log('Selected event set to:', event);
  };

  const handleCloseAlbum = () => {
    setSelectedEvent(null);
    setUploadedImages([]);
    setIsUploadExpanded(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newImages = Array.from(files).map((file) => {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select valid image files');
        return null;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert(`File ${file.name} is too large. Maximum size is 5MB.`);
        return null;
      }

      // Create preview URL
      const url = URL.createObjectURL(file);
      return {
        id: `upload-${Date.now()}-${Math.random()}`,
        url,
        file
      };
    }).filter((img): img is { id: string; url: string; file: File } => img !== null);

    setUploadedImages((prev) => [...prev, ...newImages]);
    // Reset input
    e.target.value = '';
  };

  const handleRemoveImage = (id: string) => {
    setUploadedImages((prev) => {
      const image = prev.find((img) => img.id === id);
      if (image?.url.startsWith('blob:')) {
        URL.revokeObjectURL(image.url);
      }
      return prev.filter((img) => img.id !== id);
    });
  };

  const toggleUploadSection = () => {
    setIsUploadExpanded(!isUploadExpanded);
  };

  const toggleBulkActions = () => {
    setShowBulkActions(!showBulkActions);
  };

  const toggleSortDropdown = () => {
    setShowSortDropdown(!showSortDropdown);
  };

  const handleUploadImages = async () => {
    if (uploadedImages.length === 0 || !selectedProject || !selectedEvent) {
      alert('No images to upload');
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('projectId', selectedProject.projectId);
      formData.append('clientEventId', selectedEvent.clientEventId);

      // Add all files
      uploadedImages.forEach((img) => {
        if (img.file) {
          formData.append('images', img.file);
        }
      });

      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      console.log('[Upload] Token exists:', !!token);
      console.log('[Upload] Token preview:', token?.substring(0, 20));
      
      if (!token) {
        alert('You are not logged in. Please login again.');
        return;
      }

      const response = await fetch('http://localhost:4000/upload-batch-images', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const result = await response.json();
      console.log('[Upload] Response:', response.status, result);

      if (response.ok) {
        alert(`Successfully uploaded ${result.stats.successful} of ${result.stats.total} images!`);
        
        // Clean up blob URLs
        uploadedImages.forEach((img) => {
          if (img.url.startsWith('blob:')) {
            URL.revokeObjectURL(img.url);
          }
        });
        
        // Clear uploaded images
        setUploadedImages([]);
        setIsUploadExpanded(false);
        
        // Optionally refresh the images list
        // fetchAllImages();
      } else {
        alert(`Upload failed: ${result.message}`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload images. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSelectImage = (imageId: string) => {
    const newSelected = new Set(selectedImages);
    if (newSelected.has(imageId)) {
      newSelected.delete(imageId);
    } else {
      newSelected.add(imageId);
    }
    setSelectedImages(newSelected);
  };

  const selectAllImages = () => {
    const eventImages = getPlaceholderImages();
    if (selectedImages.size === eventImages.length) {
      setSelectedImages(new Set());
    } else {
      setSelectedImages(new Set(eventImages.map(img => img.imageId)));
    }
  };

  const filteredItems = useMemo(() => {
    const items = selectedProject ? events : projects;
    let filtered = [...items];

    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter((item: any) => {
        if (selectedProject) {
          const eventName = eventTypes.get(item.eventId)?.eventDesc || '';
          return eventName.toLowerCase().includes(searchLower);
        }
        return item.projectName?.toLowerCase().includes(searchLower);
      });
    }

    // Sort
    filtered.sort((a: any, b: any) => {
      switch (sortBy) {
        case 'nameAZ':
          const nameA = selectedProject ? (eventTypes.get(a.eventId)?.eventDesc || '') : (a.projectName || '');
          const nameB = selectedProject ? (eventTypes.get(b.eventId)?.eventDesc || '') : (b.projectName || '');
          return nameA.localeCompare(nameB);
        case 'nameZA':
          const nameA2 = selectedProject ? (eventTypes.get(a.eventId)?.eventDesc || '') : (a.projectName || '');
          const nameB2 = selectedProject ? (eventTypes.get(b.eventId)?.eventDesc || '') : (b.projectName || '');
          return nameB2.localeCompare(nameA2);
        case 'oldest':
          const dateA = new Date(a.createdAt || a.fromDatetime || 0);
          const dateB = new Date(b.createdAt || b.fromDatetime || 0);
          return dateA.getTime() - dateB.getTime();
        case 'recent':
        default:
          const dateA2 = new Date(a.createdAt || a.fromDatetime || 0);
          const dateB2 = new Date(b.createdAt || b.fromDatetime || 0);
          return dateB2.getTime() - dateA2.getTime();
      }
    });

    return filtered;
  }, [selectedProject, events, projects, searchTerm, sortBy]);

  // Pagination
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedItems = filteredItems.slice(startIndex, endIndex);

  const handleToggleMenu = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenMenuId(openMenuId === id ? null : id);
  };

  const getFirstEventForProject = (projectId: string) => {
    const projectEvents = allEvents
      .filter(event => event.projectId === projectId)
      .sort((a, b) => {
        const dateA = a.fromDatetime ? new Date(a.fromDatetime).getTime() : 0;
        const dateB = b.fromDatetime ? new Date(b.fromDatetime).getTime() : 0;
        return dateA - dateB;
      });
    return projectEvents[0] || null;
  };

  const getProjectImageCount = (projectId: string) => {
    return allImages.filter(image => image.projectId === projectId).length;
  };

  const getEventImageCount = (clientEventId: string) => {
    return allImages.filter(image => image.clientEventId === clientEventId).length;
  };

  const getTimeAgo = (date: string | undefined) => {
    if (!date) return 'Recently';
    const now = new Date();
    const then = new Date(date);
    const diffMs = now.getTime() - then.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };

  // Generate random placeholder images
  const getPlaceholderImages = (count: number = 24) => {
    return Array.from({ length: count }, (_, i) => ({
      imageId: `placeholder-${i}`,
      url: `https://picsum.photos/seed/${i}/800/600`,
      thumbnailUrl: `https://picsum.photos/seed/${i}/400/300`,
    }));
  };

  if (isLoading) {
    return (
      <div className={styles.albumsContainer}>
        <Breadcrumb />
        <div className={styles.loading}>
          <div>
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            <p style={{ marginTop: '1rem', fontSize: '0.875rem' }}>Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  // Album Detail View
  if (selectedEvent && selectedProject) {
    console.log('Rendering album detail view', { selectedEvent, selectedProject });
    const eventImages = getPlaceholderImages();
    const eventName = eventTypes.get(selectedEvent.eventId)?.eventDesc || 'Event';

    return (
      <div className={styles.albumsContainer}>
        <Breadcrumb 
          items={[
            { label: 'Albums', onClick: () => { 
              setSelectedEvent(null); 
              setSelectedProject(null); 
              setUploadedImages([]); 
              setIsUploadExpanded(false);
            } },
            { label: selectedProject.projectName, onClick: handleCloseAlbum },
            { label: eventName }
          ]}
        />

        {/* Collapsible Upload Section */}
        <div 
          className={`${
            styles.uploadContainer
          } ${isUploadExpanded ? styles.uploadContainerExpanded : ''}`}
        >
          {/* Collapsed Header */}
          <button
            onClick={toggleUploadSection}
            className={styles.uploadHeader}
          >
            <div className={styles.uploadHeaderLeft}>
              <svg
                className={`${styles.uploadChevron} ${isUploadExpanded ? styles.uploadChevronExpanded : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
              <div className={styles.uploadHeaderIcon}>
                <svg
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
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
                  {isUploadExpanded
                    ? 'Drag and drop files or click Choose Files'
                    : 'Click to expand upload area'}
                </p>
              </div>
            </div>
          </button>

          {/* Upload Area (Collapsible) */}
          <div
            className={`${styles.uploadSection} ${isUploadExpanded ? styles.uploadSectionExpanded : ''}`}
          >
            <div className={styles.uploadSectionInner}>
              <div className={styles.uploadContent}>
                <div className={styles.uploadContentInner}>
                  {/* Initial Upload UI */}
                  {uploadedImages.length === 0 && (
                    <div>
                      <svg
                        className={styles.uploadIcon}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                        />
                      </svg>
                      <h3 className={styles.uploadTitle}>
                        Drag and drop images here
                      </h3>
                      <p className={styles.uploadDescription}>
                        or click to browse from your computer
                      </p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleFileSelect}
                        style={{ display: 'none' }}
                      />
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className={styles.chooseFilesButton}
                      >
                        <svg
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 4v16m8-8H4"
                          />
                        </svg>
                        <span>Choose Files</span>
                      </button>
                      <p className={styles.uploadHint}>
                        Supports: JPG, PNG, HEIC, RAW files up to 50MB each
                      </p>
                    </div>
                  )}

                  {/* Preview Grid */}
                  {uploadedImages.length > 0 && (
                    <>
                      <div className={styles.uploadPreview}>
                        {uploadedImages.map((image) => (
                          <div key={image.id} className={styles.uploadPreviewItem}>
                            <img src={image.url} alt="Upload preview" />
                            <button
                              className={styles.removeImageButton}
                              onClick={() => handleRemoveImage(image.id)}
                              title="Remove image"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>

                      <div className={styles.uploadActions}>
                        <button 
                          className={styles.saveButton}
                          onClick={handleUploadImages}
                          disabled={isUploading}
                        >
                          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          {isUploading ? 'Uploading...' : `Save ${uploadedImages.length} ${uploadedImages.length === 1 ? 'Image' : 'Images'}`}
                        </button>
                        <button
                          className={styles.cancelButton}
                          onClick={() => {
                            uploadedImages.forEach((img) => {
                              if (img.url.startsWith('blob:')) {
                                URL.revokeObjectURL(img.url);
                              }
                            });
                            setUploadedImages([]);
                          }}
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className={styles.addMoreButton}
                        >
                          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          Add More
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Existing Images */}
        <div className={styles.divider}></div>

        {/* Bulk Actions and Filters */}
        <div className={styles.actionsSection}>
          <div className={styles.actionsLeft}>
            {/* Bulk Actions Dropdown */}
            <div className={styles.bulkActionsContainer} ref={bulkActionsRef}>
              <button
                className={`${styles.bulkActionsButton} ${selectedImages.size === 0 ? styles.disabled : ''}`}
                onClick={toggleBulkActions}
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
              {showBulkActions && (
                <div className={styles.dropdown}>
                  <button className={styles.dropdownItem}>
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    <span>Download Selected</span>
                  </button>
                  <button className={styles.dropdownItem}>
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    <span>Mark as Favorites</span>
                  </button>
                  <button className={styles.dropdownItem}>
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Send for Review</span>
                  </button>
                  <button className={styles.dropdownItem}>
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Approve for Album</span>
                  </button>
                  <button className={styles.dropdownItem}>
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <span>Comment</span>
                  </button>
                  <div className={styles.dropdownDivider}></div>
                  <button className={`${styles.dropdownItem} ${styles.delete}`}>
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    <span>Delete Selected</span>
                  </button>
                </div>
              )}
            </div>

            {/* Sort Dropdown */}
            <div className={styles.sortContainer} ref={sortDropdownRef}>
              <button className={styles.sortButton} onClick={toggleSortDropdown}>
                <span>Sort by</span>
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {showSortDropdown && (
                <div className={styles.dropdown}>
                  <button className={styles.dropdownItem}>
                    <span>Name</span>
                  </button>
                  <button className={styles.dropdownItem}>
                    <span>Date</span>
                  </button>
                  <button className={styles.dropdownItem}>
                    <span>Size</span>
                  </button>
                </div>
              )}
            </div>

            {/* Selection Counter */}
            <div className={styles.selectionCounter}>
              <span>{selectedImages.size}</span> / <span>{getPlaceholderImages().length}</span> selected
            </div>

            {/* Select All Button */}
            <button className={styles.selectAllButton} onClick={selectAllImages}>
              {selectedImages.size === getPlaceholderImages().length ? 'Deselect All' : 'Select All'}
            </button>
          </div>
        </div>

        <div className={styles.imagesHeader}>
          <h2 className={styles.imagesTitle}>{eventName} ({eventImages.length})</h2>
        </div>

        <div className={styles.imageGrid}>
          {eventImages.map((image) => (
            <div key={image.imageId} className={styles.imageItem}>
              <div className={styles.imageCheckbox}>
                <input
                  type="checkbox"
                  checked={selectedImages.has(image.imageId)}
                  onChange={() => handleSelectImage(image.imageId)}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
              <img src={image.thumbnailUrl} alt="Photo" />
              <div className={styles.imageOverlay}>
                <button className={styles.imageButton}>
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </button>
                <button className={styles.imageButton}>
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.albumsContainer}>
      {selectedProject ? (
        <Breadcrumb 
          items={[
            { label: 'Albums', onClick: handleBackToProjects },
            { label: selectedProject.projectName }
          ]}
        />
      ) : (
        <Breadcrumb />
      )}

      <div className={styles.header}>
        <div className={styles.filterSection}>
          <div className={styles.filtersLeft}>
            {/* Search */}
            <Input
              type="text"
              placeholder={selectedProject ? 'Search events...' : 'Search projects...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: '18px', height: '18px' }}>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              }
              style={{ minWidth: '280px' }}
            />

            {/* Sort */}
            <div style={{ position: 'relative', minWidth: '180px' }}>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 32px 8px 12px',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  backgroundColor: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  fontSize: '14px',
                  cursor: 'pointer',
                  appearance: 'none',
                  outline: 'none',
                }}
              >
                <option value="recent">Sort: Recent</option>
                <option value="nameAZ">Sort: Name A-Z</option>
                <option value="nameZA">Sort: Name Z-A</option>
                <option value="oldest">Sort: Date Oldest</option>
              </select>
              <svg
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '16px',
                  height: '16px',
                  pointerEvents: 'none',
                  color: 'var(--text-secondary)',
                }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Projects Grid */}
      {!selectedProject && (
        <div className={`${styles.viewContainer} ${isTransitioning ? styles.viewExiting : styles.viewEntering}`}>
          {paginatedItems.length === 0 ? (
          <div className={styles.emptyState}>
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
              <h3>No projects found</h3>
              <p>Start by creating your first project</p>
            </div>
          ) : (
            <div className={styles.projectsGrid}>
              {paginatedItems.map((project: any) => (
                <div key={project.projectId} className={styles.card}>
                  <div className={styles.cardImage} onClick={() => handleProjectClick(project)}>
                    <img
                      src={project.coverPhoto || 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=500&h=400&fit=crop'}
                      alt={project.projectName}
                    />
                  </div>

                  <div className={styles.cardContent}>
                    <div className={styles.cardMenu} ref={openMenuId === project.projectId ? menuRef : null}>
                      <button
                        className={styles.menuButton}
                        onClick={(e) => handleToggleMenu(project.projectId, e)}
                      >
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z"
                          />
                        </svg>
                      </button>
                      {openMenuId === project.projectId && (
                        <div className={styles.menuDropdown}>
                          <button className={styles.menuItem}>
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                              />
                            </svg>
                            Download as ZIP
                          </button>
                          <button className={styles.menuItem}>
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                              />
                            </svg>
                            Copy Client Website
                          </button>
                        </div>
                      )}
                    </div>

                    <div
                      className={styles.cardTitle}
                      onClick={() => handleProjectClick(project)}
                    >
                      {project.projectName}
                    </div>
                    <div className={styles.cardSubtitle}>
                      {(() => {
                        const firstEvent = getFirstEventForProject(project.projectId);
                        if (firstEvent && firstEvent.fromDatetime) {
                          const eventName = eventTypes.get(firstEvent.eventId)?.eventDesc || 'Event';
                          const formattedDate = new Date(firstEvent.fromDatetime).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          });
                          return `${eventName} • ${formattedDate}`;
                        }
                        return 'No events';
                      })()}
                    </div>

                    <div className={styles.cardStats}>
                      {(() => {
                        const photoCount = getProjectImageCount(project.projectId);
                        return (
                          <div className={styles.statItem}>
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                              />
                            </svg>
                            <span>{photoCount === 0 ? 'No photos' : `${photoCount} ${photoCount === 1 ? 'photo' : 'photos'}`}</span>
                          </div>
                        );
                      })()}
                      <div className={styles.timeAgo}>
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <span>{getTimeAgo(project.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Events Grid */}
      {selectedProject && !selectedEvent && (
        <div className={`${styles.viewContainer} ${isTransitioning ? styles.viewExiting : styles.viewEntering}`}>
          {paginatedItems.length === 0 ? (
            <div className={styles.emptyState}>
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <h3>No events found</h3>
              <p>This project doesn't have any events yet</p>
            </div>
          ) : (
            <div className={styles.eventsGrid}>
              {paginatedItems.map((event: any) => (
                <div 
                  key={event.clientEventId} 
                  className={styles.card}
                  onClick={() => {
                    console.log('Card clicked!', event);
                    handleEventClick(event);
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  <div className={styles.cardImage}>
                    <img
                      src={event.coverImage || 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=500&h=400&fit=crop'}
                      alt={eventTypes.get(event.eventId)?.eventDesc || 'Event'}
                    />
                  </div>

                  <div className={styles.cardContent}>
                    <div className={styles.cardMenu} ref={openMenuId === event.clientEventId ? menuRef : null}>
                      <button
                        className={styles.menuButton}
                        onClick={(e) => handleToggleMenu(event.clientEventId, e)}
                      >
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z"
                          />
                        </svg>
                      </button>
                      {openMenuId === event.clientEventId && (
                        <div className={styles.menuDropdown}>
                          <button className={styles.menuItem}>
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                              />
                            </svg>
                            Download as ZIP
                          </button>
                          <button className={styles.menuItem}>
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                              />
                            </svg>
                            Upload Photos
                          </button>
                        </div>
                      )}
                    </div>

                    <div className={styles.cardTitle}>
                      {eventTypes.get(event.eventId)?.eventDesc || 'Untitled Event'}
                    </div>
                    <div className={styles.cardSubtitle}>
                      {event.fromDatetime
                        ? new Date(event.fromDatetime).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })
                        : 'No date'}
                    </div>

                    <div className={styles.cardStats}>
                      {(() => {
                        const photoCount = getEventImageCount(event.clientEventId);
                        return (
                          <div className={styles.statItem}>
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                              />
                            </svg>
                            <span>{photoCount === 0 ? 'No photos' : `${photoCount} ${photoCount === 1 ? 'photo' : 'photos'}`}</span>
                          </div>
                        );
                      })()}
                      <div className={styles.timeAgo}>
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <span>{getTimeAgo(event.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      {filteredItems.length > 0 && (
        <div className={styles.pagination}>
          <div className={styles.paginationInfo}>
            Showing <span>{startIndex + 1}-{Math.min(endIndex, filteredItems.length)}</span> of{' '}
            <span>{filteredItems.length}</span> {selectedProject ? 'events' : 'projects'}
          </div>

          <div className={styles.paginationControls}>
            <button
              className={styles.pageButton}
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(currentPage - 1)}
            >
              Previous
            </button>

            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                className={`${styles.pageButton} ${currentPage === page ? styles.active : ''}`}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </button>
            ))}

            <button
              className={styles.pageButton}
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(currentPage + 1)}
            >
              Next
            </button>
          </div>

          <div className={styles.perPageSelector}>
            <span>{selectedProject ? 'Events' : 'Projects'} per page:</span>
            <select value={itemsPerPage} onChange={(e) => setItemsPerPage(Number(e.target.value))}>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={30}>30</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
};

export default Albums;

