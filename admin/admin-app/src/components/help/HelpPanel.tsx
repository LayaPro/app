import React from 'react';
import type { PageHelp } from '../../data/helpContent';
import styles from './HelpPanel.module.css';

interface HelpPanelProps {
  help: PageHelp;
  onClose: () => void;
}

export const HelpPanel: React.FC<HelpPanelProps> = ({ help, onClose }) => {
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.panel} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div>
            <h2 className={styles.title}>{help.pageTitle}</h2>
            <p className={styles.description}>{help.description}</p>
          </div>
          <button className={styles.closeButton} onClick={onClose} aria-label="Close help">
            <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className={styles.content}>
          {help.videoUrl && (
            <div className={styles.videoSection}>
              <h3 className={styles.sectionTitle}>Video Tutorial</h3>
              <div className={styles.videoWrapper}>
                <iframe
                  src={help.videoUrl}
                  title="Help video"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          )}

          {help.sections.map((section, index) => (
            <div key={index} className={styles.section}>
              <div className={styles.sectionHeader}>
                {section.icon && <span className={styles.icon}>{section.icon}</span>}
                <h3 className={styles.sectionTitle}>{section.title}</h3>
              </div>
              <p className={styles.sectionContent}>{section.content}</p>
            </div>
          ))}

          {help.relatedLinks && help.relatedLinks.length > 0 && (
            <div className={styles.relatedLinks}>
              <h3 className={styles.sectionTitle}>Related Pages</h3>
              <div className={styles.links}>
                {help.relatedLinks.map((link, index) => (
                  <a key={index} href={link.path} className={styles.link}>
                    {link.title}
                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className={styles.footer}>
          <p className={styles.footerText}>
            Need more help? Contact support at{' '}
            <a href="mailto:support@layapro.com" className={styles.supportLink}>
              support@layapro.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};
