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

// Token expirado/inválido: limpa e volta ao login (o estado do AuthContext é recarregado).
http.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401 && !error.config?.url?.startsWith("/auth/")) {
      localStorage.removeItem("billwatch_token");
      window.location.assign("/login");
    }
    return Promise.reject(error);
  },
);
