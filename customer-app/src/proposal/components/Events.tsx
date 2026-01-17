import './Events.css';

export const Events = () => {
    return (
        <section className="events">
            <div className="content-wrapper">
                <span className="section-label reveal">Coverage</span>
                <h2 className="section-title reveal">Events We'll Capture</h2>
                <p className="section-description reveal">
                    Complete coverage of all your special ceremonies and celebrations with dedicated photography and videography teams.
                </p>
            </div>

            <div className="events-table-wrapper reveal-scale">
                <table className="events-table">
                    <thead>
                        <tr>
                            <th>Event</th>
                            <th>Photography</th>
                            <th>Videography</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><span className="event-name">Mehendi</span></td>
                            <td>
                                <span className="crew-badge">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                                        <circle cx="12" cy="7" r="4"/>
                                    </svg>
                                    1 Photographer
                                </span>
                            </td>
                            <td>
                                <span className="crew-badge">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                                        <circle cx="12" cy="7" r="4"/>
                                    </svg>
                                    1 Videographer
                                </span>
                            </td>
                        </tr>
                        <tr>
                            <td><span className="event-name">Haldi</span></td>
                            <td>
                                <span className="crew-badge">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                                        <circle cx="12" cy="7" r="4"/>
                                    </svg>
                                    1 Photographer
                                </span>
                            </td>
                            <td>
                                <span className="crew-badge">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                                        <circle cx="12" cy="7" r="4"/>
                                    </svg>
                                    1 Videographer
                                </span>
                            </td>
                        </tr>
                        <tr>
                            <td><span className="event-name">Wedding</span></td>
                            <td>
                                <span className="crew-badge">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
                                        <circle cx="9" cy="7" r="4"/>
                                        <path d="M23 21v-2a4 4 0 00-3-3.87"/>
                                        <path d="M16 3.13a4 4 0 010 7.75"/>
                                    </svg>
                                    2 Photographers
                                </span>
                            </td>
                            <td>
                                <span className="crew-badge">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
                                        <circle cx="9" cy="7" r="4"/>
                                        <path d="M23 21v-2a4 4 0 00-3-3.87"/>
                                        <path d="M16 3.13a4 4 0 010 7.75"/>
                                    </svg>
                                    2 Videographers
                                </span>
                            </td>
                        </tr>
                        <tr>
                            <td><span className="event-name">Reception</span></td>
                            <td>
                                <span className="crew-badge">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
                                        <circle cx="9" cy="7" r="4"/>
                                        <path d="M23 21v-2a4 4 0 00-3-3.87"/>
                                        <path d="M16 3.13a4 4 0 010 7.75"/>
                                    </svg>
                                    2 Photographers
                                </span>
                            </td>
                            <td>
                                <span className="crew-badge">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
                                        <circle cx="9" cy="7" r="4"/>
                                        <path d="M23 21v-2a4 4 0 00-3-3.87"/>
                                        <path d="M16 3.13a4 4 0 010 7.75"/>
                                    </svg>
                                    2 Videographers
                                </span>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </section>
    );
};
