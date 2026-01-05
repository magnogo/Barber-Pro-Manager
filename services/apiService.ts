
/**
 * API Service para comunicação com Backend MySQL
 * Este serviço abstrai as chamadas para o seu servidor Node/PHP/Python que gerencia o MySQL
 */

const API_BASE_URL = process.env.VITE_API_URL || 'https://api.barberpro.com/v1';

export const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('auth_token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Erro na requisição');
    }

    return await response.json();
  } catch (error) {
    console.error(`[API Error] ${endpoint}:`, error);
    throw error;
  }
};

// Métodos específicos para o SaaS
export const authService = {
  login: (credentials: any) => apiRequest('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  me: () => apiRequest('/auth/me'),
};

export const barbershopService = {
  getAll: () => apiRequest('/admin/barbershops'),
  create: (data: any) => apiRequest('/admin/barbershops', { method: 'POST', body: JSON.stringify(data) }),
  getDashboard: (id: string) => apiRequest(`/barbershops/${id}/stats`),
};

export const appointmentService = {
  list: (shopId: string, date: string) => apiRequest(`/barbershops/${shopId}/appointments?date=${date}`),
  create: (data: any) => apiRequest('/appointments', { method: 'POST', body: JSON.stringify(data) }),
  updateStatus: (id: string, status: string) => apiRequest(`/appointments/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
};
