import styles from '../Page.module.css';

const TeamMembers = () => {
  return (
    <div className={styles.pageContainer}>
      <h1 className={styles.pageTitle}>Team Members</h1>
      <p className={styles.pageDescription}>
        Manage your team members, photographers, editors, and staff.
      </p>
    </div>
  );
};

export default TeamMembers;