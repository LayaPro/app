import React from 'react';
import { useAppDispatch } from '../../store/index.js';
import { toggleNotificationPanel, toggleProfilePanel, toggleMobileMenu } from '../../store/slices/uiSlice.js';
import { useTheme } from '../../hooks/useTheme.js';
import { useAuth } from '../../hooks/useAuth.js';
import styles from './Header.module.css';

export const Header: React.FC = () => {
  const dispatch = useAppDispatch();
  const { toggle: toggleTheme, isDark } = useTheme();
  const { user } = useAuth();

  // Use dummy data if no user is logged in
  const displayName = user ? `${user.firstName} ${user.lastName}` : 'John Doe';
  const displayRole = user?.roleName || 'Administrator';
  const displayInitials = user ? `${user.firstName?.[0]}${user.lastName?.[0]}` : 'JD';

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        {/* Hamburger Menu (Mobile Only) */}
        <button onClick={() => dispatch(toggleMobileMenu())} className={styles.hamburger}>
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Mobile Brand Title (Center) */}
        <div className={styles.mobileBrand}>
          <div className={styles.mobileLogo}>
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <span className={styles.mobileBrandTitle}>Laya Studio</span>
        </div>

        {/* Logo (Hidden on Mobile) */}
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

        {/* Center: Search Bar */}
        <div className={styles.searchContainer}>
          <div className={styles.searchWrapper}>
            <input
              type="text"
              placeholder="Search projects, clients..."
              className={styles.searchInput}
            />
            <svg className={styles.searchIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Right Side Controls */}
        <div className={styles.controls}>
          {/* Quick Stats Ticker */}
          <div className={styles.statsTicker}>
            {/* Revenue */}
            <div className={styles.statItem}>
              <svg className={styles.statIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#3b82f6' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <div className={styles.statLabel}>Revenue</div>
                <div className={styles.statValue}>$24.5K</div>
              </div>
            </div>

            <div className={styles.statDivider}></div>

            {/* Completed */}
            <div className={styles.statItem}>
              <svg className={styles.statIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#8b5cf6' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <div className={styles.statLabel}>Completed</div>
                <div className={styles.statValue}>142 tasks</div>
              </div>
            </div>

            <div className={styles.statDivider}></div>

            {/* Growth */}
            <div className={styles.statItem}>
              <svg className={styles.statIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#10b981' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              <div>
                <div className={styles.statLabel}>Growth</div>
                <div className={styles.statValue} style={{ color: '#10b981' }}>+23%</div>
              </div>
            </div>
          </div>

          {/* Dark Mode Toggle */}
          <button onClick={toggleTheme} className={`${styles.iconButton} ${styles.themeToggle}`}>
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

          {/* Notifications */}
          <button onClick={() => dispatch(toggleNotificationPanel())} className={`${styles.iconButton} ${styles.notificationButton}`}>
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <span className={styles.notificationDot}>
              <span className={styles.notificationPing}></span>
              <span className={styles.notificationIndicator}></span>
            </span>
          </button>

          {/* User Profile */}
          <div onClick={() => dispatch(toggleProfilePanel())} className={styles.profileSection}>
            <div className={styles.profileInfo}>
              <div className={styles.profileName}>{displayName}</div>
              <div className={styles.profileRole}>{displayRole}</div>
            </div>
            <button className={styles.profileAvatar}>{displayInitials}</button>
          </div>
        </div>
      </div>
    </header>
  );
};
