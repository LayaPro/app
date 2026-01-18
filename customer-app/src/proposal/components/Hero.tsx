import { useEffect, useState } from 'react';
import { FocusBrackets } from './FocusBrackets';
import { useProposal } from '../context/ProposalContext';
import './Hero.css';

export const Hero = () => {
    const { proposal, organization } = useProposal();
    const [showScroll, setShowScroll] = useState(true);

    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 50) {
                setShowScroll(false);
            } else {
                setShowScroll(true);
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Preserve line breaks in tagline
    const renderTagline = () => {
        const tagline = organization?.tagline || 'Luxury Wedding Photography';
        return tagline.split(/\r?\n/).map((line: string, index: number) => (
            <span key={index}>
                {line}
                {index < tagline.split(/\r?\n/).length - 1 && <br />}
            </span>
        ));
    };

    return (
        <section className="hero">
            <FocusBrackets />
            <div className="hero-ornament"></div>
            <div className="hero-content">
                <div className="hero-logo">{organization?.companyName || 'LAYA PRODUCTIONS'}</div>
                <h1 className="hero-title">{renderTagline()}</h1>
                <div className="hero-couple">{proposal?.projectName || 'Wedding Proposal'}</div>
                <div className="hero-divider"></div>
            </div>
            
            <div className="scroll-indicator" style={{ opacity: showScroll ? '' : 0 }}>
                <div className="scroll-arrow">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M12 5v14M5 12l7 7 7-7"/>
                    </svg>
                </div>
            </div>
        </section>
    );
};
