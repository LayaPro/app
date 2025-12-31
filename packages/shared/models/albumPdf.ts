export interface AlbumPdf {
  albumId: string;
  tenantId: string;
  projectId: string;
  albumStatus: 'uploaded' | 'approved';
  eventIds: string[];
  isMultipleEvents: boolean;
  albumPdfUrl: string;
  albumPdfFileName: string;
  uploadedDate: Date;
  uploadedBy: string;
  createdAt?: Date;
  updatedAt?: Date;
}
