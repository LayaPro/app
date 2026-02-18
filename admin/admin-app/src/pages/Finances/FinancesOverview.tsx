import { useState, useEffect } from 'react';
import { PageHeader, HelpPanel } from '../../components/help/index.js';
import { getHelpContent } from '../../data/helpContent.js';
import { financeStatsApi } from '../../services/api.js';
import styles from './FinancesOverview.module.css';

interface FinancialStats {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  pendingPayments: number;
  totalProjects: number;
  activeProjects: number;
  teamPayables: number;
  teamPaid: number;
}

interface ExpenseBreakdown {
  type: string;
  amount: number;
  percentage: number;
}

interface TopCustomer {
  name: string;
  revenue: number;
  projects: number;
}

interface TopTeamMember {
  name: string;
  totalPaid: number;
  projects: number;
}

const FinancesOverview = () => {
  const [showHelp, setShowHelp] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<FinancialStats>({
    totalRevenue: 0,
    totalExpenses: 0,
    netProfit: 0,
    pendingPayments: 0,
    totalProjects: 0,
    activeProjects: 0,
    teamPayables: 0,
    teamPaid: 0,
  });
  const [expenseBreakdown, setExpenseBreakdown] = useState<ExpenseBreakdown[]>([]);
  const [revenueHistory, setRevenueHistory] = useState<{ month: string; revenue: number; expenses: number }[]>([]);
  const [topCustomers, setTopCustomers] = useState<TopCustomer[]>([]);
  const [topTeamMembers, setTopTeamMembers] = useState<TopTeamMember[]>([]);
  const helpContent = getHelpContent('finances');

  useEffect(() => {
    fetchFinancialData();
  }, []);

  const fetchFinancialData = async () => {
    setLoading(true);
    try {
      const response = await financeStatsApi.getOverview();
      
      console.log('Finance overview response:', response);
      
      if (response && response.overview) {
        const { stats: statsData, expenseBreakdown: breakdown, revenueHistory: history, topCustomers: customers, topTeamMembers: teamMembers } = response.overview;
        
        console.log('Revenue history:', history);
        console.log('Expense breakdown:', breakdown);
        console.log('Top customers:', customers);
        console.log('Top team members:', teamMembers);
        
        setStats({
          totalRevenue: statsData.totalRevenue || 0,
          totalExpenses: statsData.totalExpenses || 0,
          netProfit: statsData.netProfit || 0,
          pendingPayments: statsData.pendingPayments || 0,
          totalProjects: statsData.totalProjects || 0,
          activeProjects: statsData.activeProjects || 0,
          teamPayables: statsData.teamPayables || 0,
          teamPaid: statsData.teamPaid || 0,
        });

        setExpenseBreakdown(breakdown || []);
        setRevenueHistory(history || []);
        setTopCustomers(customers || []);
        setTopTeamMembers(teamMembers || []);
      }
    } catch (error) {
      console.error('Error fetching financial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getAvatarColors = (name: string) => {
    const colors = [
      { bg: 'rgba(99, 102, 241, 0.1)', text: '#4f46e5', border: 'rgba(99, 102, 241, 0.2)' },
      { bg: 'rgba(59, 130, 246, 0.1)', text: '#2563eb', border: 'rgba(59, 130, 246, 0.2)' },
      { bg: 'rgba(34, 197, 94, 0.1)', text: '#16a34a', border: 'rgba(34, 197, 94, 0.2)' },
      { bg: 'rgba(245, 158, 11, 0.1)', text: '#d97706', border: 'rgba(245, 158, 11, 0.2)' },
      { bg: 'rgba(239, 68, 68, 0.1)', text: '#dc2626', border: 'rgba(239, 68, 68, 0.2)' },
      { bg: 'rgba(236, 72, 153, 0.1)', text: '#db2777', border: 'rgba(236, 72, 153, 0.2)' },
      { bg: 'rgba(6, 182, 212, 0.1)', text: '#0891b2', border: 'rgba(6, 182, 212, 0.2)' },
      { bg: 'rgba(20, 184, 166, 0.1)', text: '#0d9488', border: 'rgba(20, 184, 166, 0.2)' },
      { bg: 'rgba(249, 115, 22, 0.1)', text: '#ea580c', border: 'rgba(249, 115, 22, 0.2)' },
      { bg: 'rgba(168, 85, 247, 0.1)', text: '#9333ea', border: 'rgba(168, 85, 247, 0.2)' },
    ];
    
    let hash = 0;
    for (let i = 0; i < (name?.length || 0); i++) {
      hash = ((hash << 5) - hash) + name.charCodeAt(i);
      hash = hash & hash;
    }
    return colors[Math.abs(hash) % colors.length];
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Loading financial overview...</p>
      </div>
    );
  }

  const profitPercentage = stats.totalRevenue > 0 ? (stats.netProfit / stats.totalRevenue) * 100 : 0;
  const collectionRate = (stats.totalRevenue + stats.pendingPayments) > 0 
    ? (stats.totalRevenue / (stats.totalRevenue + stats.pendingPayments)) * 100 
    : 0;

  return (
    <>
      <PageHeader onHelpClick={() => setShowHelp(true)} />
      
      <div className={styles.pageContainer}>
      <div className={styles.overview}>
        {/* Key Metrics Cards */}
        <div className={styles.metricsGrid}>
          <div className={`${styles.metricCard} ${styles.revenueCard}`}>
            <div className={styles.metricIcon}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div className={styles.metricContent}>
              <h3>Total Revenue</h3>
              <p className={styles.metricValue}>{formatCurrency(stats.totalRevenue)}</p>
              <span className={styles.metricSubtext}>{stats.totalProjects} total projects</span>
            </div>
          </div>

          <div className={`${styles.metricCard} ${styles.expenseCard}`}>
            <div className={styles.metricIcon}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
              </svg>
            </div>
            <div className={styles.metricContent}>
              <h3>Total Expenses</h3>
              <p className={styles.metricValue}>{formatCurrency(stats.totalExpenses)}</p>
              <span className={styles.metricSubtext}>Including team payments</span>
            </div>
          </div>

          <div className={`${styles.metricCard} ${stats.netProfit >= 0 ? styles.profitCard : styles.lossCard}`}>
            <div className={styles.metricIcon}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className={styles.metricContent}>
              <h3>Net Profit</h3>
              <p className={styles.metricValue}>{formatCurrency(stats.netProfit)}</p>
              <span className={styles.metricSubtext}>{profitPercentage.toFixed(1)}% profit margin</span>
            </div>
          </div>

          <div className={`${styles.metricCard} ${styles.pendingCard}`}>
            <div className={styles.metricIcon}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className={styles.metricContent}>
              <h3>Pending Collections</h3>
              <p className={styles.metricValue}>{formatCurrency(stats.pendingPayments)}</p>
              <span className={styles.metricSubtext}>{collectionRate.toFixed(1)}% collected</span>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className={styles.chartsGrid}>
          {/* Revenue vs Expenses Trend */}
          <div className={styles.chartCard}>
            <h3 className={styles.chartTitle}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
              </svg>
              Revenue vs Expenses (Last 6 Months)
            </h3>
            {revenueHistory.length > 0 ? (
              <>
                <div className={styles.barChart}>
                  {revenueHistory.map((data, index) => {
                    const maxValue = Math.max(...revenueHistory.map(d => Math.max(d.revenue, d.expenses)), 1);
                    const revenueHeight = Math.max((data.revenue / maxValue) * 100, 3);
                    const expensesHeight = Math.max((data.expenses / maxValue) * 100, 3);
                    
                    return (
                      <div key={index} className={styles.barGroup}>
                        <div className={styles.bars}>
                          <div 
                            className={`${styles.bar} ${styles.revenueBar}`}
                            style={{ height: `${revenueHeight}%` }}
                          >
                            <div className={styles.barTooltip}>
                              <div className={styles.tooltipLabel}>Revenue</div>
                              <div className={styles.tooltipValue}>{formatCurrency(data.revenue)}</div>
                            </div>
                          </div>
                          <div 
                            className={`${styles.bar} ${styles.expenseBar}`}
                            style={{ height: `${expensesHeight}%` }}
                          >
                            <div className={styles.barTooltip}>
                              <div className={styles.tooltipLabel}>Expenses</div>
                              <div className={styles.tooltipValue}>{formatCurrency(data.expenses)}</div>
                            </div>
                          </div>
                        </div>
                        <span className={styles.barLabel}>{data.month}</span>
                      </div>
                    );
                  })}
                </div>
                <div className={styles.chartLegend}>
                  <div className={styles.legendItem}>
                    <span className={`${styles.legendColor} ${styles.revenueLegend}`}></span>
                    <span>Revenue</span>
                  </div>
                  <div className={styles.legendItem}>
                    <span className={`${styles.legendColor} ${styles.expenseLegend}`}></span>
                    <span>Expenses</span>
                  </div>
                </div>
              </>
            ) : (
              <div className={styles.emptyState}>
                <p>No revenue or expense data available</p>
              </div>
            )}
          </div>

          {/* Expense Breakdown */}
          <div className={styles.chartCard}>
            <h3 className={styles.chartTitle}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
              </svg>
              Expense Breakdown by Type
            </h3>
            {expenseBreakdown.length > 0 ? (
              <div className={styles.expenseList}>
                {expenseBreakdown.map((item, index) => (
                  <div key={index} className={styles.expenseItem}>
                    <span className={styles.expenseType}>{item.type}</span>
                    <div className={styles.expenseInfo}>
                      <span className={styles.expenseAmount}>{formatCurrency(item.amount)}</span>
                      <div className={styles.expenseBar}>
                        <div 
                          className={styles.expenseProgress}
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                      <span className={styles.expensePercentage}>{item.percentage.toFixed(1)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.emptyState}>
                <p>No expense data available</p>
              </div>
            )}
          </div>

          {/* Top Customers */}
          <div className={styles.chartCard}>
            <h3 className={styles.chartTitle}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Top Customers
            </h3>
            {topCustomers.length > 0 ? (
              <div className={styles.customerList}>
                {topCustomers.map((customer, index) => {
                  const initials = customer.name
                    .split(' ')
                    .map(n => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2);
                  const colors = getAvatarColors(customer.name);
                  
                  return (
                    <div key={index} className={styles.customerItem}>
                      <div 
                        className={styles.customerAvatar}
                        style={{
                          backgroundColor: colors.bg,
                          color: colors.text,
                          border: `1.5px solid ${colors.border}`
                        }}
                      >
                        {initials}
                      </div>
                      <div className={styles.customerDetails}>
                        <div className={styles.customerNameLine}>
                          <span className={styles.customerName}>{customer.name}</span>
                          <span className={styles.customerBadge}>{customer.projects} {customer.projects === 1 ? 'project' : 'projects'}</span>
                        </div>
                        <span className={styles.customerRevenue}>{formatCurrency(customer.revenue)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className={styles.emptyState}>
                <p>No customer data available</p>
              </div>
            )}
          </div>
        </div>

        {/* Team & Stats Section */}
        <div className={styles.teamStatsGrid}>
          {/* Top Team Members */}
          <div className={styles.chartCard}>
            <h3 className={styles.chartTitle}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              Top Team Members
            </h3>
            {topTeamMembers.length > 0 ? (
              <div className={styles.customerList}>
                {topTeamMembers.map((member, index) => {
                  const initials = member.name
                    .split(' ')
                    .map(n => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2);
                  const colors = getAvatarColors(member.name);
                  
                  return (
                    <div key={index} className={styles.customerItem}>
                      <div 
                        className={styles.customerAvatar}
                        style={{
                          backgroundColor: colors.bg,
                          color: colors.text,
                          border: `1.5px solid ${colors.border}`
                        }}
                      >
                        {initials}
                      </div>
                      <div className={styles.customerDetails}>
                        <div className={styles.customerNameLine}>
                          <span className={styles.customerName}>{member.name}</span>
                          <span className={styles.customerBadge}>{member.projects} {member.projects === 1 ? 'project' : 'projects'}</span>
                        </div>
                        <span className={styles.customerRevenue}>{formatCurrency(member.totalPaid)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className={styles.emptyState}>
                <p>No team payment data available</p>
              </div>
            )}
          </div>

          {/* Additional Stats */}
          <div className={styles.statsContainer}>
            <div className={`${styles.statBox} ${styles.projectsStatBox}`}>
            <div className={styles.statIcon} style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className={styles.statContent}>
              <h4 className={styles.statLabel}>Active Projects</h4>
              <p className={styles.statNumber}>{stats.activeProjects}</p>
              <span className={styles.statDetail}>out of {stats.totalProjects} total</span>
            </div>
          </div>

          <div className={`${styles.statBox} ${styles.payablesStatBox}`}>
            <div className={styles.statIcon} style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div className={styles.statContent}>
              <h4 className={styles.statLabel}>Team Payables</h4>
              <p className={styles.statNumber}>{formatCurrency(stats.teamPayables)}</p>
              <span className={styles.statDetail}>{formatCurrency(stats.teamPaid)} paid</span>
            </div>
          </div>

          <div className={`${styles.statBox} ${styles.outstandingStatBox}`}>
            <div className={styles.statIcon} style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className={styles.statContent}>
              <h4 className={styles.statLabel}>Outstanding Payments</h4>
              <p className={styles.statNumber}>{formatCurrency(stats.teamPayables - stats.teamPaid)}</p>
              <span className={styles.statDetail}>
                {stats.teamPayables > 0 ? ((stats.teamPaid / stats.teamPayables) * 100).toFixed(1) : 0}% settled
              </span>
            </div>
          </div>

          <div className={styles.statBox}>
            <div className={styles.statIcon} style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <div className={styles.statContent}>
              <h4 className={styles.statLabel}>Average Project Value</h4>
              <p className={styles.statNumber}>
                {stats.totalProjects > 0 ? formatCurrency(stats.totalRevenue / stats.totalProjects) : formatCurrency(0)}
              </p>
              <span className={styles.statDetail}>across all projects</span>
            </div>
          </div>
        </div>
      </div>
    </div>
      </div>

      {showHelp && helpContent && (
        <HelpPanel help={helpContent} onClose={() => setShowHelp(false)} />
      )}
    </>
  );
};

export default FinancesOverview;
