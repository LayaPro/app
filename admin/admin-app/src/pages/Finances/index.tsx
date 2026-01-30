import { useState, useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Breadcrumb, Tabs } from '../../components/ui/index.js';
import type { Tab } from '../../components/ui/Tabs.js';
import { CustomersFinanceTable } from './components/CustomersFinanceTable.js';
import { TeamFinanceTable } from './components/TeamFinanceTable.js';
import { FinanceStats } from './components/FinanceStats.js';
import styles from './Finances.module.css';

const Finances = () => {
  const [statsKey, setStatsKey] = useState(0);
  const [searchParams] = useSearchParams();
  const customerParam = searchParams.get('customer');

  const refreshStats = useCallback(() => {
    setStatsKey(prev => prev + 1);
  }, []);

  const tabs: Tab[] = [
    {
      id: 'customers',
      label: 'Customers',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
      ),
      content: (
        <div className={styles.tableWrapper}>
          <CustomersFinanceTable onDataChange={refreshStats} initialCustomerFilter={customerParam} />
        </div>
      ),
    },
    {
      id: 'team',
      label: 'Team Members',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
      ),
      content: (
        <div className={styles.tableWrapper}>
          <TeamFinanceTable />
        </div>
      ),
    },
  ];

  return (
    <>
      <Breadcrumb />
      <FinanceStats key={statsKey} />
      <Tabs tabs={tabs} />
    </>
  );
};

export default Finances;
