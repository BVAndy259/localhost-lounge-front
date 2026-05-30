import axios from "axios";

const getStoredToken = () => {
  if (typeof window === "undefined") return null;

  return (
    localStorage.getItem("lhl_token") ||
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    localStorage.getItem("accessToken")
  );
};

const axiosClient = axios.create({
  baseURL: "http://localhost:3000/api",
  headers: {
    "Content-Type": "application/json",
    "Cache-Control": "no-cache",
    Pragma: "no-cache",
  },
});

const clearSessionStorage = () => {
  if (typeof window === "undefined") return;

  localStorage.removeItem("lhl_token");
  localStorage.removeItem("token");
  localStorage.removeItem("lhl_user");
};

axiosClient.interceptors.request.use((config) => {
  const token = getStoredToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (config.method === "get") {
    config.params = {
      ...(config.params || {}),
      _ts: Date.now(),
    };
  }

  return config;
});

axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("Error en API:", error.response?.data || error.message);

    if (error.response?.status === 401 && typeof window !== "undefined") {
      clearSessionStorage();
      if (window.location.pathname !== "/admin/login") {
        window.location.assign("/admin/login");
      }
    }

    return Promise.reject(error);
  },
);

export default axiosClient;
