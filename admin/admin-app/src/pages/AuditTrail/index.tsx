import { useState, useEffect } from 'react';
import { DataTable } from '../../components/ui';
import { PageHeader, HelpPanel } from '../../components/help/index.js';
import { getHelpContent } from '../../data/helpContent.js';
import type { Column } from '../../components/ui/DataTable';
import { auditApi } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import pageStyles from '../Page.module.css';
import styles from './AuditTrail.module.css';

interface AuditLog {
  id: number;
  userId: number;
  userName: string;
  action: string;
  entityType: string;
  entityId: number | null;
  description: string;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
}

const AuditTrail = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();
  const [showHelp, setShowHelp] = useState(false);
  const helpContent = getHelpContent('audit-trail');

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      const response = await auditApi.getAll({
        page: 1,
        limit: 1000, // Fetch a large batch for client-side pagination
      });
      setLogs(response.logs || []);
    } catch (error: any) {
      console.error('Error fetching audit logs:', error);
      showToast('error', 'Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const getActionBadge = (action: string) => {
    const actionColors: Record<string, string> = {
      CREATE: '#10b981',
      UPDATE: '#3b82f6',
      DELETE: '#ef4444',
      LOGIN: '#8b5cf6',
      LOGOUT: '#6b7280',
      VIEW: '#06b6d4',
    };

    const color = actionColors[action.toUpperCase()] || '#6b7280';

    return (
      <span
        style={{
          display: 'inline-block',
          padding: '0.25rem 0.75rem',
          borderRadius: '9999px',
          fontSize: '0.75rem',
          fontWeight: '600',
          backgroundColor: `${color}20`,
          color: color,
        }}
      >
        {action}
      </span>
    );
  };

  const columns: Column<AuditLog>[] = [
    {
      key: 'createdAt',
      header: 'Timestamp',
      render: (log) => (
        <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          {formatDate(log.createdAt)}
        </span>
      ),
    },
    {
      key: 'userName',
      header: 'User',
      render: (log) => (
        <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>
          {log.userName}
        </span>
      ),
    },
    {
      key: 'action',
      header: 'Action',
      render: (log) => getActionBadge(log.action),
    },
    {
      key: 'entityType',
      header: 'Entity',
      render: (log) => (
        <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          {log.entityType || '-'}
        </span>
      ),
    },
    {
      key: 'description',
      header: 'Description',
      render: (log) => (
        <span style={{ fontSize: '0.875rem' }}>
          {log.description}
        </span>
      ),
    },
    {
      key: 'ipAddress',
      header: 'IP Address',
      render: (log) => (
        <span
          style={{
            fontSize: '0.8125rem',
            fontFamily: 'monospace',
            color: 'var(--text-tertiary)',
          }}
        >
          {log.ipAddress || '-'}
        </span>
      ),
    },
  ];

  return (
    <div className={pageStyles.pageContainer}>
      <PageHeader onHelpClick={() => setShowHelp(true)} />

      <div className={styles.tableCard}>
        <DataTable
          columns={columns}
          data={logs}
          itemsPerPage={20}
          emptyMessage="No activity logs found"
        />
      </div>
      {showHelp && helpContent && (
        <HelpPanel help={helpContent} onClose={() => setShowHelp(false)} />
      )}
    </div>
  );
};

export default AuditTrail;
