import { useState, useEffect } from 'react';
import { proposalApi } from '../../../services/api';
import styles from '../../../components/common/Stats.module.css';

interface ProposalStatsProps {
  refreshTrigger?: number;
}

export const ProposalStats: React.FC<ProposalStatsProps> = ({ refreshTrigger }) => {
  const [stats, setStats] = useState({
    total: 0,
    draft: 0,
    sent: 0,
    accepted: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, [refreshTrigger]);

  const fetchStats = async () => {
    try {
      setIsLoading(true);
      const response = await proposalApi.getAll();
      const proposals = response.proposals || [];

      const calculated = {
        total: proposals.length,
        draft: proposals.filter((p: any) => p.status === 'draft').length,
        sent: proposals.filter((p: any) => p.status === 'sent').length,
        accepted: proposals.filter((p: any) => p.status === 'accepted' || p.status === 'project_created').length,
      };

      setStats(calculated);
    } catch (error) {
      console.error('Error fetching proposal stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className={styles.statsContainer}>
        {[...Array(4)].map((_, i) => (
          <div key={i} className={styles.skeletonCard}>
            <div className={styles.skeleton}></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={styles.statsContainer}>
      <div className={styles.statCard}>
        <div className={styles.iconWrapper} style={{ background: 'rgba(107, 114, 128, 0.1)' }}>
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#6b7280' }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </div>
        <div className={styles.content}>
          <p className={styles.title}>Draft</p>
          <p className={styles.value}>{stats.draft}</p>
        </div>
      </div>

      <div className={styles.statCard}>
        <div className={styles.iconWrapper} style={{ background: 'rgba(59, 130, 246, 0.1)' }}>
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#3b82f6' }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </div>
        <div className={styles.content}>
          <p className={styles.title}>Sent</p>
          <p className={styles.value}>{stats.sent}</p>
        </div>
      </div>

      <div className={styles.statCard}>
        <div className={styles.iconWrapper} style={{ background: 'rgba(16, 185, 129, 0.1)' }}>
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#10b981' }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className={styles.content}>
          <p className={styles.title}>Accepted</p>
          <p className={styles.value}>{stats.accepted}</p>
        </div>
      </div>

      <div className={styles.statCard}>
        <div className={styles.iconWrapper} style={{ background: 'rgba(139, 92, 246, 0.1)' }}>
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#8b5cf6' }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <div className={styles.content}>
          <p className={styles.title}>Total Proposals</p>
          <p className={styles.value}>{stats.total}</p>
        </div>
      </div>
    </div>
  );
};
