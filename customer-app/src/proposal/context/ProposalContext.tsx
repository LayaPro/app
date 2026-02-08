import { createContext, useContext, type ReactNode } from 'react';

interface ProposalContextType {
  proposal: any;
  organization: any;
  onAcceptSuccess?: () => void;
}

const ProposalContext = createContext<ProposalContextType | undefined>(undefined);

export const ProposalProvider = ({ 
  children, 
  proposal, 
  organization,
  onAcceptSuccess
}: { 
  children: ReactNode; 
  proposal: any; 
  organization: any;
  onAcceptSuccess?: () => void;
}) => {
  return (
    <ProposalContext.Provider value={{ proposal, organization, onAcceptSuccess }}>
      {children}
    </ProposalContext.Provider>
  );
};

export const useProposal = () => {
  const context = useContext(ProposalContext);
  if (context === undefined) {
    throw new Error('useProposal must be used within a ProposalProvider');
  }
  return context;
};
