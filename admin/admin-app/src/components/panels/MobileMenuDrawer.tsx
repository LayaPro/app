import React, { useState, useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '../../store/index.js';
import { toggleMobileMenu } from '../../store/slices/uiSlice.js';
import { useTheme } from '../../hooks/useTheme.js';
import styles from './MobileMenuDrawer.module.css';

export const MobileMenuDrawer: React.FC = () => {
  const dispatch = useAppDispatch();
  const isOpen = useAppSelector((state) => state.ui.mobileMenuOpen);
  const [isClosing, setIsClosing] = useState(false);
  const { toggle: toggleTheme, isDark } = useTheme();

  useEffect(() => {
    if (!isOpen) {
      setIsClosing(false);
    }
  }, [isOpen]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      dispatch(toggleMobileMenu());
    }, 300); // Match animation duration
  };

  if (!isOpen && !isClosing) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={styles.backdrop}
        data-closing={isClosing}
        onClick={handleClose}
      />
      
      {/* Drawer */}
      <div className={styles.drawer} data-closing={isClosing}>
        {/* Header */}
        <div className={styles.header}>
          <button
            onClick={handleClose}
            className={styles.closeButton}
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className={styles.logoSection}>
            <div className={styles.logoIcon}>
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <div className={styles.brandText}>
              <span className={styles.brandTitle}>Laya Studio</span>
              <span className={styles.brandSubtitle}>Admin Portal</span>
            </div>
          </div>
          <button onClick={toggleTheme} className={styles.themeToggle}>
            {isDark ? (
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>
        </div>

        {/* Menu Area - for future navigation items */}
        <div className={styles.menuArea}>
          {/* Navigation items will go here */}
        </div>

        {/* Stats Section */}
        <div className={styles.statsSection}>
          <div className={styles.statsRow}>
            {/* Revenue */}
            <div className={styles.statCard}>
              <svg className={styles.statIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#3b82f6' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className={styles.statContent}>
                <span className={styles.statLabel}>Revenue</span>
                <span className={styles.statValue}>$24.5K</span>
              </div>
            </div>

            {/* Completed */}
            <div className={styles.statCard}>
              <svg className={styles.statIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#8b5cf6' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className={styles.statContent}>
                <span className={styles.statLabel}>Completed</span>
                <span className={styles.statValue}>142</span>
              </div>
            </div>

            {/* Growth */}
            <div className={styles.statCard}>
              <svg className={styles.statIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#10b981' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              <div className={styles.statContent}>
                <span className={styles.statLabel}>Growth</span>
                <span className={styles.statValue} style={{ color: '#10b981' }}>+23%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
