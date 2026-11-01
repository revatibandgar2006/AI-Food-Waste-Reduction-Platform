/**
 * foodBridge-AI: Enterprise Frontend API Client Service
 * 
 * Provides centralized network requests, JWT header injection,
 * automatic demo session fallback, error handling, and PostgreSQL persistence.
 */

const API_BASE_URL = '/api';

function getAuthHeader() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handleResponse(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const errorMsg = data.message || `Request failed with status ${response.status}`;
    throw new Error(errorMsg);
  }
  return data;
}

async function ensureRoleAuth(role = 'donor') {
  let token = localStorage.getItem('token');
  if (token) return token;
  throw new Error(`Sign in as a ${role} to continue.`);
}

export const api = {
  // Authentication & Profile
  async login(credentials) {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    const data = await handleResponse(res);
    if (data.token) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('userRole', data.user.roleKey || data.user.role.toLowerCase());
      localStorage.setItem('userName', data.user.name);
      localStorage.setItem('userEmail', data.user.email);
    }
    return data;
  },

  async register(userData) {
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    const data = await handleResponse(res);
    if (data.token) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('userRole', data.user.roleKey || data.user.role.toLowerCase());
      localStorage.setItem('userName', data.user.name);
      localStorage.setItem('userEmail', data.user.email);
    }
    return data;
  },

  async getMe() {
    await ensureRoleAuth('donor');
    const res = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: { ...getAuthHeader() },
    });
    return handleResponse(res);
  },

  async updateProfile(profileData) {
    await ensureRoleAuth('donor');
    const res = await fetch(`${API_BASE_URL}/auth/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify(profileData),
    });
    return handleResponse(res);
  },

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
  },

  // Food Donations (Donor)
  async getDonations(params = {}) {
    const url = new URL(`${API_BASE_URL}/donations`, window.location.origin);
    Object.keys(params).forEach((key) => url.searchParams.append(key, params[key]));
    const res = await fetch(url.toString());
    return handleResponse(res);
  },

  async getMyDonations() {
    await ensureRoleAuth('donor');
    const res = await fetch(`${API_BASE_URL}/donations/my-listings`, {
      headers: { ...getAuthHeader() },
    });
    return handleResponse(res);
  },

  async createDonation(donationData) {
    // Ensure authenticated session so donation is always saved in PostgreSQL
    await ensureRoleAuth('donor');
    const res = await fetch(`${API_BASE_URL}/donations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify(donationData),
    });
    return handleResponse(res);
  },

  async deleteDonation(id) {
    await ensureRoleAuth('donor');
    const res = await fetch(`${API_BASE_URL}/donations/${id}`, {
      method: 'DELETE',
      headers: { ...getAuthHeader() },
    });
    return handleResponse(res);
  },

  // Volunteers
  async getAvailablePickups() {
    await ensureRoleAuth('volunteer');
    const res = await fetch(`${API_BASE_URL}/volunteers/available-pickups`, {
      headers: { ...getAuthHeader() },
    });
    return handleResponse(res);
  },

  async claimPickup(donationId, payload = {}) {
    await ensureRoleAuth('volunteer');
    const res = await fetch(`${API_BASE_URL}/volunteers/claim-pickup/${donationId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },

  async updatePickupStatus(pickupId, status, notes = '') {
    await ensureRoleAuth('volunteer');
    const res = await fetch(`${API_BASE_URL}/volunteers/pickups/${pickupId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify({ status, notes }),
    });
    return handleResponse(res);
  },

  async getMyPickups() {
    await ensureRoleAuth('volunteer');
    const res = await fetch(`${API_BASE_URL}/volunteers/my-pickups`, {
      headers: { ...getAuthHeader() },
    });
    return handleResponse(res);
  },

  async getMyDeliveries() {
    await ensureRoleAuth('volunteer');
    const res = await fetch(`${API_BASE_URL}/volunteers/my-deliveries`, {
      headers: { ...getAuthHeader() },
    });
    return handleResponse(res);
  },

  async verifyDeliveryOtp(deliveryId, otpCode, feedback = '', rating = 5) {
    await ensureRoleAuth('volunteer');
    const res = await fetch(`${API_BASE_URL}/volunteers/verify-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify({ deliveryId, otpCode, feedback, rating }),
    });
    return handleResponse(res);
  },

  async getVolunteerStats() {
    await ensureRoleAuth('volunteer');
    const res = await fetch(`${API_BASE_URL}/volunteers/stats`, {
      headers: { ...getAuthHeader() },
    });
    return handleResponse(res);
  },

  // Receivers & NGOs
  async browseReceiverFood() {
    await ensureRoleAuth('receiver');
    const res = await fetch(`${API_BASE_URL}/receivers/browse-food`, {
      headers: { ...getAuthHeader() },
    });
    return handleResponse(res);
  },

  async requestFood(donationId, payload = {}) {
    await ensureRoleAuth('receiver');
    const res = await fetch(`${API_BASE_URL}/receivers/request-food/${donationId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },

  async getReceiverRequests() {
    await ensureRoleAuth('receiver');
    const res = await fetch(`${API_BASE_URL}/receivers/my-requests`, {
      headers: { ...getAuthHeader() },
    });
    return handleResponse(res);
  },

  async getReceiverHistory() {
    await ensureRoleAuth('receiver');
    const res = await fetch(`${API_BASE_URL}/receivers/history`, {
      headers: { ...getAuthHeader() },
    });
    return handleResponse(res);
  },

  async getDeliveryOtp(deliveryId) {
    await ensureRoleAuth('receiver');
    const res = await fetch(`${API_BASE_URL}/receivers/delivery-otp/${deliveryId}`, {
      headers: { ...getAuthHeader() },
    });
    return handleResponse(res);
  },

  // ESG Analytics & AI Freshness Preview
  async getPlatformAnalytics() {
    const res = await fetch(`${API_BASE_URL}/analytics/platform`);
    return handleResponse(res);
  },

  async getUserAnalytics() {
    await ensureRoleAuth('donor');
    const res = await fetch(`${API_BASE_URL}/analytics/user`, {
      headers: { ...getAuthHeader() },
    });
    return handleResponse(res);
  },

  async predictFreshness(foodData) {
    const res = await fetch(`${API_BASE_URL}/analytics/predict-freshness`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(foodData),
    });
    return handleResponse(res);
  },

  async getSystemHealth() {
    await ensureRoleAuth('admin');
    const res = await fetch(`${API_BASE_URL}/analytics/system`, {
      headers: { ...getAuthHeader() },
    });
    return handleResponse(res);
  },

  // Contact Messages & Inquiries
  async submitContact(contactData) {
    const res = await fetch(`${API_BASE_URL}/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(contactData),
    });
    return handleResponse(res);
  },

  async getContactMessages() {
    await ensureRoleAuth('admin');
    const res = await fetch(`${API_BASE_URL}/contact`, {
      headers: { ...getAuthHeader() },
    });
    return handleResponse(res);
  },

  // Notifications
  async getNotifications() {
    await ensureRoleAuth('donor');
    const res = await fetch(`${API_BASE_URL}/notifications`, {
      headers: { ...getAuthHeader() },
    });
    return handleResponse(res);
  },

  async markNotificationRead(id) {
    await ensureRoleAuth('donor');
    const res = await fetch(`${API_BASE_URL}/notifications/${id}/read`, {
      method: 'PUT',
      headers: { ...getAuthHeader() },
    });
    return handleResponse(res);
  },
};

export default api;
