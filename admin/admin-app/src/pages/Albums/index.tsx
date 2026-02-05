import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AlbumPdfUploadManager, Breadcrumb, Input, Loading, Modal, SearchableSelect } from '../../components/ui/index.js';
import type { AlbumPdfUploadManagerHandle } from '../../components/ui/index.js';
import { ConfirmationModal } from '../../components/ui/ConfirmationModal.js';
import { DotLoader } from '../../components/ui/DotLoader.js';
import { StatusBadge } from '../../components/ui/StatusBadge.js';
import { CommentModal } from '../../components/ui/CommentModal.js';
import ReuploadModal from '../../components/ui/ReuploadModal';
import { StorageLimitModal } from '../../components/modals/StorageLimitModal';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../hooks/useAuth.js';
import { useAlbumPdfsByEvent } from '../../hooks/useAlbumPdfs';
import { projectApi, clientEventApi, eventApi, imageApi, imageStatusApi, eventDeliveryStatusApi, storageApi } from '../../services/api';
import type { ClientEventSummary as ClientEvent, ProjectSummary as Project } from '../../types/albums.js';
import ImageViewer from '../../components/ImageViewer';
import styles from './Albums.module.css';
import { AlbumPdfInfo, EventMenuDropdown, EventDateTime, VideosCard, VideosView } from './components';

const Albums = () => {
  const [searchParams] = useSearchParams();
  const { showToast } = useToast();
  const { isAdmin, user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [events, setEvents] = useState<ClientEvent[]>([]);
  const [allEvents, setAllEvents] = useState<ClientEvent[]>([]);
  const [allImages, setAllImages] = useState<any[]>([]);
  const [eventTypes, setEventTypes] = useState<Map<string, any>>(new Map());
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<ClientEvent | null>(null);
  
  // Fetch album PDFs for the selected event
  const { albumPdfs, refetch: refetchAlbumPdfs } = useAlbumPdfsByEvent(selectedEvent?.clientEventId || null);
  const currentAlbumPdf = albumPdfs.length > 0 ? albumPdfs[0] : null;
  
  const [isLoading, setIsLoading] = useState(true);
  const [showContent, setShowContent] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('default');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<Array<{ id: string; url: string; file?: File }>>([]);
  const [loadedUploadImages, setLoadedUploadImages] = useState<Set<string>>(new Set());
  const [isUploadExpanded, setIsUploadExpanded] = useState(false);
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [isDownloadingSelected, setIsDownloadingSelected] = useState(false);
  const [downloadingEventId, setDownloadingEventId] = useState<string | null>(null);
  const [downloadingDesignEventId, setDownloadingDesignEventId] = useState<string | null>(null);
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedCount, setUploadedCount] = useState(0);
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
  const [galleryImages, setGalleryImages] = useState<any[]>([]);
  const [isLoadingGallery, setIsLoadingGallery] = useState(false);
  const [loadedGalleryImages, setLoadedGalleryImages] = useState<Set<string>>(new Set());
  const [isLoadingGalleryPreviews, setIsLoadingGalleryPreviews] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [draggedImageId, setDraggedImageId] = useState<string | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [hasUnsavedOrder, setHasUnsavedOrder] = useState(false);
  const [isSavingOrder, setIsSavingOrder] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showPropertiesModal, setShowPropertiesModal] = useState(false);
  const [propertiesData, setPropertiesData] = useState<any>(null);
  const [loadingProperties, setLoadingProperties] = useState(false);
  const [imageStatuses, setImageStatuses] = useState<any[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [isRequestingReEdit, setIsRequestingReEdit] = useState(false);
  const [showReuploadModal, setShowReuploadModal] = useState(false);
  const [isReuploadingImages, setIsReuploadingImages] = useState(false);
  const [reuploadErrors, setReuploadErrors] = useState<Array<{ fileName: string; message: string }>>([]);
  const [showCommentViewModal, setShowCommentViewModal] = useState(false);
  const [viewingComment, setViewingComment] = useState<string>('');
  const [isApprovingImages, setIsApprovingImages] = useState(false);
  const [showStorageLimitModal, setShowStorageLimitModal] = useState(false);
  const [storageLimitInfo, setStorageLimitInfo] = useState<{ currentPlan: string; isEnterprise: boolean } | null>(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [publishAfterApprove, setPublishAfterApprove] = useState(false);
  const [eventDeliveryStatuses, setEventDeliveryStatuses] = useState<Map<string, any>>(new Map());
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showVideosView, setShowVideosView] = useState(false);
  const [selectedEventForStatus, setSelectedEventForStatus] = useState<ClientEvent | null>(null);
  const [newStatusId, setNewStatusId] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [statusError, setStatusError] = useState('');
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [selectedEventForPublish, setSelectedEventForPublish] = useState<ClientEvent | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishConfirmed, setPublishConfirmed] = useState(true);
  const [publishError, setPublishError] = useState('');
  const [approvedPhotosCount, setApprovedPhotosCount] = useState(0);
  const [showStatusLegend, setShowStatusLegend] = useState(false);
  const [focusedImageIndex, setFocusedImageIndex] = useState<number>(-1);
  const [showCoverPreviewModal, setShowCoverPreviewModal] = useState(false);
  const [selectedCoverDevice, setSelectedCoverDevice] = useState<'mobile' | 'tablet' | 'desktop' | null>(null);
  const [isSettingCover, setIsSettingCover] = useState(false);
  const [isPreparingImages, setIsPreparingImages] = useState(false);
  const preparingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const uploadAbortRef = useRef(false);
  const uploadAbortControllerRef = useRef<AbortController | null>(null);
  const publishStateStepNumber = useMemo(() => {
    for (const status of eventDeliveryStatuses.values()) {
      if (status.statusCode === 'PUBLISHED') {
        return status.step;
      }
    }
    return null;
  }, [eventDeliveryStatuses]);

  const currentEventStepNumber = useMemo(() => {
    if (!selectedEvent?.eventDeliveryStatusId) return null;
    const currentStatus = eventDeliveryStatuses.get(selectedEvent.eventDeliveryStatusId);
    return currentStatus?.step ?? null;
  }, [selectedEvent, eventDeliveryStatuses]);

  const canPublishAfterApprove =
    publishStateStepNumber !== null &&
    currentEventStepNumber !== null &&
    currentEventStepNumber < publishStateStepNumber;

  const selectedEventStatus = useMemo(() => {
    if (!selectedEvent?.eventDeliveryStatusId) return null;
    return eventDeliveryStatuses.get(selectedEvent.eventDeliveryStatusId) || null;
  }, [selectedEvent, eventDeliveryStatuses]);


  useEffect(() => {
    if (!canPublishAfterApprove && publishAfterApprove) {
      setPublishAfterApprove(false);
    }
  }, [canPublishAfterApprove, publishAfterApprove]);
  const menuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bulkActionsRef = useRef<HTMLDivElement>(null);
  const sortDropdownRef = useRef<HTMLDivElement>(null);
  const statusDropdownRef = useRef<HTMLDivElement>(null);
  const statusLegendRef = useRef<HTMLDivElement>(null);
  const albumPdfUploadManagerRef = useRef<AlbumPdfUploadManagerHandle>(null);

  useEffect(() => {
    const urlProjectId = searchParams.get('projectId');
    const urlEventId = searchParams.get('eventId');
    
    if (urlEventId) {
      // If URL has eventId, load project and select event directly
      fetchProjectsAndSelectEvent(urlEventId);
    } else if (urlProjectId) {
      // If URL has projectId, skip showing projects view and load project directly
      fetchProjectsAndSelectOne(urlProjectId);
    } else {
      // Normal flow - show projects view
      fetchProjects();
    }
    
    fetchEventTypes();
    fetchEventDeliveryStatuses();
    fetchAllEvents();
    fetchAllImages();
    fetchImageStatuses();
  }, []);

  useEffect(() => {
    // Check storage status when upload section is expanded
    const checkStorageStatus = async () => {
      if (isUploadExpanded && user?.tenantId && !showStorageLimitModal) {
        try {
          // Check if current storage already exceeds limit (0 bytes upload check)
          const storageCheck = await storageApi.checkUpload(user.tenantId, 0);
          console.log('Storage status check on expand:', storageCheck);
          
          if (!storageCheck.canUpload) {
            console.log('Storage already exceeded - showing warning');
            const stats = await storageApi.getStats(user.tenantId);
            const isEnterprise = stats.planName?.toUpperCase() === 'ENTERPRISE';
            
            setStorageLimitInfo({
              currentPlan: stats.planName || 'FREE',
              isEnterprise
            });
            setShowStorageLimitModal(true);
          }
        } catch (error: any) {
          console.error('Error checking storage status:', error);
          console.error('Error details:', error.message, error.stack);
        }
      }
    };

    checkStorageStatus();
  }, [isUploadExpanded, user?.tenantId]);

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
      
      // Close status dropdown
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(target)) {
        setShowStatusDropdown(false);
      }
      
      // Close status legend popover
      if (statusLegendRef.current && !statusLegendRef.current.contains(target)) {
        setShowStatusLegend(false);
      }
    };

    if (openMenuId || showBulkActions || showSortDropdown || showStatusDropdown || showStatusLegend) {
      setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
      }, 0);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openMenuId, showBulkActions, showSortDropdown, showStatusDropdown, showStatusLegend]);

  // Hide preparing state when images are added
  useEffect(() => {
    console.log('uploadedImages changed:', uploadedImages.length, 'isPreparingImages:', isPreparingImages);
    if (uploadedImages.length > 0 && isPreparingImages) {
      console.log('Hiding preparing state - images are ready');
      setIsPreparingImages(false);
      if (preparingTimerRef.current) {
        clearTimeout(preparingTimerRef.current);
        preparingTimerRef.current = null;
      }
    }
    // Reset loaded images when upload images change
    if (uploadedImages.length === 0) {
      setLoadedUploadImages(new Set());
    }
  }, [uploadedImages.length, isPreparingImages]);

  const fetchProjects = async () => {
    setIsLoading(true);
    setShowContent(false);
    try {
      const response = await projectApi.getAll();
      setProjects(response.projects || []);
      // Delay showing content to ensure smooth animation
      setTimeout(() => setShowContent(true), 150);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProjectsAndSelectOne = async (projectId: string) => {
    setIsLoading(true);
    try {
      const response = await projectApi.getAll();
      const allProjects = response.projects || [];
      setProjects(allProjects);
      
      const project = allProjects.find((p: Project) => p.projectId === projectId);
      if (project) {
        // Directly set selected project without transitions
        setSelectedProject(project);
        setShowVideosView(false);
        setSearchTerm('');
        setCurrentPage(1);
        
        // Fetch events for the project
        const eventsResponse = await clientEventApi.getAll();
        const projectEvents = (eventsResponse.clientEvents || []).filter(
          (event: ClientEvent) => event.projectId === projectId
        );
        setEvents(projectEvents);
        setShowContent(true);
      } else {
        // If project not found, show projects view
        setTimeout(() => setShowContent(true), 150);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProjectsAndSelectEvent = async (eventId: string) => {
    setIsLoading(true);
    try {
      const response = await projectApi.getAll();
      const allProjects = response.projects || [];
      setProjects(allProjects);
      
      // Fetch all events
      const eventsResponse = await clientEventApi.getAll();
      const allClientEvents = eventsResponse.clientEvents || [];
      
      // Find the event
      const event = allClientEvents.find((e: ClientEvent) => e.clientEventId === eventId);
      if (event) {
        // Find the project for this event
        const project = allProjects.find((p: Project) => p.projectId === event.projectId);
        if (project) {
          // Set project and event
          setSelectedProject(project);
          setShowVideosView(false);
          setSearchTerm('');
          setCurrentPage(1);
          
          // Filter events for this project
          const projectEvents = allClientEvents.filter(
            (e: ClientEvent) => e.projectId === event.projectId
          );
          setEvents(projectEvents);
          
          // Select the specific event
          setSelectedEvent(event);
          setIsUploadExpanded(false);
          setUploadedImages([]);
          setGalleryImages([]);
          
          // Load images for the event
          await fetchGalleryImages(event.clientEventId);
          
          setShowContent(true);
        } else {
          // If project not found, show projects view
          setTimeout(() => setShowContent(true), 150);
        }
      } else {
        // If event not found, show projects view
        setTimeout(() => setShowContent(true), 150);
      }
    } catch (error) {
      console.error('Error fetching projects and event:', error);
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

  const fetchImageStatuses = async () => {
    try {
      const response = await imageStatusApi.getAll();
      setImageStatuses(response.imageStatuses || []);
    } catch (error) {
      console.error('Error fetching image statuses:', error);
    }
  };

  const fetchEventDeliveryStatuses = async () => {
    try {
      const response = await eventDeliveryStatusApi.getAll();
      const statusesMap = new Map();
      (response.eventDeliveryStatuses || []).forEach((status: any) => {
        statusesMap.set(status.statusId, status);
      });
      setEventDeliveryStatuses(statusesMap);
    } catch (error) {
      console.error('Error fetching event delivery statuses:', error);
    }
  };

  const fetchProjectEvents = async (projectId: string) => {
    setIsLoading(true);
    setShowContent(false);
    try {
      const response = await clientEventApi.getAll();
      const projectEvents = (response.clientEvents || []).filter(
        (event: ClientEvent) => event.projectId === projectId
      );
      setEvents(projectEvents);
      // Delay showing content to ensure smooth animation
      setTimeout(() => setShowContent(true), 150);
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
      setShowVideosView(false);
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
      setShowVideosView(false);
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
    setGalleryImages([]);
    fetchGalleryImages(event.clientEventId);
    console.log('Selected event set to:', event);
  };

  const handleCloseAlbum = () => {
    console.log('handleCloseAlbum called');
    setSelectedEvent(null);
    setUploadedImages([]);
    setIsUploadExpanded(false);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    
    console.log('handleFileSelect called, files:', files?.length);
    
    // Clear timer if files are selected
    if (preparingTimerRef.current) {
      console.log('Clearing preparing timer');
      clearTimeout(preparingTimerRef.current);
      preparingTimerRef.current = null;
    }
    
    if (!files || files.length === 0) {
      console.log('No files, hiding preparing');
      setIsPreparingImages(false);
      return;
    }

    // Check storage before allowing upload
    try {
      const totalSize = Array.from(files).reduce((sum, file) => sum + file.size, 0);
      console.log('Checking storage for upload. Total size:', totalSize, 'bytes');
      const storageCheck = await storageApi.checkUpload(user?.tenantId!, totalSize);
      console.log('Storage check result:', storageCheck);
      
      if (!storageCheck.canUpload) {
        console.log('Storage limit exceeded - showing modal');
        // Get current storage stats to show plan info
        const stats = await storageApi.getStats(user?.tenantId!);
        const isEnterprise = stats.planName?.toUpperCase() === 'ENTERPRISE';
        
        setStorageLimitInfo({
          currentPlan: stats.planName || 'FREE',
          isEnterprise
        });
        console.log('Setting showStorageLimitModal to true. Storage info:', {
          currentPlan: stats.planName || 'FREE',
          isEnterprise
        });
        setShowStorageLimitModal(true);
        setIsUploadExpanded(true); // Auto-expand upload section to show the warning
        e.target.value = ''; // Reset input
        setIsPreparingImages(false);
        return;
      }
      console.log('Storage check passed - proceeding with upload');
    } catch (error) {
      console.error('Error checking storage:', error);
      showToast('error', 'Failed to check storage availability');
      e.target.value = '';
      setIsPreparingImages(false);
      return;
    }

    const newImages = Array.from(files).map((file) => {
      // Validate file type
      if (!file.type.startsWith('image/')) {
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

    console.log('Created', newImages.length, 'image previews, adding to state');
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
    setLoadedUploadImages((prev) => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
  };

  const handleUploadImageLoad = (imageId: string) => {
    setLoadedUploadImages((prev) => new Set(prev).add(imageId));
  };

  const fetchGalleryImages = async (clientEventId: string) => {
    try {
      setIsLoadingGallery(true);
      setLoadedGalleryImages(new Set());
      
      const data = await imageApi.getByClientEvent(clientEventId);
      setGalleryImages(data.images || []);
      if (data.images && data.images.length > 0) {
        setIsLoadingGalleryPreviews(true);
      }
    } catch (error) {
      console.error('Error fetching gallery images:', error);
      setGalleryImages([]);
    } finally {
      setIsLoadingGallery(false);
    }
  };

  // Silent refresh - updates gallery without showing loading states
  const refreshGallerySilently = async (clientEventId: string) => {
    try {
      const data = await imageApi.getByClientEvent(clientEventId);
      setGalleryImages(data.images || []);
    } catch (error) {
      console.error('Error refreshing gallery images:', error);
    }
  };

  const handleGalleryImageLoad = (imageId: string) => {
    setLoadedGalleryImages((prev) => {
      const newSet = new Set(prev).add(imageId);
      // Check if all images are loaded
      if (newSet.size === galleryImages.length) {
        setIsLoadingGalleryPreviews(false);
      }
      return newSet;
    });
  };

  const handleOpenViewer = (index: number) => {
    console.log('handleOpenViewer called with index:', index);
    setCurrentImageIndex(index);
    setViewerOpen(true);
  };

  const handleCloseViewer = () => {
    console.log('handleCloseViewer called');
    setViewerOpen(false);
  };

  const handleNavigateViewer = (newIndex: number) => {
    setCurrentImageIndex(newIndex);
  };

  const handleDragStart = (e: React.DragEvent, imageId: string) => {
    setDraggedImageId(imageId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = async (e: React.DragEvent, targetImageId: string) => {
    e.preventDefault();
    
    if (!draggedImageId || draggedImageId === targetImageId) {
      setDraggedImageId(null);
      setDragOverIndex(null);
      return;
    }

    // Find indices in the actual galleryImages array
    const draggedIndex = galleryImages.findIndex(img => img.imageId === draggedImageId);
    const targetIndex = galleryImages.findIndex(img => img.imageId === targetImageId);
    
    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedImageId(null);
      setDragOverIndex(null);
      return;
    }

    // Reorder the images array
    const newImages = [...galleryImages];
    const [draggedImage] = newImages.splice(draggedIndex, 1);
    newImages.splice(targetIndex, 0, draggedImage);

    // Update state immediately for smooth UX
    setGalleryImages(newImages);
    setDraggedImageId(null);
    setDragOverIndex(null);
    setHasUnsavedOrder(true);
  };

  const handleSaveSortOrder = async () => {
    if (!selectedEvent || !hasUnsavedOrder) return;

    setIsSavingOrder(true);
    try {
      const imageIds = galleryImages.map(img => img.imageId);
      await imageApi.reorderImages({
        clientEventId: selectedEvent.clientEventId,
        imageIds
      });

      // Update the sortOrder in galleryImages to match the new order
      const updatedImages = galleryImages.map((img, index) => ({
        ...img,
        sortOrder: index
      }));
      setGalleryImages(updatedImages);
      setHasUnsavedOrder(false);
      showToast('success', 'Image order saved successfully');
    } catch (error) {
      console.error('Error updating image order:', error);
      showToast('error', 'Failed to save image order');
      // Revert on error
      if (selectedEvent) {
        fetchGalleryImages(selectedEvent.clientEventId);
      }
    } finally {
      setIsSavingOrder(false);
    }
  };

  const handleDragEnd = () => {
    setDraggedImageId(null);
    setDragOverIndex(null);
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

  const handleSortChange = (sortOption: string) => {
    setSortBy(sortOption);
    setShowSortDropdown(false);
  };

  const getSortedImages = (images: any[]) => {
    const sorted = [...images];
    
    if (sortBy === 'default') {
      // If there are unsaved changes, use the current array order
      // Otherwise, use the sortOrder field from database
      if (!hasUnsavedOrder) {
        sorted.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
      }
    } else if (sortBy === 'name') {
      sorted.sort((a, b) => {
        const nameA = (a.fileName || '').toLowerCase();
        const nameB = (b.fileName || '').toLowerCase();
        return nameA.localeCompare(nameB);
      });
    } else if (sortBy === 'date-latest') {
      sorted.sort((a, b) => {
        const dateA = new Date(a.editedAt || a.capturedAt || a.uploadedAt || 0).getTime();
        const dateB = new Date(b.editedAt || b.capturedAt || b.uploadedAt || 0).getTime();
        return dateB - dateA; // Latest first (descending)
      });
    } else if (sortBy === 'date-oldest') {
      sorted.sort((a, b) => {
        const dateA = new Date(a.editedAt || a.capturedAt || a.uploadedAt || 0).getTime();
        const dateB = new Date(b.editedAt || b.capturedAt || b.uploadedAt || 0).getTime();
        return dateA - dateB; // Oldest first (ascending)
      });
    }
    
    return sorted;
  };

  const sanitizeFileName = (fileName?: string, fallback = 'image.jpg') => {
    const baseName = fileName?.trim() || fallback;
    return baseName.replace(/[\\/:*?"<>|]+/g, '_');
  };

  const downloadImageFile = async (url: string | undefined, fileName?: string) => {
    if (!url) {
      throw new Error('Image URL is missing');
    }

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Failed to download image');
    }

    const blob = await response.blob();
    const objectUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = sanitizeFileName(fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(objectUrl);
  };

  const extractFileNameFromContentDisposition = (contentDisposition: string | null) => {
    if (!contentDisposition) return null;

    const filenameStarMatch = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
    if (filenameStarMatch?.[1]) {
      try {
        return decodeURIComponent(filenameStarMatch[1]);
      } catch (error) {
        console.warn('Failed to decode filename from content-disposition header', error);
      }
    }

    const filenameMatch = contentDisposition.match(/filename="?([^";]+)"?/i);
    if (filenameMatch?.[1]) {
      return filenameMatch[1];
    }

    return null;
  };

  const downloadZipFromResponse = async (response: Response, fallbackFileName: string) => {
    const blob = await response.blob();
    const headerFileName = extractFileNameFromContentDisposition(response.headers.get('content-disposition'));
    const sanitizedFileName = sanitizeFileName(headerFileName || fallbackFileName, fallbackFileName);
    const normalizedFileName = sanitizedFileName.toLowerCase().endsWith('.zip')
      ? sanitizedFileName
      : `${sanitizedFileName}.zip`;

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = normalizedFileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const handleBulkDelete = () => {
    if (selectedImages.size === 0) return;
    console.log('Opening delete modal for', selectedImages.size, 'images');
    setShowDeleteModal(true);
  };

  const handleDownloadSelected = async () => {
    if (selectedImages.size === 0 || isDownloadingSelected) return;
    setShowBulkActions(false);
    const imageIds = Array.from(selectedImages);
    setIsDownloadingSelected(true);
    showToast('info', 'Preparing ZIP download...');

    try {
      const projectName = selectedProject?.projectName;
      const eventName = selectedEvent ? eventTypes.get(selectedEvent.eventId)?.eventDesc : undefined;
      const baseZipName = [projectName, eventName, 'selected-images']
        .filter(Boolean)
        .join('-') || 'selected-images';

      const response = await imageApi.downloadSelectedZip(imageIds);
      await downloadZipFromResponse(response, `${baseZipName}.zip`);
      showToast('success', 'Preparing ZIP download. It will start shortly.');
    } catch (error) {
      console.error('Unexpected error during bulk download:', error);
      showToast('error', 'Failed to download the selected images. Please try again.');
    } finally {
      setIsDownloadingSelected(false);
    }
  };

  const handleDownloadEventImages = async (event: ClientEvent) => {
    if (downloadingEventId === event.clientEventId) return;

    setOpenMenuId(null);
    const eventImages = allImages.filter(img => img.clientEventId === event.clientEventId);

    if (eventImages.length === 0) {
      showToast('warning', 'No images available for this event yet.');
      return;
    }

    setDownloadingEventId(event.clientEventId);
    showToast('info', 'Preparing ZIP download...');

    try {
      const projectName =
        (selectedProject && selectedProject.projectId === event.projectId)
          ? selectedProject.projectName
          : projects.find(project => project.projectId === event.projectId)?.projectName;
      const eventName = eventTypes.get(event.eventId)?.eventDesc;
      const baseZipName = [projectName, eventName, 'images']
        .filter(Boolean)
        .join('-') || 'event-images';

      const response = await imageApi.downloadEventZip(event.clientEventId);
      await downloadZipFromResponse(response, `${baseZipName}.zip`);
      showToast('success', 'Preparing ZIP download. It will start shortly.');
    } catch (error) {
      console.error('Error downloading event images:', error);
      showToast('error', 'Failed to download images for this event. Please try again.');
    } finally {
      setDownloadingEventId(null);
    }
  };

  const handleDownloadAlbumDesignImages = async (event: ClientEvent) => {
    if (downloadingDesignEventId === event.clientEventId) return;

    setOpenMenuId(null);
    const clientSelectedStatus = imageStatuses.find(status => status.statusCode === 'CLIENT_SELECTED');
    if (!clientSelectedStatus) {
      showToast('error', 'Client selected status not found.');
      return;
    }

    const selectedImagesForEvent = allImages.filter(
      img => img.clientEventId === event.clientEventId && img.imageStatusId === clientSelectedStatus.statusId
    );

    if (selectedImagesForEvent.length === 0) {
      showToast('warning', 'No client-selected photos available for this event yet.');
      return;
    }

    setDownloadingDesignEventId(event.clientEventId);
    showToast('info', 'Preparing ZIP download...');

    try {
      const imageIds = selectedImagesForEvent.map(img => img.imageId);

      const projectName =
        (selectedProject && selectedProject.projectId === event.projectId)
          ? selectedProject.projectName
          : projects.find(project => project.projectId === event.projectId)?.projectName;
      const eventName = eventTypes.get(event.eventId)?.eventDesc;
      const baseZipName = [projectName, eventName, 'album-design'].filter(Boolean).join('-') || 'album-design-images';

      const response = await imageApi.downloadSelectedZip(imageIds);
      await downloadZipFromResponse(response, `${baseZipName}.zip`);
      showToast('success', 'Preparing ZIP download. It will start shortly.');
    } catch (error) {
      console.error('Error downloading client-selected images:', error);
      showToast('error', 'Failed to download client-selected images. Please try again.');
    } finally {
      setDownloadingDesignEventId(null);
    }
  };

  const openAlbumPdfManagerForEvent = (event: ClientEvent) => {
    setOpenMenuId(null);
    albumPdfUploadManagerRef.current?.openForEvent(event);
  };

  const openAlbumPdfManagerBulk = () => {
    if (!selectedProject || selectedEvent || events.length === 0) return;
    albumPdfUploadManagerRef.current?.openBulk();
  };

  const handleRequestReEdit = () => {
    if (selectedImages.size === 0) return;
    setShowCommentModal(true);
    setShowBulkActions(false);
  };

  const confirmRequestReEdit = async (comment: string) => {
    setIsRequestingReEdit(true);
    try {
      const imageIds = Array.from(selectedImages);
      
      // Find the RE_EDIT_SUGGESTED status
      const reEditStatus = imageStatuses.find(s => s.statusCode === 'RE_EDIT_SUGGESTED');
      if (!reEditStatus) {
        throw new Error('Re-edit status not found');
      }

      await imageApi.bulkUpdate(imageIds, {
        imageStatusId: reEditStatus.statusId,
        comment: comment
      });
      
      // Send notification to editor - get project/event from first image
      try {
        console.log('[Re-edit] Preparing to send notification...');
        console.log('[Re-edit] selectedProject:', selectedProject);
        console.log('[Re-edit] selectedEvent:', selectedEvent);
        
        if (selectedProject && selectedEvent) {
          console.log('[Re-edit] Sending notification to editor...');
          const result = await imageApi.notifyReEditRequested({
            projectId: selectedProject.projectId,
            clientEventId: selectedEvent.clientEventId,
            imageCount: imageIds.length
          });
          console.log('[Re-edit] Notification sent:', result);
        } else {
          console.warn('[Re-edit] Cannot send notification - project or event not selected');
        }
      } catch (notifError) {
        console.error('Failed to send re-edit notification:', notifError);
        // Don't fail the request if notification fails
      }
      
      showToast('success', `Re-edit requested for ${imageIds.length} image${imageIds.length !== 1 ? 's' : ''}`);
      
      // Clear selection and close modal
      setSelectedImages(new Set());
      setShowCommentModal(false);
      
      // Refresh gallery
      if (selectedEvent) {
        refreshGallerySilently(selectedEvent.clientEventId);
      }
    } catch (error) {
      console.error('Error requesting re-edit:', error);
      showToast('error', 'Failed to request re-edit');
    } finally {
      setIsRequestingReEdit(false);
    }
  };

  const handleReuploadEdited = () => {
    if (selectedImages.size === 0) return;
    setReuploadErrors([]); // Clear previous errors
    setShowReuploadModal(true);
    setShowBulkActions(false);
  };

  const handleSetCover = (device: 'mobile' | 'tablet' | 'desktop') => {
    if (selectedImages.size !== 1) return;
    setSelectedCoverDevice(device);
    setShowCoverPreviewModal(true);
    setShowBulkActions(false);
  };

  const confirmSetCover = async () => {
    if (!selectedProject || !selectedCoverDevice || selectedImages.size !== 1) return;
    
    setIsSettingCover(true);
    try {
      const imageId = Array.from(selectedImages)[0];
      const image = galleryImages.find(img => img.imageId === imageId);
      if (!image) throw new Error('Image not found');

      const coverUrl = image.originalUrl;
      const fieldMap = {
        mobile: 'mobileCoverUrl',
        tablet: 'tabletCoverUrl',
        desktop: 'desktopCoverUrl'
      };

      await projectApi.update(selectedProject.projectId, {
        [fieldMap[selectedCoverDevice]]: coverUrl
      });

      // Update the local project state with the new cover URL
      setProjects(prevProjects => 
        prevProjects.map(p => 
          p.projectId === selectedProject.projectId
            ? { ...p, [fieldMap[selectedCoverDevice]]: coverUrl }
            : p
        )
      );

      // Update the selected project state as well
      setSelectedProject(prev => 
        prev ? { ...prev, [fieldMap[selectedCoverDevice]]: coverUrl } : prev
      );
      
      showToast('success', `${selectedCoverDevice.charAt(0).toUpperCase() + selectedCoverDevice.slice(1)} cover image set successfully`);
      setShowCoverPreviewModal(false);
      setSelectedCoverDevice(null);
      setSelectedImages(new Set());
    } catch (error) {
      console.error('Error setting cover:', error);
      showToast('error', 'Failed to set cover image');
    } finally {
      setIsSettingCover(false);
    }
  };

  const handleViewComment = (comment: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setViewingComment(comment || 'No comment provided');
    setShowCommentViewModal(true);
  };

  const confirmReupload = async (files: File[]) => {
    setIsReuploadingImages(true);
    setReuploadErrors([]); // Clear errors before upload
    
    try {
      const imageIds = Array.from(selectedImages);
      
      const result = await imageApi.reupload(imageIds, files);
      
      const successCount = result.successful || 0;
      const failedCount = result.failed || 0;
      
      // Extract error details from failed uploads
      const errors = (result.results || [])
        .filter((r: any) => !r.success)
        .map((r: any) => ({
          fileName: r.fileName,
          message: r.message || r.error || 'Upload failed'
        }));
      
      if (errors.length > 0) {
        setReuploadErrors(errors);
        // Don't close modal if there are errors
        showToast('error', `${failedCount} file${failedCount !== 1 ? 's' : ''} failed to upload. Check details in the modal.`);
      } else if (successCount > 0) {
        // Only close modal and clear selection if all successful
        showToast('success', `Successfully re-uploaded ${successCount} image${successCount !== 1 ? 's' : ''}`);
        setSelectedImages(new Set());
        setShowReuploadModal(false);
        
        // Refresh gallery
        if (selectedEvent) {
          refreshGallerySilently(selectedEvent.clientEventId);
        }
      }
      
      // Show partial success message if some succeeded
      if (successCount > 0 && failedCount > 0) {
        showToast('warning', `${successCount} uploaded, ${failedCount} failed`);
        
        // Refresh gallery even with partial success
        if (selectedEvent) {
          refreshGallerySilently(selectedEvent.clientEventId);
        }
      }
      
    } catch (error: any) {
      console.error('Error re-uploading images:', error);
      
      // Extract user-friendly error message
      let errorMessage = 'Failed to re-upload images. Please try again.';
      
      if (error?.message) {
        errorMessage = error.message;
      } else if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      showToast('error', errorMessage);
      setReuploadErrors([{
        fileName: 'Upload Error',
        message: errorMessage
      }]);
    } finally {
      setIsReuploadingImages(false);
    }
  };

  const handleApproveImages = () => {
    if (selectedImages.size === 0) return;
    setPublishAfterApprove(false);
    setShowApproveModal(true);
    setShowBulkActions(false);
  };

  const confirmApproveImages = async () => {
    if (selectedImages.size === 0) return;
    
    setIsApprovingImages(true);
    
    try {
      const imageIds = Array.from(selectedImages);
      const result = await imageApi.approve(imageIds);
      
      showToast('success', `Successfully approved ${result.approvedCount} image${result.approvedCount !== 1 ? 's' : ''}`);
      
      // Clear selection
      setSelectedImages(new Set());
      setShowApproveModal(false);
      setPublishAfterApprove(false);
      
      // Ensure body scroll is restored (fix for modal overflow issue)
      setTimeout(() => {
        document.body.style.overflow = 'unset';
      }, 100);
      
      // Refresh gallery silently without showing loading states
      if (selectedEvent) {
        await refreshGallerySilently(selectedEvent.clientEventId);
      }

      // Optionally publish album immediately
      if (publishAfterApprove && canPublishAfterApprove && selectedEvent) {
        try {
          await publishAlbumDirect(selectedEvent);
          showToast('success', 'Album published to customer successfully');
        } catch (publishError) {
          console.error('Error publishing album after approval:', publishError);
          showToast('error', 'Images approved, but publishing failed. Please try again from the publish menu.');
        }
      }
    } catch (error: any) {
      console.error('Error approving images:', error);
      
      let errorMessage = 'Failed to approve images. Please try again.';
      
      if (error?.message) {
        errorMessage = error.message;
      } else if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      showToast('error', errorMessage);
    } finally {
      setIsApprovingImages(false);
    }
  };

  const getNextAvailableStatus = (currentStatusId: string | undefined) => {
    if (!currentStatusId) return null;
    const currentStatus = eventDeliveryStatuses.get(currentStatusId);
    if (!currentStatus) return null;

    const nextStep = currentStatus.step + 1;
    const nextStatus = Array.from(eventDeliveryStatuses.entries()).find(
      ([_, status]) => status.step === nextStep
    );

    return nextStatus ? { id: nextStatus[0], ...nextStatus[1] } : null;
  };

  const handleSetEventStatus = (event: ClientEvent) => {
    setSelectedEventForStatus(event);
    setNewStatusId('');
    setStatusError('');
    setShowStatusModal(true);
    setOpenMenuId(null);
  };

  const handlePublishToCustomer = (event: ClientEvent) => {
    // Check for approved photos
    const reviewedStatus = imageStatuses.find(s => s.statusCode === 'APPROVED');
    const eventImages = allImages.filter(img => img.clientEventId === event.clientEventId);
    const approvedImages = reviewedStatus 
      ? eventImages.filter(img => img.imageStatusId === reviewedStatus.statusId)
      : [];
    
    setApprovedPhotosCount(approvedImages.length);
    setSelectedEventForPublish(event);
    setPublishConfirmed(true);
    setPublishError(approvedImages.length === 0 ? 'No approved photos found in this album. Please approve some photos before publishing.' : '');
    setShowPublishModal(true);
    setOpenMenuId(null);
  };

  const publishAlbumDirect = async (event: ClientEvent) => {
    const publishedStatus = Array.from(eventDeliveryStatuses.entries()).find(
      ([_, status]) => status.statusCode === 'PUBLISHED'
    );

    if (!publishedStatus) {
      throw new Error('Published status not found in system');
    }

    await clientEventApi.update(event.clientEventId, {
      eventDeliveryStatusId: publishedStatus[0],
    });

    if (selectedProject) {
      await fetchProjectEvents(selectedProject.projectId);
    }
  };

  const handleConfirmPublish = async () => {
    if (!selectedEventForPublish) return;
    
    if (approvedPhotosCount === 0) {
      setPublishError('No approved photos found in this album. Please approve some photos before publishing.');
      return;
    }
    
    if (!publishConfirmed) {
      showToast('error', 'Please confirm to proceed with publishing');
      return;
    }

    setIsPublishing(true);
    try {
      await publishAlbumDirect(selectedEventForPublish);
      showToast('success', 'Album published to customer successfully');
      setShowPublishModal(false);
      setSelectedEventForPublish(null);
      setPublishConfirmed(true);
      setPublishError('');
      setApprovedPhotosCount(0);
    } catch (error) {
      console.error('Error publishing album:', error);
      showToast('error', 'Failed to publish album. Please try again.');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleUpdateEventStatus = async () => {
    if (!selectedEventForStatus || !newStatusId) {
      setStatusError('Please select a status');
      return;
    }

    const currentStatus = eventDeliveryStatuses.get(selectedEventForStatus.eventDeliveryStatusId || '');
    const newStatus = eventDeliveryStatuses.get(newStatusId);

    if (!newStatus) {
      setStatusError('Invalid status selection');
      return;
    }

    // If event has no current status, allow setting to step 1
    if (!currentStatus) {
      if (newStatus.step !== 1) {
        setStatusError('Please set the initial status (Step 1) first');
        return;
      }
    } else {
      // If event has a status, validate sequential progression
      if (newStatus.step !== currentStatus.step + 1) {
        setStatusError(`Status must be the next in sequence: "${getNextAvailableStatus(selectedEventForStatus.eventDeliveryStatusId)?.statusDescription || 'N/A'}"`);
        return;
      }
    }

    setIsUpdatingStatus(true);
    try {
      await clientEventApi.update(selectedEventForStatus.clientEventId, {
        eventDeliveryStatusId: newStatusId,
      });
      
      showToast('success', 'Event status updated successfully');
      setShowStatusModal(false);
      setSelectedEventForStatus(null);
      setNewStatusId('');
      setStatusError('');
      
      // Refresh events
      if (selectedProject) {
        fetchProjectEvents(selectedProject.projectId);
      }
    } catch (error) {
      console.error('Error updating event status:', error);
      setStatusError('Failed to update event status. Please try again.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const confirmBulkDelete = async () => {
    setIsDeleting(true);
    try {
      const imageIds = Array.from(selectedImages);
      await imageApi.bulkDelete(imageIds);
      
      showToast('success', `Successfully deleted ${imageIds.length} image${imageIds.length !== 1 ? 's' : ''}`);
      
      // Clear selection
      setSelectedImages(new Set());
      setShowBulkActions(false);
      setShowDeleteModal(false);
      
      // Refresh gallery
      if (selectedEvent) {
        refreshGallerySilently(selectedEvent.clientEventId);
      }

      // Trigger storage update event
      window.dispatchEvent(new Event('storageUpdated'));
    } catch (error) {
      console.error('Error deleting images:', error);
      showToast('error', 'Failed to delete images');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleShowProperties = async (imageId: string) => {
    setLoadingProperties(true);
    setShowPropertiesModal(true);
    setPropertiesData(null);
    
    try {
      const response = await imageApi.getProperties(imageId);
      setPropertiesData(response.image);
    } catch (error) {
      console.error('Error fetching image properties:', error);
      showToast('error', 'Failed to load image properties');
      setShowPropertiesModal(false);
    } finally {
      setLoadingProperties(false);
    }
  };

  const handleUploadImages = async () => {
    if (uploadedImages.length === 0 || !selectedProject || !selectedEvent) {
      return;
    }

    setIsUploading(true);
    setUploadedCount(0);
    setFailedImages(new Set());
    const failedImageIds = new Set<string>();
    uploadAbortRef.current = false; // Reset abort flag
    uploadAbortControllerRef.current = new AbortController(); // Create abort controller

    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      console.log('[Upload] Token exists:', !!token);
      
      if (!token) {
        showToast('error', 'You are not logged in. Please login again.');
        setIsUploading(false);
        return;
      }

      let successCount = 0;
      let wasAborted = false;

      // Upload images in chunks of 10 for better memory management and visible progress
      const CHUNK_SIZE = 10;
      const imagesWithFiles = uploadedImages.filter(img => img.file);
      const totalChunks = Math.ceil(imagesWithFiles.length / CHUNK_SIZE);

      for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
        // Check if upload was cancelled
        if (uploadAbortRef.current) {
          console.log('Upload cancelled by user');
          wasAborted = true;
          showToast('info', `Upload aborted. ${successCount} of ${uploadedImages.length} images uploaded.`);
          break;
        }

        const startIdx = chunkIndex * CHUNK_SIZE;
        const endIdx = Math.min(startIdx + CHUNK_SIZE, imagesWithFiles.length);
        const chunk = imagesWithFiles.slice(startIdx, endIdx);

        const formData = new FormData();
        formData.append('projectId', selectedProject.projectId);
        formData.append('clientEventId', selectedEvent.clientEventId);
        formData.append('skipNotification', 'true'); // Skip notification for each chunk
        
        // Add chunk images to FormData
        chunk.forEach((img) => {
          if (img.file) {
            formData.append('images', img.file);
          }
        });

        try {
          const result = await imageApi.uploadBatch(formData, uploadAbortControllerRef.current?.signal);
          
          successCount += result.stats.successful;
          setUploadedCount(successCount);

          // Track failed images
          if (result.failed && result.failed.length > 0) {
            result.failed.forEach((failed: any) => {
              const failedImg = chunk.find(img => img.file?.name === failed.fileName);
              if (failedImg) {
                failedImageIds.add(failedImg.id);
              }
            });
          }
        } catch (error) {
          // Check if error is due to abort
          if (error instanceof Error && error.name === 'AbortError') {
            console.log('Request aborted');
            wasAborted = true;
            showToast('info', `Upload aborted. ${successCount} of ${uploadedImages.length} images uploaded.`);
            // Don't mark chunk as failed if aborted
            break;
          }
          console.error('Upload error for chunk:', error);
          // Mark this chunk's images as failed
          chunk.forEach(img => failedImageIds.add(img.id));
        }
      }

      // Update failed images state
      setFailedImages(failedImageIds);

      // Send single notification after all chunks are uploaded
      if (successCount > 0 && !wasAborted) {
        try {
          const formData = new FormData();
          formData.append('projectId', selectedProject.projectId);
          formData.append('clientEventId', selectedEvent.clientEventId);
          formData.append('imageCount', successCount.toString());
          await imageApi.notifyImagesUploaded(formData);
        } catch (notifError) {
          console.error('Failed to send upload notification:', notifError);
        }

        // Show success toast
        showToast('success', `Successfully uploaded ${successCount} image${successCount !== 1 ? 's' : ''}!${failedImageIds.size > 0 ? ` (${failedImageIds.size} failed - see below)` : ''}`);
      }
      
      // Clean up and refresh regardless of abort status (for successful uploads)
      if (successCount > 0) {
        // Clean up blob URLs for successful uploads
        uploadedImages.forEach((img) => {
          if (!failedImageIds.has(img.id) && img.url.startsWith('blob:')) {
            URL.revokeObjectURL(img.url);
          }
        });
        
        // Remove successful images, keep failed ones
        setUploadedImages(prev => prev.filter(img => failedImageIds.has(img.id)));
        
        // Collapse upload section if all succeeded and not aborted
        if (failedImageIds.size === 0 && !wasAborted) {
          setIsUploadExpanded(false);
        }

        // Refresh gallery images
        if (selectedEvent) {
          refreshGallerySilently(selectedEvent.clientEventId);
        }

        // Trigger storage update event
        window.dispatchEvent(new Event('storageUpdated'));
      }
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setIsUploading(false);
      setUploadedCount(0);
      uploadAbortControllerRef.current = null; // Clean up
    }
  };

  const handleSelectImage = useCallback((imageId: string) => {
    setSelectedImages(prev => {
      const newSelected = new Set(prev);
      if (newSelected.has(imageId)) {
        newSelected.delete(imageId);
      } else {
        newSelected.add(imageId);
      }
      return newSelected;
    });
  }, []);

  const selectAllImages = useCallback(() => {
    const eventImages = galleryImages;
    if (selectedImages.size === eventImages.length) {
      setSelectedImages(new Set());
    } else {
      setSelectedImages(new Set(eventImages.map(img => img.imageId)));
    }
  }, [galleryImages, selectedImages.size]);

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

  const getFirstEventImage = (clientEventId: string) => {
    const eventImages = allImages.filter(image => image.clientEventId === clientEventId);
    return eventImages.length > 0 ? eventImages[0] : null;
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

  // Check if all selected images are in "Re-edit requested" status
  const canReuploadSelected = useMemo(() => {
    if (selectedImages.size === 0) return false;
    
    const reEditStatus = imageStatuses.find(s => s.statusCode === 'RE_EDIT_SUGGESTED');
    if (!reEditStatus) return false;
    
    // Check if all selected images have RE_EDIT_SUGGESTED status
    const allInReEditStatus = Array.from(selectedImages).every(imageId => {
      const image = galleryImages.find(img => img.imageId === imageId);
      return image?.imageStatusId === reEditStatus.statusId;
    });
    
    return allInReEditStatus;
  }, [selectedImages, galleryImages, imageStatuses]);

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
    const eventImages = galleryImages;
    const eventName = eventTypes.get(selectedEvent.eventId)?.eventDesc || 'Event';
    const filteredImageCount = eventImages.filter(img => selectedStatus === 'all' || img.imageStatusId === selectedStatus).length;

    const renderSelectedEventStatusBadge = (
      className = '',
      size: 'default' | 'compact' = 'default'
    ) => {
      if (!selectedEventStatus) return null;
      return (
        <StatusBadge
          label={selectedEventStatus.statusDescription}
          className={className}
          size={size}
          aria-label={`Status: ${selectedEventStatus.statusDescription}`}
        />
      );
    };

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

        {/* Gallery Actions Bar */}
        <div className={styles.galleryActionsBar}>
          <button
            className={styles.backButton}
            onClick={handleCloseAlbum}
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>Back to Events</span>
          </button>
          <div className={styles.galleryActionsRight}>
            <AlbumPdfInfo
              albumPdfUrl={currentAlbumPdf?.albumPdfUrl}
              albumPdfFileName={currentAlbumPdf?.albumPdfFileName}
            />
          </div>
        </div>

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
          <style>{`
            @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
          `}</style>
          <div
            className={`${styles.uploadSection} ${isUploadExpanded ? styles.uploadSectionExpanded : ''}`}
          >
            <div className={styles.uploadSectionInner}>
              <div className={styles.uploadContent}>
                <div className={styles.uploadContentInner}>
                  {/* Hidden file input - always present */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                  />
                  
                  {/* Storage Limit Warning - replaces upload UI when storage is full */}
                  {showStorageLimitModal && storageLimitInfo && (
                    <StorageLimitModal
                      show={showStorageLimitModal}
                      currentPlan={storageLimitInfo.currentPlan}
                      isEnterprise={storageLimitInfo.isEnterprise}
                      onClose={() => setShowStorageLimitModal(false)}
                      onUpgrade={() => {
                        setShowStorageLimitModal(false);
                        showToast('info', 'Please contact your administrator to upgrade your plan');
                      }}
                      onPlanUpgraded={() => {
                        // Plan was upgraded, hide the storage limit warning
                        setShowStorageLimitModal(false);
                        showToast('success', 'Plan upgraded successfully! You can now upload images.');
                        // Refresh storage stats
                        window.dispatchEvent(new Event('storageUpdated'));
                      }}
                    />
                  )}
                  
                  {/* Preparing Images State */}
                  {!showStorageLimitModal && isPreparingImages && uploadedImages.length === 0 && (
                    <div style={{ padding: '2rem' }}>
                      <DotLoader text="Preparing images..." />
                    </div>
                  )}
                  
                  {/* Initial Upload UI */}
                  {!showStorageLimitModal && !isPreparingImages && uploadedImages.length === 0 && (
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
                      <button
                        onClick={() => {
                          // Clear any existing timer
                          if (preparingTimerRef.current) {
                            clearTimeout(preparingTimerRef.current);
                          }
                          
                          // Show preparing state after 2 seconds
                          preparingTimerRef.current = setTimeout(() => {
                            setIsUploadExpanded(true);
                            setIsPreparingImages(true);
                          }, 2000);
                          
                          fileInputRef.current?.click();
                        }}
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
                        Supports: JPG, PNG, HEIC, RAW files
                      </p>
                    </div>
                  )}

                  {/* Preview Grid or Upload Progress */}
                  {!showStorageLimitModal && uploadedImages.length > 0 && (
                    <>
                      {!isUploading ? (
                        <>
                          {failedImages.size > 0 && (
                            <div className={styles.failedImagesHeader}>
                              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <div>
                                <strong>Failed uploads ({failedImages.size}):</strong>
                                <div className={styles.failedImagesList}>
                                  {uploadedImages
                                    .filter(img => failedImages.has(img.id))
                                    .map(img => img.file?.name)
                                    .filter(Boolean)
                                    .join(', ')}
                                </div>
                              </div>
                            </div>
                          )}
                          {/* Hidden preloader images */}
                          <div style={{ display: 'none' }}>
                            {uploadedImages.map((image) => (
                              <img 
                                key={`preload-${image.id}`}
                                src={image.url} 
                                alt=""
                                onLoad={() => handleUploadImageLoad(image.id)}
                              />
                            ))}
                          </div>
                          
                          {/* Visible preview grid - only show loaded images */}
                          <div className={styles.uploadPreview}>
                            {uploadedImages
                              .filter(image => loadedUploadImages.has(image.id) || failedImages.has(image.id))
                              .map((image, index) => (
                              <div 
                                key={image.id} 
                                className={`${styles.uploadPreviewItem} ${failedImages.has(image.id) ? styles.failedImage : ''}`}
                                style={{ animationDelay: `${index * 0.05}s` }}
                              >
                                <img 
                                  src={image.url} 
                                  alt="Upload preview"
                                  className={styles.imageLoaded}
                                />
                                
                                {failedImages.has(image.id) && (
                                  <div className={styles.failedBadge}>
                                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                    Failed
                                  </div>
                                )}
                                
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
                        </>
                      ) : (
                        <>
                          <div className={styles.uploadProgressContainer}>
                            <div className={styles.uploadingIndicator}>
                              <div className={styles.uploadIconWrapper}>
                                <svg className={styles.uploadingIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                </svg>
                              </div>
                              <div className={styles.uploadingTextWrapper}>
                                <span className={styles.uploadingText}>Uploading your images</span>
                                <span className={styles.uploadingSubtext}>Please wait...</span>
                              </div>
                            </div>
                            <div className={styles.uploadProgressBar}>
                              <div 
                                className={styles.uploadProgressFill}
                                style={{ width: `${(uploadedCount / uploadedImages.length) * 100}%` }}
                              />
                            </div>
                            <p className={styles.uploadProgressText}>
                              {Math.round((uploadedCount / uploadedImages.length) * 100)}% complete
                            </p>
                          </div>
                          <div className={styles.uploadActions}>
                            <button
                              className={styles.abortButton}
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                uploadAbortRef.current = true;
                                uploadAbortControllerRef.current?.abort();
                              }}
                            >
                              Abort
                            </button>
                          </div>
                        </>
                      )}

                      {!isUploading && (loadedUploadImages.size > 0 || failedImages.size > 0) && (
                      <div className={styles.uploadActions}>
                        <button 
                          className={styles.saveButton}
                          onClick={handleUploadImages}
                        >
                          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                          </svg>
                          Upload {uploadedImages.length} {uploadedImages.length === 1 ? 'Image' : 'Images'}
                        </button>
                        <button
                          className={styles.cancelButton}
                          onClick={() => {
                            // Just close if not uploading
                            uploadedImages.forEach((img) => {
                              if (img.url.startsWith('blob:')) {
                                URL.revokeObjectURL(img.url);
                              }
                            });
                            setUploadedImages([]);
                            setFailedImages(new Set());
                            setIsUploadExpanded(false);
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
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Gallery Card */}
        <div className={styles.galleryCard}>
          {/* Bulk Actions and Filters */}
          <div className={styles.actionsSection}>
          <div className={styles.actionsLeft}>
            {/* Bulk Actions Dropdown */}
            <div className={styles.bulkActionsContainer} ref={bulkActionsRef}>
              <button
                className={`${styles.bulkActionsButton} ${selectedImages.size === 0 ? styles.disabled : ''}`}
                onClick={toggleBulkActions}
                disabled={selectedImages.size === 0}
                tabIndex={-1}
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
                  <button 
                    className={styles.dropdownItem}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownloadSelected();
                    }}
                    disabled={isDownloadingSelected}
                  >
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    <span>{isDownloadingSelected ? 'Downloading...' : 'Download Selected'}</span>
                  </button>
                  
                  {isAdmin && (
                    <button 
                      className={styles.dropdownItem}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRequestReEdit();
                      }}
                    >
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                      <span>Request Re-edit</span>
                    </button>
                  )}
                  
                  {/* Set Cover with Submenu */}
                  {selectedImages.size === 1 && (
                    <div className={styles.setCoverContainer}>
                      <button 
                        className={styles.dropdownItem}
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                      >
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>Set Cover</span>
                        <svg style={{ marginLeft: 'auto' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" width="16" height="16">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>

                      {/* Submenu - shows on hover */}
                      <div className={styles.submenu}>
                        <button
                          className={styles.submenuItem}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSetCover('mobile');
                          }}
                        >
                          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                          Mobile
                        </button>
                        <button
                          className={styles.submenuItem}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSetCover('tablet');
                          }}
                        >
                          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                          Tablet
                        </button>
                        <button
                          className={styles.submenuItem}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSetCover('desktop');
                          }}
                        >
                          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          Desktop
                        </button>
                      </div>
                    </div>
                  )}
                  
                  <button 
                    className={styles.dropdownItem}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleReuploadEdited();
                    }}
                    disabled={!canReuploadSelected}
                    title={!canReuploadSelected ? 'All selected images must be in "Re-edit requested" status' : 'Re-upload edited versions of selected images'}
                  >
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    <span>Re-upload Edited</span>
                  </button>
                  
                  {isAdmin && (
                    <>
                      <button 
                        className={`${styles.dropdownItem} ${styles.approve}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleApproveImages();
                        }}
                        disabled={isApprovingImages || selectedImages.size === 0}
                      >
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{isApprovingImages ? 'Approving...' : 'Approve'}</span>
                      </button>
                      <div className={styles.dropdownDivider}></div>
                      <button 
                        className={`${styles.dropdownItem} ${styles.delete}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleBulkDelete();
                        }}
                      >
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        <span>Delete Selected</span>
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Save Sort Order Button */}
            <button 
              className={styles.saveSortButton} 
              onClick={handleSaveSortOrder}
              disabled={!hasUnsavedOrder || isSavingOrder}
              title={hasUnsavedOrder ? "Save custom image order" : "No changes to save"}
              tabIndex={-1}
            >
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
              {isSavingOrder ? 'Saving...' : 'Save Sorting'}
            </button>
          </div>

          <div className={styles.actionsRight}>
            {/* Status Filter Dropdown */}
            <div className={styles.statusContainer} ref={statusDropdownRef}>
              <button className={styles.statusButton} onClick={() => setShowStatusDropdown(!showStatusDropdown)} tabIndex={-1}>
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                {(() => {
                  const currentStatus = imageStatuses.find(s => s.statusId === selectedStatus);
                  return (
                    <>
                      {currentStatus?.statusCode === 'REVIEW_PENDING' && (
                        <span className={styles.statusIconBadge} style={{ background: 'rgba(59, 130, 246, 0.95)' }}>
                          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </span>
                      )}
                      {currentStatus?.statusCode === 'RE_EDIT_SUGGESTED' && (
                        <span className={styles.statusIconBadge} style={{ background: 'rgba(251, 191, 36, 0.95)' }}>
                          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                          </svg>
                        </span>
                      )}
                      {currentStatus?.statusCode === 'RE_EDIT_DONE' && (
                        <span className={styles.statusIconBadge} style={{ background: 'rgba(147, 51, 234, 0.95)' }}>
                          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                          </svg>
                        </span>
                      )}
                      {currentStatus?.statusCode === 'APPROVED' && (
                        <span className={styles.statusIconBadge} style={{ background: 'rgba(34, 197, 94, 0.95)' }}>
                          <svg fill="currentColor" viewBox="0 0 24 24">
                            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                          </svg>
                        </span>
                      )}
                      {currentStatus?.statusCode === 'CLIENT_SELECTED' && (
                        <span className={styles.statusIconBadge} style={{ background: 'rgba(59, 130, 246, 0.95)' }}>
                          <svg fill="currentColor" viewBox="0 0 24 24">
                            <path d="M0.41,13.41L6,19L7.41,17.58L1.83,12M22.24,5.58L11.66,16.17L7.5,12L6.07,13.41L11.66,19L23.66,7M18,7L16.59,5.58L10.24,11.93L11.66,13.34L18,7Z" />
                          </svg>
                        </span>
                      )}
                      <span>{selectedStatus === 'all' ? 'All Images' : currentStatus?.statusDescription || 'Status'}</span>
                    </>
                  );
                })()}
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {showStatusDropdown && (
                <div className={styles.dropdown}>
                  <button 
                    className={`${styles.dropdownItem} ${selectedStatus === 'all' ? styles.active : ''}`}
                    onClick={() => {
                      setSelectedStatus('all');
                      setShowStatusDropdown(false);
                    }}
                  >
                    <span>All Images</span>
                  </button>
                  {imageStatuses
                    .filter((status) => status.statusCode !== 'DISCARDED')
                    .map((status) => (
                    <button 
                      key={status.statusId}
                      className={`${styles.dropdownItem} ${selectedStatus === status.statusId ? styles.active : ''}`}
                      onClick={() => {
                        setSelectedStatus(status.statusId);
                        setShowStatusDropdown(false);
                      }}
                    >
                      {status.statusCode === 'REVIEW_PENDING' && (
                        <span className={styles.statusIconBadge} style={{ background: 'rgba(59, 130, 246, 0.95)' }}>
                          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </span>
                      )}
                      {status.statusCode === 'RE_EDIT_SUGGESTED' && (
                        <span className={styles.statusIconBadge} style={{ background: 'rgba(251, 191, 36, 0.95)' }}>
                          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                          </svg>
                        </span>
                      )}
                      {status.statusCode === 'RE_EDIT_DONE' && (
                        <span className={styles.statusIconBadge} style={{ background: 'rgba(147, 51, 234, 0.95)' }}>
                          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                          </svg>
                        </span>
                      )}
                      {status.statusCode === 'APPROVED' && (
                        <span className={styles.statusIconBadge} style={{ background: 'rgba(34, 197, 94, 0.95)' }}>
                          <svg fill="currentColor" viewBox="0 0 24 24">
                            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                          </svg>
                        </span>
                      )}
                      {status.statusCode === 'CLIENT_SELECTED' && (
                        <span className={styles.statusIconBadge} style={{ background: 'rgba(59, 130, 246, 0.95)' }}>
                          <svg fill="currentColor" viewBox="0 0 24 24">
                            <path d="M0.41,13.41L6,19L7.41,17.58L1.83,12M22.24,5.58L11.66,16.17L7.5,12L6.07,13.41L11.66,19L23.66,7M18,7L16.59,5.58L10.24,11.93L11.66,13.34L18,7Z" />
                          </svg>
                        </span>
                      )}
                      <span>{status.statusDescription}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Sort Dropdown */}
            <div className={styles.sortContainer} ref={sortDropdownRef}>
              <button className={styles.sortButton} onClick={toggleSortDropdown} tabIndex={-1}>
                <span>
                  {sortBy === 'default' ? 'Default' : sortBy === 'name' ? 'Name' : sortBy === 'date-latest' ? 'Date - Latest first' : 'Date - Oldest first'}
                </span>
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {showSortDropdown && (
                <div className={styles.dropdown}>
                  <button 
                    className={`${styles.dropdownItem} ${sortBy === 'default' ? styles.active : ''}`}
                    onClick={() => handleSortChange('default')}
                  >
                    <span>Default</span>
                  </button>
                  <button 
                    className={`${styles.dropdownItem} ${sortBy === 'name' ? styles.active : ''}`}
                    onClick={() => handleSortChange('name')}
                  >
                    <span>Name</span>
                  </button>
                  <button 
                    className={`${styles.dropdownItem} ${sortBy === 'date-latest' ? styles.active : ''}`}
                    onClick={() => handleSortChange('date-latest')}
                  >
                    <span>Date - Latest first</span>
                  </button>
                  <button 
                    className={`${styles.dropdownItem} ${sortBy === 'date-oldest' ? styles.active : ''}`}
                    onClick={() => handleSortChange('date-oldest')}
                  >
                    <span>Date - Oldest first</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className={styles.imagesToolbarDivider}></div>

        <div className={styles.imagesHeader}>
          <div className={styles.imagesHeaderLeft}>
            <h2 className={styles.imagesTitle}>
              <span>{eventName}</span>
              <span className={styles.imagesTitleCount}>
                ({filteredImageCount} image{filteredImageCount === 1 ? '' : 's'})
              </span>
              {renderSelectedEventStatusBadge(styles.badgeAfterTitle)}
            </h2>
          </div>
          
          <div className={styles.imagesHeaderRight}>
            {/* Status Legend Help Icon */}
            <div className={styles.statusLegendContainer} ref={statusLegendRef}>
              <button 
                className={styles.statusLegendButton}
                onClick={() => setShowStatusLegend(!showStatusLegend)}
                title="View status icons legend"
                tabIndex={-1}
              >
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Status Icons</span>
              </button>
              
              {showStatusLegend && (
              <div className={styles.statusLegendPopover}>
                <div className={styles.legendPopoverHeader}>
                  <span>Status Icons Legend</span>
                </div>
                <div className={styles.legendPopoverContent}>
                  <div className={styles.legendItem}>
                    <span className={styles.legendIcon} style={{ background: 'rgba(59, 130, 246, 0.95)' }}>
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </span>
                    <span className={styles.legendLabel}>Review Pending</span>
                  </div>
                  <div className={styles.legendItem}>
                    <span className={styles.legendIcon} style={{ background: 'rgba(251, 191, 36, 0.95)' }}>
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                      </svg>
                    </span>
                    <span className={styles.legendLabel}>Re-edit Requested</span>
                  </div>
                  <div className={styles.legendItem}>
                    <span className={styles.legendIcon} style={{ background: 'rgba(147, 51, 234, 0.95)' }}>
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                      </svg>
                    </span>
                    <span className={styles.legendLabel}>Re-edit Done</span>
                  </div>
                  <div className={styles.legendItem}>
                    <span className={styles.legendIcon} style={{ background: 'rgba(34, 197, 94, 0.95)' }}>
                      <svg fill="currentColor" viewBox="0 0 24 24">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                      </svg>
                    </span>
                    <span className={styles.legendLabel}>Approved</span>
                  </div>
                  <div className={styles.legendItem}>
                    <span className={styles.legendIcon} style={{ background: 'rgba(59, 130, 246, 0.95)' }}>
                      <svg fill="currentColor" viewBox="0 0 24 24">
                        <path d="M0.41,13.41L6,19L7.41,17.58L1.83,12M22.24,5.58L11.66,16.17L7.5,12L6.07,13.41L11.66,19L23.66,7M18,7L16.59,5.58L10.24,11.93L11.66,13.34L18,7Z" />
                      </svg>
                    </span>
                    <span className={styles.legendLabel}>Client Selected</span>
                  </div>
                </div>
              </div>
            )}
            </div>

            {/* Refresh Button */}
            <button 
              className={styles.refreshButton} 
              onClick={() => selectedEvent && fetchGalleryImages(selectedEvent.clientEventId)}
              disabled={isLoadingGallery}
              title="Refresh gallery"
              aria-label="Refresh gallery"
              tabIndex={-1}
            >
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>

            {/* Select All Button with Counter */}
            <button className={styles.selectAllButton} onClick={selectAllImages} tabIndex={-1}>
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: '1.125rem', height: '1.125rem', color: '#6366f1' }}>
                {selectedImages.size === galleryImages.length ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                ) : (
                  <circle cx="12" cy="12" r="10" strokeWidth={2} />
                )}
              </svg>
              {selectedImages.size === galleryImages.length ? 'Deselect All' : 'Select All'} ({selectedImages.size}/{galleryImages.length})
            </button>
          </div>
        </div>

        <div className={`${styles.imageGrid} ${showContent && !isLoadingGallery && !isLoadingGalleryPreviews && eventImages.length > 0 ? styles.animatedGrid : ''}`}>
          {isLoadingGallery ? (
            <div style={{ gridColumn: '1 / -1', padding: '3rem', display: 'flex', justifyContent: 'center' }}>
              <DotLoader text="Loading gallery..." />
            </div>
          ) : eventImages.length === 0 ? (
            <div className={styles.emptyGallery}>
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p>No images uploaded yet. Use the upload section above to add images.</p>
            </div>
          ) : isLoadingGalleryPreviews ? (
            <>
              <div style={{ gridColumn: '1 / -1', padding: '3rem', display: 'flex', justifyContent: 'center' }}>
                <DotLoader text="Loading gallery..." />
              </div>
              <div style={{ display: 'none' }}>
                {eventImages.map((image) => (
                  <img 
                    key={image.imageId}
                    src={image.compressedUrl || image.originalUrl}
                    alt=""
                    onLoad={() => handleGalleryImageLoad(image.imageId)}
                    onError={() => handleGalleryImageLoad(image.imageId)}
                  />
                ))}
              </div>
            </>
          ) : showContent && (
            getSortedImages(eventImages.filter(img => selectedStatus === 'all' || img.imageStatusId === selectedStatus)).map((image, index) => (
              <div 
                key={image.imageId} 
                className={`${styles.imageItem} ${selectedImages.has(image.imageId) ? styles.selectedImage : ''} ${dragOverIndex === index ? styles.dragOver : ''} ${draggedImageId === image.imageId ? styles.dragging : ''}`}
                draggable={sortBy === 'default'}
                tabIndex={0}
                role="button"
                aria-label={`${image.fileName || 'Image'}, ${selectedImages.has(image.imageId) ? 'selected' : 'not selected'}`}
                onDragStart={(e) => handleDragStart(e, image.imageId)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, image.imageId)}
                onDragEnd={handleDragEnd}
                onClick={() => handleSelectImage(image.imageId)}
                onDoubleClick={() => handleOpenViewer(index)}
              >
                <button 
                  className={styles.imageDownloadButton}
                  tabIndex={-1}
                  onClick={async (e) => {
                    e.stopPropagation();
                    try {
                      await downloadImageFile(image.originalUrl || image.compressedUrl, image.fileName);
                    } catch (error) {
                      console.error('Download failed:', error);
                      showToast('error', 'Failed to download image. Please try again.');
                    }
                  }}
                  aria-label="Download image"
                >
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </button>
                <button 
                  className={styles.imagePropertiesButton}
                  tabIndex={-1}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleShowProperties(image.imageId);
                  }}
                  aria-label="View properties"
                >
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
                
                {/* Status indicators */}
                {(() => {
                  const reviewPendingStatus = imageStatuses.find(s => s.statusCode === 'REVIEW_PENDING');
                  const reEditStatus = imageStatuses.find(s => s.statusCode === 'RE_EDIT_SUGGESTED');
                  const changesDoneStatus = imageStatuses.find(s => s.statusCode === 'RE_EDIT_DONE');
                  const reviewedStatus = imageStatuses.find(s => s.statusCode === 'APPROVED');
                  const clientSelectedStatus = imageStatuses.find(s => s.statusCode === 'CLIENT_SELECTED');
                  
                  return (
                    <>
                      {/* Review Pending - Blue eye */}
                      {reviewPendingStatus && image.imageStatusId === reviewPendingStatus.statusId && (
                        <div 
                          className={styles.imageStatusIndicator}
                          style={{ background: 'rgba(59, 130, 246, 0.95)' }}
                          title="Review pending"
                        >
                          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </div>
                      )}
                      
                      {/* Re-edit Requested - Yellow comment (clickable) */}
                      {reEditStatus && image.imageStatusId === reEditStatus.statusId && image.comment && (
                        <button 
                          className={styles.imageStatusIndicator}
                          style={{ background: 'rgba(251, 191, 36, 0.95)' }}
                          onClick={(e) => handleViewComment(image.comment, e)}
                          title="Click to view re-edit comment"
                        >
                          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                          </svg>
                        </button>
                      )}
                      
                      {/* Re-edit Done - Purple comment */}
                      {changesDoneStatus && image.imageStatusId === changesDoneStatus.statusId && (
                        <div 
                          className={styles.imageStatusIndicator}
                          style={{ background: 'rgba(147, 51, 234, 0.95)' }}
                          title="Re-edit done"
                        >
                          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                          </svg>
                        </div>
                      )}
                      
                      {/* Approved - Green checkmark */}
                      {reviewedStatus && image.imageStatusId === reviewedStatus.statusId && (
                        <div 
                          className={styles.imageStatusIndicator}
                          style={{ background: 'rgba(34, 197, 94, 0.95)' }}
                          title="Approved"
                        >
                          <svg fill="currentColor" viewBox="0 0 24 24">
                            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                          </svg>
                        </div>
                      )}
                      
                      {/* Client Selected - Blue double checkmark */}
                      {clientSelectedStatus && image.imageStatusId === clientSelectedStatus.statusId && (
                        <div 
                          className={styles.imageStatusIndicator}
                          style={{ background: 'rgba(59, 130, 246, 0.95)' }}
                          title="Client selected"
                        >
                          <svg fill="currentColor" viewBox="0 0 24 24">
                            <path d="M0.41,13.41L6,19L7.41,17.58L1.83,12M22.24,5.58L11.66,16.17L7.5,12L6.07,13.41L11.66,19L23.66,7M18,7L16.59,5.58L10.24,11.93L11.66,13.34L18,7Z" />
                          </svg>
                        </div>
                      )}
                    </>
                  );
                })()}
                
                <img 
                  src={image.compressedUrl || image.originalUrl} 
                  alt={image.fileName || 'Photo'} 
                  style={{ cursor: 'pointer', pointerEvents: 'none' }}
                />
                <div className={styles.imageName}>
                  {image.fileName || 'Untitled'}
                </div>
              </div>
            ))
          )}
        </div>
        </div>
        {/* End Gallery Card */}

        {/* Image Viewer Modal */}
        {viewerOpen && galleryImages.length > 0 && (
          <ImageViewer
            images={galleryImages.map(img => ({
              url: img.compressedUrl || img.originalUrl,
              originalUrl: img.originalUrl,
              filename: img.fileName || 'Image'
            }))}
            currentIndex={currentImageIndex}
            isOpen={viewerOpen}
            onClose={handleCloseViewer}
            onNavigate={handleNavigateViewer}
          />
        )}

        {/* Approve Images Confirmation Modal */}
        {showApproveModal && (
          <ConfirmationModal
            isOpen={showApproveModal}
            onClose={() => {
              if (isApprovingImages) return;
              setShowApproveModal(false);
              setPublishAfterApprove(false);
            }}
            onConfirm={confirmApproveImages}
            title="Approve Images"
            message={(
              <>
                Are you sure you want to approve <strong>{selectedImages.size}</strong> image{selectedImages.size !== 1 ? 's' : ''}? Approved images will be visible to the customer once the album is published.
              </>
            )}
            confirmText="Approve"
            cancelText="Cancel"
            isLoading={isApprovingImages}
            variant="primary"
          >
            {canPublishAfterApprove && (
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  background: 'var(--bg-secondary)',
                  padding: '0.75rem',
                  borderRadius: '0.5rem',
                  cursor: isApprovingImages ? 'not-allowed' : 'pointer'
                }}
              >
                <input
                  type="checkbox"
                  checked={publishAfterApprove}
                  onChange={(e) => setPublishAfterApprove(e.target.checked)}
                  style={{ width: '1rem', height: '1rem', cursor: 'pointer', accentColor: '#3b82f6' }}
                  disabled={isApprovingImages}
                />
                <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)', userSelect: 'none' }}>
                  Publish album after approving
                </span>
              </label>
            )}
          </ConfirmationModal>
        )}

        {/* Delete Confirmation Modal */}
        <ConfirmationModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={confirmBulkDelete}
          title="Delete Images"
          message={`Are you sure you want to delete ${selectedImages.size} image${selectedImages.size !== 1 ? 's' : ''}? This action cannot be undone and will permanently remove images from both S3 and Glacier storage.`}
          confirmText="Delete"
          cancelText="Cancel"
          isLoading={isDeleting}
          variant="danger"
        />

        {/* Request Re-edit Comment Modal */}
        <CommentModal
          isOpen={showCommentModal}
          onClose={() => setShowCommentModal(false)}
          onSubmit={confirmRequestReEdit}
          title="Request Re-edit"
          placeholder="Describe what changes are needed..."
          submitText="Request Re-edit"
          isLoading={isRequestingReEdit}
        />

        {/* Reupload Edited Images Modal */}
        <ReuploadModal
          isOpen={showReuploadModal}
          onClose={() => {
            setShowReuploadModal(false);
            setReuploadErrors([]); // Clear errors when closing
          }}
          onSubmit={confirmReupload}
          isLoading={isReuploadingImages}
          selectedCount={selectedImages.size}
          errors={reuploadErrors}
        />

        {/* Comment View Modal */}
        {showCommentViewModal && (
          <div className={styles.modalOverlay} onClick={() => setShowCommentViewModal(false)}>
            <div className={styles.commentViewModal} onClick={(e) => e.stopPropagation()}>
              <div className={styles.commentViewHeader}>
                <h3>Re-edit Comment</h3>
                <button 
                  className={styles.closeButton}
                  onClick={() => setShowCommentViewModal(false)}
                >
                  ×
                </button>
              </div>
              <div className={styles.commentViewBody}>
                <div className={styles.commentIcon}>
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                  </svg>
                </div>
                <p className={styles.commentText}>{viewingComment}</p>
              </div>
              <div className={styles.commentViewFooter}>
                <button 
                  className={styles.closeCommentButton}
                  onClick={() => setShowCommentViewModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Properties Modal */}
        {showPropertiesModal && (
          <div className={styles.modalOverlay} onClick={() => setShowPropertiesModal(false)}>
            <div className={styles.propertiesModal} onClick={(e) => e.stopPropagation()}>
              <div className={styles.propertiesHeader}>
                <h3>Image Properties</h3>
                <button 
                  className={styles.closeButton}
                  onClick={() => setShowPropertiesModal(false)}
                  aria-label="Close"
                >
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className={styles.propertiesContent}>
                {loadingProperties ? (
                  <Loading />
                ) : propertiesData ? (
                  <div className={styles.propertiesGrid}>
                    <div className={styles.propertyRow}>
                      <span className={styles.propertyLabel}>Name:</span>
                      <span className={styles.propertyValue}>{propertiesData.fileName || 'N/A'}</span>
                    </div>
                    <div className={styles.propertyRow}>
                      <span className={styles.propertyLabel}>Status:</span>
                      <span className={styles.propertyValue}>{propertiesData.status || 'N/A'}</span>
                    </div>
                    <div className={styles.propertyRow}>
                      <span className={styles.propertyLabel}>Size:</span>
                      <span className={styles.propertyValue}>
                        {propertiesData.fileSize 
                          ? `${(propertiesData.fileSize / 1024 / 1024).toFixed(2)} MB` 
                          : 'N/A'}
                      </span>
                    </div>
                    <div className={styles.propertyRow}>
                      <span className={styles.propertyLabel}>Captured At:</span>
                      <span className={styles.propertyValue}>
                        {propertiesData.capturedAt 
                          ? new Date(propertiesData.capturedAt).toLocaleString() 
                          : 'N/A'}
                      </span>
                    </div>
                    <div className={styles.propertyRow}>
                      <span className={styles.propertyLabel}>Edited At:</span>
                      <span className={styles.propertyValue}>
                        {propertiesData.editedAt 
                          ? new Date(propertiesData.editedAt).toLocaleString() 
                          : 'N/A'}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p>Failed to load properties</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Cover Preview Modal */}
        {showCoverPreviewModal && (() => {
          const imageId = Array.from(selectedImages)[0];
          const image = galleryImages.find(img => img.imageId === imageId);
          const imageUrl = image?.originalUrl || '';
          
          return imageUrl ? (
            <Modal
              isOpen={showCoverPreviewModal}
              onClose={() => {
                setShowCoverPreviewModal(false);
                setSelectedCoverDevice(null);
              }}
              title={`Set ${selectedCoverDevice?.charAt(0).toUpperCase()}${selectedCoverDevice?.slice(1)} Cover`}
              size="large"
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '20px' }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center',
                  maxHeight: '70vh',
                  overflow: 'hidden'
                }}>
                  <img 
                    src={imageUrl} 
                    alt="Cover preview" 
                    style={{ 
                      maxWidth: '100%', 
                      maxHeight: '70vh', 
                      objectFit: 'contain'
                    }} 
                  />
                </div>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => {
                      setShowCoverPreviewModal(false);
                      setSelectedCoverDevice(null);
                    }}
                    style={{
                      padding: '8px 16px',
                      border: '1px solid var(--border-color)',
                      borderRadius: '6px',
                      background: 'var(--bg-secondary)',
                      color: 'var(--text-primary)',
                      cursor: 'pointer'
                    }}
                    disabled={isSettingCover}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmSetCover}
                    style={{
                      padding: '8px 16px',
                      border: 'none',
                      borderRadius: '6px',
                      background: 'var(--color-primary)',
                      color: 'white',
                      cursor: 'pointer'
                    }}
                    disabled={isSettingCover}
                  >
                    {isSettingCover ? 'Setting...' : 'Confirm'}
                  </button>
                </div>
              </div>
            </Modal>
          ) : null;
        })()}
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
            {/* Back button when viewing events */}
            {selectedProject && !selectedEvent && !showVideosView && (
              <button
                className={styles.backButton}
                onClick={handleBackToProjects}
              >
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span>Back to Projects</span>
              </button>
            )}
            {/* Search */}
            {!showVideosView && !selectedProject && (
              <Input
                type="text"
                placeholder={'Search projects...'}
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
            )}
            {showVideosView && (
              <button
                className={styles.backButton}
                onClick={() => setShowVideosView(false)}
              >
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span>Back to Events</span>
              </button>
            )}
          </div>
          <div className={styles.filtersRight}>
            {selectedProject && !selectedEvent && !showVideosView && (
              <button
                type="button"
                className={styles.uploadAlbumButton}
                onClick={openAlbumPdfManagerBulk}
                disabled={events.length === 0}
              >
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>Upload Album PDF</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <AlbumPdfUploadManager
        ref={albumPdfUploadManagerRef}
        selectedProject={selectedProject}
        events={events}
        eventTypes={eventTypes}
        setEvents={setEvents}
        setAllEvents={setAllEvents}
        setSelectedEvent={setSelectedEvent}
        showBulkTrigger={false}
        onUploadSuccess={refetchAlbumPdfs}
      />

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
          ) : showContent ? (
            <div className={styles.contentWrapper}>
              <div className={styles.projectsGrid}>
                {paginatedItems.map((project: any, index: number) => (
                  <div
                    key={project.projectId}
                    className={styles.card}
                    style={{ '--card-index': index + 1 } as React.CSSProperties}
                  >
                    <div className={styles.cardImage} onClick={() => handleProjectClick(project)}>
                      <img
                        src={project.desktopCoverUrl || project.coverPhoto || 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=500&h=400&fit=crop'}
                        alt={project.projectName}
                        onLoad={(e) => e.currentTarget.classList.add('loaded')}
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
          </div>
          ) : null}
        </div>
      )}

      {/* Videos View */}
      {showVideosView && selectedProject && !selectedEvent && (
        <div className={styles.videosViewContainer}>
          <VideosView 
            project={selectedProject}
            onUpdate={async () => {
              try {
                const response = await projectApi.getById(selectedProject.projectId);
                const updatedProject = response.project;
                setProjects((prev) => 
                  prev.map((p) => p.projectId === selectedProject.projectId ? updatedProject : p)
                );
                setSelectedProject(updatedProject);
              } catch (error) {
                console.error('Error refreshing project:', error);
              }
            }}
          />
        </div>
      )}

      {/* Events Grid */}
      {selectedProject && !selectedEvent && !showVideosView && (
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
          ) : showContent ? (
            <div className={styles.contentWrapper}>
              <div className={styles.eventsGrid}>
                {paginatedItems.map((eventItem: any, index: number) => (
                  <div 
                    key={eventItem.clientEventId} 
                    className={styles.card}
                    style={{ '--card-index': index + 1, cursor: 'pointer' } as React.CSSProperties}
                    onClick={() => {
                      console.log('Card clicked!', eventItem);
                      handleEventClick(eventItem);
                    }}
                  >
                    <div className={styles.cardImage}>
                      <img
                        src={
                          getFirstEventImage(eventItem.clientEventId)?.compressedUrl || 
                          'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=500&h=400&fit=crop'
                        }
                        alt={eventTypes.get(eventItem.eventId)?.eventDesc || 'Event'}
                        onLoad={(e) => e.currentTarget.classList.add('loaded')}
                      />
                    </div>

                    <div className={styles.cardContent}>
                    <div className={styles.cardMenu} ref={openMenuId === eventItem.clientEventId ? menuRef : null}>
                      <button
                        className={styles.menuButton}
                        onClick={(e) => handleToggleMenu(eventItem.clientEventId, e)}
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
                      {openMenuId === eventItem.clientEventId && (
                        <EventMenuDropdown
                          event={eventItem}
                          isDownloadingAll={downloadingEventId === eventItem.clientEventId}
                          isDownloadingAlbumDesign={downloadingDesignEventId === eventItem.clientEventId}
                          onDownloadAll={handleDownloadEventImages}
                          onDownloadAlbumDesign={handleDownloadAlbumDesignImages}
                          onSetStatus={handleSetEventStatus}
                          onPublish={handlePublishToCustomer}
                          onUploadAlbumPdf={openAlbumPdfManagerForEvent}
                        />
                      )}
                    </div>

                    <div className={styles.cardTitle}>
                      {eventTypes.get(eventItem.eventId)?.eventDesc || 'Untitled Event'}
                      {/* Status badge - Show event delivery status */}
                      {eventItem.eventDeliveryStatusId && (() => {
                        const status = eventDeliveryStatuses.get(eventItem.eventDeliveryStatusId);
                        if (!status) return null;
                        return (
                          <StatusBadge
                            label={status.statusDescription}
                            className={styles.badgeInlineCardTitle}
                            aria-label={`Status: ${status.statusDescription}`}
                          />
                        );
                      })()}
                    </div>

                    <EventDateTime fromDatetime={eventItem.fromDatetime} toDatetime={eventItem.toDatetime} />

                    <div className={styles.cardStats}>
                      {(() => {
                        const photoCount = getEventImageCount(eventItem.clientEventId);
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
                        <span>{getTimeAgo(eventItem.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Videos Card - Show at the end */}
              <VideosCard 
                projectId={selectedProject.projectId}
                videoCount={selectedProject.videoUrls?.length || 0}
                onClick={() => setShowVideosView(true)}
              />
            </div>
          </div>
          ) : null}
        </div>
      )}

      {/* Pagination */}
      {showContent && filteredItems.length > 10 && (
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

      {/* Image Viewer Modal */}
      {viewerOpen && galleryImages.length > 0 && (
        <ImageViewer
          images={galleryImages.map(img => ({
            url: img.compressedUrl || img.originalUrl,
            originalUrl: img.originalUrl,
            filename: img.fileName || 'Image'
          }))}
          currentIndex={currentImageIndex}
          isOpen={viewerOpen}
          onClose={handleCloseViewer}
          onNavigate={handleNavigateViewer}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmBulkDelete}
        title="Delete Images"
        message={`Are you sure you want to delete ${selectedImages.size} image${selectedImages.size !== 1 ? 's' : ''}? This action cannot be undone and will permanently remove images from both S3 and Glacier storage.`}
        confirmText="Delete"
        cancelText="Cancel"
        isLoading={isDeleting}
        variant="danger"
      />

      {/* Properties Modal */}
      {showPropertiesModal && (
        <div className={styles.modalOverlay} onClick={() => setShowPropertiesModal(false)}>
          <div className={styles.propertiesModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.propertiesHeader}>
              <h3>Image Properties</h3>
              <button 
                className={styles.closeButton}
                onClick={() => setShowPropertiesModal(false)}
                aria-label="Close"
              >
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className={styles.propertiesContent}>
              {loadingProperties ? (
                <Loading />
              ) : propertiesData ? (
                <div className={styles.propertiesGrid}>
                  <div className={styles.propertyRow}>
                    <span className={styles.propertyLabel}>Name:</span>
                    <span className={styles.propertyValue}>{propertiesData.fileName || 'N/A'}</span>
                  </div>
                  <div className={styles.propertyRow}>
                    <span className={styles.propertyLabel}>Status:</span>
                    <span className={styles.propertyValue}>{propertiesData.status || 'N/A'}</span>
                  </div>
                  <div className={styles.propertyRow}>
                    <span className={styles.propertyLabel}>Size:</span>
                    <span className={styles.propertyValue}>
                      {propertiesData.fileSize 
                        ? `${(propertiesData.fileSize / 1024 / 1024).toFixed(2)} MB` 
                        : 'N/A'}
                    </span>
                  </div>
                  <div className={styles.propertyRow}>
                    <span className={styles.propertyLabel}>Captured At:</span>
                    <span className={styles.propertyValue}>
                      {propertiesData.capturedAt 
                        ? new Date(propertiesData.capturedAt).toLocaleString() 
                        : 'N/A'}
                    </span>
                  </div>
                  <div className={styles.propertyRow}>
                    <span className={styles.propertyLabel}>Edited At:</span>
                    <span className={styles.propertyValue}>
                      {propertiesData.editedAt 
                        ? new Date(propertiesData.editedAt).toLocaleString() 
                        : 'N/A'}
                    </span>
                  </div>
                </div>
              ) : (
                <p>Failed to load properties</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Publish to Customer Modal */}
      {showPublishModal && selectedEventForPublish && (
        <Modal
          isOpen={showPublishModal}
          onClose={() => {
            setShowPublishModal(false);
            setSelectedEventForPublish(null);
          }}
          title="Publish to Customer"
          size="small"
        >
          <div style={{ padding: '1rem' }}>
            {publishError && (
              <div style={{
                padding: '0.75rem',
                marginBottom: '1rem',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '0.375rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <svg 
                  style={{ width: '1.25rem', height: '1.25rem', flexShrink: 0 }}
                  fill="none" 
                  stroke="#ef4444" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                  />
                </svg>
                <span style={{ fontSize: '0.875rem', color: '#dc2626' }}>{publishError}</span>
              </div>
            )}

            <p style={{ marginBottom: '0.75rem', lineHeight: '1.6', color: 'var(--text-color)' }}>
              You are about to publish this album to the customer. All approved images will be picked up for publishing to the customer.
            </p>
            <p style={{ marginBottom: '0.5rem', lineHeight: '1.6', color: 'var(--text-secondary)' }}>
              You can approve more images in this album anytime to publish more.
            </p>
            <p style={{ marginBottom: '0.5rem', lineHeight: '1.6', fontSize: '0.875rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
              Once published, the customer will be able to select their favorite photos for the final album.
            </p>
            <p style={{ marginBottom: '1rem', lineHeight: '1.6', fontSize: '0.875rem', fontWeight: 600, color: approvedPhotosCount > 0 ? '#10b981' : '#ef4444' }}>
              Approved photos: {approvedPhotosCount}
            </p>
            
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem', 
              marginBottom: '1rem',
              padding: '0.5rem',
              background: 'var(--bg-secondary)',
              borderRadius: '0.375rem'
            }}>
              <input
                type="checkbox"
                id="publishConfirm"
                checked={publishConfirmed}
                onChange={(e) => setPublishConfirmed(e.target.checked)}
                style={{
                  width: '1rem',
                  height: '1rem',
                  cursor: 'pointer',
                  accentColor: '#3b82f6'
                }}
              />
              <label 
                htmlFor="publishConfirm" 
                style={{ 
                  fontSize: '0.875rem', 
                  color: 'var(--text-color)',
                  cursor: 'pointer',
                  userSelect: 'none'
                }}
              >
                Publish this album to customer
              </label>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowPublishModal(false);
                  setSelectedEventForPublish(null);
                }}
                style={{
                  padding: '0.5rem 1rem',
                  border: '1px solid var(--border-color)',
                  borderRadius: '0.375rem',
                  background: 'transparent',
                  color: 'var(--text-color)',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '500'
                }}
                disabled={isPublishing}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmPublish}
                style={{
                  padding: '0.5rem 1rem',
                  border: 'none',
                  borderRadius: '0.375rem',
                  background: '#6366f1',
                  color: 'white',
                  cursor: (isPublishing || !publishConfirmed || approvedPhotosCount === 0) ? 'not-allowed' : 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  opacity: (isPublishing || !publishConfirmed || approvedPhotosCount === 0) ? 0.6 : 1
                }}
                disabled={isPublishing || !publishConfirmed || approvedPhotosCount === 0}
              >
                {isPublishing ? 'Publishing...' : 'Publish'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Set Event Status Modal */}
      {selectedEventForStatus && (
        <Modal
          isOpen={showStatusModal}
          onClose={() => setShowStatusModal(false)}
          title="Set Event Status"
          size="small"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                Event
              </label>
              <div style={{ padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: '0.5rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                {eventTypes.get(selectedEventForStatus.eventId)?.eventDesc || 'Untitled Event'}
              </div>
            </div>
            
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                Current Status
              </label>
              <div style={{ padding: '0.75rem', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '0.5rem', fontWeight: 600, color: '#6366f1' }}>
                {selectedEventForStatus.eventDeliveryStatusId 
                  ? eventDeliveryStatuses.get(selectedEventForStatus.eventDeliveryStatusId)?.statusDescription || 'No Status'
                  : 'No Status'}
                {selectedEventForStatus.eventDeliveryStatusId && (
                  <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                    Step {eventDeliveryStatuses.get(selectedEventForStatus.eventDeliveryStatusId)?.step || 0}
                  </div>
                )}
              </div>
            </div>

            <div>
              <SearchableSelect
                label="New Status"
                value={newStatusId}
                onChange={(value) => {
                  setNewStatusId(value);
                  setStatusError('');
                }}
                options={[
                  { value: '', label: 'Select new status' },
                  ...Array.from(eventDeliveryStatuses.entries())
                    .sort((a, b) => a[1].step - b[1].step)
                    .map(([statusId, status]) => ({
                      value: statusId,
                      label: `${status.statusDescription} (Step ${status.step})`
                    }))
                ]}
                placeholder="Select a status"
                required
              />
              {statusError && (
                <div style={{ 
                  marginTop: '0.5rem', 
                  fontSize: '0.875rem', 
                  color: '#ef4444',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <svg style={{ width: '16px', height: '16px', flexShrink: 0 }} fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  {statusError}
                </div>
              )}
            </div>

            {getNextAvailableStatus(selectedEventForStatus.eventDeliveryStatusId) && (
              <div style={{ 
                padding: '0.75rem', 
                backgroundColor: 'rgba(99, 102, 241, 0.05)', 
                borderRadius: '0.5rem',
                border: '1px solid rgba(99, 102, 241, 0.2)',
                fontSize: '0.875rem',
                color: 'var(--text-secondary)'
              }}>
                <strong style={{ color: 'var(--text-primary)' }}>Next Status:</strong> {getNextAvailableStatus(selectedEventForStatus.eventDeliveryStatusId)?.statusDescription}
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
              <button
                style={{ 
                  padding: '0.625rem 1.25rem', 
                  border: '1px solid var(--border-color)', 
                  borderRadius: '0.5rem', 
                  background: 'transparent', 
                  color: 'var(--text-primary)', 
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: 600
                }}
                onClick={() => setShowStatusModal(false)}
                disabled={isUpdatingStatus}
              >
                Cancel
              </button>
              <button
                style={{ 
                  padding: '0.625rem 1.25rem', 
                  border: 'none', 
                  borderRadius: '0.5rem', 
                  background: '#6366f1', 
                  color: 'white', 
                  cursor: newStatusId ? 'pointer' : 'not-allowed',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  opacity: newStatusId ? 1 : 0.5
                }}
                onClick={handleUpdateEventStatus}
                disabled={isUpdatingStatus || !newStatusId}
              >
                {isUpdatingStatus ? 'Updating...' : 'Update Status'}
              </button>
            </div>
          </div>
        </Modal>
      )}

    </div>
  );
};

export default Albums;
