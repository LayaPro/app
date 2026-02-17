import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '../../components/ui/index.js';
import { PageHeader, HelpPanel } from '../../components/help/index.js';
import { getHelpContent } from '../../data/helpContent.js';
import { ProposalsTable } from './components/ProposalsTable';
import { ProposalWizard } from './ProposalWizard';
import { ProposalStats } from './components/ProposalStats';
import { proposalApi } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import styles from '../Page.module.css';

const Proposals = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [showWizard, setShowWizard] = useState(false);
  const [editingProposal, setEditingProposal] = useState<any>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [proposalIdFilter, setProposalIdFilter] = useState<string | null>(null);
  const { showToast } = useToast();
  const [showHelp, setShowHelp] = useState(false);
  const helpContent = getHelpContent('proposals');

  // Handle proposal filter from URL parameter
  useEffect(() => {
    const proposalId = searchParams.get('proposalId');
    if (proposalId) {
      setProposalIdFilter(proposalId);
    }
  }, [searchParams]);

  // Handle direct proposal access via URL parameter
  useEffect(() => {
    if (id) {
      // Navigate to proposals page
      navigate('/proposals', { replace: true });
    }
  }, [id, navigate]);

  const handleCreateProposal = () => {
    setEditingProposal(null);
    setShowWizard(true);
  };

  const handleEditProposal = (proposal: any) => {
    setEditingProposal(proposal);
    setShowWizard(true);
  };

  const handleBack = () => {
    setShowWizard(false);
  };

  const handleSubmit = async (proposalData: any) => {
    try {
      // Validate required fields
      if (!proposalData.totalAmount || proposalData.totalAmount <= 0) {
        showToast('error', 'Please enter the final quotation price');
        return;
      }

      // Transform deliverables (addOns) to match API structure
      const payload = {
        clientName: proposalData.clientName,
        clientEmail: proposalData.clientEmail,
        clientPhone: proposalData.clientPhone,
        projectName: proposalData.projectName,
        weddingDate: proposalData.weddingDate,
        venue: proposalData.venue,
        events: proposalData.events,
        termsOfService: proposalData.termsOfService,
        paymentTerms: proposalData.paymentTerms,
        deliverables: proposalData.addOns, // addOns are deliverables in the model
        totalAmount: proposalData.totalAmount,
        validUntil: proposalData.validUntil,
      };

      if (editingProposal) {
        // Update existing proposal
        await proposalApi.update(editingProposal.proposalId, payload);
        showToast('success', 'Proposal updated successfully');
      } else {
        // Create new proposal
        await proposalApi.create(payload);
        showToast('success', 'Proposal created successfully');
      }
      setShowWizard(false);
      setEditingProposal(null);
      setRefreshKey(prev => prev + 1);
    } catch (error: any) {
      console.error('Error saving proposal:', error);
      showToast('error', error.message || 'Failed to save proposal');
    }
  };

  if (showWizard) {
    return (
      <ProposalWizard
        onBack={handleBack}
        onSubmit={handleSubmit}
        initialData={editingProposal}
      />
    );
  }

  return (
    <div className={styles.pageContainer}>
      <PageHeader onHelpClick={() => setShowHelp(true)} />
      
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: '24px',
        marginBottom: '24px',
        flexWrap: 'wrap'
      }} className="proposals-header">
        <ProposalStats refreshTrigger={refreshKey} />
        
        <Button
          variant="primary"
          onClick={handleCreateProposal}
          style={{ flexShrink: 0 }}
          className="add-proposal-button"
        >
          <svg 
            width="20" 
            height="20" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            style={{ marginRight: '8px' }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Proposal
        </Button>
      </div>

      <ProposalsTable 
        onEdit={handleEditProposal} 
        onDataChange={() => setRefreshKey(prev => prev + 1)} 
        initialProposalFilter={proposalIdFilter}
      />
      {showHelp && helpContent && (
        <HelpPanel help={helpContent} onClose={() => setShowHelp(false)} />
      )}
    </div>
  );
};

export default Proposals;
