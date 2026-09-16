import axios from "axios";

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:8080",
});

http.interceptors.request.use((config) => {
  const token = localStorage.getItem("billwatch_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
