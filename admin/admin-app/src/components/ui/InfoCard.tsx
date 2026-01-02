import styles from './InfoCard.module.css';

interface InfoCardProps {
  message: string;
}

export const InfoCard: React.FC<InfoCardProps> = ({ message }) => {
  if (!message) return null;

  return (
    <div className={styles.infoCard}>
      <svg className={styles.icon} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <circle cx="12" cy="12" r="10" strokeWidth="2"/>
        <line x1="12" y1="16" x2="12" y2="12" strokeWidth="2" strokeLinecap="round"/>
        <circle cx="12" cy="8" r="0.5" fill="currentColor" strokeWidth="0"/>
      </svg>
      <span>{message}</span>
    </div>
  );
};
