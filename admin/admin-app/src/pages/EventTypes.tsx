import styles from './Page.module.css';

const EventTypes = () => {
  return (
    <div className={styles.pageContainer}>
      <h1 className={styles.pageTitle}>Event Types</h1>
      <p className={styles.pageDescription}>
        Configure event categories like Wedding, Birthday, Corporate Event, etc.
      </p>
    </div>
  );
};

export default EventTypes;