import React from 'react';
import { useAppDispatch, useAppSelector } from '../../store/index.js';
import { toggleNotificationPanel, toggleProfilePanel, toggleMobileMenu } from '../../store/slices/uiSlice.js';
import { useTheme } from '../../hooks/useTheme.js';
import { useAuth } from '../../hooks/useAuth.js';
import { NotificationDropdown } from '../common/NotificationDropdown.js';
import { GlobalSearch } from '../common/GlobalSearch.js';
import styles from './Header.module.css';

export const Header: React.FC = () => {
  const dispatch = useAppDispatch();
  const { toggle: toggleTheme, isDark } = useTheme();
  const { user } = useAuth();
  const profilePanelOpen = useAppSelector((state) => state.ui.profilePanelOpen);

  // Use dummy data if no user is logged in
  const displayName = user ? `${user.firstName} ${user.lastName}` : 'John Doe';
  const displayRole = user?.roleName || 'Administrator';
  const displayInitials = user ? `${user.firstName?.[0]}${user.lastName?.[0]}` : 'JD';

  const handleHeaderClick = (e: React.MouseEvent) => {
    // Close profile panel if clicking anywhere on header except profile section
    if (profilePanelOpen && !(e.target as HTMLElement).closest(`.${styles.profileSection}`)) {
      dispatch(toggleProfilePanel());
    }
  };

  return (
    <header className={styles.header} onClick={handleHeaderClick}>
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
          <GlobalSearch />
        </div>

        {/* Right Side Controls */}
        <div className={styles.controls}>
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

          {/* Notifications - Real-time Socket.io */}
          <NotificationDropdown />

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
