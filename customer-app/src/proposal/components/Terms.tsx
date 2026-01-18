import { useProposal } from '../context/ProposalContext';
import './Terms.css';

export const Terms = () => {
    const { proposal } = useProposal();
    const termsOfService = proposal?.termsOfService || '';

    // Parse terms - each line break is a new item
    const parseTerms = () => {
        if (!termsOfService || !termsOfService.trim()) {
            return [];
        }

        // Split by actual newlines (handle both \n and \r\n)
        const lines = termsOfService.split(/\r?\n/)
            .map((line: string) => line.trim())
            .filter((line: string) => line.length > 0);
        
        // Remove existing numbering if present (e.g., "1. ", "1) ", "1 - ")
        return lines.map((line: string) => line.replace(/^\d+[.)\-]\s*/, '').trim());
    };

    const terms = parseTerms();

    if (terms.length === 0) {
        return null;
    }

    return (
        <section className="terms">
            <div className="content-wrapper">
                <span className="section-label reveal">Legal</span>
                <h2 className="section-title reveal">Terms & Conditions</h2>

                <div className="terms-content reveal-scale">
                    <div className="terms-list">
                        {terms.map((term: string, index: number) => (
                            <div key={index} className="term-item">
                                <div className="term-number">{index + 1}</div>
                                <p className="term-text">{term}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};
