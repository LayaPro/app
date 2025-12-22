import { useState } from 'react';
import React from 'react';
import { useAppDispatch, useAppSelector } from '../../store/index.js';
import { reorderWorkflowStatuses, setEventStatuses, addWorkflowStatus } from '../../store/slices/eventsSlice.js';
import { Modal } from '../ui/Modal.js';
import { WorkflowStepForm } from '../forms/WorkflowStepForm.js';
import styles from './EventCard.module.css';
import workflowStyles from './EventWorkflow.module.css';

interface EventWorkflowCardProps {
  eventStatuses: any[];
  loading: boolean;
  isExpanded: boolean;
  onToggle: () => void;
}

export const EventWorkflowCard: React.FC<EventWorkflowCardProps> = ({
  eventStatuses,
  loading,
  isExpanded,
  onToggle,
}) => {
  const dispatch = useAppDispatch();
  const reduxEventStatuses = useAppSelector((state) => state.events.eventStatuses);
  const hasUnsavedChanges = useAppSelector((state) => state.events.hasUnsavedWorkflowChanges);
  
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isReorderMode, setIsReorderMode] = useState(false);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);

  // Initialize Redux state when prop changes and there are no unsaved changes
  React.useEffect(() => {
    if (eventStatuses.length > 0 && !hasUnsavedChanges) {
      const sorted = [...eventStatuses].sort((a, b) => a.step - b.step);
      dispatch(setEventStatuses(sorted));
    }
  }, [eventStatuses, hasUnsavedChanges, dispatch]);

  // Use Redux state if available, otherwise fall back to props
  const displayStatuses = reduxEventStatuses.length > 0 ? reduxEventStatuses : eventStatuses;

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.currentTarget.innerHTML);
    // Add slight delay to allow the drag image to be captured
    setTimeout(() => {
      (e.target as HTMLElement).style.opacity = '0.4';
    }, 0);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    (e.target as HTMLElement).style.opacity = '1';
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedIndex !== null && draggedIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== dropIndex) {
      dispatch(reorderWorkflowStatuses({ fromIndex: draggedIndex, toIndex: dropIndex }));
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleSave = () => {
    console.log('Saving workflow order:');
    console.log('Updated statuses:', reduxEventStatuses.map((s, idx) => ({
      statusId: s.statusId,
      statusCode: s.statusCode,
      step: s.step,
      position: idx + 1
    })));
    // TODO: Call API to save the new order
    // After successful API call: dispatch(clearUnsavedWorkflowChanges());
  };

  const handleAddClick = () => {
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
  };

  const handleFormSubmit = async (data: { statusCode: string; statusDescription?: string }) => {
    setIsSubmitting(true);
    try {
      // TODO: Call API to create new workflow step
      // For now, just add to Redux state
      dispatch(addWorkflowStatus(data));
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error adding workflow step:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReorderToggle = () => {
    if (isReorderMode && hasUnsavedChanges) {
      // Auto-save when exiting reorder mode
      handleSave();
    }
    setIsReorderMode(!isReorderMode);
  };

  const handleTouchStart = (e: React.TouchEvent, index: number) => {
    if (!isReorderMode) return;
    e.preventDefault();
    const touch = e.touches[0];
    setTouchStartY(touch.clientY);
    setDraggedIndex(index);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isReorderMode || draggedIndex === null || touchStartY === null) return;
    e.preventDefault();
    const touch = e.touches[0];
    
    const delta = touch.clientY - touchStartY;
    const cardHeight = 100; // card height including gap
    const threshold = cardHeight * 0.8; // 80% of card height for more deliberate dragging
    
    if (Math.abs(delta) > threshold) {
      const direction = delta > 0 ? 1 : -1;
      const newIndex = draggedIndex + direction;
      
      if (newIndex >= 0 && newIndex < displayStatuses.length) {
        dispatch(reorderWorkflowStatuses({ fromIndex: draggedIndex, toIndex: newIndex }));
        setDraggedIndex(newIndex);
        // Reset to current position to prevent multiple rapid swaps
        setTouchStartY(touch.clientY);
      }
    }
  };

  const handleTouchEnd = () => {
    setTouchStartY(null);
    setDraggedIndex(null);
  };

  return (
    <div className={styles.card}>
      <button
        className={styles.cardHeader}
        onClick={onToggle}
      >
        <div className={styles.cardHeaderContent}>
          <svg className={styles.cardIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
          <div>
            <h2 className={styles.cardTitle}>Event Workflow</h2>
            <p className={styles.cardSubtitle}>Define workflow steps for event delivery (Booking → Shooting → Editing → Delivered)</p>
          </div>
        </div>
        <svg
          className={`${styles.chevron} ${isExpanded ? styles.chevronExpanded : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <div className={`${styles.cardContent} ${isExpanded ? styles.cardContentExpanded : ''}`}>
        <div className={styles.contentInner}>
          {loading ? (
            <div className={workflowStyles.loading}>Loading workflow...</div>
          ) : displayStatuses.length === 0 ? (
            <div className={workflowStyles.empty}>
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              <p>No workflow steps defined yet</p>
              <button className={workflowStyles.addButton} onClick={handleAddClick}>
                Add First Step
              </button>
            </div>
          ) : (
            <>
              <div className={workflowStyles.toolbar}>
                <button 
                  className={workflowStyles.reorderModeButton}
                  onClick={handleReorderToggle}
                >
                  {isReorderMode ? (
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  )}
                  {isReorderMode ? 'Done' : 'Reorder'}
                </button>
                <button 
                  className={workflowStyles.addStepButton}
                  onClick={handleAddClick}
                >
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Workflow Step
                </button>
              </div>
              <div className={workflowStyles.workflowContainer}>
                {displayStatuses.map((status, index) => (
                  <div key={status.statusId} className={workflowStyles.stepWrapper}>
                    <div 
                      className={`${workflowStyles.stepCard} ${
                        draggedIndex === index ? workflowStyles.dragging : ''
                      } ${
                        dragOverIndex === index ? workflowStyles.dragOver : ''
                      } ${
                        isReorderMode ? workflowStyles.shake : ''
                      }`}
                      draggable={isReorderMode}
                      onDragStart={(e) => handleDragStart(e, index)}
                      onDragEnd={handleDragEnd}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, index)}
                      onTouchStart={(e) => handleTouchStart(e, index)}
                      onTouchMove={handleTouchMove}
                      onTouchEnd={handleTouchEnd}
                    >
                      <div className={workflowStyles.stepHeader}>
                        <div className={workflowStyles.stepBadge}>
                          <span>{status.step}</span>
                        </div>
                        <button 
                          className={workflowStyles.deleteButton} 
                          title="Delete"
                          onClick={() => console.log('Delete status', status)}
                        >
                          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                      <div className={workflowStyles.stepContent}>
                        <h4 className={workflowStyles.statusCode}>{status.statusCode}</h4>
                      </div>
                    </div>
                    {index < displayStatuses.length - 1 && (
                      <div className={workflowStyles.connector}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        title="Add Workflow Step"
        size="medium"
      >
        <WorkflowStepForm
          onSubmit={handleFormSubmit}
          onCancel={handleModalClose}
          isLoading={isSubmitting}
        />
      </Modal>
    </div>
  );
};