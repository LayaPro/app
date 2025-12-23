import styles from '../Page.module.css';

const Designations = () => {
  return (
    <div className={styles.pageContainer}>
      <h1 className={styles.pageTitle}>Designations</h1>
      <p className={styles.pageDescription}>
        Define job roles and designations for team members.
      </p>
    </div>
  );
};

export default Designations;