import { useState } from 'react';
import { proposalApi, projectApi } from '../../../services/api';
import styles from './VisitClientGalleryButton.module.css';

interface VisitClientGalleryButtonProps {
  projectId: string;
  onError: (message: string) => void;
}

export const VisitClientGalleryButton = ({ projectId, onError }: VisitClientGalleryButtonProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleVisitClientGallery = async () => {
    if (isLoading) return;
    
    try {
      setIsLoading(true);

      // Fetch full project details to get proposalId
      const projectResponse = await projectApi.getById(projectId);
      const project = projectResponse.project;

      if (!project?.proposalId) {
        onError('This project was not created from a proposal');
        return;
      }

      // Fetch proposal details to get access code
      const proposalData = await proposalApi.getById(project.proposalId);
      const accessCode = proposalData?.proposal?.accessCode;

      if (!accessCode) {
        onError('No portal access code found');
        return;
      }

      const customerAppUrl = import.meta.env.VITE_CUSTOMER_APP_URL || 'http://localhost:5174';
      const portalUrl = `${customerAppUrl}/${accessCode}`;
      window.open(portalUrl, '_blank');
    } catch (error) {
      console.error('Error opening customer gallery:', error);
      onError('Failed to open customer gallery');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      className={styles.visitPortalButton}
      onClick={handleVisitClientGallery}
      disabled={isLoading}
    >
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
      </svg>
      <span>{isLoading ? 'Loading...' : 'Visit Client Gallery'}</span>
    </button>
  );
};
