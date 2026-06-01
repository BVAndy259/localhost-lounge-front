import axiosClient from "../api/axiosClient";

export const WaiterService = {
  getAll: async () => {
    const response = await axiosClient.get("/waiters");

    return {
      ...response,
      data: response.data?.data ?? response.data ?? [],
    };
  },

  create: (data) => axiosClient.post("/waiters", data),

  update: (id, data) => axiosClient.put(`/waiters/${id}`, data),

  toggleStatus: (id, active) => axiosClient.patch(`/waiters/${id}/status`, { active }),
};