import { useProposal } from '../context/ProposalContext';
import './Payment.css';

export const Payment = () => {
    const { proposal } = useProposal();
    const paymentTerms = proposal?.paymentTerms || '';
    const totalAmount = proposal?.totalAmount || 0;

    // Parse payment terms if they're in structured format
    // Expected format: "50% Advance - Description\n45% Event Day - Description\n5% Final - Description"
    const parsePaymentTerms = () => {
        if (!paymentTerms) {
            return [
                { percent: '50%', label: 'Advance Payment', desc: `₹${(totalAmount * 0.5).toLocaleString('en-IN')} to confirm booking` },
                { percent: '50%', label: 'Final Payment', desc: `₹${(totalAmount * 0.5).toLocaleString('en-IN')} on delivery` }
            ];
        }

        const lines = paymentTerms.split(/\r?\n/).filter((line: string) => line.trim());
        return lines.map((line: string) => {
            const match = line.match(/(\d+)%?\s*[-:]?\s*(.+?)(?:\s*[-:]\s*(.+))?$/);
            if (match) {
                const percent = match[1] + '%';
                const label = match[2]?.trim() || 'Payment';
                const desc = match[3]?.trim() || `₹${(totalAmount * parseInt(match[1]) / 100).toLocaleString('en-IN')}`;
                return { percent, label, desc };
            }
            return { percent: '', label: line, desc: '' };
        });
    };

    const paymentSchedule = parsePaymentTerms();

    return (
        <section className="payment">
            <div className="content-wrapper">
                <span className="section-label reveal">Payment Schedule</span>
                <h2 className="section-title reveal">Flexible Payment Plan</h2>
            </div>

            <div className="payment-timeline">
                {paymentSchedule.map((item, index) => (
                    <div key={index} className="payment-item reveal">
                        <div className="payment-content">
                            {item.percent && <div className="payment-percent">{item.percent}</div>}
                            <div className="payment-label">{item.label}</div>
                            {item.desc && <div className="payment-desc">{item.desc}</div>}
                        </div>
                        <div className="payment-dot"></div>
                    </div>
                ))}
            </div>
        </section>
    );
};
