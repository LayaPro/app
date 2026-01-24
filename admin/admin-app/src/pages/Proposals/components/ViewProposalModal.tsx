import { Modal } from '../../../components/ui/Modal';
import styles from './ViewProposalModal.module.css';

interface ViewProposalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEdit?: () => void;
  onPreview?: () => void;
  proposal: any;
}

export const ViewProposalModal: React.FC<ViewProposalModalProps> = ({
  isOpen,
  onClose,
  onEdit,
  onPreview,
  proposal,
}) => {
  if (!proposal) return null;

  const formatDate = (dateString: string) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return '#6b7280';
      case 'sent': return '#3b82f6';
      case 'accepted': return '#22c55e';
      case 'rejected': return '#ef4444';
      case 'expired': return '#f97316';
      case 'project_created': return '#8b5cf6';
      default: return '#6b7280';
    }
  };

  const getStatusLabel = (status: string) => {
    if (status === 'project_created') return 'Project Created';
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  return (
    <Modal 
      key={proposal.proposalId} 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Proposal Details" 
      size="large"
    >
      <div className={styles.container}>
        {/* Header Section */}
        <div className={styles.header}>
          <div className={styles.projectInfo}>
            <h2 className={styles.projectName}>{proposal.projectName}</h2>
            <span 
              className={styles.statusBadge}
              style={{ 
                backgroundColor: `${getStatusColor(proposal.status)}15`,
                color: getStatusColor(proposal.status)
              }}
            >
              {getStatusLabel(proposal.status)}
            </span>
          </div>
          <div className={styles.amount}>₹{proposal.totalAmount.toLocaleString('en-IN')}</div>
        </div>

        {/* Client Details */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Client Information</h3>
          <div className={styles.details}>
            <div className={styles.field}>
              <label>Client Name</label>
              <div className={styles.value}>{proposal.clientName}</div>
            </div>
            
            <div className={styles.field}>
              <label>Email</label>
              <div className={styles.value}>{proposal.clientEmail}</div>
            </div>

            {proposal.clientPhone && (
              <div className={styles.field}>
                <label>Phone Number</label>
                <div className={styles.value}>{proposal.clientPhone}</div>
              </div>
            )}
          </div>
        </div>

        {/* Wedding and Venue Info */}
        {(proposal.weddingDate || proposal.venue) && (
          <div className={styles.section}>
            <div className={styles.details}>
              {proposal.weddingDate && (
                <div className={styles.field}>
                  <label>Wedding Date</label>
                  <div className={styles.value}>{formatDate(proposal.weddingDate)}</div>
                </div>
              )}

              {proposal.venue && (
                <div className={styles.field}>
                  <label>Venue</label>
                  <div className={styles.value}>{proposal.venue}</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Events List */}
        {proposal.events && proposal.events.length > 0 && (
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Events ({proposal.events.length})</h3>
            <div className={styles.eventsList}>
              {proposal.events.map((event: any, index: number) => (
                <div key={event.eventId || index} className={styles.eventCard}>
                  <div className={styles.eventName}>{event.eventName}</div>
                  {event.date && (
                    <div className={styles.eventDate}>{formatDate(event.date)}</div>
                  )}
                  {event.venue && (
                    <div className={styles.eventVenue}>{event.venue}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Deliverables */}
        {proposal.deliverables && proposal.deliverables.length > 0 && (
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Deliverables</h3>
            <div className={styles.deliverablesList}>
              {proposal.deliverables.map((item: any, index: number) => (
                <div key={index} className={styles.deliverableItem}>
                  <div className={styles.deliverableName}>{item.name}</div>
                  {item.description && (
                    <div className={styles.deliverableDesc}>{item.description}</div>
                  )}
                  <div className={styles.deliverablePrice}>₹{item.price.toLocaleString('en-IN')}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Access Details */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Access Information</h3>
          <div className={styles.details}>
            <div className={styles.field}>
              <label>Access Code</label>
              <div className={styles.value}>{proposal.accessCode}</div>
            </div>
            
            <div className={styles.field}>
              <label>Access PIN</label>
              <div className={styles.value}>{proposal.accessPin}</div>
            </div>

            {proposal.validUntil && (
              <div className={styles.field}>
                <label>Valid Until</label>
                <div className={styles.value}>{formatDate(proposal.validUntil)}</div>
              </div>
            )}

            <div className={styles.field}>
              <label>Created</label>
              <div className={styles.value}>{formatDate(proposal.createdAt)}</div>
            </div>

            {proposal.acceptedAt && (
              <div className={styles.field}>
                <label>Accepted At</label>
                <div className={styles.value}>{formatDate(proposal.acceptedAt)}</div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className={styles.footer}>
          {onPreview && (
            <button onClick={onPreview} className={styles.previewButton}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Preview Quotation
            </button>
          )}
          {onEdit && (proposal.status === 'draft' || proposal.status === 'sent') && (
            <button onClick={onEdit} className={styles.editButton}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit
            </button>
          )}
          <button onClick={onClose} className={styles.closeButton}>
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
};
