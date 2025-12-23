import React, { useEffect, useState, useRef } from 'react';
import { useToast } from '../../context/ToastContext';
import type { Toast as ToastType } from '../../context/ToastContext';
import styles from './Toast.module.css';

interface ToastProps {
  toast: ToastType;
}

const TOAST_DURATION = 5000; // 5 seconds

export const Toast: React.FC<ToastProps> = ({ toast }) => {
  const { removeToast } = useToast();
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(100);
  const timerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const remainingTimeRef = useRef<number>(TOAST_DURATION);

  const startTimer = () => {
    startTimeRef.current = Date.now();
    
    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const remaining = remainingTimeRef.current - elapsed;
      const progressPercent = (remaining / TOAST_DURATION) * 100;
      
      setProgress(Math.max(0, progressPercent));
      
      if (remaining <= 0) {
        handleClose();
      }
    }, 16); // ~60fps
  };

  const pauseTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      const elapsed = Date.now() - startTimeRef.current;
      remainingTimeRef.current -= elapsed;
    }
  };

  useEffect(() => {
    if (!isPaused) {
      startTimer();
    } else {
      pauseTimer();
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isPaused]);

  const handleClose = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    removeToast(toast.id);
  };

  const handleMouseEnter = () => {
    setIsPaused(true);
  };

  const handleMouseLeave = () => {
    setIsPaused(false);
  };

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return (
          <svg className={styles.icon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'error':
        return (
          <svg className={styles.icon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'warning':
        return (
          <svg className={styles.icon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        );
      case 'info':
        return (
          <svg className={styles.icon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  return (
    <div
      className={`${styles.toast} ${styles[toast.type]}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className={styles.content}>
        {getIcon()}
        <span className={styles.message}>{toast.message}</span>
        <button className={styles.closeButton} onClick={handleClose} aria-label="Close">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className={styles.progressBar}>
        <div 
          className={styles.progress} 
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};
