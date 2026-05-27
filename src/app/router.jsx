import { Routes, Route, Navigate } from "react-router-dom";
import { AdminLayout } from "./admin/AdminLayout";

export const AppRouter = () => {
  return (
    <Routes>
      <Route path="/">
        <Route
          index
          element={
            <div className="p-10 text-xl font-bold">Landing Page Inmersiva</div>
          }
        />
      </Route>

      <Route path="/admin" element={<AdminLayout />}>
        <Route
          index
          element={<div className="p-6">Contenido del Dashboard Principal</div>}
        />
        <Route
          path="meseros"
          element={<div className="p-6">Contenido de Meseros</div>}
        />
        <Route
          path="mesas"
          element={<div className="p-6">Contenido de Mesas</div>}
        />
        <Route
          path="reservas"
          element={<div className="p-6">Contenido de Reservas</div>}
        />
        <Route
          path="platos"
          element={<div className="p-6">Contenido del Menú</div>}
        />
        <Route
          path="chat"
          element={<div className="p-6">Contenido del Chatbot Interno</div>}
        />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
