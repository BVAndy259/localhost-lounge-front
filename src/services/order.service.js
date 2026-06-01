import axiosClient from "../api/axiosClient";

export const OrderService = {
  getAll: (params = {}) => axiosClient.get("/orders", { params }),

  create: (data) => axiosClient.post("/orders", data),
  
  getActiveByTable: (tableId) => axiosClient.get(`/orders/table/${tableId}/active`),
  
  getById: (id) => axiosClient.get(`/orders/${id}`),
  
  addItems: (id, data) => axiosClient.post(`/orders/${id}/items`, data),

  deleteItem: (id, itemId) => axiosClient.delete(`/orders/${id}/items/${itemId}`),
  cancel: (id) => axiosClient.post(`/orders/${id}/cancel`),
  
  updateStatus: (id, status) => axiosClient.patch(`/orders/${id}/status`, { status }),
  
    checkout: (id, payload) => axiosClient.post(`/orders/${id}/checkout`, payload),

    getReceiptPdf: (id, params = {}) =>
      axiosClient.get(`/orders/${id}/receipt/pdf`, {
        params,
        responseType: "blob",
      }),
};