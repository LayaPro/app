export interface Project {
  projectId: string;
  projectName: string;
  coverPhoto?: string;
  displayPic?: string;
  startDate?: string;
  createdAt?: string;
  mobileCoverUrl?: string;
  tabletCoverUrl?: string;
  desktopCoverUrl?: string;
}

export interface ClientEvent {
  clientEventId: string;
  eventId: string;
  projectId: string;
  fromDatetime?: string;
  createdAt?: string;
  coverImage?: string;
  mobileCoverUrl?: string;
  tabletCoverUrl?: string;
  desktopCoverUrl?: string;
}

export interface ImageData {
  imageId: string;
  fileName: string;
  originalUrl: string;
  compressedUrl?: string;
  thumbnailUrl?: string;
  sortOrder?: number;
  uploadedAt?: string;
}
