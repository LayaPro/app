import './Pricing.css';

export const Pricing = () => {
    return (
        <section className="pricing">
            <div className="content-wrapper">
                <span className="section-label reveal">Investment</span>
                <h2 className="section-title reveal">Package Pricing</h2>
            </div>

            <div className="pricing-card reveal-scale">
                <div className="pricing-header">
                    <p className="pricing-label">Total Package Value</p>
                    <div className="pricing-amount">
                        <span className="pricing-currency">₹</span>
                        <span>4,35,000</span>
                    </div>
                    <p className="pricing-label">Inclusive of All Services & Events</p>
                </div>
            </div>
        </section>
    );
};
