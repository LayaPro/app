import { useCallback, useState, type Dispatch, type SetStateAction } from 'react';
import type { ClientEventSummary as ClientEvent } from '../types/albums.js';
import { clientEventApi } from '../services/api';
import { useToast } from '../context/ToastContext';

interface UseAlbumPdfUploadConfig {
  setEvents: Dispatch<SetStateAction<ClientEvent[]>>;
  setAllEvents: Dispatch<SetStateAction<ClientEvent[]>>;
  setSelectedEvent: Dispatch<SetStateAction<ClientEvent | null>>;
}

interface UploadAlbumPdfArgs {
  projectId: string;
  eventIds: string[];
  file: File;
  successMessage?: string;
}

const applyAlbumPdfUpdates = (
  updatedEvents: ClientEvent[],
  {
    setEvents,
    setAllEvents,
    setSelectedEvent,
  }: UseAlbumPdfUploadConfig
) => {
  if (!updatedEvents.length) return;

  const updatesMap = new Map(updatedEvents.map((evt) => [evt.clientEventId, evt]));

  setEvents((prev) =>
    prev.map((evt) => (updatesMap.has(evt.clientEventId) ? { ...evt, ...updatesMap.get(evt.clientEventId)! } : evt))
  );

  setAllEvents((prev) =>
    prev.map((evt) => (updatesMap.has(evt.clientEventId) ? { ...evt, ...updatesMap.get(evt.clientEventId)! } : evt))
  );

  setSelectedEvent((prev) => {
    if (!prev) return prev;
    const updated = updatesMap.get(prev.clientEventId);
    return updated ? { ...prev, ...updated } : prev;
  });
};

export const useAlbumPdfUpload = ({
  setEvents,
  setAllEvents,
  setSelectedEvent,
}: UseAlbumPdfUploadConfig) => {
  const { showToast } = useToast();
  const [isUploading, setIsUploading] = useState(false);

  const uploadAlbumPdf = useCallback(
    async ({ projectId, eventIds, file, successMessage }: UploadAlbumPdfArgs) => {
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
        const updatedEventsList: ClientEvent[] =
          response.clientEvents || (response.clientEvent ? [response.clientEvent] : []);

        if (!updatedEventsList.length) {
          throw new Error('Upload completed but no events were updated.');
        }

        applyAlbumPdfUpdates(updatedEventsList, {
          setEvents,
          setAllEvents,
          setSelectedEvent,
        });

        const fallbackMessage = `Album PDF applied to ${updatedEventsList.length} event${
          updatedEventsList.length === 1 ? '' : 's'
        }.`;
        showToast('success', successMessage || fallbackMessage);
        return updatedEventsList;
      } catch (error: any) {
        const message =
          error?.message || error?.response?.data?.message || 'Failed to upload album PDF. Please try again.';
        showToast('error', message);
        throw new Error(message);
      } finally {
        setIsUploading(false);
      }
    },
    [setEvents, setAllEvents, setSelectedEvent, showToast]
  );

  return { isUploading, uploadAlbumPdf };
};
