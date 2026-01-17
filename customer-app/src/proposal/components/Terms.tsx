import './Terms.css';

export const Terms = () => {
    return (
        <section className="terms">
            <div className="content-wrapper">
                <span className="section-label reveal">Legal</span>
                <h2 className="section-title reveal">Terms & Conditions</h2>

                <div className="terms-content reveal-scale">
                    <div className="terms-list">
                        <div className="term-item">
                            <div className="term-number">1</div>
                            <p className="term-text">
                                All payments are non-refundable once the booking is confirmed. Date changes are subject to availability and may incur additional charges.
                            </p>
                        </div>
                        <div className="term-item">
                            <div className="term-number">2</div>
                            <p className="term-text">
                                Edited photos and videos will be delivered within 60 days of the final event. The premium album will be delivered within 90 days.
                            </p>
                        </div>
                        <div className="term-item">
                            <div className="term-number">3</div>
                            <p className="term-text">
                                Laya Productions retains the copyright to all photographs and videos. You receive a personal usage license for prints and social media.
                            </p>
                        </div>
                        <div className="term-item">
                            <div className="term-number">4</div>
                            <p className="term-text">
                                We reserve the right to use selected images for our portfolio, website, and marketing materials unless explicitly requested otherwise.
                            </p>
                        </div>
                        <div className="term-item">
                            <div className="term-number">5</div>
                            <p className="term-text">
                                Any additional services, overtime, or travel expenses outside the agreed scope will be charged separately as per our standard rates.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};
