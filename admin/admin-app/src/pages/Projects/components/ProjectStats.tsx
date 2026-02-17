import styles from '../../../components/common/Stats.module.css';

interface ProjectStatsProps {
  stats: {
    active: number;
    completed: number;
    revenue: number;
    dueSoon: number;
  };
}

const formatIndianAmount = (amount: number): string => {
  if (amount === 0) return '0';
  
  const [integerPart, decimalPart] = amount.toString().split('.');
  const lastThree = integerPart.slice(-3);
  const otherNumbers = integerPart.slice(0, -3);
  
  const formatted = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + (otherNumbers ? ',' : '') + lastThree;
  return decimalPart ? `${formatted}.${decimalPart}` : formatted;
};

export const ProjectStats: React.FC<ProjectStatsProps> = ({ stats }) => {
  return (
    <div className={styles.statsContainer}>
      <div className={styles.statCard}>
        <div className={styles.iconWrapper} style={{ background: 'rgba(99, 102, 241, 0.1)' }}>
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#6366f1' }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
        </div>
        <div className={styles.content}>
          <p className={styles.title}>Active Projects</p>
          <p className={styles.value}>{stats.active}</p>
        </div>
      </div>

      <div className={styles.statCard}>
        <div className={styles.iconWrapper} style={{ background: 'rgba(16, 185, 129, 0.1)' }}>
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#10b981' }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className={styles.content}>
          <p className={styles.title}>Completed</p>
          <p className={styles.value}>{stats.completed}</p>
        </div>
      </div>

      <div className={styles.statCard}>
        <div className={styles.iconWrapper} style={{ background: 'rgba(16, 185, 129, 0.1)' }}>
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#10b981' }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className={styles.content}>
          <p className={styles.title}>Total Value</p>
          <p className={styles.value}>₹{formatIndianAmount(stats.revenue)}</p>
        </div>
      </div>

      <div className={styles.statCard}>
        <div className={styles.iconWrapper} style={{ background: 'rgba(239, 68, 68, 0.1)' }}>
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#ef4444' }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className={styles.content}>
          <p className={styles.title}>Due Soon</p>
          <p className={styles.value}>{stats.dueSoon}</p>
        </div>
      </div>
    </div>
  );
};
