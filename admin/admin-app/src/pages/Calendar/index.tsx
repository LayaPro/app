import styles from '../Page.module.css';

const Calendar = () => {
  return (
    <div className={styles.pageContainer}>
      <h1 className={styles.pageTitle}>Calendar</h1>
      <p className={styles.pageDescription}>
        This is the Calendar page. View and manage all your scheduled events and bookings.
      </p>
    </div>
  );
};

export default Calendar;
