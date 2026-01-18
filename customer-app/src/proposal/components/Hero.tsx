import { FocusBrackets } from './FocusBrackets';
import { useProposal } from '../context/ProposalContext';
import './Hero.css';

export const Hero = () => {
    const { proposal, organization } = useProposal();

    return (
        <section className="hero">
            <FocusBrackets />
            <div className="hero-ornament"></div>
            <div className="hero-content">
                <div className="hero-logo">{organization?.companyName || 'LAYA PRODUCTIONS'}</div>
                <h1 className="hero-title">{organization?.tagline || 'Luxury Wedding Photography'}</h1>
                <div className="hero-couple">{proposal?.projectName || 'Wedding Proposal'}</div>
                <div className="hero-divider"></div>
            </div>
        </section>
    );
};
