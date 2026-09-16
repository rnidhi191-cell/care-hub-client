import { createSlice } from '@reduxjs/toolkit';

const getInitialUser = () => {
  try {
    const raw = localStorage.getItem('careHubUser');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const initialState = {
  user: getInitialUser(),
  token: localStorage.getItem('careHubToken') || null,
  refreshToken: localStorage.getItem('careHubRefreshToken') || null,
  permissions: getInitialUser()?.permissions || [],
  isAuthenticated: !!localStorage.getItem('careHubToken'),
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      const { user, accessToken, token, refreshToken } = action.payload;
      const activeToken = accessToken || token;

      state.user = user;
      state.token = activeToken;
      state.permissions = user?.permissions || [];
      state.isAuthenticated = true;

      if (refreshToken) {
        state.refreshToken = refreshToken;
        localStorage.setItem('careHubRefreshToken', refreshToken);
      }

      if (activeToken) {
        localStorage.setItem('careHubToken', activeToken);
      }
      if (user) {
        localStorage.setItem('careHubUser', JSON.stringify(user));
      }
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.permissions = [];
      state.isAuthenticated = false;

      localStorage.removeItem('careHubToken');
      localStorage.removeItem('careHubRefreshToken');
      localStorage.removeItem('careHubUser');
    },
  },
});

export const { setCredentials, logout } = authSlice.actions;

export default authSlice.reducer;

export const selectCurrentUser = (state) => state.auth.user;
export const selectCurrentToken = (state) => state.auth.token;
export const selectPermissions = (state) => state.auth.permissions;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectUserRole = (state) => state.auth.user?.role;
export const hasPermission = (state, permission) =>
  state.auth.permissions.includes(permission) || state.auth.user?.role === 'SUPER_ADMIN';

