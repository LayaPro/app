import type { FC } from 'react';
import { useMemo } from 'react';
import { CollapsibleCard } from '../../components/ui/CollapsibleCard.js';
import styles from './EventCard.module.css';
import workflowStyles from './EventWorkflow.module.css';

interface EventWorkflowCardProps {
  eventStatuses: any[];
  loading: boolean;
  isExpanded: boolean;
  onToggle: () => void;
}

export const EventWorkflowCard: FC<EventWorkflowCardProps> = ({
  eventStatuses,
  loading,
  isExpanded,
  onToggle,
}) => {
  const displayStatuses = useMemo(() => {
    return [...eventStatuses]
      .filter((status) => !status.isHidden)
      .sort((a, b) => (a.step ?? 0) - (b.step ?? 0));
  }, [eventStatuses]);

  return (
    <CollapsibleCard
        icon={
          <svg className={styles.cardIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
        }
        title="Event/Album Workflow"
        subtitle="Event workflow steps are guided by the delivery journey and update automatically"
        isExpanded={isExpanded}
        onToggle={onToggle}
      >
        {loading ? (
          <div className={workflowStyles.loading}>Loading workflow...</div>
        ) : displayStatuses.length === 0 ? (
          <div className={workflowStyles.empty}>
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            <p>Workflow steps are managed by the system.</p>
          </div>
        ) : (
          <>
            <div className={workflowStyles.workflowInfo}>
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M12 6a9 9 0 100 12 9 9 0 000-12z" />
              </svg>
              <div>
                <p>Event workflow steps are system-managed and update automatically.</p>
                <span>Statuses reflect where the event sits in the delivery journey.</span>
              </div>
            </div>
            <div className={workflowStyles.workflowContainer}>
              {displayStatuses.map((status, index) => (
                <div key={status.statusId} className={workflowStyles.stepWrapper}>
                  <div className={workflowStyles.stepCard}>
                    <div className={workflowStyles.stepHeader}>
                      <div className={workflowStyles.stepBadge}>
                        <span>{status.step}</span>
                      </div>
                    </div>
                    <div className={workflowStyles.stepContent}>
                      <h4 className={workflowStyles.statusCode}>{status.statusDescription}</h4>
                      {status.statusCode && (
                        <span className={workflowStyles.statusCodeTag}>{status.statusCode}</span>
                      )}
                      {status.statusExplaination && (
                        <p className={workflowStyles.statusExplaination}>{status.statusExplaination}</p>
                      )}
                      {status.statusCustomerNote && (
                        <div className={workflowStyles.customerNote}>
                          <span className={workflowStyles.customerNoteLabel}>Customer note</span>
                          <p>{status.statusCustomerNote}</p>
                        </div>
                      )}
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
        )}
      </CollapsibleCard>
  );
};