import './Payment.css';

export const Payment = () => {
    return (
        <section className="payment">
            <div className="content-wrapper">
                <span className="section-label reveal">Payment Schedule</span>
                <h2 className="section-title reveal">Flexible Payment Plan</h2>
            </div>

            <div className="payment-timeline">
                <div className="payment-item reveal">
                    <div className="payment-content">
                        <div className="payment-percent">50%</div>
                        <div className="payment-label">Advance Payment</div>
                        <div className="payment-desc">₹2,17,500 to confirm booking</div>
                    </div>
                    <div className="payment-dot"></div>
                </div>
                <div className="payment-item reveal">
                    <div className="payment-content">
                        <div className="payment-percent">45%</div>
                        <div className="payment-label">Event Day</div>
                        <div className="payment-desc">₹1,95,750 on wedding day</div>
                    </div>
                    <div className="payment-dot"></div>
                </div>
                <div className="payment-item reveal">
                    <div className="payment-content">
                        <div className="payment-percent">5%</div>
                        <div className="payment-label">Final Payment</div>
                        <div className="payment-desc">₹21,750 on album delivery</div>
                    </div>
                    <div className="payment-dot"></div>
                </div>
            </div>
        </section>
    );
};
