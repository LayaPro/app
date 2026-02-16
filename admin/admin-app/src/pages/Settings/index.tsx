import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { userApi } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Button, Input, Tabs } from '../../components/ui';
import { PageHeader, HelpPanel } from '../../components/help/index.js';
import { getHelpContent } from '../../data/helpContent.js';
import type { Tab } from '../../components/ui/Tabs';
import pageStyles from '../Page.module.css';
import styles from './Settings.module.css';

const Settings = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [activeTab, setActiveTab] = useState<string>('security');
  const [showHelp, setShowHelp] = useState(false);
  const helpContent = getHelpContent('settings');

  // Set active tab from navigation state
  useEffect(() => {
    if (location.state?.activeTab) {
      setActiveTab(location.state.activeTab);
    }
  }, [location.state]);

  // Password form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [currentPasswordError, setCurrentPasswordError] = useState('');
  const [newPasswordError, setNewPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const validatePassword = (password: string): string | null => {
    if (password.length < 8) {
      return 'Password must be at least 8 characters long';
    }
    if (!/[A-Z]/.test(password)) {
      return 'Password must contain at least one uppercase letter';
    }
    if (!/[a-z]/.test(password)) {
      return 'Password must contain at least one lowercase letter';
    }
    if (!/[0-9]/.test(password)) {
      return 'Password must contain at least one number';
    }
    return null;
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPasswordError('');
    setNewPasswordError('');
    setConfirmPasswordError('');
    setSuccessMessage('');

    // Validation
    if (!currentPassword) {
      setCurrentPasswordError('Current password is required');
      return;
    }

    if (!newPassword) {
      setNewPasswordError('New password is required');
      return;
    }

    if (!confirmPassword) {
      setConfirmPasswordError('Please confirm your password');
      return;
    }

    if (newPassword !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match');
      return;
    }

    if (currentPassword === newPassword) {
      setNewPasswordError('New password must be different from current password');
      return;
    }

    const validationError = validatePassword(newPassword);
    if (validationError) {
      setNewPasswordError(validationError);
      return;
    }

    try {
      setLoading(true);
      await userApi.updatePassword({
        currentPassword,
        newPassword,
      });

      setSuccessMessage('Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      showToast('success', 'Password updated successfully');
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to update password';
      setCurrentPasswordError(errorMessage);
      showToast('error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getInitials = () => {
    if (!user) return 'U';
    return `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase();
  };

  const PasswordToggleIcon = ({ show, onClick }: { show: boolean; onClick: () => void }) => (
    <button
      type="button"
      onClick={onClick}
      style={{
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: '0.25rem',
        display: 'flex',
        alignItems: 'center',
        color: 'var(--text-secondary)',
      }}
    >
      <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        {show ? (
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
        ) : (
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        )}
      </svg>
    </button>
  );

  const tabs: Tab[] = [
    {
      id: 'profile',
      label: 'Profile',
      icon: (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      content: (
        <div className={styles.tabContent}>
          <h2 className={styles.sectionTitle}>Profile Information</h2>
          <p className={styles.sectionDescription}>
            Update your personal information and contact details
          </p>

          <div className={styles.profileInfo}>
            <div className={styles.avatar}>{getInitials()}</div>
            <div className={styles.profileDetails}>
              <h3 className={styles.profileName}>
                {user?.firstName} {user?.lastName}
              </h3>
              <p className={styles.profileEmail}>{user?.email}</p>
            </div>
          </div>

          <div className={styles.form}>
            <Input
              label="First Name"
              value={user?.firstName || ''}
              disabled
            />
            <Input
              label="Last Name"
              value={user?.lastName || ''}
              disabled
            />
            <Input
              label="Email"
              type="email"
              value={user?.email || ''}
              disabled
              info="Contact your administrator to update profile information"
            />
          </div>
        </div>
      ),
    },
    {
      id: 'security',
      label: 'Security',
      icon: (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ),
      content: (
        <div className={styles.tabContent}>
          <h2 className={styles.sectionTitle}>Change Password</h2>
          <p className={styles.sectionDescription}>
            Update your password to keep your account secure
          </p>

          {successMessage && (
            <div className={styles.successMessage}>
              <svg fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              {successMessage}
            </div>
          )}

          <form onSubmit={handleUpdatePassword} className={styles.form}>
            <Input
              label="Current Password"
              type={showCurrentPassword ? 'text' : 'password'}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              disabled={loading}
              required
              autoComplete="current-password"
              error={currentPasswordError}
              icon={<PasswordToggleIcon show={showCurrentPassword} onClick={() => setShowCurrentPassword(!showCurrentPassword)} />}
            />

            <Input
              label="New Password"
              type={showNewPassword ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={loading}
              required
              autoComplete="new-password"
              info="Must be at least 8 characters with uppercase, lowercase, and numbers"
              error={newPasswordError}
              icon={<PasswordToggleIcon show={showNewPassword} onClick={() => setShowNewPassword(!showNewPassword)} />}
            />

            <Input
              label="Confirm New Password"
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
              required
              autoComplete="new-password"
              error={confirmPasswordError}
              icon={<PasswordToggleIcon show={showConfirmPassword} onClick={() => setShowConfirmPassword(!showConfirmPassword)} />}
            />

            <Button
              type="submit"
              variant="primary"
              isLoading={loading}
              disabled={loading}
            >
              Update Password
            </Button>
          </form>
        </div>
      ),
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      ),
      content: (
        <div className={styles.tabContent}>
          <h2 className={styles.sectionTitle}>Notification Preferences</h2>
          <p className={styles.sectionDescription}>
            Manage how you receive notifications and updates
          </p>
          <p style={{ color: 'var(--text-secondary)', marginTop: '2rem' }}>
            Notification settings coming soon...
          </p>
        </div>
      ),
    },
  ];

  return (
    <div className={pageStyles.pageContainer}>
      <PageHeader onHelpClick={() => setShowHelp(true)} />
      <Tabs 
        tabs={tabs} 
        defaultActiveTab={activeTab}
        onTabChange={(tabId) => setActiveTab(tabId)}
      />
      {showHelp && helpContent && (
        <HelpPanel help={helpContent} onClose={() => setShowHelp(false)} />
      )}
    </div>
  );
};

export default Settings;
