import { Fragment, type FC } from 'react';
import styles from '../Albums.module.css';

interface AlbumPdfInfoProps {
  albumPdfUrl?: string | null;
  albumPdfFileName?: string | null;
  className?: string;
  emptyMessage?: string;
}

export const AlbumPdfInfo: FC<AlbumPdfInfoProps> = ({
  albumPdfUrl,
  albumPdfFileName,
  className,
  emptyMessage = 'No album PDF uploaded yet'
}) => {
  const containerClassName = [
    styles.albumPdfInfo,
    !albumPdfUrl ? styles.albumPdfInfoEmpty : '',
    className || ''
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={containerClassName} aria-live="polite">
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M7 7v10a2 2 0 002 2h6a2 2 0 002-2V9l-4-4H9a2 2 0 00-2 2z"
        />
      </svg>
      {albumPdfUrl ? (
        <Fragment>
          <span className={styles.albumPdfInfoLabel}>Album PDF</span>
          <span className={styles.albumPdfInfoSeparator} aria-hidden="true">•</span>
          <a
            href={albumPdfUrl}
            download={albumPdfFileName || undefined}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.albumPdfInfoLink}
          >
            {albumPdfFileName || 'Download album PDF'}
          </a>
        </Fragment>
      ) : (
        <span className={styles.albumPdfInfoPlaceholder}>{emptyMessage}</span>
      )}
    </div>
  );
};
