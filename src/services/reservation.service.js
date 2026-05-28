import axiosClient from "../api/axiosClient";

export const ReservationService = {
  getAll: async () => {
    try {
      const response = await axiosClient.get("/reservations");
      return {
        ...response,
        data: response.data?.data ?? response.data ?? [],
      };
    } catch (error) {
      if (error?.response?.status === 401) {
        return { data: [] };
      }
      throw error;
    }
  },
  getById: (id) => axiosClient.get(`/reservations/${id}`),
  create: (data) => axiosClient.post("/reservations", data),
  update: (id, data) => axiosClient.put(`/reservations/${id}`, data),
  updateStatus: (id, status) =>
    axiosClient.patch(`/reservations/${id}/status`, { status }),
};
