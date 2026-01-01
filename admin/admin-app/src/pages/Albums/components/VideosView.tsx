import { useState, useEffect } from 'react';
import { Input } from '../../../components/ui/Input';
import { ConfirmationModal } from '../../../components/ui/ConfirmationModal';
import { useToast } from '../../../context/ToastContext';
import { VideoPlayerModal } from './VideoPlayerModal';
import styles from './VideosView.module.css';

interface VideosViewProps {
  project: any;
  onUpdate?: () => void;
}

const extractYouTubeId = (url: string): string | null => {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
    /youtube\.com\/embed\/([^&\n?#]+)/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
};

export const VideosView = ({ project, onUpdate }: VideosViewProps) => {
  const { showToast } = useToast();
  const [videoUrls, setVideoUrls] = useState<string[]>(project.videoUrls || []);
  const [newVideoUrl, setNewVideoUrl] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const [selectedVideoUrl, setSelectedVideoUrl] = useState<string>('');
  const [videoTitles, setVideoTitles] = useState<Map<string, string>>(new Map());
  const [deleteConfirmIndex, setDeleteConfirmIndex] = useState<number | null>(null);

  useEffect(() => {
    // Fetch video titles for all videos
    const fetchVideoTitles = async () => {
      for (const url of videoUrls) {
        const videoId = extractYouTubeId(url);
        if (videoId && !videoTitles.has(videoId)) {
          try {
            const response = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`);
            if (response.ok) {
              const data = await response.json();
              setVideoTitles(prev => new Map(prev).set(videoId, data.title));
            }
          } catch (error) {
            console.error('Error fetching video title:', error);
          }
        }
      }
    };

    if (videoUrls.length > 0) {
      fetchVideoTitles();
    }
  }, [videoUrls]);

  const handleAddVideo = async () => {
    if (!newVideoUrl.trim()) {
      showToast('error', 'Please enter a YouTube URL');
      return;
    }

    const videoId = extractYouTubeId(newVideoUrl);
    if (!videoId) {
      showToast('error', 'Invalid YouTube URL');
      return;
    }

    console.log('Adding video for project:', project);
    console.log('Project ID:', project.projectId);

    setIsAdding(true);
    try {
      const updatedUrls = [...videoUrls, newVideoUrl.trim()];
      
      setVideoUrls(updatedUrls);
      setNewVideoUrl('');
      showToast('success', 'Video added successfully');
      onUpdate?.();
    } catch (error: any) {
      console.error('Error adding video:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to add video';
      showToast('error', errorMessage);
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveVideo = async (index: number) => {
    setIsSaving(true);
    try {
      const updatedUrls = videoUrls.filter((_, i) => i !== index);
      
      setVideoUrls(updatedUrls);
      showToast('success', 'Video removed successfully');
      onUpdate?.();
    } catch (error) {
      console.error('Error removing video:', error);
      showToast('error', 'Failed to remove video');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={styles.container}>
      {/* Add Video Section */}
      <div className={styles.addSection}>
        <div className={styles.inputWrapper}>
          <Input
            type="text"
            placeholder="Paste YouTube URL (e.g., https://youtube.com/watch?v=...)"
            value={newVideoUrl}
            onChange={(e) => setNewVideoUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleAddVideo();
              }
            }}
            icon={
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            }
            style={{ flex: 1 }}
          />
        </div>
        <button
          className={styles.addButton}
          onClick={handleAddVideo}
          disabled={isAdding || !newVideoUrl.trim()}
        >
          {isAdding ? (
            <span>Adding...</span>
          ) : (
            <>
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Add Video</span>
            </>
          )}
        </button>
      </div>

      {/* Videos Grid */}
      {videoUrls.length === 0 ? (
        <div className={styles.emptyState}>
          <svg width="64" height="64" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
          <h3>No videos yet</h3>
          <p>Add YouTube video links to showcase event highlights, teasers, and more</p>
        </div>
      ) : (
        <div className={styles.videosGrid}>
          {videoUrls.map((url, index) => {
            const videoId = extractYouTubeId(url);
            return (
              <div key={index} className={styles.videoCard}>
                <div className={styles.videoThumbnail}>
                  {videoId ? (
                    <img
                      src={`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`}
                      alt={`Video ${index + 1}`}
                      className={styles.thumbnail}
                    />
                  ) : (
                    <div className={styles.invalidThumbnail}>Invalid URL</div>
                  )}
                  <button
                    className={styles.playButton}
                    onClick={() => {
                      setSelectedVideoId(videoId);
                      setSelectedVideoUrl(url);
                    }}
                    title="Play video"
                  >
                    <svg width="48" height="48" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                  </button>
                </div>
                <div className={styles.videoInfo}>
                  <h3 className={styles.videoTitle}>
                    {videoId ? (videoTitles.get(videoId) || 'Loading...') : 'Invalid Video'}
                  </h3>
                </div>
                <div className={styles.videoActions}>
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.videoLink}
                    title={url}
                  >
                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    <span className={styles.linkText}>Open in YouTube</span>
                  </a>
                  <button
                    className={styles.removeButton}
                    onClick={() => setDeleteConfirmIndex(index)}
                    title="Remove video"
                  >
                    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteConfirmIndex !== null}
        onClose={() => setDeleteConfirmIndex(null)}
        onConfirm={async () => {
          if (deleteConfirmIndex !== null) {
            await handleRemoveVideo(deleteConfirmIndex);
            setDeleteConfirmIndex(null);
          }
        }}
        title="Remove Video"
        message="Are you sure you want to remove this video? This action cannot be undone."
        confirmText="Remove"
        cancelText="Cancel"
        variant="danger"
        isLoading={isSaving}
      />

      {/* Video Player Modal */}
      {selectedVideoId && (
        <VideoPlayerModal
          isOpen={!!selectedVideoId}
          onClose={() => {
            setSelectedVideoId(null);
            setSelectedVideoUrl('');
          }}
          videoId={selectedVideoId}
          videoUrl={selectedVideoUrl}
        />
      )}
    </div>
  );
};
