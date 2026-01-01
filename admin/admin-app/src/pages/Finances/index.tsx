import { Breadcrumb } from '../../components/ui/index.js';
import { CustomersFinanceTable } from './components/CustomersFinanceTable.js';
import { TeamFinanceTable } from './components/TeamFinanceTable.js';
import { FinanceStats } from './components/FinanceStats.js';
import styles from './Finances.module.css';

const Finances = () => {
  return (
    <>
      <Breadcrumb />

      {/* Finance Stats */}
      <FinanceStats />

      {/* Side by Side Sections */}
      <div className={styles.sectionsGrid}>
        {/* Customers Section */}
        <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionHeaderContent}>
            <svg
              className={styles.sectionIcon}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            <div>
              <h2 className={styles.sectionTitle}>Customers</h2>
              <p className={styles.sectionSubtitle}>
                Track customer payments, pending amounts, and transaction history
              </p>
            </div>
          </div>
        </div>
        <div className={styles.sectionContent}>
          <div className={styles.contentInner}>
            <CustomersFinanceTable />
          </div>
        </div>
      </div>

      {/* Team Members Section */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionHeaderContent}>
            <svg
              className={styles.sectionIcon}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
            <div>
              <h2 className={styles.sectionTitle}>Team Members</h2>
              <p className={styles.sectionSubtitle}>
                Manage team member salaries, allowances, and payment schedules
              </p>
            </div>
          </div>
        </div>
        <div className={styles.sectionContent}>
          <div className={styles.contentInner}>
            <TeamFinanceTable />
          </div>
        </div>
      </div>
      </div>
    </>
  );
};

export default Finances;
