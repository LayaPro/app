import { baseApi } from './baseApi.js';
import type { LoginRequest, LoginResponse, User } from '../../types/index.js';

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<LoginResponse, LoginRequest>({
      query: (credentials) => ({
        url: '/login',
        method: 'POST',
        body: credentials,
      }),
    }),
    logout: builder.mutation<{ message: string }, void>({
      query: () => ({
        url: '/logout',
        method: 'POST',
      }),
    }),
    verifyToken: builder.query<{ valid: boolean; user: User }, void>({
      query: () => '/verify-token',
    }),
    refreshToken: builder.mutation<{ message: string; token: string }, void>({
      query: () => ({
        url: '/refresh-token',
        method: 'POST',
      }),
    }),
    forgotPassword: builder.mutation<{ message: string }, { email: string }>({
      query: (body) => ({
        url: '/forgot-password',
        method: 'POST',
        body,
      }),
    }),
    resetPassword: builder.mutation<
      { message: string },
      { token: string; newPassword: string }
    >({
      query: (body) => ({
        url: '/reset-password',
        method: 'POST',
        body,
      }),
    }),
    changePassword: builder.mutation<
      { message: string },
      { currentPassword: string; newPassword: string }
    >({
      query: (body) => ({
        url: '/change-password',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['User'],
    }),
  }),
});

export const {
  useLoginMutation,
  useLogoutMutation,
  useVerifyTokenQuery,
  useRefreshTokenMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useChangePasswordMutation,
} = authApi;
