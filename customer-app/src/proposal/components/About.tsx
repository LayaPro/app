import './About.css';

export const About = () => {
    const images = [
        'https://images.unsplash.com/photo-1606800052052-a08af7148866?w=600&q=80',
        'https://images.unsplash.com/photo-1519741497674-611481863552?w=600&q=80',
        'https://images.unsplash.com/photo-1591604466107-ec97de577aff?w=600&q=80'
    ];
    const titles = ['Romantic Moments', 'Love Story', 'Sacred Rituals'];
    const descriptions = ['WEDDING DAY', 'PRE-WEDDING', 'CEREMONY'];

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
                    {images.map((imageUrl, index) => (
                        <div key={index} className="portfolio-item reveal-scale">
                            <img src={imageUrl} alt={`Portfolio image ${index + 1}`} />
                            <div className="portfolio-overlay">
                                <h3>{titles[index]}</h3>
                                <p>{descriptions[index]}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};
