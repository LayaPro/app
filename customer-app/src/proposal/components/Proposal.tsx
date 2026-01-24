import { useEffect } from 'react';
import { PageTransition } from './PageTransition';
import { ScrollProgress } from './ScrollProgress';
import { Hero } from './Hero';
import { About } from './About';
import { Deliverables } from './Deliverables';
import { Events } from './Events';
import { Pricing } from './Pricing';
import { AddOns } from './AddOns';
import { Payment } from './Payment';
import { Terms } from './Terms';
import { CTA } from './CTA';
import { Footer } from './Footer';
import { ProposalProvider } from '../context/ProposalContext';
import '../styles/variables.css';
import '../styles/global.css';
import './Proposal.css';

interface ProposalProps {
  proposalData: any;
  organizationData: any;
  accessCode: string;
  onAcceptSuccess?: () => void;
}

export const Proposal: React.FC<ProposalProps> = ({ proposalData, organizationData, onAcceptSuccess }) => {
  useEffect(() => {
    // Intersection Observer for reveal animations
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -100px 0px'
    });

    // Observe all elements with reveal classes
    const observeElements = () => {
      const revealElements = document.querySelectorAll('.reveal, .reveal-scale');
      revealElements.forEach((el) => {
        // Remove any existing active class first
        el.classList.remove('active');
        revealObserver.observe(el);
      });
    };

    // Initial observation
    observeElements();

    // Re-observe after delays to catch dynamically rendered elements
    const timeout1 = setTimeout(observeElements, 100);
    const timeout2 = setTimeout(observeElements, 500);

    return () => {
      clearTimeout(timeout1);
      clearTimeout(timeout2);
      const revealElements = document.querySelectorAll('.reveal, .reveal-scale');
      revealElements.forEach((el) => revealObserver.unobserve(el));
      revealObserver.disconnect();
    };
  }, []);

  return (
    <ProposalProvider proposal={proposalData} organization={organizationData} onAcceptSuccess={onAcceptSuccess}>
      <div className="proposal-container">
        <PageTransition />
        <ScrollProgress />
        <div className="animated-bg"></div>
        
        {/* Floating Particles */}
        <div className="proposal-floating-particles">
          {[...Array(30)].map((_, i) => (
            <div 
              key={i} 
              className="proposal-particle"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                '--delay': `${Math.random() * 5}s`,
                '--duration': `${4 + Math.random() * 6}s`,
                '--x': `${(Math.random() - 0.5) * 100}px`,
              } as any}
            ></div>
          ))}
        </div>

        <Hero />
        <About />
        <Events />
        <Deliverables />
        <Pricing />
        <Payment />
        <AddOns />
        <Terms />
        <CTA />
        <Footer />
      </div>
    </ProposalProvider>
  );
};
