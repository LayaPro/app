import type { FC } from 'react';
import type { ClientEvent } from '../types';
import styles from '../Albums.module.css';

interface EventMenuDropdownProps {
  event: ClientEvent;
  isDownloadingAll: boolean;
  isDownloadingAlbumDesign: boolean;
  onDownloadAll: (event: ClientEvent) => void;
  onDownloadAlbumDesign: (event: ClientEvent) => void;
  onSetStatus: (event: ClientEvent) => void;
  onPublish: (event: ClientEvent) => void;
  onUploadAlbumPdf: (event: ClientEvent) => void;
}

export const EventMenuDropdown: FC<EventMenuDropdownProps> = ({
  event,
  isDownloadingAll,
  isDownloadingAlbumDesign,
  onDownloadAll,
  onDownloadAlbumDesign,
  onSetStatus,
  onPublish,
  onUploadAlbumPdf
}) => {
  return (
    <div className={styles.menuDropdown}>
      <button
        className={styles.menuItem}
        onClick={(e) => {
          e.stopPropagation();
          onDownloadAll(event);
        }}
        disabled={isDownloadingAll}
        aria-disabled={isDownloadingAll}
      >
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
          />
        </svg>
        <span>{isDownloadingAll ? 'Downloading...' : 'Download as ZIP'}</span>
      </button>

      <button
        className={styles.menuItem}
        onClick={(e) => {
          e.stopPropagation();
          onDownloadAlbumDesign(event);
        }}
        disabled={isDownloadingAlbumDesign}
        aria-disabled={isDownloadingAlbumDesign}
      >
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 7h4l2-3h6l2 3h4v13H3V7zm9 3a4 4 0 100 8 4 4 0 000-8z"
          />
        </svg>
        <span>{isDownloadingAlbumDesign ? 'Preparing...' : 'Download Images for Album Design'}</span>
      </button>

      <button
        className={styles.menuItem}
        onClick={(e) => {
          e.stopPropagation();
          onUploadAlbumPdf(event);
        }}
      >
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 11v6m0 0l-2-2m2 2l2-2m6 5H6a2 2 0 01-2-2V7a2 2 0 012-2h5l2 2h5a2 2 0 012 2v10a2 2 0 01-2 2z"
          />
        </svg>
        Upload Album PDF
      </button>

      <button
        className={styles.menuItem}
        onClick={(e) => {
          e.stopPropagation();
          onSetStatus(event);
        }}
      >
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          />
        </svg>
        Set Status
      </button>

      <button
        className={styles.menuItem}
        onClick={(e) => {
          e.stopPropagation();
          onPublish(event);
        }}
      >
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
          />
        </svg>
        Publish to Customer
      </button>
    </div>
  );
};
