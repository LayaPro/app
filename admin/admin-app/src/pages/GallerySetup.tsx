import { useState } from 'react';
import styles from './GallerySetup.module.css';

const GallerySetup = () => {
  const [expandedCard, setExpandedCard] = useState<string | null>('imageStatus');

  const toggleCard = (cardId: string) => {
    setExpandedCard(expandedCard === cardId ? null : cardId);
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Gallery Setup</h1>
        <p className={styles.pageDescription}>
          Configure image and gallery delivery workflow settings. Define delivery status steps to track the progress of image processing and delivery.
        </p>
      </div>

      <div className={styles.cardsContainer}>
        {/* Image Delivery Status Card */}
        <div className={styles.card}>
          <button
            className={styles.cardHeader}
            onClick={() => toggleCard('imageStatus')}
          >
            <div className={styles.cardHeaderContent}>
              <svg className={styles.cardIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <div>
                <h2 className={styles.cardTitle}>Image Delivery Status</h2>
                <p className={styles.cardSubtitle}>
                  Define workflow steps for image delivery (Selection → Editing → Retouching → Delivery)
                </p>
              </div>
            </div>
            <svg
              className={`${styles.chevron} ${
                expandedCard === 'imageStatus' ? styles.chevronExpanded : ''
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
              expandedCard === 'imageStatus' ? styles.cardContentExpanded : ''
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
                    <div className={styles.tableCell}>Description</div>
                    <div className={styles.tableCell}>Actions</div>
                  </div>
                </div>
                <div className={styles.tableBody}>
                  <div className={styles.emptyState}>
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <p>No delivery status steps defined yet</p>
                    <span>Create your first status step to track image delivery workflow</span>
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

export default GallerySetup;
