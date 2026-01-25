import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataTable } from '../../../components/ui/DataTable';
import type { Column } from '../../../components/ui/DataTable';
import { Modal } from '../../../components/ui/Modal';
import { Select } from '../../../components/ui/Select';
import { ConfirmationModal } from '../../../components/ui/ConfirmationModal';
import { ViewProposalModal } from './ViewProposalModal';
import { useToast } from '../../../context/ToastContext';
import { proposalApi } from '../../../services/api';
import { useAppDispatch } from '../../../store/index';
import { setEditingProject } from '../../../store/slices/projectSlice';
import styles from './ProposalsTable.module.css';

interface Proposal {
  proposalId: string;
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  projectName: string;
  totalAmount: number;
  accessCode: string;
  accessPin: string;
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired' | 'project_created';
  createdAt: string;
  validUntil?: string;
  events?: Array<{
    eventId: string;
    eventName: string;
    eventType?: string;
    date?: string;
    venue?: string;
  }>;
}

interface ProposalsTableProps {
  onEdit: (proposal: Proposal) => void;
  onDataChange?: () => void;
}

export const ProposalsTable: React.FC<ProposalsTableProps> = ({ onEdit, onDataChange }) => {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [openActionDropdown, setOpenActionDropdown] = useState<string | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewProposal, setViewProposal] = useState<Proposal | null>(null);
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [proposalToDelete, setProposalToDelete] = useState<Proposal | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  useEffect(() => {
    fetchProposals();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      
      if (target.closest('button[class*="actionsDropdownButton"]') || 
          target.closest('button[class*="actionsDropdownItem"]')) {
        return;
      }
      
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenActionDropdown(null);
      }
    };

    if (openActionDropdown) {
      setTimeout(() => {
        document.addEventListener('click', handleClickOutside);
      }, 0);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [openActionDropdown]);

  const fetchProposals = async () => {
    try {
      setIsLoading(true);
      const response = await proposalApi.getAll();
      setProposals(response.proposals || []);
    } catch (error) {
      console.error('Error fetching proposals:', error);
      showToast('error', 'Failed to fetch proposals');
    } finally {
      setIsLoading(false);
    }
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const filteredProposals = useMemo(() => {
    if (statusFilter === 'all') return proposals;
    return proposals.filter(proposal => proposal.status === statusFilter);
  }, [proposals, statusFilter]);

  const handlePreview = (proposal: Proposal) => {
    const customerAppUrl = import.meta.env.VITE_CUSTOMER_APP_URL || 'http://localhost:5174';
    const previewUrl = `${customerAppUrl}/${proposal.accessCode}`;
    window.open(previewUrl, '_blank');
  };

  const handleView = async (proposal: Proposal) => {
    try {
      // Fetch full proposal details
      const response = await proposalApi.getById(proposal.proposalId);
      const fullProposal = response.proposal;
      
      setViewProposal(fullProposal);
      setIsViewModalOpen(true);
      setOpenActionDropdown(null);
    } catch (error) {
      console.error('Error fetching proposal details:', error);
      showToast('error', 'Failed to load proposal details');
    }
  };

  const handleEditFromView = () => {
    if (viewProposal) {
      setIsViewModalOpen(false);
      onEdit(viewProposal);
    }
  };

  const handleEdit = async (proposal: Proposal) => {
    try {
      // Fetch full proposal details
      const response = await proposalApi.getById(proposal.proposalId);
      const fullProposal = response.proposal;
      
      // Pass to parent component
      setOpenActionDropdown(null);
      onEdit(fullProposal);
    } catch (error) {
      console.error('Error fetching proposal details:', error);
      showToast('error', 'Failed to load proposal details');
    }
  };

  const handleSend = (proposal: Proposal) => {
    setSelectedProposal(proposal);
    setIsSendModalOpen(true);
    setOpenActionDropdown(null);
  };

  const confirmSend = async () => {
    if (!selectedProposal) return;

    try {
      setIsSending(true);
      await proposalApi.send(selectedProposal.proposalId);
      showToast('success', 'Proposal sent successfully via email');
      setIsSendModalOpen(false);
      fetchProposals(); // Refresh the list
      onDataChange?.(); // Trigger parent refresh
    } catch (error: any) {
      console.error('Error sending proposal:', error);
      showToast('error', error.message || 'Failed to send proposal');
    } finally {
      setIsSending(false);
    }
  };

  const handleDelete = (proposal: Proposal) => {
    setProposalToDelete(proposal);
    setOpenActionDropdown(null);
  };

  const confirmDelete = async () => {
    if (!proposalToDelete) return;

    try {
      setIsDeleting(true);
      await proposalApi.delete(proposalToDelete.proposalId);
      showToast('success', 'Proposal deleted successfully');
      setProposalToDelete(null);
      fetchProposals(); // Refresh the list
      onDataChange?.(); // Trigger parent refresh
    } catch (error: any) {
      console.error('Error deleting proposal:', error);
      showToast('error', error.message || 'Failed to delete proposal');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCreateProject = async (proposal: Proposal) => {
    try {
      // Fetch full proposal details to get events and quotation
      const fullProposal = await proposalApi.getById(proposal.proposalId);
      
      // Transform proposal events to project event format
      const proposalEvents = (fullProposal.proposal?.events || []).map((event: any) => ({
        eventId: event.eventType || event.eventId, // Use eventType (event-xxx) not proposal eventId (evt-xxx)
        eventName: event.eventName,
        fromProposal: true, // Tag to indicate this came from proposal
        // These will need to be filled in by user
        fromDate: '',
        toDate: '',
        fromTime: '',
        toTime: '',
        venue: event.venue || '',
        venueLocation: '',
        teamMembers: [],
      }));

      // Transform proposal data to project form format
      const projectData = {
        projectName: fullProposal.proposal?.projectName || proposal.projectName,
        contactPerson: fullProposal.proposal?.clientName || proposal.clientName,
        email: fullProposal.proposal?.clientEmail || proposal.clientEmail,
        phoneNumber: fullProposal.proposal?.clientPhone || proposal.clientPhone || '',
        totalBudget: fullProposal.proposal?.totalAmount || proposal.totalAmount || 0,
        events: proposalEvents,
        fromProposal: true,
        proposalId: proposal.proposalId,
      };

      // Dispatch to Redux store
      dispatch(setEditingProject(projectData));
      
      // Navigate to projects page which will open the wizard
      navigate('/projects');
      
      setOpenActionDropdown(null);
    } catch (error) {
      console.error('Error fetching proposal details:', error);
      showToast('error', 'Failed to load proposal details');
    }
  };

  const getAvatarColors = (name: string) => {
    const colors = [
      { bg: 'rgba(99, 102, 241, 0.1)', text: '#4f46e5', border: 'rgba(99, 102, 241, 0.2)' },    // indigo
      { bg: 'rgba(59, 130, 246, 0.1)', text: '#2563eb', border: 'rgba(59, 130, 246, 0.2)' },    // blue
      { bg: 'rgba(34, 197, 94, 0.1)', text: '#16a34a', border: 'rgba(34, 197, 94, 0.2)' },      // green
      { bg: 'rgba(245, 158, 11, 0.1)', text: '#d97706', border: 'rgba(245, 158, 11, 0.2)' },    // amber
      { bg: 'rgba(239, 68, 68, 0.1)', text: '#dc2626', border: 'rgba(239, 68, 68, 0.2)' },      // red
      { bg: 'rgba(236, 72, 153, 0.1)', text: '#db2777', border: 'rgba(236, 72, 153, 0.2)' },    // pink
      { bg: 'rgba(6, 182, 212, 0.1)', text: '#0891b2', border: 'rgba(6, 182, 212, 0.2)' },      // cyan
      { bg: 'rgba(20, 184, 166, 0.1)', text: '#0d9488', border: 'rgba(20, 184, 166, 0.2)' },    // teal
      { bg: 'rgba(249, 115, 22, 0.1)', text: '#ea580c', border: 'rgba(249, 115, 22, 0.2)' },    // orange
      { bg: 'rgba(168, 85, 247, 0.1)', text: '#9333ea', border: 'rgba(168, 85, 247, 0.2)' },    // violet
      { bg: 'rgba(234, 179, 8, 0.1)', text: '#ca8a04', border: 'rgba(234, 179, 8, 0.2)' },      // yellow
      { bg: 'rgba(14, 165, 233, 0.1)', text: '#0284c7', border: 'rgba(14, 165, 233, 0.2)' },    // sky
      { bg: 'rgba(16, 185, 129, 0.1)', text: '#059669', border: 'rgba(16, 185, 129, 0.2)' },    // emerald
      { bg: 'rgba(244, 63, 94, 0.1)', text: '#e11d48', border: 'rgba(244, 63, 94, 0.2)' },      // rose
    ];
    
    let hash = 0;
    for (let i = 0; i < (name?.length || 0); i++) {
      hash = ((hash << 5) - hash) + name.charCodeAt(i);
      hash = hash & hash;
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const columns: Column<Proposal>[] = [
    {
      key: 'projectName',
      header: 'Project',
      sortable: true,
      render: (proposal) => {
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: colors.bg,
              border: `1.5px solid ${colors.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px',
              fontWeight: '600',
              color: colors.text,
              flexShrink: 0,
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              {getInitials(proposal.projectName)}
            </div>
            <span className={styles.projectName}>{proposal.projectName}</span>
          </div>
        );
      },
    },
    {
      key: 'clientName',
      header: 'Client',
      sortable: true,
      render: (proposal) => (
        <div>
          <div className={styles.clientName}>{proposal.clientName}</div>
          <div className={styles.clientEmail}>{proposal.clientEmail}</div>
        </div>
      ),
    },
    {
      key: 'clientPhone',
      header: 'Phone',
      sortable: true,
      render: (proposal) => (
        <span className={styles.phoneText}>{proposal.clientPhone || '—'}</span>
      ),
    },
    {
      key: 'totalAmount',
      header: 'Amount',
      sortable: true,
      render: (proposal) => (
        <span className={styles.amount}>₹{proposal.totalAmount.toLocaleString('en-IN')}</span>
      ),
    },
    {
      key: 'accessPin',
      header: 'PIN',
      sortable: false,
      render: (proposal) => (
        <span className={styles.pinText}>{proposal.accessPin}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (proposal) => (
        <span 
          className={styles.statusBadge}
          style={{ 
            backgroundColor: `${getStatusColor(proposal.status)}15`,
            color: getStatusColor(proposal.status)
          }}
        >
          {getStatusLabel(proposal.status)}
        </span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Created',
      sortable: true,
      render: (proposal) => (
        <span className={styles.dateText}>{formatDate(proposal.createdAt)}</span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      sortable: false,
      render: (proposal) => (
        <div className={styles.actionsCell}>
          <button 
            className={styles.actionsDropdownButton}
            onClick={(e) => {
              e.stopPropagation();
              const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
              setDropdownPosition({
                top: rect.bottom + 4,
                left: rect.right - 160
              });
              setOpenActionDropdown(openActionDropdown === proposal.proposalId ? null : proposal.proposalId);
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </button>
          
          {openActionDropdown === proposal.proposalId && (
            <>
              <div 
                className={styles.dropdownBackdrop}
                onClick={() => setOpenActionDropdown(null)}
              />
              <div 
                ref={dropdownRef} 
                className={styles.actionsDropdown}
                style={{ top: `${dropdownPosition.top}px`, left: `${dropdownPosition.left}px` }}
              >
              <button 
                className={styles.actionsDropdownItem}
                onClick={(e) => {
                  e.stopPropagation();
                  handleView(proposal);
                  setOpenActionDropdown(null);
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                View
              </button>
              <button 
                className={styles.actionsDropdownItem}
                onClick={(e) => {
                  e.stopPropagation();
                  handlePreview(proposal);
                  setOpenActionDropdown(null);
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                Preview Quotation
              </button>
              {(proposal.status === 'draft' || proposal.status === 'sent') && (
                <button 
                  className={styles.actionsDropdownItem}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEdit(proposal);
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit
                </button>
              )}
              {(proposal.status === 'draft' || proposal.status === 'sent') && (
                <button 
                  className={styles.actionsDropdownItem}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSend(proposal);
                    setOpenActionDropdown(null);
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  Send
                </button>
              )}
              {proposal.status === 'accepted' && (
                <>
                  <div className={styles.actionsDropdownDivider} />
                  <button 
                    className={styles.actionsDropdownItem}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCreateProject(proposal);
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Create Project
                  </button>
                </>
              )}
              {(proposal.status !== 'accepted' && proposal.status !== 'project_created') && (
                <>
                  <div className={styles.actionsDropdownDivider} />
                  <button 
                    className={`${styles.actionsDropdownItem} ${styles.actionsDropdownItemDanger}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(proposal);
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete
                  </button>
                </>
              )}
            </div>
            </>
          )}
        </div>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div style={{ padding: '48px', textAlign: 'center', color: '#6b7280' }}>
        Loading proposals...
      </div>
    );
  }

  return (
    <>
      <DataTable
        data={filteredProposals}
        columns={columns}
        emptyMessage="No proposals yet"
        itemsPerPage={10}
        customFilters={
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: 'all', label: 'All Statuses' },
              { value: 'draft', label: 'Draft' },
              { value: 'sent', label: 'Sent' },
              { value: 'accepted', label: 'Accepted' },
              { value: 'project_created', label: 'Project Created' }
            ]}
            placeholder="Filter by status"
            className={styles.statusFilterSelect}
          />
        }
      />

      <Modal
        isOpen={isSendModalOpen}
        onClose={() => setIsSendModalOpen(false)}
        title="Send Proposal"
        size="small"
      >
        <div style={{ padding: '20px 0' }}>
          <p style={{ marginBottom: '20px', lineHeight: '1.6', color: 'var(--text-secondary)' }}>
            This will send the proposal to <strong>{selectedProposal?.clientName}</strong> via email at <strong>{selectedProposal?.clientEmail}</strong>.
          </p>
          <p style={{ marginBottom: '20px', lineHeight: '1.6', color: 'var(--text-secondary)' }}>
            The email will include:
          </p>
          <ul style={{ marginBottom: '20px', paddingLeft: '24px', lineHeight: '1.8', color: 'var(--text-secondary)' }}>
            <li>Proposal URL</li>
            <li>Access PIN: <strong>{selectedProposal?.accessPin}</strong></li>
            <li>Instructions to view the proposal</li>
          </ul>
          <p style={{ 
            padding: '12px 16px', 
            background: 'rgba(99, 102, 241, 0.1)', 
            borderRadius: '8px',
            color: 'var(--text-secondary)',
            fontSize: '14px',
            marginBottom: '20px'
          }}>
            📧 Note: WhatsApp integration is not yet available. The proposal will only be sent via email.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              onClick={() => setIsSendModalOpen(false)}
              disabled={isSending}
              style={{
                padding: '10px 20px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                background: 'transparent',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
              }}
            >
              Cancel
            </button>
            <button
              onClick={confirmSend}
              disabled={isSending}
              style={{
                padding: '10px 20px',
                borderRadius: '8px',
                border: 'none',
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                color: 'white',
                cursor: isSending ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                opacity: isSending ? 0.6 : 1,
              }}
            >
              {isSending ? 'Sending...' : 'Send Proposal'}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmationModal
        isOpen={!!proposalToDelete}
        onClose={() => setProposalToDelete(null)}
        onConfirm={confirmDelete}
        title="Delete Proposal"
        message={`Are you sure you want to delete the proposal "${proposalToDelete?.projectName}" for ${proposalToDelete?.clientName}? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
        isLoading={isDeleting}
      />

      <ViewProposalModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        onEdit={handleEditFromView}
        onPreview={() => viewProposal && handlePreview(viewProposal)}
        proposal={viewProposal}
      />
    </>
  );
};
