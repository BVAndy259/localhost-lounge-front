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
  },
});

axiosClient.interceptors.request.use((config) => {
  const token = getStoredToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("Error en API:", error.response?.data || error.message);
    return Promise.reject(error);
  },
);

export default axiosClient;
