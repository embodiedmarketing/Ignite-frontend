import axios from "axios";

export const APP_BASE_URL =
  import.meta.env.VITE_API_URL || import.meta.env.VITE_BASE_URL || "";

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
