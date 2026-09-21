import CONFIG from '../config';

const STORAGE_KEY = 'storyapp-token';

const ENDPOINTS = {
  REGISTER: `${CONFIG.BASE_URL}/register`,
  LOGIN: `${CONFIG.BASE_URL}/login`,
  STORIES: `${CONFIG.BASE_URL}/stories`,
  VAPID_KEY: `${CONFIG.BASE_URL}/notifications/vapid`,
  SUBSCRIBE: `${CONFIG.BASE_URL}/notifications/subscribe`,
};

export function getAuthToken() {
  return localStorage.getItem(STORAGE_KEY);
}

export function setAuthToken(token) {
  localStorage.setItem(STORAGE_KEY, token);
}

export function clearAuthToken() {
  localStorage.removeItem(STORAGE_KEY);
}

export async function registerUser({ name, email, password }) {
  const response = await fetch(ENDPOINTS.REGISTER, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  });

  return response.json();
}

export async function loginUser({ email, password }) {
  const response = await fetch(ENDPOINTS.LOGIN, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  return response.json();
}

export async function getStories({ page = 1, size = 10, location = 0 } = {}) {
  const token = getAuthToken();
  const response = await fetch(`${ENDPOINTS.STORIES}?page=${page}&size=${size}&location=${location}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.json();
}

export async function addStory(formData) {
  const token = getAuthToken();
  const response = await fetch(ENDPOINTS.STORIES, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  return response.json();
}

export async function getStoryById(storyId) {
  const token = getAuthToken();
  const response = await fetch(`${ENDPOINTS.STORIES}/${storyId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.json();
}

export async function getVapidPublicKey() {
  const response = await fetch(ENDPOINTS.VAPID_KEY);
  return response.json();
}

export async function subscribePush(subscription) {
  const token = getAuthToken();
  const response = await fetch(ENDPOINTS.SUBSCRIBE, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(subscription),
  });

  return response.json();
}

export async function unsubscribePush(endpoint) {
  const token = getAuthToken();
  const response = await fetch(ENDPOINTS.SUBSCRIBE, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ endpoint }),
  });

  return response.json();
}
