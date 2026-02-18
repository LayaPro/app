import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PageHeader, HelpPanel } from '../../components/help/index.js';
import { getHelpContent } from '../../data/helpContent.js';
import { CustomersFinanceTable } from './components/CustomersFinanceTable.js';
import styles from './Finances.module.css';

const FinancesCustomers = () => {
  const [searchParams] = useSearchParams();
  const customerParam = searchParams.get('customer');
  const [showHelp, setShowHelp] = useState(false);
  const [customersKey, setCustomersKey] = useState(0);
  const helpContent = getHelpContent('finances');

  return (
    <>
      <PageHeader onHelpClick={() => setShowHelp(true)} />
      <div className={styles.pageContainer}>
        <CustomersFinanceTable key={customersKey} initialCustomerFilter={customerParam} />
      </div>
      {showHelp && helpContent && (
        <HelpPanel help={helpContent} onClose={() => setShowHelp(false)} />
      )}
    </>
  );
};

export default FinancesCustomers;
