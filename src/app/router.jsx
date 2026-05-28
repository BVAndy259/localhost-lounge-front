import { Routes, Route, Navigate } from "react-router-dom";
import { LoginPage } from "../pages/staff/LoginPage";
import { StaffDashboardPage } from "../pages/staff/DashboardPage";
import { AdminLayout } from "./admin/AdminLayout";
import { TablesPage } from "../pages/staff/TablePage";
import { PlatesPage } from "../pages/staff/PlatesPage";
import { UsersPage } from "../pages/staff/UsersPage";
import { WaitersPage } from "../pages/staff/WaitersPage";

const getStoredUser = () => {
  try {
    const rawUser = localStorage.getItem("lhl_user");
    return rawUser ? JSON.parse(rawUser) : null;
  } catch {
    return null;
  }
};

const AdminOnly = ({ children }) => {
  const currentUser = getStoredUser();

  if (currentUser?.role !== "ADMIN") {
    return <Navigate to="/admin" replace />;
  }

  return children;
};

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
          path="usuarios"
          element={
            <AdminOnly>
              <UsersPage />
            </AdminOnly>
          }
        />
        <Route
          path="meseros"
          element={
            <AdminOnly>
              <WaitersPage />
            </AdminOnly>
          }
        />
        <Route
          path="reservas"
          element={<div className="p-6">Contenido de Reservas</div>}
        />
        <Route
          path="platos"
          element={
            <AdminOnly>
              <PlatesPage />
            </AdminOnly>
          }
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
