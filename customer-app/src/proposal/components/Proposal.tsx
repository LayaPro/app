import { useEffect, useState } from 'react';
import { PageTransition } from './PageTransition';
import { ScrollProgress } from './ScrollProgress';
import { PinEntry } from './PinEntry';
import { LoadingCurtain } from './LoadingCurtain';
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
import { proposalApi } from '../../services/api';
import '../styles/variables.css';
import '../styles/global.css';
import './Proposal.css';

// Cookie helper functions
const setCookie = (name: string, value: string, days: number) => {
    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Strict`;
};

const getCookie = (name: string): string | null => {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
};

export const Proposal = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [proposalData, setProposalData] = useState<any>(null);
    const [organizationData, setOrganizationData] = useState<any>(null);

    // Get access code from URL path
    const accessCode = window.location.pathname.split('/proposal/')[1];

    // Check for existing auth cookie on mount
    useEffect(() => {
        const checkAuth = async () => {
            const cookieName = `proposal_auth_${accessCode}`;
            const savedPin = getCookie(cookieName);

            if (savedPin && accessCode) {
                try {
                    // Store PIN in sessionStorage for API authentication
                    proposalApi.setPin(savedPin);
                    
                    const response = await proposalApi.verifyPin(accessCode, savedPin);
                    setProposalData(response.proposal);
                    setOrganizationData(response.organization);
                    setIsAuthenticated(true);
                } catch (err) {
                    // Invalid or expired PIN in cookie, clear it
                    document.cookie = `${cookieName}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
                    proposalApi.clearPin();
                }
            }
            setIsLoading(false);
        };

        checkAuth();
    }, [accessCode]);

    const handlePinSubmit = async (pin: string) => {
        if (!accessCode) {
            setError('Invalid proposal link');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            // Store PIN in sessionStorage for API authentication
            proposalApi.setPin(pin);
            
            const response = await proposalApi.verifyPin(accessCode, pin);
            setProposalData(response.proposal);
            setOrganizationData(response.organization);
            
            // Save PIN in cookie for 7 days
            const cookieName = `proposal_auth_${accessCode}`;
            setCookie(cookieName, pin, 7);
            
            setIsAuthenticated(true);
            setIsLoading(false);
        } catch (err: any) {
            setError(err.message || 'Invalid PIN. Please try again.');
            proposalApi.clearPin();
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (!isAuthenticated) return;

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
    }, [isAuthenticated]);

    // Show loading on initial check
    if (isLoading && !error) {
        return <LoadingCurtain />;
    }

    if (!isAuthenticated) {
        return (
            <PinEntry 
                onSubmit={handlePinSubmit}
                isLoading={isLoading}
                error={error}
            />
        );
    }

    return (
        <ProposalProvider proposal={proposalData} organization={organizationData}>
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
