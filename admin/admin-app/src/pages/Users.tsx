import styles from './Page.module.css';

const Users = () => {
  return (
    <div className={styles.pageContainer}>
      <h1 className={styles.pageTitle}>Users</h1>
      <p className={styles.pageDescription}>
        Manage user accounts and access permissions.
      </p>
    </div>
  );
};

export default Users;