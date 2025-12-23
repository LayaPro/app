import styles from '../Page.module.css';

const DeliveryStatus = () => {
  return (
    <div className={styles.pageContainer}>
      <h1 className={styles.pageTitle}>Delivery Status</h1>
      <p className={styles.pageDescription}>
        Manage delivery statuses for tracking project completions.
      </p>
    </div>
  );
};

export default DeliveryStatus;