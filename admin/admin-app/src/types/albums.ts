export interface ProjectSummary {
  projectId: string;
  projectName: string;
  coverPhoto?: string;
  displayPic?: string;
  startDate?: string;
  createdAt?: string;
}

export interface ClientEventSummary {
  clientEventId: string;
  eventId: string;
  projectId: string;
  eventDeliveryStatusId?: string;
  fromDatetime?: string;
  createdAt?: string;
  coverImage?: string;
  albumPdfUrl?: string;
  albumPdfFileName?: string;
  albumPdfUploadedAt?: string;
  albumPdfUploadedBy?: string;
}
