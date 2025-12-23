import styles from '../Page.module.css';

const Tenants = () => {
  return (
    <div className={styles.pageContainer}>
      <h1 className={styles.pageTitle}>Tenants</h1>
      <p className={styles.pageDescription}>
        Manage studio tenants and multi-studio configurations.
      </p>
    </div>
  );
};

export default Tenants;