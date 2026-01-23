import './AddOns.css';
import { useProposal } from '../context/ProposalContext';

export const AddOns = () => {
    const { organization } = useProposal();
    
    // Parse add-ons from organization (one per line)
    const addOns = organization?.addOns 
        ? organization.addOns.split('\n').filter((line: string) => line.trim())
        : [];

    // If no add-ons are defined, don't show the section
    if (addOns.length === 0) {
        return null;
    }

    return (
        <section className="addons">
            <div className="content-wrapper">
                <span className="section-label reveal">Extras</span>
                <h2 className="section-title reveal">Optional Add-ons</h2>
                <p className="section-description reveal">
                    Enhance your package with these premium additions.
                </p>

                <div className="addons-grid">
                    {addOns.map((addon: string, index: number) => (
                        <div key={index} className="addon-item reveal">
                            <div className="addon-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="10"/>
                                    <line x1="12" y1="8" x2="12" y2="16"/>
                                    <line x1="8" y1="12" x2="16" y2="12"/>
                                </svg>
                            </div>
                            <div className="addon-details">
                                <h4>{addon.trim()}</h4>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};
