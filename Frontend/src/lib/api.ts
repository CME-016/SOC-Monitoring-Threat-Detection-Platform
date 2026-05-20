const API_URL = import.meta.env.VITE_API_URL;

async function request(endpoint: string, options: RequestInit = {}) {
  const url = `${API_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Something went wrong');
  }
  return data;
}

export const api = {
  auth: {
    signup: (data: any) => request('/auth.php?action=signup', { method: 'POST', body: JSON.stringify(data) }),
    login: (data: any) => request('/auth.php?action=login', { method: 'POST', body: JSON.stringify(data) }),
  },
  logs: {
    getAll: (userId: string) => request(`/logs.php?user_id=${userId}`),
    create: (userId: string, data: any) => request(`/logs.php?user_id=${userId}`, { method: 'POST', body: JSON.stringify(data) }),
  },
  alerts: {
    getAll: (userId: string) => request(`/alerts.php?user_id=${userId}`),
  },
  dashboard: {
    getStats: (userId: string) => request(`/dashboard.php?user_id=${userId}`),
  },
  websites: {
    getAll: (userId: string) => request(`/websites.php?user_id=${userId}`),
    create: (userId: string, data: { name: string; url: string }) => request(`/websites.php?user_id=${userId}`, { method: 'POST', body: JSON.stringify(data) }),
    delete: (userId: string, id: string) => request(`/websites.php?user_id=${userId}&id=${id}`, { method: 'DELETE' }),
  },
  profile: {
    get: (userId: string) => request(`/profile.php?user_id=${userId}`),
    update: (userId: string, data: any) => request(`/profile.php?user_id=${userId}`, { method: 'POST', body: JSON.stringify(data) }),
  }
};
