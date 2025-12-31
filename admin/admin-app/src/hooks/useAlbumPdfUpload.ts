import { useCallback, useState } from 'react';
import { clientEventApi, albumPdfApi } from '../services/api';
import { useToast } from '../context/ToastContext';

interface UseAlbumPdfUploadConfig {
  onUploadSuccess?: (albumPdf: any) => void;
  onExistingFound?: (existingPdf: any, eventIds: string[]) => Promise<boolean>;
}

interface UploadAlbumPdfArgs {
  projectId: string;
  eventIds: string[];
  file: File;
  successMessage?: string;
  skipCheck?: boolean;
}

interface UploadAlbumPdfBatchArgs {
  projectId: string;
  mappings: Array<{ eventIds: string[]; file: File }>;
  successMessage?: string;
}

export const useAlbumPdfUpload = ({
  onUploadSuccess,
  onExistingFound,
}: UseAlbumPdfUploadConfig) => {
  const { showToast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  const uploadAlbumPdf = useCallback(
    async ({ projectId, eventIds, file, successMessage, skipCheck = false }: UploadAlbumPdfArgs) => {
      if (!projectId) {
        const message = 'Project is missing for this upload.';
        showToast('error', message);
        throw new Error(message);
      }

      if (!eventIds.length) {
        const message = 'Select at least one event to continue.';
        showToast('error', message);
        throw new Error(message);
      }

      // Check for existing PDFs in this project (only on first upload)
      if (!skipCheck && onExistingFound) {
        setIsChecking(true);
        try {
          const checkResponse = await albumPdfApi.checkExisting(projectId);

          if (checkResponse.exists && checkResponse.count > 0) {
            const shouldContinue = await onExistingFound(checkResponse, eventIds);
            if (!shouldContinue) {
              setIsChecking(false);
              throw new Error('Upload cancelled');
            }
          }
        } catch (error: any) {
          setIsChecking(false);
          if (error.message === 'Upload cancelled') {
            throw error;
          }
          // Continue with upload if check fails
          console.warn('Failed to check for existing PDF:', error);
        }
        setIsChecking(false);
      }

      setIsUploading(true);
      try {
        const formData = new FormData();
        formData.append('projectId', projectId);
        if (eventIds.length === 1) {
          formData.append('clientEventId', eventIds[0]);
        } else {
          formData.append('clientEventIds', JSON.stringify(eventIds));
        }
        formData.append('albumPdf', file);

        const response = await clientEventApi.uploadAlbumPdf(formData);
        const albumPdf = response.albumPdf;
        const replaced = response.replaced;

        if (!albumPdf) {
          throw new Error('Upload completed but no album PDF was created.');
        }

        // Call the success callback if provided
        if (onUploadSuccess) {
          onUploadSuccess(albumPdf);
        }

        const fallbackMessage = replaced 
          ? `Album PDF replaced for ${eventIds.length} event${eventIds.length === 1 ? '' : 's'}.`
          : `Album PDF applied to ${eventIds.length} event${eventIds.length === 1 ? '' : 's'}.`;
        showToast('success', successMessage || fallbackMessage);
        return albumPdf;
      } catch (error: any) {
        const message =
          error?.message || error?.response?.data?.message || 'Failed to upload album PDF. Please try again.';
        showToast('error', message);
        throw new Error(message);
      } finally {
        setIsUploading(false);
      }
    },
    [showToast, onUploadSuccess, onExistingFound]
  );

  const uploadAlbumPdfBatch = useCallback(
    async ({ projectId, mappings, successMessage }: UploadAlbumPdfBatchArgs) => {
      if (!projectId) {
        const message = 'Project is missing for this upload.';
        showToast('error', message);
        throw new Error(message);
      }

      if (!mappings || mappings.length === 0) {
        const message = 'No PDFs to upload.';
        showToast('error', message);
        throw new Error(message);
      }

      // Check for existing PDFs in this project
      if (onExistingFound) {
        setIsChecking(true);
        try {
          const checkResponse = await albumPdfApi.checkExisting(projectId);

          if (checkResponse.exists && checkResponse.count > 0) {
            const allEventIds = mappings.flatMap(m => m.eventIds);
            const shouldContinue = await onExistingFound(checkResponse, allEventIds);
            if (!shouldContinue) {
              setIsChecking(false);
              throw new Error('Upload cancelled');
            }
          }
        } catch (error: any) {
          setIsChecking(false);
          if (error.message === 'Upload cancelled') {
            throw error;
          }
          // Continue with upload if check fails
          console.warn('Failed to check for existing PDF:', error);
        }
        setIsChecking(false);
      }

      setIsUploading(true);
      try {
        const formData = new FormData();
        formData.append('projectId', projectId);
        
        // Add all files
        mappings.forEach((mapping) => {
          formData.append('albumPdfs', mapping.file);
        });

        // Add mappings metadata (eventIds for each file)
        const mappingsData = mappings.map(m => ({ eventIds: m.eventIds }));
        formData.append('mappings', JSON.stringify(mappingsData));

        const response = await clientEventApi.uploadAlbumPdfBatch(formData);
        const albumPdfs = response.albumPdfs || [];
        const deletedCount = response.deletedCount || 0;

        if (albumPdfs.length === 0) {
          throw new Error('Upload completed but no album PDFs were created.');
        }

        // Call the success callback for each PDF
        if (onUploadSuccess) {
          albumPdfs.forEach((albumPdf: any) => {
            onUploadSuccess(albumPdf);
          });
        }

        const message = successMessage || `Successfully uploaded ${albumPdfs.length} PDF${albumPdfs.length > 1 ? 's' : ''}${deletedCount > 0 ? ` (replaced ${deletedCount} existing)` : ''}`;
        showToast('success', message);
        return albumPdfs;
      } catch (error: any) {
        const message =
          error?.message || error?.response?.data?.message || 'Failed to upload album PDFs. Please try again.';
        showToast('error', message);
        throw new Error(message);
      } finally {
        setIsUploading(false);
      }
    },
    [showToast, onUploadSuccess, onExistingFound]
  );

  return { isUploading, isChecking, uploadAlbumPdf, uploadAlbumPdfBatch };
};
