import React from 'react';
import { Breadcrumb } from '../ui';
import { HelpButton } from './HelpButton';
import styles from './PageHeader.module.css';

interface PageHeaderProps {
  onHelpClick: () => void;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ onHelpClick }) => {
  return (
    <div className={styles.pageHeader}>
      <Breadcrumb />
      <HelpButton onClick={onHelpClick} />
    </div>
  );
};
