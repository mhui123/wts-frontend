import api from './client';

export type Me = {
  id: number | string;
  email?: string;
  name?: string;
  roles?: string[];
  [key: string]: unknown;
};

/**
 * Try to fetch current user info using cookie-based session/JWT.
 * Primary path: /account/me (common)
 * Fallback: /accpunt/me (typo variant provided in request) to be safe.
 */
type AxiosErr = { response?: { status?: number } };

export async function getMe(): Promise<Me> {
  try {
    const res = await api.get('/account/getMyInfo');
    return res.data;
  } catch (e: unknown) {
    // fallback if backend route is spelled differently
    const status = (e as AxiosErr).response?.status;
    if (status === 404) {
      const res2 = await api.get('/account/getMyInfo');
      return res2.data;
    }
    throw e;
  }
}

/**
 * Logout current session.
 * Backend should clear cookie/session.
 */
export async function logout(): Promise<void> {
  try {
    await api.post('/account/logout');
  } catch (e) {
    // Even if logout endpoint responds with 204/200 or minor errors,
    // we proceed to clear client state.
  }
}
