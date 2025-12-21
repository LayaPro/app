import styles from './Page.module.css';

const ProjectStatus = () => {
  return (
    <div className={styles.pageContainer}>
      <h1 className={styles.pageTitle}>Project Status</h1>
      <p className={styles.pageDescription}>
        Define workflow statuses for projects (New, In Progress, Completed, etc.).
      </p>
    </div>
  );
};

export default ProjectStatus;