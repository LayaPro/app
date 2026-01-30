import { useState, useEffect } from 'react';
import { proposalApi } from '../../../services/api';

interface ProposalStatsProps {
  refreshTrigger?: number;
}

export const ProposalStats: React.FC<ProposalStatsProps> = ({ refreshTrigger }) => {
  const [stats, setStats] = useState({
    total: 0,
    draft: 0,
    sent: 0,
    accepted: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, [refreshTrigger]);

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
      };

      setStats(calculated);
    } catch (error) {
      console.error('Error fetching proposal stats:', error);
    } finally {
      setIsLoading(false);
    }
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
        {[...Array(4)].map((_, i) => (
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
        <div style={{
          width: 'clamp(36px, 8vw, 44px)',
          height: 'clamp(36px, 8vw, 44px)',
          borderRadius: '12px',
          background: 'rgba(107, 114, 128, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}>
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: 'clamp(18px, 4vw, 22px)', height: 'clamp(18px, 4vw, 22px)', strokeWidth: 2, color: '#6b7280' }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </div>
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
        <div style={{
          width: 'clamp(36px, 8vw, 44px)',
          height: 'clamp(36px, 8vw, 44px)',
          borderRadius: '12px',
          background: 'rgba(59, 130, 246, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}>
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: 'clamp(18px, 4vw, 22px)', height: 'clamp(18px, 4vw, 22px)', strokeWidth: 2, color: '#3b82f6' }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </div>
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
        <div style={{
          width: 'clamp(36px, 8vw, 44px)',
          height: 'clamp(36px, 8vw, 44px)',
          borderRadius: '12px',
          background: 'rgba(16, 185, 129, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}>
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: 'clamp(18px, 4vw, 22px)', height: 'clamp(18px, 4vw, 22px)', strokeWidth: 2, color: '#10b981' }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
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
        <div style={{
          width: 'clamp(36px, 8vw, 44px)',
          height: 'clamp(36px, 8vw, 44px)',
          borderRadius: '12px',
          background: 'rgba(139, 92, 246, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}>
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: 'clamp(18px, 4vw, 22px)', height: 'clamp(18px, 4vw, 22px)', strokeWidth: 2, color: '#8b5cf6' }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <div>
          <p style={{ margin: 0, fontSize: 'clamp(9px, 2vw, 12px)', color: 'var(--text-secondary)', fontWeight: 500 }}>Total Proposals</p>
          <p style={{ margin: 0, fontSize: 'clamp(16px, 4vw, 24px)', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1, marginTop: '4px' }}>{stats.total}</p>
        </div>
      </div>
    </div>
  );
};
