import React, { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth.js';
import { storageApi } from '../../services/api.js';
import { UpgradePlanModal } from '../../components/modals/UpgradePlanModal.js';
import { PageHeader, HelpPanel } from '../../components/help/index.js';
import { getHelpContent } from '../../data/helpContent.js';
import styles from './Storage.module.css';

interface StorageStats {
  storageUsedGB: number;
  storageLimitGB: number;
  percentageUsed: number;
  remainingGB: number;
  isNearLimit: boolean;
  isOverLimit: boolean;
  planName?: string;
}

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

const Storage: React.FC = () => {
  const { user } = useAuth();
  const [storage, setStorage] = useState<StorageStats>({
    storageUsedGB: 0,
    storageLimitGB: 0,
    percentageUsed: 0,
    remainingGB: 0,
    isNearLimit: false,
    isOverLimit: false,
  });
  const [breakdown, setBreakdown] = useState<StorageBreakdownData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  
  const helpContent = getHelpContent('storage');

  useEffect(() => {
    const fetchStorageData = async () => {
      if (!user?.tenantId) return;

      try {
        setLoading(true);
        const [statsResponse, breakdownResponse] = await Promise.all([
          storageApi.getStats(user.tenantId),
          storageApi.getBreakdown(user.tenantId),
        ]);
        setStorage(statsResponse);
        setBreakdown(breakdownResponse);
      } catch (error) {
        console.error('Error fetching storage data:', error);
        setBreakdown(null);
      } finally {
        setLoading(false);
      }
    };

    fetchStorageData();

    // Listen for storage update events
    const handleStorageUpdate = () => {
      console.log('[Storage] Received storage update event, refreshing...');
      fetchStorageData();
    };

    window.addEventListener('storageUpdated', handleStorageUpdate);
    return () => window.removeEventListener('storageUpdated', handleStorageUpdate);
  }, [user?.tenantId]);

  const getStatusColor = () => {
    if (storage.isOverLimit) return '#ef4444'; // red
    if (storage.isNearLimit) return '#f59e0b'; // amber
    return '#10b981'; // green
  };

  const getStatusText = () => {
    if (storage.isOverLimit) return 'Storage Limit Exceeded';
    if (storage.isNearLimit) return 'Near Storage Limit';
    return 'Storage Healthy';
  };

  const formatSize = (sizeGB: number) => {
    if (sizeGB < 1) {
      const sizeMB = sizeGB * 1024;
      return `${sizeMB.toFixed(2)} MB`;
    }
    return `${sizeGB.toFixed(2)} GB`;
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

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner}></div>
          <p>Loading storage data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <PageHeader onHelpClick={() => setShowHelp(true)} />

      {/* Overview Card */}
      <div className={styles.overviewCard}>
        <div className={styles.overviewHeader}>
          <div>
            <h2 className={styles.cardTitle}>Storage Overview</h2>
            {storage.planName && (
              <span className={styles.planBadge}>{storage.planName}</span>
            )}
          </div>
          
          {storage.isOverLimit ? (
            <div className={styles.statusBadge} style={{ backgroundColor: getStatusColor() }}>
              {getStatusText()}
            </div>
          ) : storage.isNearLimit ? (
            <div className={styles.statusBadge} style={{ backgroundColor: getStatusColor() }}>
              {getStatusText()}
            </div>
          ) : (
            <button className={styles.upgradeButton} onClick={() => setShowUpgradeModal(true)}>
              <svg className={styles.crownIcon} fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              Upgrade Plan
            </button>
          )}
        </div>

        <div className={styles.storageMetrics}>
          <div className={styles.metric}>
            <span className={styles.metricLabel}>Used</span>
            <span className={styles.metricValue} style={{ color: getStatusColor() }}>
              {formatSize(storage.storageUsedGB)}
            </span>
          </div>
          <div className={styles.metric}>
            <span className={styles.metricLabel}>Total Limit</span>
            <span className={styles.metricValue}>
              {storage.storageLimitGB} GB
            </span>
          </div>
          <div className={styles.metric}>
            <span className={styles.metricLabel}>Remaining</span>
            <span className={styles.metricValue}>
              {formatSize(storage.remainingGB)}
            </span>
          </div>
          <div className={styles.metric}>
            <span className={styles.metricLabel}>Usage</span>
            <span className={styles.metricValue}>
              {storage.percentageUsed.toFixed(1)}%
            </span>
          </div>
        </div>

        <div className={styles.progressSection}>
          <div className={styles.progressBar}>
            <div 
              className={styles.progressFill}
              style={{ 
                width: `${Math.min(storage.percentageUsed, 100)}%`,
                backgroundColor: getStatusColor()
              }}
            />
          </div>
          <div className={styles.progressLabels}>
            <span>0 GB</span>
            <span>{storage.storageLimitGB} GB</span>
          </div>
        </div>
      </div>

      {/* Breakdown Card */}
      <div className={styles.breakdownCard}>
        <h2 className={styles.cardTitle}>Storage Breakdown by Projects</h2>
        <p className={styles.cardSubtitle}>View detailed storage usage across all projects and events</p>

        {breakdown && breakdown.totalImages > 0 && (
          <div className={styles.totalStats}>
            <span className={styles.totalLabel}>Total:</span>
            <span className={styles.totalValue}>
              {formatStorage(breakdown.totalStorageBytes, breakdown.totalStorageGB)}
            </span>
            <span className={styles.totalImages}>({breakdown.totalImages.toLocaleString()} images)</span>
          </div>
        )}

        <div className={styles.breakdownList}>
          {!breakdown || breakdown.projects.length === 0 ? (
            <div className={styles.emptyState}>
              <svg className={styles.emptyIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <p>No projects with images found</p>
              <span>Start uploading images to projects to see storage breakdown</span>
            </div>
          ) : (
            breakdown.projects.map((project) => {
              const isExpanded = expandedProjects.has(project.projectId);
              return (
                <div key={project.projectId} className={styles.projectItem}>
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
                        <div className={styles.projectName}>{project.projectName}</div>
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
            })
          )}
        </div>
      </div>

      {/* Alert Messages */}
      {storage.isOverLimit && (
        <div className={styles.alertCard} style={{ borderColor: '#ef4444' }}>
          <svg className={styles.alertIcon} fill="none" stroke="#ef4444" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div className={styles.alertContent}>
            <h3 className={styles.alertTitle}>Storage Limit Exceeded</h3>
            <p className={styles.alertText}>
              You have exceeded your storage limit. Please delete some files or upgrade your plan to continue uploading.
            </p>
          </div>
        </div>
      )}

      {storage.isNearLimit && !storage.isOverLimit && (
        <div className={styles.alertCard} style={{ borderColor: '#f59e0b' }}>
          <svg className={styles.alertIcon} fill="none" stroke="#f59e0b" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div className={styles.alertContent}>
            <h3 className={styles.alertTitle}>Approaching Storage Limit</h3>
            <p className={styles.alertText}>
              You are nearing your storage limit. Consider cleaning up unused files or upgrading your plan.
            </p>
          </div>
        </div>
      )}
      
      <UpgradePlanModal
        show={showUpgradeModal}
        currentPlanCode={storage.planName}
        onClose={() => setShowUpgradeModal(false)}
        onSelectPlan={() => {
          // Plan upgrade is handled by the modal
          // Storage will be refreshed via storageUpdated event
        }}
      />
      
      {showHelp && helpContent && (
        <HelpPanel help={helpContent} onClose={() => setShowHelp(false)} />
      )}
    </div>
  );
};

export default Storage;
