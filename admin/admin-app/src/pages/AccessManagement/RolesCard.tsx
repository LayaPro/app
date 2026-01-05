import { DataTable } from '../../components/ui/DataTable.js';
import type { Column } from '../../components/ui/DataTable.js';
import styles from './AccessCard.module.css';

interface RolesCardProps {
  roles: any[];
  loading: boolean;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
  onRefresh: () => void;
}

export const RolesCard: React.FC<RolesCardProps> = ({
  roles,
  loading,
}) => {
  const rolesColumns: Column<any>[] = [
    {
      key: 'name',
      header: 'Role Name',
      sortable: true,
      render: (row) => row.name || row.roleName,
    },
    {
      key: 'description',
      header: 'Description',
      sortable: true,
      render: (row) => row.description || row.roleDescription || '-',
    },
  ];

  return (
    <div className={styles.contentWrapper}>
      <div className={styles.infoText}>
        <svg className={styles.infoIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>Predefined roles and permission levels to control user access across the system. Assign specific capabilities to each role.</span>
      </div>
      
      <DataTable
        columns={rolesColumns}
        data={roles}
        itemsPerPage={10}
        emptyMessage={loading ? "Loading..." : "No roles found"}
      />
    </div>
  );
};
