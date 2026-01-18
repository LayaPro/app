import { useProposal } from '../context/ProposalContext';
import './Deliverables.css';

export const Deliverables = () => {
    const { proposal } = useProposal();
    const deliverables = proposal?.deliverables || [];

    return (
        <section className="deliverables">
            <div className="content-wrapper">
                <span className="section-label reveal">What You Get</span>
                <h2 className="section-title reveal">Package Deliverables</h2>
                <p className="section-description reveal">
                    Our comprehensive package includes everything you need to preserve your wedding memories in the most beautiful way possible.
                </p>
            </div>

            <div className="deliverables-grid">
                {deliverables.map((deliverable: any, index: number) => (
                    <div key={index} className="deliverable-card reveal">
                        <svg className="deliverable-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <rect x="2" y="3" width="20" height="14" rx="2"/>
                            <path d="M7 3v4"/>
                            <path d="M17 3v4"/>
                            <path d="M2 9h20"/>
                        </svg>
                        <h3>{deliverable.name}</h3>
                        <p>{deliverable.description || ''}</p>
                        {deliverable.price > 0 && (
                            <div className="deliverable-price">₹{deliverable.price.toLocaleString('en-IN')}</div>
                        )}
                    </div>
                ))}
            </div>
        </section>
    );
};
