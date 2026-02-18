import { useState } from 'react';
import { PageHeader, HelpPanel } from '../../components/help/index.js';
import { getHelpContent } from '../../data/helpContent.js';
import { ExpensesTable } from './components/ExpensesTable.js';
import styles from './Finances.module.css';

const FinancesExpenses = () => {
  const [showHelp, setShowHelp] = useState(false);
  const [expensesKey, setExpensesKey] = useState(0);
  const helpContent = getHelpContent('finances');

  return (
    <>
      <PageHeader onHelpClick={() => setShowHelp(true)} />
      <div className={styles.pageContainer}>
        <ExpensesTable key={expensesKey} />
      </div>
      {showHelp && helpContent && (
        <HelpPanel help={helpContent} onClose={() => setShowHelp(false)} />
      )}
    </>
  );
};

export default FinancesExpenses;
