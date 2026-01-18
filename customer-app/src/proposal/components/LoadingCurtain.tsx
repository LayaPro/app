import './LoadingCurtain.css';

export const LoadingCurtain = () => {
    return (
        <div className="loading-curtain-overlay">
            <div className="loading-shimmer"></div>
            
            <div className="loading-content">
                <div className="loading-icon-wrapper">
                    <div className="loading-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <circle cx="12" cy="12" r="10" strokeWidth="2"/>
                            <circle cx="12" cy="12" r="6" strokeWidth="2"/>
                            <circle cx="12" cy="12" r="2" strokeWidth="2" fill="currentColor"/>
                            <line x1="18" y1="6" x2="20" y2="4" strokeWidth="2" strokeLinecap="round"/>
                            <line x1="6" y1="18" x2="4" y2="20" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                    </div>
                    <div className="loading-ring"></div>
                    <div className="loading-ring loading-ring-2"></div>
                </div>
                
                <h2 className="loading-title">Crafting Your Experience</h2>
                <p className="loading-subtitle">Preparing your personalized proposal...</p>
                
                <div className="loading-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>

            {/* Floating Elements */}
            <div className="loading-decorations">
                {[...Array(20)].map((_, i) => (
                    <div 
                        key={i} 
                        className="loading-particle"
                        style={{
                            '--x': `${Math.random() * 100}%`,
                            '--y': `${Math.random() * 100}%`,
                            '--delay': `${Math.random() * 3}s`,
                            '--duration': `${3 + Math.random() * 4}s`,
                        } as any}
                    ></div>
                ))}
            </div>

            {/* Elegant light rays */}
            <div className="loading-rays">
                <div className="ray"></div>
                <div className="ray"></div>
                <div className="ray"></div>
            </div>
        </div>
    );
};
