import { createContext, useContext, ReactNode } from 'react';

interface ProposalContextType {
  proposal: any;
  organization: any;
}

const ProposalContext = createContext<ProposalContextType | undefined>(undefined);

export const ProposalProvider = ({ 
  children, 
  proposal, 
  organization 
}: { 
  children: ReactNode; 
  proposal: any; 
  organization: any;
}) => {
  return (
    <ProposalContext.Provider value={{ proposal, organization }}>
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
