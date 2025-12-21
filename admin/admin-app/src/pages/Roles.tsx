import styles from './Page.module.css';

const Roles = () => {
  return (
    <div className={styles.pageContainer}>
      <h1 className={styles.pageTitle}>Roles</h1>
      <p className={styles.pageDescription}>
        Define roles and permissions for access control.
      </p>
    </div>
  );
};

export default Roles;