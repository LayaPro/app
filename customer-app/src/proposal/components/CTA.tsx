import { useState } from 'react';
import { useProposal } from '../context/ProposalContext';
import { proposalApi } from '../../services/api';
import './CTA.css';

export const CTA = () => {
    const { proposal } = useProposal();
    const [isAccepting, setIsAccepting] = useState(false);
    const [acceptMessage, setAcceptMessage] = useState('');

    const handleAcceptQuotation = async () => {
        if (!proposal?._id) return;
        
        setIsAccepting(true);
        setAcceptMessage('');

        try {
            await proposalApi.updateProposalStatus(proposal._id, 'accepted');
            setAcceptMessage('Quotation accepted successfully! We will contact you soon.');
        } catch (error: any) {
            setAcceptMessage(error.message || 'Failed to accept quotation. Please try again.');
        } finally {
            setIsAccepting(false);
        }
    };

    const handleDownloadPDF = () => {
        window.print();
    };

    return (
        <section className="cta">
            <div className="cta-content">
                <h2 className="reveal" style={{ transitionDelay: '0.2s' }}>Let's Create Magic Together</h2>
                <p className="reveal" style={{ transitionDelay: '0.4s' }}>
                    Ready to preserve your special moments forever? Let's discuss your vision and create something extraordinary.
                </p>
                {acceptMessage && (
                    <div className="accept-message" style={{ 
                        padding: '15px', 
                        marginBottom: '20px', 
                        borderRadius: '8px',
                        background: acceptMessage.includes('success') ? 'rgba(76, 175, 80, 0.2)' : 'rgba(244, 67, 54, 0.2)',
                        color: 'white',
                        textAlign: 'center'
                    }}>
                        {acceptMessage}
                    </div>
                )}
                <div className="cta-buttons reveal" style={{ transitionDelay: '0.6s' }}>
                    <button 
                        onClick={handleAcceptQuotation} 
                        className="btn btn-primary"
                        disabled={isAccepting || proposal?.status === 'accepted'}
                    >
                        {isAccepting ? 'Accepting...' : proposal?.status === 'accepted' ? 'Quotation Accepted' : 'Accept Quotation'}
                    </button>
                    <button onClick={handleDownloadPDF} className="btn btn-secondary">Download Quotation PDF</button>
                </div>
            </div>
        </section>
    );
};
