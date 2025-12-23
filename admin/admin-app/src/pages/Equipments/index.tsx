import styles from '../Page.module.css';

const Equipments = () => {
  return (
    <div className={styles.pageContainer}>
      <h1 className={styles.pageTitle}>Equipments</h1>
      <p className={styles.pageDescription}>
        This is the Equipments page. Manage your studio equipment inventory and maintenance.
      </p>
    </div>
  );
};

export default Equipments;
