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
import '../styles/variables.css';
import '../styles/global.css';
import './Proposal.css';

export const Proposal = () => {
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
        const revealElements = document.querySelectorAll('.reveal, .reveal-scale');
        revealElements.forEach((el) => revealObserver.observe(el));

        return () => {
            revealElements.forEach((el) => revealObserver.unobserve(el));
        };
    }, []);

    return (
        <div className="proposal-container">
            <PageTransition />
            <ScrollProgress />
            <div className="animated-bg"></div>
            <Hero />
            <About />
            <Deliverables />
            <Events />
            <Pricing />
            <AddOns />
            <Payment />
            <Terms />
            <CTA />
            <Footer />
        </div>
    );
};
