import styles from '../Page.module.css';

const ProjectTypes = () => {
  return (
    <div className={styles.pageContainer}>
      <h1 className={styles.pageTitle}>Project Types</h1>
      <p className={styles.pageDescription}>
        Configure project categories like Wedding, Corporate, Portrait, etc.
      </p>
    </div>
  );
};

export default ProjectTypes;