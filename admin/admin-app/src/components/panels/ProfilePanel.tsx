import React from 'react';
import { useAppSelector, useAppDispatch } from '../../store/index.js';
import { toggleProfilePanel } from '../../store/slices/uiSlice.js';
import { logout } from '../../store/slices/authSlice.js';
import { useAuth } from '../../hooks/useAuth.js';
import styles from './ProfilePanel.module.css';

export const ProfilePanel: React.FC = () => {
  const dispatch = useAppDispatch();
  const isOpen = useAppSelector((state) => state.ui.profilePanelOpen);
  const { user } = useAuth();

  const displayName = user ? `${user.firstName} ${user.lastName}` : 'John Doe';
  const displayRole = user?.roleName || 'Administrator';
  const displayEmail = user?.email || 'john.doe@company.com';
  const displayInitials = user ? `${user.firstName?.[0]}${user.lastName?.[0]}` : 'JD';

  const handleLogout = () => {
    dispatch(logout());
    dispatch(toggleProfilePanel());
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={styles.backdrop}
        onClick={() => dispatch(toggleProfilePanel())}
      />
      
      {/* Panel */}
      <div className={styles.panel}>
        <div className={styles.header}>
          <div className={styles.profileInfo}>
            <div className={styles.avatar}>{displayInitials}</div>
            <div>
              <h3 className={styles.name}>{displayName}</h3>
              <p className={styles.role}>{displayRole}</p>
              <p className={styles.email}>{displayEmail}</p>
            </div>
          </div>
        </div>

        <div className={styles.menu}>
          <a href="#" className={styles.menuItem}>
            <svg className={styles.menuIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span>My Profile</span>
          </a>
          
          <a href="#" className={styles.menuItem}>
            <svg className={styles.menuIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>Account Settings</span>
          </a>
          
          <a href="#" className={styles.menuItem}>
            <svg className={styles.menuIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
            <span>Change Password</span>
          </a>
          
          <a href="#" className={styles.menuItem}>
            <svg className={styles.menuIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span>Privacy Settings</span>
          </a>
          
          <a href="#" className={styles.menuItem}>
            <svg className={styles.menuIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>Activity Log</span>
          </a>
          
          <a href="#" className={styles.menuItem}>
            <svg className={styles.menuIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <span>Help & Support</span>
          </a>
        </div>

        <div className={styles.footer}>
          <button onClick={handleLogout} className={styles.logoutBtn}>
            <svg className={styles.logoutIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className={styles.logoutText}>Logout</span>
          </button>
        </div>
      </div>
    </>
  );
};
