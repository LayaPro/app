import { useState } from 'react';
import { Breadcrumb, Button } from '../../components/ui/index.js';
import { ProposalsTable } from './components/ProposalsTable';
import { ProposalWizard } from './ProposalWizard';
import { proposalApi } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import styles from '../Page.module.css';

const Proposals = () => {
  const [showWizard, setShowWizard] = useState(false);
  const { showToast } = useToast();

  const handleCreateProposal = () => {
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

      await proposalApi.create(payload);
      showToast('success', 'Proposal created successfully');
      setShowWizard(false);
    } catch (error: any) {
      console.error('Error creating proposal:', error);
      showToast('error', error.message || 'Failed to create proposal');
    }
  };

  if (showWizard) {
    return (
      <ProposalWizard
        onBack={handleBack}
        onSubmit={handleSubmit}
      />
    );
  }

  return (
    <div className={styles.pageContainer}>
      <Breadcrumb />
      
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <h1 style={{ 
            margin: 0, 
            fontSize: 'clamp(20px, 4vw, 28px)', 
            fontWeight: 700, 
            color: 'var(--text-primary)' 
          }}>
            Proposals
          </h1>
          <p style={{ 
            margin: '4px 0 0 0', 
            fontSize: '14px', 
            color: 'var(--text-secondary)' 
          }}>
            Manage and send proposals to potential clients
          </p>
        </div>
        
        <Button
          variant="primary"
          onClick={handleCreateProposal}
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

      <ProposalsTable />
    </div>
  );
};

export default Proposals;
