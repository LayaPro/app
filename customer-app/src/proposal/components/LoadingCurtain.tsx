import './LoadingCurtain.css';

export const LoadingCurtain = () => {
    return (
        <div className="loading-curtain-overlay">
            <div className="loading-content">
                <div className="loading-icon-wrapper">
                    <div className="loading-dot"></div>
                    <div className="loading-ripple"></div>
                    <div className="loading-ripple loading-ripple-2"></div>
                    <div className="loading-ring"></div>
                    <div className="loading-ring loading-ring-2"></div>
                </div>
                
                <h2 className="loading-title">
                    <span className="loading-text-1">Crafting Your Experience</span>
                    <span className="loading-text-2">Creating Your Proposal</span>
                </h2>
                
                {/* <div className="loading-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                </div> */}
            </div>

            {/* Floating Elements */}
            <div className="loading-decorations">
                {[...Array(80)].map((_, i) => (
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

            {/* Elegant light rays - COMMENTED FOR LATER USE */}
            {/* <div className="loading-rays">
                {[...Array(4)].map((_, i) => (
                    <div 
                        key={i} 
                        className="ray"
                        style={{
                            '--rotation': `${45 + (i * 90)}deg`,
                            '--delay': `${i * 0.5}s`,
                        } as any}
                    ></div>
                ))}
            </div> */}
        </div>
    );
};
