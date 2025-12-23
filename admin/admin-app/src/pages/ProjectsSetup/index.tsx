import { useState } from 'react';
import styles from './ProjectsSetup.module.css';

const ProjectsSetup = () => {
  const [expandedCard, setExpandedCard] = useState<string | null>('projectTypes');

  const toggleCard = (cardId: string) => {
    setExpandedCard(expandedCard === cardId ? null : cardId);
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Projects Setup</h1>
        <p className={styles.pageDescription}>
          Configure project types and delivery workflow settings. Define project categories and their delivery status steps.
        </p>
      </div>

      <div className={styles.cardsContainer}>
        {/* Project Types Card */}
        <div className={styles.card}>
          <button
            className={styles.cardHeader}
            onClick={() => toggleCard('projectTypes')}
          >
            <div className={styles.cardHeaderContent}>
              <svg className={styles.cardIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              <div>
                <h2 className={styles.cardTitle}>Project Types</h2>
                <p className={styles.cardSubtitle}>
                  Manage different types of projects (Wedding Package, Corporate Event, Portrait Session, etc.)
                </p>
              </div>
            </div>
            <svg
              className={`${styles.chevron} ${
                expandedCard === 'projectTypes' ? styles.chevronExpanded : ''
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          <div
            className={`${styles.cardContent} ${
              expandedCard === 'projectTypes' ? styles.cardContentExpanded : ''
            }`}
          >
            <div className={styles.contentInner}>
              <div className={styles.toolbar}>
                <button className={styles.addButton}>
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Project Type
                </button>
              </div>

              <div className={styles.table}>
                <div className={styles.tableHeader}>
                  <div className={styles.tableRow}>
                    <div className={styles.tableCell}>Code</div>
                    <div className={styles.tableCell}>Name</div>
                    <div className={styles.tableCell}>Description</div>
                    <div className={styles.tableCell}>Actions</div>
                  </div>
                </div>
                <div className={styles.tableBody}>
                  <div className={styles.emptyState}>
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    <p>No project types configured yet</p>
                    <span>Create your first project type to categorize your work</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Project Delivery Status Card */}
        <div className={styles.card}>
          <button
            className={styles.cardHeader}
            onClick={() => toggleCard('projectStatus')}
          >
            <div className={styles.cardHeaderContent}>
              <svg className={styles.cardIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h2 className={styles.cardTitle}>Project Delivery Status</h2>
                <p className={styles.cardSubtitle}>
                  Define workflow steps for project delivery (Planning → Execution → Review → Completion)
                </p>
              </div>
            </div>
            <svg
              className={`${styles.chevron} ${
                expandedCard === 'projectStatus' ? styles.chevronExpanded : ''
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          <div
            className={`${styles.cardContent} ${
              expandedCard === 'projectStatus' ? styles.cardContentExpanded : ''
            }`}
          >
            <div className={styles.contentInner}>
              <div className={styles.toolbar}>
                <button className={styles.addButton}>
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Status Step
                </button>
              </div>

              <div className={styles.table}>
                <div className={styles.tableHeader}>
                  <div className={styles.tableRow}>
                    <div className={styles.tableCell}>Step</div>
                    <div className={styles.tableCell}>Status Code</div>
                    <div className={styles.tableCell}>Last Updated</div>
                    <div className={styles.tableCell}>Actions</div>
                  </div>
                </div>
                <div className={styles.tableBody}>
                  <div className={styles.emptyState}>
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <p>No delivery status steps defined yet</p>
                    <span>Create your first status step to track project delivery workflow</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectsSetup;
