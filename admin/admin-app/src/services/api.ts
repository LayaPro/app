import { API_BASE_URL } from '../utils/constants.js';

const getAuthToken = () => {
  return localStorage.getItem('token') || sessionStorage.getItem('token');
};

const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || 'Request failed');
  }
  return response.json();
};

// Event API
export const eventApi = {
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/get-all-events`, {
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
        'Content-Type': 'application/json',
      },
    });
    return handleResponse(response);
  },

  create: async (data: { eventCode: string; eventDesc: string; eventAlias?: string }) => {
    const response = await fetch(`${API_BASE_URL}/create-event`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  update: async (eventId: string, data: { eventCode?: string; eventDesc?: string; eventAlias?: string }) => {
    const response = await fetch(`${API_BASE_URL}/update-event/${eventId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  delete: async (eventId: string) => {
    const response = await fetch(`${API_BASE_URL}/delete-event/${eventId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
        'Content-Type': 'application/json',
      },
    });
    return handleResponse(response);
  },
};

// Event Delivery Status API
export const eventDeliveryStatusApi = {
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/get-all-event-delivery-statuses`, {
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
        'Content-Type': 'application/json',
      },
    });
    return handleResponse(response);
  },

  create: async (data: { statusCode: string; statusDescription: string; step: number }) => {
    const response = await fetch(`${API_BASE_URL}/create-event-delivery-status`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  update: async (statusId: string, data: { statusCode?: string; statusDescription?: string; step?: number; statusCustomerNote?: string }) => {
    const response = await fetch(`${API_BASE_URL}/update-event-delivery-status/${statusId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  delete: async (statusId: string) => {
    const response = await fetch(`${API_BASE_URL}/delete-event-delivery-status/${statusId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
        'Content-Type': 'application/json',
      },
    });
    return handleResponse(response);
  },

  bulkUpdateSteps: async (statuses: Array<{ statusId: string; step: number }>) => {
    const response = await fetch(`${API_BASE_URL}/bulk-update-event-delivery-status-steps`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ statuses }),
    });
    return handleResponse(response);
  },
};

// User API
export const userApi = {
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/get-all-users`, {
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
        'Content-Type': 'application/json',
      },
    });
    return handleResponse(response);
  },

  create: async (data: { email: string; password: string; firstName: string; lastName: string; roleId: string; isActive?: boolean }) => {
    const response = await fetch(`${API_BASE_URL}/create-user`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  update: async (userId: string, data: { email?: string; firstName?: string; lastName?: string; roleId?: string; isActive?: boolean }) => {
    const response = await fetch(`${API_BASE_URL}/update-user/${userId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  delete: async (userId: string) => {
    const response = await fetch(`${API_BASE_URL}/delete-user/${userId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
        'Content-Type': 'application/json',
      },
    });
    return handleResponse(response);
  },

  toggleActive: async (userId: string, isActive: boolean) => {
    const response = await fetch(`${API_BASE_URL}/toggle-user-active/${userId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ isActive }),
    });
    return handleResponse(response);
  },
};

// Role API
export const roleApi = {
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/get-all-roles`, {
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
        'Content-Type': 'application/json',
      },
    });
    return handleResponse(response);
  },

  create: async (data: { name: string; description?: string }) => {
    const response = await fetch(`${API_BASE_URL}/create-role`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  update: async (roleId: string, data: { name?: string; description?: string }) => {
    const response = await fetch(`${API_BASE_URL}/update-role/${roleId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  delete: async (roleId: string) => {
    const response = await fetch(`${API_BASE_URL}/delete-role/${roleId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
        'Content-Type': 'application/json',
      },
    });
    return handleResponse(response);
  },
};

// Team API
export const teamApi = {
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/get-all-team-members`, {
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
        'Content-Type': 'application/json',
      },
    });
    return handleResponse(response);
  },

  create: async (data: { firstName: string; lastName: string; email: string; phoneNumber?: string; profileId?: string; address?: string; isFreelancer?: boolean }) => {
    const response = await fetch(`${API_BASE_URL}/create-team-member`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  update: async (memberId: string, data: { firstName?: string; lastName?: string; email?: string; phoneNumber?: string; profileId?: string; address?: string; isFreelancer?: boolean }) => {
    const response = await fetch(`${API_BASE_URL}/update-team-member/${memberId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  delete: async (memberId: string) => {
    const response = await fetch(`${API_BASE_URL}/delete-team-member/${memberId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
        'Content-Type': 'application/json',
      },
    });
    return handleResponse(response);
  },
};

// Profile API (Work Profiles)
export const profileApi = {
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/get-all-profiles`, {
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
        'Content-Type': 'application/json',
      },
    });
    return handleResponse(response);
  },

  create: async (data: { name: string; description?: string }) => {
    const response = await fetch(`${API_BASE_URL}/create-profile`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  update: async (profileId: string, data: { name?: string; description?: string }) => {
    const response = await fetch(`${API_BASE_URL}/update-profile/${profileId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  delete: async (profileId: string) => {
    const response = await fetch(`${API_BASE_URL}/delete-profile/${profileId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
        'Content-Type': 'application/json',
      },
    });
    return handleResponse(response);
  },
};

export const equipmentApi = {
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/get-all-equipment`, {
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
        'Content-Type': 'application/json',
      },
    });
    return handleResponse(response);
  },

  create: async (data: any) => {
    const response = await fetch(`${API_BASE_URL}/create-equipment`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  update: async (equipmentId: string, data: any) => {
    const response = await fetch(`${API_BASE_URL}/update-equipment/${equipmentId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  delete: async (equipmentId: string) => {
    const response = await fetch(`${API_BASE_URL}/delete-equipment/${equipmentId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
        'Content-Type': 'application/json',
      },
    });
    return handleResponse(response);
  },
};

// Project API
export const projectApi = {
  create: async (data: {
    project: any;
    events: any[];
    finance?: any;
  }) => {
    const response = await fetch(`${API_BASE_URL}/projects`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/get-all-projects`, {
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
        'Content-Type': 'application/json',
      },
    });
    return handleResponse(response);
  },

  getById: async (projectId: string) => {
    const response = await fetch(`${API_BASE_URL}/get-project/${projectId}`, {
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
        'Content-Type': 'application/json',
      },
    });
    return handleResponse(response);
  },

  update: async (projectId: string, data: any) => {
    const response = await fetch(`${API_BASE_URL}/update-project/${projectId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  updateWithDetails: async (projectId: string, data: {
    project: any;
    events: any[];
    finance?: any;
  }) => {
    const response = await fetch(`${API_BASE_URL}/update-project-with-details/${projectId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  delete: async (projectId: string) => {
    const response = await fetch(`${API_BASE_URL}/delete-project/${projectId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
        'Content-Type': 'application/json',
      },
    });
    return handleResponse(response);
  },
};

// Project Finance API
export const projectFinanceApi = {
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/get-all-project-finances`, {
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
        'Content-Type': 'application/json',
      },
    });
    return handleResponse(response);
  },

  getByProjectId: async (projectId: string) => {
    const response = await fetch(`${API_BASE_URL}/get-project-finance-by-project/${projectId}`, {
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
        'Content-Type': 'application/json',
      },
    });
    return handleResponse(response);
  },

  update: async (projectId: string, data: any) => {
    const response = await fetch(`${API_BASE_URL}/update-project-finance/${projectId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  addTransaction: async (projectId: string, transaction: any) => {
    const response = await fetch(`${API_BASE_URL}/add-project-finance-transaction/${projectId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(transaction),
    });
    return handleResponse(response);
  },
};

// Team Finance API
export const teamFinanceApi = {
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/get-all-team-finances`, {
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
        'Content-Type': 'application/json',
      },
    });
    return handleResponse(response);
  },

  getByMemberId: async (memberId: string) => {
    const response = await fetch(`${API_BASE_URL}/get-team-finance-by-member/${memberId}`, {
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
        'Content-Type': 'application/json',
      },
    });
    return handleResponse(response);
  },

  create: async (data: any) => {
    const response = await fetch(`${API_BASE_URL}/create-team-finance`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  update: async (financeId: string, data: any) => {
    const response = await fetch(`${API_BASE_URL}/update-team-finance/${financeId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  addTransaction: async (memberId: string, transaction: any) => {
    const response = await fetch(`${API_BASE_URL}/add-team-salary-transaction/${memberId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(transaction),
    });
    return handleResponse(response);
  },
};

// Finance Stats API
export const financeStatsApi = {
  getStats: async () => {
    const response = await fetch(`${API_BASE_URL}/finance-stats`, {
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
        'Content-Type': 'application/json',
      },
    });
    return handleResponse(response);
  },
};

export const dashboardStatsApi = {
  getComparisonStats: async () => {
    const response = await fetch(`${API_BASE_URL}/dashboard/comparison-stats`, {
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
        'Content-Type': 'application/json',
      },
    });
    return handleResponse(response);
  },
};

// Client Event API (Calendar Events)
export const clientEventApi = {
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/get-all-client-events`, {
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
        'Content-Type': 'application/json',
      },
    });
    return handleResponse(response);
  },

  getById: async (clientEventId: string) => {
    const response = await fetch(`${API_BASE_URL}/get-client-event/${clientEventId}`, {
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
        'Content-Type': 'application/json',
      },
    });
    return handleResponse(response);
  },

  getByProject: async (projectId: string) => {
    const response = await fetch(`${API_BASE_URL}/get-client-events-by-project/${projectId}`, {
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
        'Content-Type': 'application/json',
      },
    });
    return handleResponse(response);
  },

  create: async (data: any) => {
    const response = await fetch(`${API_BASE_URL}/create-client-event`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  update: async (clientEventId: string, data: any) => {
    const response = await fetch(`${API_BASE_URL}/update-client-event/${clientEventId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  delete: async (clientEventId: string) => {
    const response = await fetch(`${API_BASE_URL}/delete-client-event/${clientEventId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
        'Content-Type': 'application/json',
      },
    });
    return handleResponse(response);
  },

  uploadAlbumPdf: async (formData: FormData) => {
    const response = await fetch(`${API_BASE_URL}/upload-album-pdf`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
      },
      body: formData,
    });
    return handleResponse(response);
  },

  uploadAlbumPdfBatch: async (formData: FormData) => {
    const response = await fetch(`${API_BASE_URL}/upload-album-pdf-batch`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
      },
      body: formData,
    });
    return handleResponse(response);
  },
};

// Album PDF API
export const albumPdfApi = {
  checkExisting: async (projectId: string) => {
    const response = await fetch(`${API_BASE_URL}/check-existing-album-pdf`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ projectId }),
    });
    return handleResponse(response);
  },

  create: async (data: {
    albumId: string;
    projectId: string;
    eventIds: string[];
    albumPdfUrl: string;
    albumPdfFileName: string;
  }) => {
    const response = await fetch(`${API_BASE_URL}/create-album-pdf`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/get-all-album-pdfs`, {
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
        'Content-Type': 'application/json',
      },
    });
    return handleResponse(response);
  },

  getByProject: async (projectId: string) => {
    const response = await fetch(`${API_BASE_URL}/get-album-pdfs-by-project/${projectId}`, {
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
        'Content-Type': 'application/json',
      },
    });
    return handleResponse(response);
  },

  getByEventId: async (eventId: string) => {
    const response = await fetch(`${API_BASE_URL}/get-album-pdfs-by-event/${eventId}`, {
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
        'Content-Type': 'application/json',
      },
    });
    return handleResponse(response);
  },

  getById: async (albumPdfId: string) => {
    const response = await fetch(`${API_BASE_URL}/get-album-pdf/${albumPdfId}`, {
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
        'Content-Type': 'application/json',
      },
    });
    return handleResponse(response);
  },

  updateStatus: async (albumPdfId: string, albumStatus: string) => {
    const response = await fetch(`${API_BASE_URL}/update-album-pdf-status/${albumPdfId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ albumStatus }),
    });
    return handleResponse(response);
  },

  delete: async (albumPdfId: string) => {
    const response = await fetch(`${API_BASE_URL}/delete-album-pdf/${albumPdfId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
        'Content-Type': 'application/json',
      },
    });
    return handleResponse(response);
  },
};

// Image API
export const imageApi = {
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/get-all-images`, {
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
        'Content-Type': 'application/json',
      },
    });
    return handleResponse(response);
  },

  getByProject: async (projectId: string) => {
    const response = await fetch(`${API_BASE_URL}/get-images-by-project/${projectId}`, {
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
        'Content-Type': 'application/json',
      },
    });
    return handleResponse(response);
  },

  getByClientEvent: async (clientEventId: string) => {
    const response = await fetch(`${API_BASE_URL}/get-images-by-client-event/${clientEventId}`, {
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
        'Content-Type': 'application/json',
      },
    });
    return handleResponse(response);
  },

  uploadBatch: async (formData: FormData, signal?: AbortSignal) => {
    const response = await fetch(`${API_BASE_URL}/upload-batch-images`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
      },
      body: formData,
      signal,
    });
    return handleResponse(response);
  },

  notifyImagesUploaded: async (formData: FormData) => {
    const response = await fetch(`${API_BASE_URL}/notify-images-uploaded`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
      },
      body: formData,
    });
    return handleResponse(response);
  },

  notifyReEditRequested: async (data: { projectId: string; clientEventId: string; imageCount: number }) => {
    const response = await fetch(`${API_BASE_URL}/notify-reedit-requested`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  reorderImages: async (data: { clientEventId: string; imageIds: string[] }) => {
    const response = await fetch(`${API_BASE_URL}/reorder-images`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  bulkDelete: async (imageIds: string[]) => {
    const response = await fetch(`${API_BASE_URL}/bulk-delete-images`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ imageIds }),
    });
    return handleResponse(response);
  },

  bulkUpdate: async (imageIds: string[], updates: any) => {
    const response = await fetch(`${API_BASE_URL}/bulk-update-images`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ imageIds, updates }),
    });
    return handleResponse(response);
  },

  reupload: async (imageIds: string[], files: File[]) => {
    const formData = new FormData();
    
    // Add imageIds as JSON
    formData.append('imageIds', JSON.stringify(imageIds));
    
    // Add all files
    files.forEach((file) => {
      formData.append('images', file);
    });

    const response = await fetch(`${API_BASE_URL}/reupload-images`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
      },
      body: formData,
    });
    return handleResponse(response);
  },

  approve: async (imageIds: string[]) => {
    const response = await fetch(`${API_BASE_URL}/approve-images`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ imageIds }),
    });
    return handleResponse(response);
  },

  getProperties: async (imageId: string) => {
    const response = await fetch(`${API_BASE_URL}/get-image-properties/${imageId}`, {
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
        'Content-Type': 'application/json',
      },
    });
    return handleResponse(response);
  },

  downloadSelectedZip: async (imageIds: string[]) => {
    const response = await fetch(`${API_BASE_URL}/download-selected-images`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ imageIds }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to download selected images' }));
      throw new Error(error.message || 'Failed to download selected images');
    }

    return response;
  },

  downloadEventZip: async (clientEventId: string) => {
    const response = await fetch(`${API_BASE_URL}/download-event-images/${clientEventId}`, {
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to download event images' }));
      throw new Error(error.message || 'Failed to download event images');
    }

    return response;
  },
};

export const imageStatusApi = {
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/get-all-image-statuses`, {
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
        'Content-Type': 'application/json',
      },
    });
    return handleResponse(response);
  },
};

// Organization API
export const organizationApi = {
  get: async () => {
    const response = await fetch(`${API_BASE_URL}/get-organization`, {
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
        'Content-Type': 'application/json',
      },
    });
    return handleResponse(response);
  },

  create: async (data: any) => {
    const response = await fetch(`${API_BASE_URL}/create-organization`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  update: async (data: any) => {
    const response = await fetch(`${API_BASE_URL}/update-organization`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  delete: async () => {
    const response = await fetch(`${API_BASE_URL}/delete-organization`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
        'Content-Type': 'application/json',
      },
    });
    return handleResponse(response);
  },
};

// Proposal API
export const proposalApi = {
  create: async (data: any) => {
    const response = await fetch(`${API_BASE_URL}/create-proposal`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  getAll: async (params?: { status?: string; clientEmail?: string; search?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.clientEmail) queryParams.append('clientEmail', params.clientEmail);
    if (params?.search) queryParams.append('search', params.search);
    
    const url = `${API_BASE_URL}/get-all-proposals${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
        'Content-Type': 'application/json',
      },
    });
    return handleResponse(response);
  },

  getById: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/get-proposal/${id}`, {
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
        'Content-Type': 'application/json',
      },
    });
    return handleResponse(response);
  },

  update: async (id: string, data: any) => {
    const response = await fetch(`${API_BASE_URL}/update-proposal/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  delete: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/delete-proposal/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
        'Content-Type': 'application/json',
      },
    });
    return handleResponse(response);
  },

  send: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/send-proposal/${id}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
        'Content-Type': 'application/json',
      },
    });
    return handleResponse(response);
  },
};

// Storage API
export const storageApi = {
  getStats: async (tenantId: string) => {
    const response = await fetch(`${API_BASE_URL}/storage/stats/${tenantId}`, {
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
        'Content-Type': 'application/json',
      },
    });
    return handleResponse(response);
  },

  getBreakdown: async (tenantId: string) => {
    const response = await fetch(`${API_BASE_URL}/storage/breakdown/${tenantId}`, {
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
        'Content-Type': 'application/json',
      },
    });
    return handleResponse(response);
  },

  refresh: async (tenantId: string) => {
    const response = await fetch(`${API_BASE_URL}/storage/refresh/${tenantId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
        'Content-Type': 'application/json',
      },
    });
    return handleResponse(response);
  },

  checkUpload: async (tenantId: string, uploadSizeBytes: number) => {
    const response = await fetch(`${API_BASE_URL}/storage/check-upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ tenantId, uploadSizeBytes }),
    });
    return handleResponse(response);
  },

  getPlans: async () => {
    const response = await fetch(`${API_BASE_URL}/storage/plans`, {
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
        'Content-Type': 'application/json',
      },
    });
    return handleResponse(response);
  },

  updateSubscription: async (tenantId: string, planId: string) => {
    const response = await fetch(`${API_BASE_URL}/storage/subscription/${tenantId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ planId }),
    });
    return handleResponse(response);
  },
};

// Search API
export const searchApi = {
  global: async (query: string, options?: { limit?: number; page?: number; type?: string }) => {
    const params = new URLSearchParams({ q: query });
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.page) params.append('page', options.page.toString());
    if (options?.type && options.type !== 'all') params.append('type', options.type);
    
    const response = await fetch(`${API_BASE_URL}/search?${params.toString()}`, {
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
        'Content-Type': 'application/json',
      },
    });
    return handleResponse(response);
  },
};
