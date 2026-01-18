import './CTA.css';

export const CTA = () => {
    return (
        <section className="cta">
            <div className="cta-content">
                <h2 className="reveal" style={{ transitionDelay: '0.2s' }}>Let's Create Magic Together</h2>
                <p className="reveal" style={{ transitionDelay: '0.4s' }}>
                    Ready to preserve your special moments forever? Let's discuss your vision and create something extraordinary.
                </p>
                <div className="cta-buttons reveal" style={{ transitionDelay: '0.6s' }}>
                    <a href="#" className="btn btn-primary">Book Now</a>
                    <a href="#" className="btn btn-secondary">Contact Us</a>
                </div>
            </div>
        </section>
    );
};
