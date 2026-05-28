import { Routes, Route, Navigate } from "react-router-dom";
import { LoginPage } from "../pages/staff/LoginPage";
import { StaffDashboardPage } from "../pages/staff/DashboardPage";
import { AdminLayout } from "./admin/AdminLayout";
import { TablesPage } from "../pages/staff/TablePage";

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

      <Route path="/admin/login" element={<LoginPage />} />
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<StaffDashboardPage />} />
        <Route path="mesas" element={<TablesPage />} />
        <Route
          path="meseros"
          element={<div className="p-6">Contenido de Meseros</div>}
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
