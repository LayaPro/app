import { useState, useEffect } from 'react';
import { Breadcrumb } from '../../components/ui/index.js';
import { ProjectWizard } from './ProjectWizard';
import { ProjectsTable } from './components/ProjectsTable';
import { useAppSelector, useAppDispatch } from '../../store/index.js';
import { clearEditingProject } from '../../store/slices/projectSlice.js';
import { formatIndianAmount } from '../../utils/formatAmount';
import styles from '../Page.module.css';

const Projects = () => {
  const [showWizard, setShowWizard] = useState(false);
  const [stats, setStats] = useState({ active: 0, completed: 0, revenue: 0, dueSoon: 0 });
  const dispatch = useAppDispatch();
  const { isEditing, editingProject } = useAppSelector((state) => state.project);

  // Open wizard when editing is triggered
  useEffect(() => {
    console.log('isEditing changed:', isEditing);
    if (isEditing) {
      setShowWizard(true);
    }
  }, [isEditing]);

  const handleCreateProject = (projectData: any) => {
    console.log('Project data:', projectData);
    console.log('Is editing:', isEditing, 'Project ID:', editingProject?.projectId);
    
    if (isEditing && editingProject?.projectId) {
      console.log('Updating existing project:', editingProject.projectId);
      // TODO: Call API to update project
    } else {
      console.log('Creating new project');
      // TODO: Call API to create project
    }
    
    setShowWizard(false);
    dispatch(clearEditingProject());
  };

  const handleBack = () => {
    setShowWizard(false);
    dispatch(clearEditingProject());
  };

  if (showWizard) {
    return (
      <ProjectWizard
        onBack={handleBack}
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
        marginBottom: '24px',
        flexWrap: 'wrap'
      }}>
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
              background: 'rgba(99, 102, 241, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: 'clamp(18px, 4vw, 22px)', height: 'clamp(18px, 4vw, 22px)', strokeWidth: 2, color: '#6366f1' }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 'clamp(9px, 2vw, 12px)', color: 'var(--text-secondary)', fontWeight: 500 }}>Active Projects</p>
              <p style={{ margin: 0, fontSize: 'clamp(16px, 4vw, 24px)', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1, marginTop: '4px' }}>{stats.active}</p>
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
              <p style={{ margin: 0, fontSize: 'clamp(9px, 2vw, 12px)', color: 'var(--text-secondary)', fontWeight: 500 }}>Completed</p>
              <p style={{ margin: 0, fontSize: 'clamp(16px, 4vw, 24px)', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1, marginTop: '4px' }}>{stats.completed}</p>
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
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 'clamp(9px, 2vw, 12px)', color: 'var(--text-secondary)', fontWeight: 500 }}>Total Revenue</p>
              <p style={{ margin: 0, fontSize: 'clamp(16px, 4vw, 24px)', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1, marginTop: '4px' }}>₹{formatIndianAmount(stats.revenue)}</p>
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
              background: 'rgba(239, 68, 68, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: 'clamp(18px, 4vw, 22px)', height: 'clamp(18px, 4vw, 22px)', strokeWidth: 2, color: '#ef4444' }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 'clamp(9px, 2vw, 12px)', color: 'var(--text-secondary)', fontWeight: 500 }}>Due Soon</p>
              <p style={{ margin: 0, fontSize: 'clamp(16px, 4vw, 24px)', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1, marginTop: '4px' }}>{stats.dueSoon}</p>
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
