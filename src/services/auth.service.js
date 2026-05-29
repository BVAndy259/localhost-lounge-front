import axiosClient from "../api/axiosClient";

const getStoredToken = () => {
  if (typeof window === "undefined") return null;

  return (
    localStorage.getItem("lhl_token") ||
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    localStorage.getItem("accessToken")
  );
};

const decodeJwtPayload = (token) => {
  try {
    const payloadBase64 = token.split(".")[1];
    if (!payloadBase64) return null;

    const normalized = payloadBase64.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
};

const clearSessionStorage = () => {
  localStorage.removeItem("lhl_token");
  localStorage.removeItem("token");
  localStorage.removeItem("lhl_user");
};

export const AuthService = {
  login: async (email, password) => {
    const response = await axiosClient.post("/auth/login", { email, password });
    const authData = response.data?.data ?? response.data;
    const token = authData?.token;
    const user = authData?.user;

    if (token) {
      localStorage.setItem("lhl_token", token);
      localStorage.setItem("token", token);

      if (user) {
        localStorage.setItem("lhl_user", JSON.stringify(user));
      }
    }

    return authData;
  },

  logout: () => {
    clearSessionStorage();
  },

  getStoredToken: () => getStoredToken(),

  getTokenExpiryMs: () => {
    const token = getStoredToken();
    if (!token) return null;

    const payload = decodeJwtPayload(token);
    if (!payload?.exp) return null;

    return payload.exp * 1000;
  },

  isTokenExpired: () => {
    const expiryMs = AuthService.getTokenExpiryMs();
    if (!expiryMs) return false;

    return Date.now() >= expiryMs;
  },

  isSessionValid: () => {
    const token = getStoredToken();
    if (!token) return false;

    return !AuthService.isTokenExpired();
  },

  clearExpiredSession: () => {
    clearSessionStorage();
  },

  startSessionMonitor: (onExpire) => {
    const expiryMs = AuthService.getTokenExpiryMs();
    if (!expiryMs) return () => {};

    const remainingMs = expiryMs - Date.now();
    if (remainingMs <= 0) {
      clearSessionStorage();
      if (typeof onExpire === "function") onExpire();
      return () => {};
    }

    const timeoutId = window.setTimeout(() => {
      clearSessionStorage();
      if (typeof onExpire === "function") onExpire();
    }, remainingMs);

    return () => window.clearTimeout(timeoutId);
  },

  getCurrentUser: async () => {
    const response = await axiosClient.get("/auth/me");
    return response.data?.data ?? response.data ?? null;
  },

  isAuthenticated: () => {
    return AuthService.isSessionValid();
  },
};
