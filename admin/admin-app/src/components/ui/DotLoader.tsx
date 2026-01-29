import React from 'react';
import styles from './DotLoader.module.css';

interface DotLoaderProps {
  size?: 'small' | 'medium' | 'large';
  text?: string;
}

export const DotLoader: React.FC<DotLoaderProps> = ({ size = 'medium', text }) => {
  return (
    <div className={styles.container}>
      <div className={`${styles.loader} ${styles[size]}`}></div>
      {text && <p className={styles.text}>{text}</p>}
    </div>
  );
};
