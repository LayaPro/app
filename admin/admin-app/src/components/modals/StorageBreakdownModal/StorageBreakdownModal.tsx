import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../hooks/useAuth.js';
import { storageApi } from '../../../services/api.js';
import { Modal } from '../../ui/Modal.js';
import styles from './StorageBreakdownModal.module.css';

interface EventBreakdown {
  clientEventId: string;
  eventName: string;
  eventDate?: Date;
  imageCount: number;
  storageBytes: number;
  storageGB: number;
}

interface ProjectBreakdown {
  projectId: string;
  projectName: string;
  clientName: string;
  imageCount: number;
  storageBytes: number;
  storageGB: number;
  events: EventBreakdown[];
}

interface StorageBreakdownData {
  tenantId: string;
  totalImages: number;
  totalStorageBytes: number;
  totalStorageGB: number;
  projectCount: number;
  projects: ProjectBreakdown[];
}

interface StorageBreakdownModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StorageBreakdownModal: React.FC<StorageBreakdownModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { user } = useAuth();
  const [data, setData] = useState<StorageBreakdownData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (isOpen && user?.tenantId) {
      fetchBreakdown();
    }
  }, [isOpen, user?.tenantId]);

  const fetchBreakdown = async () => {
    if (!user?.tenantId) return;

    try {
      setLoading(true);
      console.log('[StorageBreakdownModal] Fetching breakdown for tenantId:', user.tenantId);
      const response = await storageApi.getBreakdown(user.tenantId);
      console.log('[StorageBreakdownModal] Response:', response);
      setData(response);
    } catch (error) {
      console.error('Error fetching storage breakdown:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleProject = (projectId: string) => {
    setExpandedProjects(prev => {
      const newSet = new Set(prev);
      if (newSet.has(projectId)) {
        newSet.delete(projectId);
      } else {
        newSet.add(projectId);
      }
      return newSet;
    });
  };

  const formatStorage = (bytes: number, gb: number) => {
    if (gb < 0.01) {
      const mb = bytes / (1024 * 1024);
      return `${mb.toFixed(2)} MB`;
    }
    return `${gb.toFixed(2)} GB`;
  };

  const formatDate = (date?: Date) => {
    if (!date) return 'No date';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Storage Breakdown" size="medium">
      <div className={styles.modalContent}>
        {/* Total Stats */}
        {data && (
          <div className={styles.totalStats}>
            <span className={styles.totalLabel}>Total Usage:</span>
            <span className={styles.totalValue}>
              {formatStorage(data.totalStorageBytes, data.totalStorageGB)}
            </span>
            <span className={styles.totalImages}>({data.totalImages.toLocaleString()} images)</span>
          </div>
        )}

        {/* Content */}
        {loading ? (
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Loading storage breakdown...</p>
        </div>
      ) : !data || data.projects.length === 0 ? (
        <div className={styles.empty}>
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
          <p>No projects with images found</p>
        </div>
      ) : (
        <div className={styles.projectsList}>
              {data.projects.map((project) => {
                const isExpanded = expandedProjects.has(project.projectId);
                return (
                  <div key={project.projectId} className={styles.projectItem}>
                    {/* Project Header */}
                    <div
                      className={styles.projectHeader}
                      onClick={() => toggleProject(project.projectId)}
                    >
                      <div className={styles.projectInfo}>
                        <svg
                          className={`${styles.expandIcon} ${isExpanded ? styles.expanded : ''}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                        <div className={styles.projectDetails}>
                          <div className={styles.projectName}>
                            {project.projectName}
                          </div>
                          <div className={styles.clientName}>{project.clientName}</div>
                        </div>
                      </div>
                      <div className={styles.projectStats}>
                        <div className={styles.storageInfo}>
                          <span className={styles.storageValue}>
                            {formatStorage(project.storageBytes, project.storageGB)}
                          </span>
                          <span className={styles.imageCount}>
                            {project.imageCount.toLocaleString()} images
                          </span>
                        </div>
                        <div className={styles.eventCount}>
                          {project.events.length} {project.events.length === 1 ? 'event' : 'events'}
                        </div>
                      </div>
                    </div>

                    {/* Events List */}
                    {isExpanded && project.events.length > 0 && (
                      <div className={styles.eventsList}>
                        {project.events.map((event) => (
                          <div key={event.clientEventId} className={styles.eventItem}>
                            <div className={styles.eventInfo}>
                              <div className={styles.eventName}>{event.eventName}</div>
                              <div className={styles.eventDate}>{formatDate(event.eventDate)}</div>
                            </div>
                            <div className={styles.eventStats}>
                              <span className={styles.eventStorage}>
                                {formatStorage(event.storageBytes, event.storageGB)}
                              </span>
                              <span className={styles.eventImages}>
                                {event.imageCount.toLocaleString()} images
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {isExpanded && project.events.length === 0 && (
                      <div className={styles.noEvents}>No events in this project</div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
      </div>
    </Modal>
  );
};
