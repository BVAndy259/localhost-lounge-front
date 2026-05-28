import axiosClient from "../api/axiosClient";

const hasAuthToken = () => {
  if (typeof window === "undefined") return false;

  return Boolean(
    localStorage.getItem("lhl_token") ||
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    localStorage.getItem("accessToken"),
  );
};

export const TableService = {
  getAll: async () => {
    const endpoint = hasAuthToken() ? "/tables" : "/tables/public";
    const response = await axiosClient.get(endpoint);

    return {
      ...response,
      data: response.data?.data ?? response.data ?? [],
    };
  },
  getById: (id) => axiosClient.get(`/tables/${id}`),
  create: (data) => axiosClient.post("/tables", data),
  update: (id, data) => axiosClient.put(`/tables/${id}`, data),
  toggleActive: (id, active) =>
    axiosClient.patch(`/tables/${id}/active`, { active }),
};
