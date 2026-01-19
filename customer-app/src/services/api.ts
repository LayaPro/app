import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';

const axiosInstance = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add interceptor to include PIN in headers for authenticated requests
axiosInstance.interceptors.request.use((config) => {
  // Get PIN from session storage if available
  const savedPin = sessionStorage.getItem('portal_pin');
  if (savedPin) {
    config.headers['X-Portal-Pin'] = savedPin;
  }
  return config;
});

export const proposalApi = {
  verifyPin: async (accessCode: string, pin: string) => {
    const response = await axiosInstance.post(`/verify-proposal-pin/${accessCode}`, { pin });
    return response.data;
  },
  
  updateProposalStatus: async (proposalId: string, status: string) => {
    const response = await axiosInstance.patch(`/proposals/${proposalId}/status`, { status });
    return response.data;
  },
  
  setPin: (pin: string) => {
    sessionStorage.setItem('portal_pin', pin);
  },
  
  clearPin: () => {
    sessionStorage.removeItem('portal_pin');
  },
};

export const customerPortalApi = {
  getPortalData: async (accessCode: string, pin: string) => {
    const response = await axiosInstance.post(`/customer-portal/${accessCode}`, { pin });
    return response.data;
  },
  
  setPin: (pin: string) => {
    sessionStorage.setItem('portal_pin', pin);
  },
  
  clearPin: () => {
    sessionStorage.removeItem('portal_pin');
  },
};

export const organizationApi = {
  getOrganization: async (tenantId: string) => {
    const response = await axiosInstance.get(`/get-organization/${tenantId}`);
    return response.data;
  },
};
