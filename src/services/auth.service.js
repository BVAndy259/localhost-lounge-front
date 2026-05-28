import axiosClient from "../api/axiosClient";

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
    localStorage.removeItem("lhl_token");
    localStorage.removeItem("token");
    localStorage.removeItem("lhl_user");
  },

  isAuthenticated: () => {
    return !!(localStorage.getItem("lhl_token") || localStorage.getItem("token"));
  },
};
