import { useState, useEffect } from 'react';
import styles from './AccessManagement.module.css';
import { Breadcrumb } from '../../components/ui/index.js';
import { UsersCard } from './UsersCard.js';
import { RolesCard } from './RolesCard.js';
import { userApi, roleApi } from '../../services/api';
import { useToast } from '../../context/ToastContext';

const AccessManagement = () => {
  const [expandedCard, setExpandedCard] = useState<string | null>('users');
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

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

  const toggleCard = (cardId: string) => {
    setExpandedCard(expandedCard === cardId ? null : cardId);
  };

  const handleSuccess = (message: string) => {
    showToast('success', message);
  };

  const handleError = (message: string) => {
    showToast('error', message);
  };

  return (
    <div className={styles.pageContainer}>
      <Breadcrumb />

      <div className={styles.cardsContainer}>
        <UsersCard
          users={users}
          roles={roles}
          loading={loading}
          isExpanded={expandedCard === 'users'}
          onToggle={() => toggleCard('users')}
          onSuccess={handleSuccess}
          onError={handleError}
          onRefresh={fetchData}
        />

        <RolesCard
          roles={roles}
          loading={loading}
          isExpanded={expandedCard === 'roles'}
          onToggle={() => toggleCard('roles')}
          onSuccess={handleSuccess}
          onError={handleError}
          onRefresh={fetchData}
        />
      </div>
    </div>
  );
};

export default AccessManagement;
