import { useMemo } from 'react';
import { Select } from '../ui/Select';
import styles from './MonthlyRevenueChart.module.css';

interface MonthData {
  month: string;
  revenue: number;
  projects: number;
}

interface MonthlyRevenueChartProps {
  data: MonthData[];
  year: number;
  onYearChange: (year: number) => void;
}

export const MonthlyRevenueChart: React.FC<MonthlyRevenueChartProps> = ({ data, year, onYearChange }) => {
  const maxRevenue = useMemo(() => {
    return Math.max(...data.map(d => d.revenue), 1);
  }, [data]);

  const formatCurrency = (value: number) => {
    if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
    if (value >= 1000) return `₹${(value / 1000).toFixed(1)}K`;
    return `₹${value}`;
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 4 + i);
  const yearOptions = years.map(y => ({ value: String(y), label: String(y) }));

  return (
    <div className={styles.chartContainer}>
      <div className={styles.chartHeader}>
        <div className={styles.titleSection}>
          <svg className={styles.chartIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <h2 className={styles.chartTitle}>Monthly Revenue</h2>
        </div>
        <div className={styles.yearSelectWrapper}>
          <Select 
            value={String(year)}
            onChange={(value) => onYearChange(Number(value))}
            options={yearOptions}
            placeholder="Select Year"
            className={styles.yearSelect}
          />
        </div>
      </div>

      <div className={styles.chartContent}>
        <div className={styles.chartArea}>
          {data.map((item, index) => {
            const height = (item.revenue / maxRevenue) * 100;
            return (
              <div key={item.month} className={styles.barContainer}>
                <div 
                  className={styles.barWrapper}
                  style={{ height: '200px' }}
                >
                  <div 
                    className={styles.bar}
                    style={{ 
                      height: `${height}%`,
                      animationDelay: `${index * 0.05}s`
                    }}
                    data-revenue={formatCurrency(item.revenue)}
                    data-projects={item.projects}
                  >
                    <div className={styles.barTooltip}>
                      <div className={styles.tooltipRevenue}>{formatCurrency(item.revenue)}</div>
                      <div className={styles.tooltipProjects}>{item.projects} projects</div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className={styles.chartLabels}>
          {data.map((item) => (
            <div key={`label-${item.month}`} className={styles.barLabel}>{item.month}</div>
          ))}
        </div>
      </div>
    </div>
  );
};
