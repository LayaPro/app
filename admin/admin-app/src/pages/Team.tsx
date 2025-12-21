import styles from './Page.module.css';

const Team = () => {
  return (
    <div className={styles.pageContainer}>
      <h1 className={styles.pageTitle}>Team</h1>
      <p className={styles.pageDescription}>
        This is the Team page. Manage your team members and their roles.
      </p>
    </div>
  );
};

export default Team;
