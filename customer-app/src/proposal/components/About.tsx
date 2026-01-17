import './About.css';

export const About = () => {
    return (
        <section className="about reveal">
            <div className="about-content">
                <span className="section-label">About Us</span>
                <h2 className="section-title">Laya Productions</h2>
                <p className="section-description">
                    We are passionate storytellers dedicated to capturing the magic of your special day. With years of experience 
                    and a keen eye for detail, we transform fleeting moments into timeless memories that you'll cherish forever.
                </p>
                
                <div className="portfolio-grid">
                    <div className="portfolio-item reveal-scale">
                        <img src="https://images.unsplash.com/photo-1606800052052-a08af7148866?w=600&q=80" alt="Wedding Couple" />
                        <div className="portfolio-overlay">
                            <h3>Romantic Moments</h3>
                            <p>WEDDING DAY</p>
                        </div>
                    </div>
                    <div className="portfolio-item reveal-scale">
                        <img src="https://images.unsplash.com/photo-1519741497674-611481863552?w=600&q=80" alt="Pre-Wedding Shoot" />
                        <div className="portfolio-overlay">
                            <h3>Love Story</h3>
                            <p>PRE-WEDDING</p>
                        </div>
                    </div>
                    <div className="portfolio-item reveal-scale">
                        <img src="https://images.unsplash.com/photo-1591604466107-ec97de577aff?w=600&q=80" alt="Wedding Ceremony" />
                        <div className="portfolio-overlay">
                            <h3>Sacred Rituals</h3>
                            <p>CEREMONY</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};
