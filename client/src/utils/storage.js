// utils/storage.js

// ===== TOKENS =====
export const getAccessToken = () => localStorage.getItem('jwt');
export const getRefreshToken = () => localStorage.getItem('refreshToken');

export const setAccessToken = (token) => {
  if (!token) return;
  localStorage.setItem('jwt', token);
};

export const setRefreshToken = (token) => {
  if (!token) return;
  localStorage.setItem('refreshToken', token);
};

// ===== USER INFO =====
export const getUserInfo = () => {
  const raw = localStorage.getItem('userInfo');
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    localStorage.removeItem('userInfo');
    return null;
  }
};

export const setUserInfo = (user) => {
  if (!user) return;
  localStorage.setItem('userInfo', JSON.stringify(user));
};

export const clearStorage = () => {
  localStorage.removeItem('jwt');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('userInfo');
};
