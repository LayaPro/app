import { useState, useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Tabs } from '../../components/ui/index.js';
import { PageHeader, HelpPanel } from '../../components/help/index.js';
import { getHelpContent } from '../../data/helpContent.js';
import type { Tab } from '../../components/ui/Tabs.js';
import { CustomersFinanceTable } from './components/CustomersFinanceTable.js';
import { TeamFinanceTable } from './components/TeamFinanceTable.js';
import { ExpensesTable } from './components/ExpensesTable.js';
import { FinanceStats } from './components/FinanceStats.js';
import styles from './Finances.module.css';

const Finances = () => {
  const [statsKey, setStatsKey] = useState(0);
  const [searchParams] = useSearchParams();
  const customerParam = searchParams.get('customer');
  const [showHelp, setShowHelp] = useState(false);
  const [customersKey, setCustomersKey] = useState(0);
  const [teamKey, setTeamKey] = useState(0);
  const [expensesKey, setExpensesKey] = useState(0);
  const helpContent = getHelpContent('finances');

  const refreshStats = useCallback(() => {
    setStatsKey(prev => prev + 1);
  }, []);

  const handleTabChange = useCallback((tabId: string) => {
    // Refresh the active tab's data
    if (tabId === 'customers') {
      setCustomersKey(prev => prev + 1);
    } else if (tabId === 'team') {
      setTeamKey(prev => prev + 1);
    } else if (tabId === 'expenses') {
      setExpensesKey(prev => prev + 1);
    }
  }, []);

  const tabs: Tab[] = [
    {
      id: 'expenses',
      label: 'Expenses',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
          />
        </svg>
      ),
      content: (
        <div className={styles.tableWrapper}>
          <ExpensesTable key={expensesKey} />
        </div>
      ),
    },
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
          <CustomersFinanceTable key={customersKey} onDataChange={refreshStats} initialCustomerFilter={customerParam} />
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
          <TeamFinanceTable key={teamKey} />
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader onHelpClick={() => setShowHelp(true)} />
      <FinanceStats key={statsKey} />
      <Tabs tabs={tabs} onTabChange={handleTabChange} />
      {showHelp && helpContent && (
        <HelpPanel help={helpContent} onClose={() => setShowHelp(false)} />
      )}
    </>
  );
};

export default Finances;
