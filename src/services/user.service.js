import axiosClient from "../api/axiosClient";

export const UserService = {
  getAll: async () => {
    const response = await axiosClient.get("/users");
    return {
      ...response,
      data: response.data?.data ?? response.data ?? [],
    };
  },

  create: (data) => axiosClient.post("/users", data),

  update: (id, data) => axiosClient.put(`/users/${id}`, data),

  toggleStatus: (id, active) =>
    axiosClient.patch(`/users/${id}/status`, { active }),
};
