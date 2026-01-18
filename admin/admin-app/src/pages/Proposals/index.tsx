import { useState } from 'react';
import { Breadcrumb, Button } from '../../components/ui/index.js';
import { ProposalsTable } from './components/ProposalsTable';
import { ProposalWizard } from './ProposalWizard';
import styles from '../Page.module.css';

const Proposals = () => {
  const [showWizard, setShowWizard] = useState(false);

  const handleCreateProposal = () => {
    setShowWizard(true);
  };

  const handleBack = () => {
    setShowWizard(false);
  };

  const handleSubmit = (proposalData: any) => {
    console.log('Proposal data:', proposalData);
    // TODO: Call API to create proposal
    setShowWizard(false);
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
