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
