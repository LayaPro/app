import styles from '../Page.module.css';

const Albums = () => {
  return (
    <div className={styles.pageContainer}>
      <h1 className={styles.pageTitle}>Albums</h1>
      <p className={styles.pageDescription}>
        This is the Albums page. Here you can manage all your photo albums.
      </p>
    </div>
  );
};

export default Albums;
