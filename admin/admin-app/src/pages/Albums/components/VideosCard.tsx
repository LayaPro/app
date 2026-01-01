import type { FC } from 'react';
import styles from './VideosCard.module.css';

interface VideosCardProps {
  projectId: string;
  videoCount?: number;
  onClick?: () => void;
}

export const VideosCard: FC<VideosCardProps> = ({ videoCount = 0, onClick }) => {
  return (
    <div 
      className={styles.videosCard}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onClick?.();
        }
      }}
    >
      <div className={styles.iconContainer}>
        <svg 
          width="64" 
          height="64" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
          className={styles.videoIcon}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
          />
        </svg>
      </div>

      <div className={styles.content}>
        <h3 className={styles.title}>Project Videos</h3>
        <p className={styles.description}>
          Teasers, highlights & event moments
        </p>
        
        <div className={styles.stats}>
          <div className={styles.statBadge}>
            <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z"/>
            </svg>
            <span>{videoCount} {videoCount === 1 ? 'video' : 'videos'}</span>
          </div>
        </div>

        <div className={styles.action}>
          <span>View Videos</span>
          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </div>
  );
};
