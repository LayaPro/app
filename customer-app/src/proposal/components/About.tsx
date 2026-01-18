import { useProposal } from '../context/ProposalContext';
import './About.css';

export const About = () => {
    const { organization } = useProposal();

    const renderAboutUs = () => {
        const aboutUs = organization?.aboutUs || 'We are passionate storytellers dedicated to capturing the magic of your special day. With years of experience and a keen eye for detail, we transform fleeting moments into timeless memories that you\'ll cherish forever.';
        return aboutUs.split(/\r?\n/).map((line: string, index: number) => (
            <span key={index}>
                {line}
                {index < aboutUs.split(/\r?\n/).length - 1 && <br />}
            </span>
        ));
    };

    return (
        <section className="about">
            <div className="about-content">
                <span className="section-label reveal" style={{ transitionDelay: '0.2s' }}>About Us</span>
                <h2 className="section-title reveal" style={{ transitionDelay: '0.4s' }}>{organization?.companyName || 'Our Studio'}</h2>
                <p className="section-description reveal" style={{ transitionDelay: '0.6s' }}>
                    {renderAboutUs()}
                </p>
            </div>
        </section>
    );
};
