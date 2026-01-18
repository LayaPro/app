import { useProposal } from '../context/ProposalContext';
import './Events.css';

export const Events = () => {
    const { proposal } = useProposal();
    const events = proposal?.events || [];

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
                        {events.map((event: any, index: number) => (
                            <tr key={event.eventId || index}>
                                <td><span className="event-name">{event.eventName}</span></td>
                                <td>
                                    {event.photographyServices && event.photographyServices.length > 0 ? (
                                        <div className="crew-badges">
                                            {event.photographyServices.map((service: any, idx: number) => (
                                                <span key={idx} className="crew-badge">
                                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                                                        <circle cx="12" cy="7" r="4"/>
                                                    </svg>
                                                    {service.count} {service.label}
                                                </span>
                                            ))}
                                        </div>
                                    ) : (
                                        <span className="crew-badge-empty">—</span>
                                    )}
                                </td>
                                <td>
                                    {event.videographyServices && event.videographyServices.length > 0 ? (
                                        <div className="crew-badges">
                                            {event.videographyServices.map((service: any, idx: number) => (
                                                <span key={idx} className="crew-badge">
                                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                                                        <circle cx="12" cy="7" r="4"/>
                                                    </svg>
                                                    {service.count} {service.label}
                                                </span>
                                            ))}
                                        </div>
                                    ) : (
                                        <span className="crew-badge-empty">—</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </section>
    );
};
