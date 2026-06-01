import axiosClient from "../api/axiosClient";

export const PlateService = {
  getPublic: async () => {
    const response = await axiosClient.get("/plates/public");
    return {
      ...response,
      data: response.data?.data ?? response.data ?? [],
    };
  },

  getAll: async () => {
    const response = await axiosClient.get("/plates");
    return {
      ...response,
      data: response.data?.data ?? response.data ?? [],
    };
  },

  create: (formData) =>
    axiosClient.post("/plates", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  update: (id, formData) =>
    axiosClient.put(`/plates/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  toggleStatus: (id, available) =>
    axiosClient.patch(`/plates/${id}/status`, { available }),
};
