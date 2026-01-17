import './Deliverables.css';

export const Deliverables = () => {
    return (
        <section className="deliverables">
            <div className="content-wrapper">
                <span className="section-label reveal">What You Get</span>
                <h2 className="section-title reveal">Package Deliverables</h2>
                <p className="section-description reveal">
                    Our comprehensive package includes everything you need to preserve your wedding memories in the most beautiful way possible.
                </p>
            </div>

            <div className="deliverables-grid">
                <div className="deliverable-card reveal">
                    <svg className="deliverable-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <rect x="2" y="3" width="20" height="14" rx="2"/>
                        <path d="M7 3v4"/>
                        <path d="M17 3v4"/>
                        <path d="M2 9h20"/>
                    </svg>
                    <h3>Pre-Wedding Shoot</h3>
                    <p>A beautiful outdoor session to capture your chemistry and create stunning portraits before the big day.</p>
                </div>

                <div className="deliverable-card reveal">
                    <svg className="deliverable-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <circle cx="12" cy="12" r="10"/>
                        <circle cx="12" cy="12" r="3"/>
                        <line x1="12" y1="2" x2="12" y2="5"/>
                        <line x1="12" y1="19" x2="12" y2="22"/>
                        <line x1="4.22" y1="4.22" x2="6.34" y2="6.34"/>
                        <line x1="17.66" y1="17.66" x2="19.78" y2="19.78"/>
                    </svg>
                    <h3>Traditional Photography</h3>
                    <p>Timeless, posed portraits that capture the elegance and formality of your traditional ceremonies.</p>
                </div>

                <div className="deliverable-card reveal">
                    <svg className="deliverable-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M23 7l-7 5 7 5V7z"/>
                        <rect x="1" y="5" width="15" height="14" rx="2"/>
                    </svg>
                    <h3>Cinematic Video</h3>
                    <p>A professionally edited highlight film that tells the story of your day with emotion and artistry.</p>
                </div>

                <div className="deliverable-card reveal">
                    <svg className="deliverable-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M14.5 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V7.5L14.5 2z"/>
                        <polyline points="14 2 14 8 20 8"/>
                    </svg>
                    <h3>Candid Photography</h3>
                    <p>Natural, unposed moments captured throughout your events, showcasing genuine emotions and interactions.</p>
                </div>

                <div className="deliverable-card reveal">
                    <svg className="deliverable-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <rect x="4" y="4" width="16" height="16" rx="2"/>
                        <rect x="9" y="9" width="6" height="6"/>
                        <line x1="9" y1="2" x2="9" y2="4"/>
                        <line x1="15" y1="2" x2="15" y2="4"/>
                    </svg>
                    <h3>Drone Coverage</h3>
                    <p>Breathtaking aerial shots that capture the grandeur of your venue and celebrations from a unique perspective.</p>
                </div>

                <div className="deliverable-card reveal">
                    <svg className="deliverable-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M4 19.5A2.5 2.5 0 016.5 17H20"/>
                        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>
                    </svg>
                    <h3>Premium Album</h3>
                    <p>A premium quality printed album with carefully curated photographs, designed to last a lifetime.</p>
                </div>
            </div>
        </section>
    );
};
