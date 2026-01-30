import { useEffect, useState } from 'react';
import { financeStatsApi } from '../../../services/api';
import styles from './FinanceStats.module.css';

interface FinanceStats {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  pendingReceivable: number;
  pendingPayable: number;
  totalBudget: number;
}

export const FinanceStats = () => {
  const [stats, setStats] = useState<FinanceStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await financeStatsApi.getStats();
      setStats(response.stats);
    } catch (error) {
      console.error('Error fetching finance stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  if (loading) {
    return (
      <div className={styles.statsContainer}>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className={styles.statCard} style={{ opacity: 0.5 }}>
            <div className={styles.skeleton} />
          </div>
        ))}
      </div>
    );
  }

  if (!stats) return null;

  const statCards = [
    {
      title: 'Total Revenue',
      value: stats.totalRevenue,
      icon: (
        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: '#10b981',
      bgColor: 'rgba(16, 185, 129, 0.1)'
    },
    {
      title: 'Total Expenses',
      value: stats.totalExpenses,
      icon: (
        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      color: '#f59e0b',
      bgColor: 'rgba(245, 158, 11, 0.1)'
    },
    {
      title: 'Net Profit',
      value: stats.netProfit,
      icon: (
        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ),
      color: stats.netProfit >= 0 ? '#3b82f6' : '#ef4444',
      bgColor: stats.netProfit >= 0 ? 'rgba(59, 130, 246, 0.1)' : 'rgba(239, 68, 68, 0.1)'
    },
    {
      title: 'Pending Receivable',
      value: stats.pendingReceivable,
      icon: (
        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      ),
      color: '#8b5cf6',
      bgColor: 'rgba(139, 92, 246, 0.1)'
    },
    {
      title: 'Pending Payable',
      value: stats.pendingPayable,
      icon: (
        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
        </svg>
      ),
      color: '#ef4444',
      bgColor: 'rgba(239, 68, 68, 0.1)'
    }
  ];

  return (
    <div className={styles.statsContainer}>
      {statCards.map((card, index) => (
        <div key={index} className={styles.statCard}>
          <div className={styles.iconWrapper} style={{ background: card.bgColor }}>
            <div style={{ color: card.color }}>
              {card.icon}
            </div>
          </div>
          <div className={styles.content}>
            <div className={styles.title}>{card.title}</div>
            <div className={styles.value}>{formatCurrency(card.value)}</div>
          </div>
        </div>
      ))}
    </div>
  );
};
