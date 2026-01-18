import { useState, useEffect, useRef } from 'react';
import { DataTable } from '../../../components/ui/DataTable';
import type { Column } from '../../../components/ui/DataTable';
import { useToast } from '../../../context/ToastContext';
import styles from './ProposalsTable.module.css';

interface Proposal {
  proposalId: string;
  proposalNumber: string;
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  amount: number;
  status: 'draft' | 'sent' | 'viewed' | 'accepted' | 'rejected';
  createdAt: string;
  validUntil: string;
}

export const ProposalsTable = () => {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [openActionDropdown, setOpenActionDropdown] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();

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
      // TODO: Replace with actual API call
      const mockData: Proposal[] = [];
      setProposals(mockData);
    } catch (error) {
      console.error('Error fetching proposals:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return '#6b7280';
      case 'sent': return '#3b82f6';
      case 'viewed': return '#8b5cf6';
      case 'accepted': return '#22c55e';
      case 'rejected': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatusLabel = (status: string) => {
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

  const handleView = (proposal: Proposal) => {
    console.log('View proposal:', proposal);
    showToast('info', 'View proposal feature coming soon');
  };

  const handleEdit = (proposal: Proposal) => {
    console.log('Edit proposal:', proposal);
    showToast('info', 'Edit proposal feature coming soon');
  };

  const handleSend = (proposal: Proposal) => {
    console.log('Send proposal:', proposal);
    showToast('info', 'Send proposal feature coming soon');
  };

  const handleDelete = (proposal: Proposal) => {
    console.log('Delete proposal:', proposal);
    showToast('info', 'Delete proposal feature coming soon');
  };

  const columns: Column<Proposal>[] = [
    {
      key: 'proposalNumber',
      header: 'Proposal #',
      sortable: true,
      render: (proposal) => (
        <span className={styles.proposalNumber}>{proposal.proposalNumber}</span>
      ),
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
      key: 'amount',
      header: 'Amount',
      sortable: true,
      render: (proposal) => (
        <span className={styles.amount}>₹{proposal.amount.toLocaleString('en-IN')}</span>
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
      key: 'validUntil',
      header: 'Valid Until',
      sortable: true,
      render: (proposal) => (
        <span className={styles.dateText}>{formatDate(proposal.validUntil)}</span>
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
              setOpenActionDropdown(openActionDropdown === proposal.proposalId ? null : proposal.proposalId);
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </button>
          
          {openActionDropdown === proposal.proposalId && (
            <div ref={dropdownRef} className={styles.actionsDropdown}>
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
                  handleEdit(proposal);
                  setOpenActionDropdown(null);
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit
              </button>
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
              <button 
                className={styles.actionsDropdownItem}
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(proposal);
                  setOpenActionDropdown(null);
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete
              </button>
            </div>
          )}
        </div>
      ),
    },
  ];

  return (
    <DataTable
      data={proposals}
      columns={columns}
      emptyMessage="No proposals yet"
    />
  );
};
