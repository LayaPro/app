import styles from './Page.module.css';

const Settings = () => {
  return (
    <div className={styles.pageContainer}>
      <h1 className={styles.pageTitle}>Settings</h1>
      <p className={styles.pageDescription}>
        This is the Settings page. Configure your application preferences and account settings.
      </p>
    </div>
  );
};

export default Settings;
