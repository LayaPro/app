import './AddOns.css';

export const AddOns = () => {
    return (
        <section className="addons">
            <div className="content-wrapper">
                <span className="section-label reveal">Extras</span>
                <h2 className="section-title reveal">Optional Add-ons</h2>
                <p className="section-description reveal">
                    Enhance your package with these premium additions.
                </p>

                <div className="addons-grid">
                    <div className="addon-item reveal">
                        <div className="addon-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="3" width="18" height="18" rx="2"/>
                                <circle cx="8.5" cy="8.5" r="1.5"/>
                                <path d="M21 15l-5-5L5 21"/>
                            </svg>
                        </div>
                        <div className="addon-details">
                            <h4>Extra Photo Prints</h4>
                            <p>Additional high-quality prints for your family members</p>
                        </div>
                    </div>

                    <div className="addon-item reveal">
                        <div className="addon-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10"/>
                                <line x1="12" y1="8" x2="12" y2="16"/>
                                <line x1="8" y1="12" x2="16" y2="12"/>
                            </svg>
                        </div>
                        <div className="addon-details">
                            <h4>Extended Coverage</h4>
                            <p>Additional hours of photography and videography</p>
                        </div>
                    </div>

                    <div className="addon-item reveal">
                        <div className="addon-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                                <polyline points="7 10 12 15 17 10"/>
                                <line x1="12" y1="15" x2="12" y2="3"/>
                            </svg>
                        </div>
                        <div className="addon-details">
                            <h4>Digital Album</h4>
                            <p>Interactive online gallery with all your photos</p>
                        </div>
                    </div>

                    <div className="addon-item reveal">
                        <div className="addon-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                            </svg>
                        </div>
                        <div className="addon-details">
                            <h4>Same-Day Edit</h4>
                            <p>Quick highlight reel shown during reception</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};
