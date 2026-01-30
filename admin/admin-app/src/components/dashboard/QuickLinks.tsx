import { Link } from 'react-router-dom';
import { ROUTES } from '../../utils/constants';
import styles from './QuickLinks.module.css';

export const QuickLinks = () => {
  const quickLinks = [
    {
      to: ROUTES.PROPOSALS + '?action=new',
      icon: (
        <svg fill="none" stroke="#f59e0b" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      iconBg: 'rgba(245, 158, 11, 0.1)',
      text: 'New Proposal'
    },
    {
      to: ROUTES.CALENDAR + '?action=new',
      icon: (
        <svg fill="none" stroke="#8b5cf6" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      ),
      iconBg: 'rgba(139, 92, 246, 0.1)',
      text: 'New Event'
    },
    {
      to: ROUTES.TEAM_MEMBERS + '?action=new',
      icon: (
        <svg fill="none" stroke="#3b82f6" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
        </svg>
      ),
      iconBg: 'rgba(59, 130, 246, 0.1)',
      text: 'New Team Member'
    },
    {
      to: ROUTES.CALENDAR,
      icon: (
        <svg fill="none" stroke="#6366f1" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      iconBg: 'rgba(99, 102, 241, 0.1)',
      text: 'Calendar'
    },
    {
      to: ROUTES.FINANCES,
      icon: (
        <svg fill="none" stroke="#22c55e" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      iconBg: 'rgba(34, 197, 94, 0.1)',
      text: 'Finances'
    }
  ];

  return (
    <div className={styles.quickLinksCard}>
      <div className={styles.sectionHeader}>
        <div className={styles.sectionTitleWrapper}>
          <svg
            className={styles.sectionIcon}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
          <h2 className={styles.sectionTitle}>Quick Links</h2>
        </div>
      </div>
      <div className={styles.quickLinksGrid}>
        {quickLinks.map((link) => (
          <Link key={link.text} to={link.to} className={styles.quickLinkCard}>
            <div className={styles.quickLinkIcon} style={{ backgroundColor: link.iconBg }}>
              {link.icon}
            </div>
            <span className={styles.quickLinkText}>{link.text}</span>
          </Link>
        ))}
      </div>
    </div>
  );
};
