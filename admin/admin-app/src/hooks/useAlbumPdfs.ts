import { useState, useEffect } from 'react';
import { albumPdfApi } from '../services/api';

interface AlbumPdf {
  albumId: string;
  tenantId: string;
  projectId: string;
  albumStatus: 'uploaded' | 'approved';
  eventIds: string[];
  albumPdfUrl: string;
  albumPdfFileName: string;
  uploadedDate: Date;
  uploadedBy: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export const useAlbumPdfsByEvent = (eventId: string | null) => {
  const [albumPdfs, setAlbumPdfs] = useState<AlbumPdf[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!eventId) {
      setAlbumPdfs([]);
      return;
    }

    const fetchAlbumPdfs = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await albumPdfApi.getByEventId(eventId);
        setAlbumPdfs(response.albumPdfs || []);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch album PDFs');
        setAlbumPdfs([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAlbumPdfs();
  }, [eventId]);

  const refetch = async () => {
    if (!eventId) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const response = await albumPdfApi.getByEventId(eventId);
      setAlbumPdfs(response.albumPdfs || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch album PDFs');
      setAlbumPdfs([]);
    } finally {
      setIsLoading(false);
    }
  };

  return { albumPdfs, isLoading, error, refetch };
};

export const useAlbumPdfsByProject = (projectId: string | null) => {
  const [albumPdfs, setAlbumPdfs] = useState<AlbumPdf[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId) {
      setAlbumPdfs([]);
      return;
    }

    const fetchAlbumPdfs = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await albumPdfApi.getByProject(projectId);
        setAlbumPdfs(response.albumPdfs || []);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch album PDFs');
        setAlbumPdfs([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAlbumPdfs();
  }, [projectId]);

  const refetch = async () => {
    if (!projectId) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const response = await albumPdfApi.getByProject(projectId);
      setAlbumPdfs(response.albumPdfs || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch album PDFs');
      setAlbumPdfs([]);
    } finally {
      setIsLoading(false);
    }
  };

  return { albumPdfs, isLoading, error, refetch };
};
