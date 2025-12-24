import { useState } from 'react';
import { Breadcrumb } from '../../components/ui/index.js';
import { ProjectWizard } from './ProjectWizard';
import { ProjectsTable } from './components/ProjectsTable';
import styles from '../Page.module.css';

const Projects = () => {
  const [showWizard, setShowWizard] = useState(false);
  const [stats, setStats] = useState({ active: 0, completed: 0, revenue: 0, dueSoon: 0 });

  const handleCreateProject = (projectData: any) => {
    console.log('Project data:', projectData);
    setShowWizard(false);
    // TODO: Call API to create project
  };

  if (showWizard) {
    return (
      <ProjectWizard
        onBack={() => setShowWizard(false)}
        onSubmit={handleCreateProject}
      />
    );
  }

  return (
    <div className={styles.pageContainer}>
      <Breadcrumb />
      
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: '24px',
        marginBottom: '24px'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '16px',
          flex: '1',
          maxWidth: 'calc(100% - 180px)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '16px',
            background: 'var(--bg-primary)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              flexShrink: 0
            }}>
              <svg fill="none" viewBox="0 0 24 24" stroke="white" style={{ width: '20px', height: '20px', strokeWidth: 2 }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>Active Projects</p>
              <p style={{ margin: 0, fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1, marginTop: '4px' }}>{stats.active}</p>
            </div>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '16px',
            background: 'var(--bg-primary)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
              flexShrink: 0
            }}>
              <svg fill="none" viewBox="0 0 24 24" stroke="white" style={{ width: '20px', height: '20px', strokeWidth: 2 }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>Completed</p>
              <p style={{ margin: 0, fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1, marginTop: '4px' }}>{stats.completed}</p>
            </div>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '16px',
            background: 'var(--bg-primary)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              flexShrink: 0
            }}>
              <svg fill="none" viewBox="0 0 24 24" stroke="white" style={{ width: '20px', height: '20px', strokeWidth: 2 }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>Total Revenue</p>
              <p style={{ margin: 0, fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1, marginTop: '4px' }}>₹{stats.revenue.toLocaleString()}</p>
            </div>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '16px',
            background: 'var(--bg-primary)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              flexShrink: 0
            }}>
              <svg fill="none" viewBox="0 0 24 24" stroke="white" style={{ width: '20px', height: '20px', strokeWidth: 2 }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>Due Soon</p>
              <p style={{ margin: 0, fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1, marginTop: '4px' }}>{stats.dueSoon}</p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setShowWizard(true)}
          style={{
            padding: '10px 16px',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.2s ease',
            boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
            whiteSpace: 'nowrap'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span style={{ display: 'inline-block' }}>New Project</span>
        </button>
      </div>

      <ProjectsTable onStatsUpdate={setStats} />
    </div>
  );
};

export default Projects;
