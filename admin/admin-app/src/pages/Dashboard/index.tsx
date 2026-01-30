import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { dashboardStatsApi } from '../../services/api';
import { ROUTES } from '../../utils/constants';
import styles from './Dashboard.module.css';
import pageStyles from '../Page.module.css';

interface DashboardStats {
  totalProjects: number;
  activeProjects: number;
  totalRevenue: number;
  pendingReceivable: number;
  totalProposals: number;
  pendingProposals: number;
  upcomingEvents: number;
  comparisons: {
    projects: { change: number; changePercent: number };
    revenue: { change: number; changePercent: number };
    proposals: { change: number; changePercent: number };
    events: { change: number; changePercent: number };
  };
}

const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const response = await dashboardStatsApi.getComparisonStats();
      setStats(response?.stats || null);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  if (loading || !stats) {
    return (
      <div className={pageStyles.pageContainer}>
        <div className={styles.metricsGrid}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className={styles.metricCard} style={{ opacity: 0.5 }}>
              <div className={styles.skeleton} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const metricsCards = [
    {
      title: 'Total Projects',
      value: stats.totalProjects.toString(),
      subtitle: `${stats.activeProjects} Active`,
      trend: { 
        value: Math.abs(stats.comparisons.projects.change), 
        isPositive: stats.comparisons.projects.change >= 0,
        isCount: true
      },
      icon: (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      ),
      color: '#6366f1',
      link: ROUTES.PROJECTS,
    },
    {
      title: 'Total Revenue',
      value: formatCurrency(stats.totalRevenue),
      subtitle: 'Received',
      trend: { 
        value: Math.abs(stats.comparisons.revenue.changePercent), 
        isPositive: stats.comparisons.revenue.changePercent >= 0,
        isCount: false
      },
      icon: (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: '#10b981',
      link: ROUTES.FINANCES,
    },
    {
      title: 'Proposals',
      value: stats.totalProposals.toString(),
      subtitle: `${stats.pendingProposals} Pending`,
      trend: { 
        value: Math.abs(stats.comparisons.proposals.change), 
        isPositive: stats.comparisons.proposals.change >= 0,
        isCount: true
      },
      icon: (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      color: '#f59e0b',
      link: ROUTES.PROPOSALS,
    },
    {
      title: 'Events',
      value: stats.upcomingEvents.toString(),
      subtitle: 'This Month',
      trend: { 
        value: Math.abs(stats.comparisons.events.change), 
        isPositive: stats.comparisons.events.change >= 0,
        isCount: true
      },
      icon: (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      color: '#8b5cf6',
      link: ROUTES.CALENDAR,
    },
  ];

  return (
    <div className={pageStyles.pageContainer}>
      <div className={styles.metricsGrid}>
        {metricsCards.map((card) => (
          <Link
            key={card.title}
            to={card.link}
            className={styles.metricCard}
            style={{ '--card-color': card.color } as any}
          >
            <div className={styles.metricIcon}>
              {card.icon}
            </div>
            <div className={styles.metricContent}>
              <h3 className={styles.metricTitle}>{card.title}</h3>
              <div className={styles.metricValue}>{card.value}</div>
              <div className={styles.metricFooter}>
                <span className={styles.metricSubtitle}>{card.subtitle}</span>
                <div className={styles.metricTrendWrapper}>
                  <span 
                    className={styles.metricTrend}
                    data-positive={card.trend.isPositive}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={3} 
                        d={card.trend.isPositive ? "M5 10l7-7m0 0l7 7m-7-7v18" : "M19 14l-7 7m0 0l-7-7m7 7V3"}
                      />
                    </svg>
                    {card.trend.isCount ? card.trend.value : `${card.trend.value}%`}
                  </span>
                  <span className={styles.metricCompare}>vs last month</span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
