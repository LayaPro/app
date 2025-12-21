import styles from './Page.module.css';

const Projects = () => {
  return (
    <div className={styles.pageContainer}>
      <h1 className={styles.pageTitle}>Projects</h1>
      <p className={styles.pageDescription}>
        This is the Projects page. Manage all your studio projects here. You have 24 active projects.
      </p>
    </div>
  );
};

export default Projects;
