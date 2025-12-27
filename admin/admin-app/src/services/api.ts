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

  update: async (statusId: string, data: { statusCode?: string; statusDescription?: string; step?: number }) => {
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

  create: async (data: { name: string; type?: string; serialNumber?: string; purchaseDate?: string; status?: string }) => {
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

  update: async (equipmentId: string, data: { name?: string; type?: string; serialNumber?: string; purchaseDate?: string; status?: string }) => {
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

  uploadBatch: async (formData: FormData) => {
    const response = await fetch(`${API_BASE_URL}/upload-batch-images`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
      },
      body: formData,
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

  getProperties: async (imageId: string) => {
    const response = await fetch(`${API_BASE_URL}/get-image-properties/${imageId}`, {
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
        'Content-Type': 'application/json',
      },
    });
    return handleResponse(response);
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
