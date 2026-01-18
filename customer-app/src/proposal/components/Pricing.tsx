import { useProposal } from '../context/ProposalContext';
import './Pricing.css';

export const Pricing = () => {
    const { proposal } = useProposal();
    
    const formatAmount = (amount: number) => {
        return amount?.toLocaleString('en-IN') || '0';
    };

    return (
        <section className="pricing">
            <div className="pricing-card">
                <span className="section-label reveal" style={{ transitionDelay: '0.2s' }}>Investment</span>
                <h2 className="section-title reveal" style={{ transitionDelay: '0.4s', color: 'rgba(255,255,255,0.95)', background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, var(--accent-gold) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Package Pricing</h2>
                <div className="pricing-header reveal" style={{ transitionDelay: '0.6s' }}>
                    <p className="pricing-label">Total Package Value</p>
                    <div className="pricing-amount">
                        <span className="pricing-currency">₹</span>
                        <span>{formatAmount(proposal?.totalAmount)}</span>
                    </div>
                    <p className="pricing-label">Inclusive of All Services & Events</p>
                </div>
            </div>
        </section>
    );
};
