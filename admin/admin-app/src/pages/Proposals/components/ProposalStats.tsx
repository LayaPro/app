import { useState, useEffect } from 'react';
import { proposalApi } from '../../../services/api';

export const ProposalStats = () => {
  const [stats, setStats] = useState({
    total: 0,
    draft: 0,
    sent: 0,
    accepted: 0,
    totalValue: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setIsLoading(true);
      const response = await proposalApi.getAll();
      const proposals = response.proposals || [];

      const calculated = {
        total: proposals.length,
        draft: proposals.filter((p: any) => p.status === 'draft').length,
        sent: proposals.filter((p: any) => p.status === 'sent').length,
        accepted: proposals.filter((p: any) => p.status === 'accepted' || p.status === 'project_created').length,
        totalValue: proposals
          .filter((p: any) => p.status === 'accepted' || p.status === 'project_created')
          .reduce((sum: number, p: any) => sum + (p.totalAmount || 0), 0),
      };

      setStats(calculated);
    } catch (error) {
      console.error('Error fetching proposal stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatAmount = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  if (isLoading) {
    return (
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '16px',
        flex: '1',
        minWidth: 'min(100%, 600px)',
        maxWidth: 'calc(100% - 180px)'
      }}>
        {[...Array(5)].map((_, i) => (
          <div key={i} style={{
            padding: 'clamp(10px, 3vw, 16px)',
            background: 'var(--bg-primary)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            height: '72px'
          }}>
            <div style={{
              width: '100%',
              height: '100%',
              background: 'linear-gradient(90deg, var(--bg-secondary) 0%, var(--bg-tertiary) 50%, var(--bg-secondary) 100%)',
              backgroundSize: '200% 100%',
              borderRadius: '8px',
              animation: 'shimmer 1.5s infinite'
            }}></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
      gap: '16px',
      flex: '1',
      minWidth: 'min(100%, 600px)',
      maxWidth: 'calc(100% - 180px)'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'clamp(8px, 2vw, 12px)',
        padding: 'clamp(10px, 3vw, 16px)',
        background: 'var(--bg-primary)',
        border: '1px solid var(--border-color)',
        borderRadius: '12px'
      }}>
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: 'clamp(28px, 7vw, 36px)', height: 'clamp(28px, 7vw, 36px)', strokeWidth: 1.5, color: '#6b7280', flexShrink: 0 }}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
        <div>
          <p style={{ margin: 0, fontSize: 'clamp(9px, 2vw, 12px)', color: 'var(--text-secondary)', fontWeight: 500 }}>Draft</p>
          <p style={{ margin: 0, fontSize: 'clamp(16px, 4vw, 24px)', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1, marginTop: '4px' }}>{stats.draft}</p>
        </div>
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'clamp(8px, 2vw, 12px)',
        padding: 'clamp(10px, 3vw, 16px)',
        background: 'var(--bg-primary)',
        border: '1px solid var(--border-color)',
        borderRadius: '12px'
      }}>
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: 'clamp(28px, 7vw, 36px)', height: 'clamp(28px, 7vw, 36px)', strokeWidth: 1.5, color: '#3b82f6', flexShrink: 0 }}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
        </svg>
        <div>
          <p style={{ margin: 0, fontSize: 'clamp(9px, 2vw, 12px)', color: 'var(--text-secondary)', fontWeight: 500 }}>Sent</p>
          <p style={{ margin: 0, fontSize: 'clamp(16px, 4vw, 24px)', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1, marginTop: '4px' }}>{stats.sent}</p>
        </div>
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'clamp(8px, 2vw, 12px)',
        padding: 'clamp(10px, 3vw, 16px)',
        background: 'var(--bg-primary)',
        border: '1px solid var(--border-color)',
        borderRadius: '12px'
      }}>
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: 'clamp(28px, 7vw, 36px)', height: 'clamp(28px, 7vw, 36px)', strokeWidth: 1.5, color: '#10b981', flexShrink: 0 }}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div>
          <p style={{ margin: 0, fontSize: 'clamp(9px, 2vw, 12px)', color: 'var(--text-secondary)', fontWeight: 500 }}>Accepted</p>
          <p style={{ margin: 0, fontSize: 'clamp(16px, 4vw, 24px)', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1, marginTop: '4px' }}>{stats.accepted}</p>
        </div>
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'clamp(8px, 2vw, 12px)',
        padding: 'clamp(10px, 3vw, 16px)',
        background: 'var(--bg-primary)',
        border: '1px solid var(--border-color)',
        borderRadius: '12px'
      }}>
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: 'clamp(28px, 7vw, 36px)', height: 'clamp(28px, 7vw, 36px)', strokeWidth: 1.5, color: '#8b5cf6', flexShrink: 0 }}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <div>
          <p style={{ margin: 0, fontSize: 'clamp(9px, 2vw, 12px)', color: 'var(--text-secondary)', fontWeight: 500 }}>Total Proposals</p>
          <p style={{ margin: 0, fontSize: 'clamp(16px, 4vw, 24px)', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1, marginTop: '4px' }}>{stats.total}</p>
        </div>
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'clamp(8px, 2vw, 12px)',
        padding: 'clamp(10px, 3vw, 16px)',
        background: 'var(--bg-primary)',
        border: '1px solid var(--border-color)',
        borderRadius: '12px'
      }}>
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: 'clamp(28px, 7vw, 36px)', height: 'clamp(28px, 7vw, 36px)', strokeWidth: 1.5, color: '#f59e0b', flexShrink: 0 }}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div>
          <p style={{ margin: 0, fontSize: 'clamp(9px, 2vw, 12px)', color: 'var(--text-secondary)', fontWeight: 500 }}>Total Value</p>
          <p style={{ margin: 0, fontSize: 'clamp(16px, 4vw, 24px)', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1, marginTop: '4px' }}>{formatAmount(stats.totalValue)}</p>
        </div>
      </div>
    </div>
  );
};
