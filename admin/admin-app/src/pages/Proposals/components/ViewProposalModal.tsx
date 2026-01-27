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

  const getAvatarColors = (name: string) => {
    const colors = [
      { bg: 'rgba(99, 102, 241, 0.1)', text: '#4f46e5', border: 'rgba(99, 102, 241, 0.2)' },
      { bg: 'rgba(59, 130, 246, 0.1)', text: '#2563eb', border: 'rgba(59, 130, 246, 0.2)' },
      { bg: 'rgba(34, 197, 94, 0.1)', text: '#16a34a', border: 'rgba(34, 197, 94, 0.2)' },
      { bg: 'rgba(245, 158, 11, 0.1)', text: '#d97706', border: 'rgba(245, 158, 11, 0.2)' },
      { bg: 'rgba(239, 68, 68, 0.1)', text: '#dc2626', border: 'rgba(239, 68, 68, 0.2)' },
      { bg: 'rgba(236, 72, 153, 0.1)', text: '#db2777', border: 'rgba(236, 72, 153, 0.2)' },
      { bg: 'rgba(6, 182, 212, 0.1)', text: '#0891b2', border: 'rgba(6, 182, 212, 0.2)' },
      { bg: 'rgba(20, 184, 166, 0.1)', text: '#0d9488', border: 'rgba(20, 184, 166, 0.2)' },
      { bg: 'rgba(249, 115, 22, 0.1)', text: '#ea580c', border: 'rgba(249, 115, 22, 0.2)' },
      { bg: 'rgba(168, 85, 247, 0.1)', text: '#9333ea', border: 'rgba(168, 85, 247, 0.2)' },
      { bg: 'rgba(234, 179, 8, 0.1)', text: '#ca8a04', border: 'rgba(234, 179, 8, 0.2)' },
      { bg: 'rgba(14, 165, 233, 0.1)', text: '#0284c7', border: 'rgba(14, 165, 233, 0.2)' },
      { bg: 'rgba(16, 185, 129, 0.1)', text: '#059669', border: 'rgba(16, 185, 129, 0.2)' },
      { bg: 'rgba(244, 63, 94, 0.1)', text: '#e11d48', border: 'rgba(244, 63, 94, 0.2)' },
    ];
    
    let hash = 0;
    for (let i = 0; i < (name?.length || 0); i++) {
      hash = ((hash << 5) - hash) + name.charCodeAt(i);
      hash = hash & hash;
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .filter(word => word.toLowerCase() !== '&' && word.toLowerCase() !== 'and')
      .map(word => word.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('');
  };

  const colors = getAvatarColors(proposal.projectName);

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
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div 
              style={{ 
                width: '56px', 
                height: '56px', 
                borderRadius: '50%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                fontWeight: '600',
                fontSize: '18px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                backgroundColor: colors.bg,
                border: `1.5px solid ${colors.border}`,
                color: colors.text,
                flexShrink: 0
              }}
            >
              {getInitials(proposal.clientName)}
            </div>
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
          </div>
          <div className={styles.amount}>₹{proposal.totalAmount.toLocaleString('en-IN')}</div>
        </div>

        {/* Client Details */}
        <div className={styles.section}>
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

        {/* Access Details */}
        <div className={styles.section}>
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

        {/* Events List */}
        {proposal.events && proposal.events.length > 0 && (
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Events ({proposal.events.length})</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
              {proposal.events.map((event: any, index: number) => (
                <div 
                  key={event.eventId || index}
                  style={{
                    background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.03), rgba(139, 92, 246, 0.03))',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    minWidth: 'fit-content'
                  }}
                >
                  <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '6px', whiteSpace: 'nowrap' }}>
                    {event.eventName}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                    {event.date && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
                        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {formatDate(event.date)}
                      </div>
                    )}
                    {event.venue && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {event.venue}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Deliverables */}
        {proposal.deliverables && proposal.deliverables.length > 0 && (
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Deliverables</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {proposal.deliverables.map((item: any, index: number) => (
                <div 
                  key={index}
                  style={{
                    background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.03), rgba(139, 92, 246, 0.03))',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    padding: '16px'
                  }}
                >
                  <div style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: item.description ? '8px' : '0' }}>
                    {item.name}
                  </div>
                  {item.description && (
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                      {item.description}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

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
