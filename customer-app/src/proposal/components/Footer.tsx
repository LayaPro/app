import './Footer.css';
import { useProposal } from '../context/ProposalContext';

export const Footer = () => {
    const { organization } = useProposal();
    const currentYear = new Date().getFullYear();
    
    return (
        <footer>
            <div className="footer-divider"></div>
            <p className="footer-text">© {currentYear} {organization?.companyName || 'Studio'}. All Rights Reserved.</p>
        </footer>
    );
};
