import styles from '../Page.module.css';

const Dashboard = () => {
  return (
    <div className={styles.pageContainer}>
      <h1 className={styles.pageTitle}>Dashboard</h1>
      <p className={styles.pageDescription}>
        This is the Dashboard page. You're viewing the main overview of your studio.
      </p>
    </div>
  );
};

export default Dashboard;
