import { useState, useEffect } from 'react';
import styles from './AccessManagement.module.css';
import { Tabs, type Tab } from '../../components/ui/index.js';
import { PageHeader, HelpPanel } from '../../components/help/index.js';
import { getHelpContent } from '../../data/helpContent.js';
import { UsersCard } from './UsersCard.js';
import { RolesCard } from './RolesCard.js';
import { userApi, roleApi } from '../../services/api';
import { useToast } from '../../context/ToastContext';

const AccessManagement = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();
  const [showHelp, setShowHelp] = useState(false);
  const helpContent = getHelpContent('access-management');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch users and roles from API
      const [usersResponse, rolesData] = await Promise.all([
        userApi.getAll(),
        roleApi.getAll()
      ]);
      
      // Backend returns { users: [...] } for users
      setUsers(usersResponse.users || []);
      // Backend returns roles array directly
      setRoles(rolesData);
    } catch (err: any) {
      showToast('error', err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = (message: string) => {
    showToast('success', message);
  };

  const handleError = (message: string) => {
    showToast('error', message);
  };

  const tabs: Tab[] = [
    {
      id: 'users',
      label: 'Users',
      icon: (
        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      badge: users.length,
      content: (
        <UsersCard
          users={users}
          roles={roles}
          loading={loading}
          onSuccess={handleSuccess}
          onError={handleError}
          onRefresh={fetchData}
        />
      ),
    },
    {
      id: 'roles',
      label: 'Roles',
      icon: (
        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
        </svg>
      ),
      badge: roles.length,
      content: (
        <RolesCard
          roles={roles}
          loading={loading}
          onSuccess={handleSuccess}
          onError={handleError}
          onRefresh={fetchData}
        />
      ),
    },
  ];

  return (
    <div className={styles.pageContainer}>
      <PageHeader onHelpClick={() => setShowHelp(true)} />
      <Tabs tabs={tabs} />
      {showHelp && helpContent && (
        <HelpPanel help={helpContent} onClose={() => setShowHelp(false)} />
      )}
    </div>
  );
};

export default AccessManagement;
