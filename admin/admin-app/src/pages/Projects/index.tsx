import { useState } from 'react';
import { Breadcrumb } from '../../components/ui/index.js';
import { ProjectWizard } from './ProjectWizard';
import styles from '../Page.module.css';

const Projects = () => {
  const [showWizard, setShowWizard] = useState(false);

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
        justifyContent: 'flex-end',
        marginBottom: '24px'
      }}>
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

      <div style={{
        background: 'var(--color-card-bg)',
        borderRadius: '12px',
        padding: '48px',
        textAlign: 'center',
        border: '1px solid var(--color-border)'
      }}>
        <svg
          width="64"
          height="64"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          style={{ margin: '0 auto 16px', color: 'var(--color-text-secondary)' }}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--color-text-primary)', marginBottom: '8px' }}>
          No Projects Yet
        </h3>
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: '24px' }}>
          Get started by creating your first project
        </p>
        <button
          onClick={() => setShowWizard(true)}
          style={{
            padding: '10px 20px',
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer'
          }}
        >
          Create Project
        </button>
      </div>
    </div>
  );
};

export default Projects;
