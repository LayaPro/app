import type { Project, ClientEvent } from '../types.ts';
import styles from '../Albums.module.css';

interface ProjectsViewProps {
  projects: Project[];
  onProjectClick: (project: Project) => void;
  getFirstEventForProject: (projectId: string) => ClientEvent | undefined;
  getProjectImageCount: (projectId: string) => number;
  eventTypes: Map<string, any>;
  getTimeAgo: (date?: string) => string;
}

export const ProjectsView: React.FC<ProjectsViewProps> = ({
  projects,
  onProjectClick,
  getFirstEventForProject,
  getProjectImageCount,
  eventTypes,
  getTimeAgo
}) => {
  if (projects.length === 0) {
    return (
      <div className={styles.emptyState}>
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
          />
        </svg>
        <h3>No projects found</h3>
        <p>Create your first project to get started</p>
      </div>
    );
  }

  return (
    <div className={styles.projectsGrid}>
      {projects.map((project) => (
        <div
          key={project.projectId}
          className={styles.card}
          onClick={() => onProjectClick(project)}
          style={{ cursor: 'pointer' }}
        >
          <div className={styles.cardImage}>
            <img
              src={project.desktopCoverUrl || project.coverPhoto || project.displayPic || 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=500&h=400&fit=crop'}
              alt={project.projectName}
            />
          </div>

          <div className={styles.cardContent}>
            <h3 className={styles.cardTitle}>{project.projectName}</h3>
            <div className={styles.cardSubtitle}>
              {(() => {
                const firstEvent = getFirstEventForProject(project.projectId);
                if (firstEvent && firstEvent.fromDatetime) {
                  const eventName = eventTypes.get(firstEvent.eventId)?.eventDesc || 'Event';
                  const formattedDate = new Date(firstEvent.fromDatetime).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  });
                  return `${eventName} • ${formattedDate}`;
                }
                return 'No events';
              })()}
            </div>

            <div className={styles.cardStats}>
              {(() => {
                const photoCount = getProjectImageCount(project.projectId);
                return (
                  <div className={styles.statItem}>
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <span>{photoCount === 0 ? 'No photos' : `${photoCount} ${photoCount === 1 ? 'photo' : 'photos'}`}</span>
                  </div>
                );
              })()}
              <div className={styles.timeAgo}>
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>{getTimeAgo(project.createdAt)}</span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
