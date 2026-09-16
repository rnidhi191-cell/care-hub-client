import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { setCredentials, logout } from '../slices/authSlice';

const baseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1',
  prepareHeaders: (headers, { getState }) => {
    const token = getState().auth.token || localStorage.getItem('careHubToken');
    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }
    return headers;
  },
});

const baseQueryWithReauth = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);

  if (result.error && result.error.status === 401) {
    // Try to rotate token using refreshToken
    const refreshToken = api.getState().auth.refreshToken || localStorage.getItem('careHubRefreshToken');

    if (refreshToken) {
      const refreshResult = await baseQuery(
        {
          url: '/auth/refresh',
          method: 'POST',
          body: { refreshToken },
        },
        api,
        extraOptions
      );

      if (refreshResult.data?.success) {
        const { user, accessToken, refreshToken: newRefreshToken } = refreshResult.data.data;
        api.dispatch(setCredentials({ user, accessToken, refreshToken: newRefreshToken }));

        // Retry initial query with new token
        result = await baseQuery(args, api, extraOptions);
      } else {
        api.dispatch(logout());
      }
    } else {
      api.dispatch(logout());
    }
  }

  return result;
};

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    'User',
    'Review',
    'SelfReview',
    'Assessment',
    'Goal',
    'DevelopmentPlan',
    'ReviewCycle',
    'Notification',
    'Audit',
  ],
  endpoints: () => ({}),
});

