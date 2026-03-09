import axios from "axios";

/** Single source of truth for API base URL. Use this instead of import.meta.env.VITE_BASE_URL for /api/* calls. */
export const APP_BASE_URL =
  import.meta.env.VITE_API_URL || import.meta.env.VITE_BASE_URL || "";

/** Alias for consistency in docs and when you need a named export for "API base". */
export const API_BASE_URL = APP_BASE_URL;

export const apiClient = axios.create({
  baseURL: APP_BASE_URL,
  withCredentials: true,
});

apiClient.interceptors.request.use(
  (config) => {
    // console.log("@persistData", persistData);

    // if (persistData?.token && !config.headers.Authorization) {
    //   config.headers[`Authorization`] = `Bearer ${persistData.token}`;
    // }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status, data } = error.response;
      // if (status === 401 || status === 403) {
      //   logout();
      // }
    }
    return Promise.reject(error);
  }
);

/**
 * Helper function for fetch requests with credentials included
 * Use this instead of fetch() directly to ensure cookies are sent
 */
export const fetchWithCredentials = (
  url: string,
  options?: RequestInit
): Promise<Response> => {
  return fetch(url, {
    ...options,
    credentials: 'include',
  });
};
