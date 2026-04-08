import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token"); // ✅ unified

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => {
    const newToken = response.headers["x-refreshed-token"];
    if (newToken) {
      localStorage.setItem("token", newToken);
    }

    return response;
  },
  (error) => {
    const status = error.response?.status;
    const detail = error.response?.data?.detail;

    if (
      status === 401 &&
      (
        detail === "Invalid or expired token" ||
        detail === "Token invalidated" ||
        detail === "Invalid token payload"
      )
    ) {
      localStorage.removeItem("token");
      window.location.href = "/";
    }

    return Promise.reject(error);
  }
);

export default api;