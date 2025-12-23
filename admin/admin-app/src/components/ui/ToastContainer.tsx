import React from 'react';
import { useToast } from '../../context/ToastContext';
import { Toast } from './Toast';
import styles from './ToastContainer.module.css';

export const ToastContainer: React.FC = () => {
  const { toasts } = useToast();

  return (
    <div className={styles.toastContainer}>
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} />
      ))}
    </div>
  );
};
