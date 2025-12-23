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

  create: async (data: { statusCode: string; step: number }) => {
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

  update: async (statusId: string, data: { statusCode?: string; step?: number }) => {
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
