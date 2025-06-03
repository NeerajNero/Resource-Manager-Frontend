// src/api/apiClient.ts
import axios from "axios";
import { getToken } from "../store/useAuthStore";

const apiClient = axios.create({
  baseURL: "http://localhost:5000/api", // adjust if your backend uses a different host/port
});

// Automatically attach the JWT to every request, if present
apiClient.interceptors.request.use((config) => {
  const token = getToken();
  if (token && config.headers) {
    config.headers["Authorization"] = `Bearer ${token}`;
  }
  return config;
});

export default apiClient;
