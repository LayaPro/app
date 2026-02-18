import { useState } from 'react';
import { PageHeader, HelpPanel } from '../../components/help/index.js';
import { getHelpContent } from '../../data/helpContent.js';
import { TeamFinanceTable } from './components/TeamFinanceTable.js';
import styles from './Finances.module.css';

const FinancesTeamMembers = () => {
  const [showHelp, setShowHelp] = useState(false);
  const [teamKey, setTeamKey] = useState(0);
  const helpContent = getHelpContent('finances');

  return (
    <>
      <PageHeader onHelpClick={() => setShowHelp(true)} />
      <div className={styles.pageContainer}>
        <TeamFinanceTable key={teamKey} />
      </div>
      {showHelp && helpContent && (
        <HelpPanel help={helpContent} onClose={() => setShowHelp(false)} />
      )}
    </>
  );
};

export default FinancesTeamMembers;
