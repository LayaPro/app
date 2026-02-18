import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ProjectWizard } from './ProjectWizard';
import { ProjectsTable } from './components/ProjectsTable';
import { ProjectStats } from './components/ProjectStats';
import { PageHeader, HelpPanel } from '../../components/help/index.js';
import { getHelpContent } from '../../data/helpContent.js';
import { useAppSelector, useAppDispatch } from '../../store/index.js';
import { clearEditingProject, setEditingProject } from '../../store/slices/projectSlice.js';
import { projectApi } from '../../services/api';
import styles from '../Page.module.css';

const Projects = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [showWizard, setShowWizard] = useState(false);
  const [stats, setStats] = useState({ active: 0, completed: 0, revenue: 0, dueSoon: 0 });
  const [showHelp, setShowHelp] = useState(false);
  const [projectIdFilter, setProjectIdFilter] = useState<string | null>(null);
  const helpContent = getHelpContent('projects');
  const dispatch = useAppDispatch();
  const { isEditing, editingProject } = useAppSelector((state) => state.project);

  // Handle project filter from URL parameter
  useEffect(() => {
    const projectId = searchParams.get('projectId');
    if (projectId) {
      setProjectIdFilter(projectId);
    }
  }, [searchParams]);

  // Handle direct project access via URL parameter
  useEffect(() => {
    if (id) {
      // Just navigate to projects page
      navigate('/projects', { replace: true });
    }
  }, [id, navigate]);

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
      <div className="print-hide">
        <PageHeader onHelpClick={() => setShowHelp(true)} />
      </div>
      
      <div className="print-hide" style={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: '24px',
        marginBottom: '24px',
        flexWrap: 'wrap'
      }}>
        <ProjectStats stats={stats} />
      </div>

      <ProjectsTable
        onStatsUpdate={setStats}
        initialProjectFilter={projectIdFilter}
        onCreateProject={() => {
          dispatch(clearEditingProject());
          setShowWizard(true);
        }}
      />
      
      {showHelp && helpContent && (
        <HelpPanel help={helpContent} onClose={() => setShowHelp(false)} />
      )}
    </div>
  );
};

export default Projects;
