export interface ProjectSummary {
  projectId: string;
  projectName: string;
  coverPhoto?: string;
  displayPic?: string;
  mobileCoverUrl?: string;
  tabletCoverUrl?: string;
  desktopCoverUrl?: string;
  coverImage?: {
    imageId: string;
    url: string;
    focalPoint: {
      x: number;
      y: number;
    };
  };
  startDate?: string;
  createdAt?: string;
  videoUrls?: string[];
}

export interface ClientEventSummary {
  clientEventId: string;
  eventId: string;
  projectId: string;
  eventDeliveryStatusId?: string;
  fromDatetime?: string;
  createdAt?: string;
  coverImage?: string;
}
