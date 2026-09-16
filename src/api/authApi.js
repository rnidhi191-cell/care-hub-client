import api from '../api';

export const registerUser = (data) => {
  return api.post('/auth/register', data);
};

export const loginUser = (data) => {
  return api.post('/auth/login', data);
};

export const getProfile = () => {
  return api.get('/auth/profile');
};

export const logoutUser = () => {
  return api.post('/auth/logout');
};

export const getUsers = (role) => {
  return api.get('/auth/users', { params: role ? { role } : {} });
};