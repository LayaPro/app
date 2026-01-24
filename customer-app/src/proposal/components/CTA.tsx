import { useState } from 'react';
import { useProposal } from '../context/ProposalContext';
import { proposalApi } from '../../services/api';
import './CTA.css';

export const CTA = () => {
    const { proposal, onAcceptSuccess } = useProposal();
    const [isAccepting, setIsAccepting] = useState(false);

    const handleAcceptQuotation = async () => {
        if (!proposal?._id) return;
        
        setIsAccepting(true);

        try {
            await proposalApi.updateProposalStatus(proposal._id, 'accepted');
            
            // Immediately transition to accepted view
            if (onAcceptSuccess) {
                onAcceptSuccess();
            }
        } catch (error: any) {
            // Handle error silently or show minimal error feedback
            console.error('Failed to accept quotation:', error);
            setIsAccepting(false);
        }
    };

    const handleDownloadPDF = () => {
        window.print();
    };

    // Check if quotation is already accepted (either 'accepted' or 'project_created' status)
    const isQuotationAccepted = proposal?.status === 'accepted' || proposal?.status === 'project_created';
    const canAcceptQuotation = proposal?.status === 'sent';

    return (
        <section className="cta">
            <div className="cta-content">
                <h2 className="reveal" style={{ transitionDelay: '0.2s' }}>Let's Create Magic Together</h2>
                <p className="reveal" style={{ transitionDelay: '0.4s' }}>
                    Ready to preserve your special moments forever? Let's discuss your vision and create something extraordinary.
                </p>
                <div className="cta-buttons reveal" style={{ transitionDelay: '0.6s' }}>
                    <button 
                        onClick={handleAcceptQuotation} 
                        className="btn btn-primary"
                        disabled={isAccepting || !canAcceptQuotation}
                        {...(proposal?.status === 'draft' && { 'data-tooltip': 'Quotation can be accepted by customer once it is sent' })}
                    >
                        {isAccepting ? 'Accepting...' : isQuotationAccepted ? 'Quotation Accepted' : 'Accept Quotation'}
                    </button>
                    <button onClick={handleDownloadPDF} className="btn btn-secondary">Download Quotation PDF</button>
                </div>
            </div>
        </section>
    );
};
