import { FocusBrackets } from './FocusBrackets';
import './Hero.css';

export const Hero = () => {
    return (
        <section className="hero">
            <FocusBrackets />
            <div className="hero-ornament"></div>
            <div className="hero-content">
                <div className="hero-logo">LAYA PRODUCTIONS</div>
                <h1 className="hero-title">Luxury Wedding<br />Photography</h1>
                <div className="hero-couple">Neehar & Bride</div>
                <div className="hero-divider"></div>
            </div>
        </section>
    );
};
