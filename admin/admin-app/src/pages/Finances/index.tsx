import styles from '../Page.module.css';

const Finances = () => {
  return (
    <div className={styles.pageContainer}>
      <h1 className={styles.pageTitle}>Finances</h1>
      <p className={styles.pageDescription}>
        This is the Finances page. Track your income, expenses, and financial reports.
      </p>
    </div>
  );
};

export default Finances;
