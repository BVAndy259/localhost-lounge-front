import { Routes, Route, Navigate } from "react-router-dom";
import { LandingPage } from "../pages/public/LandingPage";
import { ReservationPage } from "../pages/public/ReservationPage";
import { LoginPage } from "../pages/staff/LoginPage";
import { StaffDashboardPage } from "../pages/staff/DashboardPage";
import { AdminLayout } from "./admin/AdminLayout";
import { TablesPage } from "../pages/staff/TablePage";
import { PlatesPage } from "../pages/staff/PlatesPage";
import { UsersPage } from "../pages/staff/UsersPage";
import { WaitersPage } from "../pages/staff/WaitersPage";
import { ReservationsPage } from "../pages/staff/ReservationsPage";
import { InternalChatPage } from "../pages/staff/InternalChatPage";
import { POSPage } from "../pages/staff/POSPage";
import { OrdersPage } from "../pages/staff/OrdersPage";
import { AuthService } from "../services/auth.service";

const getStoredUser = () => {
  try {
    const rawUser = localStorage.getItem("lhl_user");
    return rawUser ? JSON.parse(rawUser) : null;
  } catch {
    return null;
  }
};

const hasValidSession = () => AuthService.isSessionValid();

const AdminOnly = ({ children }) => {
  const currentUser = getStoredUser();

  if (!hasValidSession()) {
    return <Navigate to="/admin/login" replace />;
  }

  if (currentUser?.role !== "ADMIN") {
    return <Navigate to="/admin" replace />;
  }

  return children;
};

const StaffOnly = ({ children }) => {
  const currentUser = getStoredUser();

  if (!hasValidSession()) {
    return <Navigate to="/admin/login" replace />;
  }

  if (currentUser?.role !== "ADMIN" && currentUser?.role !== "RECEPCIONISTA") {
    return <Navigate to="/admin" replace />;
  }

  return children;
};

export const AppRouter = () => {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/reservar" element={<ReservationPage />} />

      <Route path="/admin/login" element={<LoginPage />} />
      <Route
        path="/admin"
        element={
          hasValidSession() ? <AdminLayout /> : <Navigate to="/admin/login" replace />
        }
      >
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
            <StaffOnly>
              <WaitersPage />
            </StaffOnly>
          }
        />
        <Route
          path="reservas"
          element={
            <StaffOnly>
              <ReservationsPage />
            </StaffOnly>
          }
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
          element={
            <StaffOnly>
              <InternalChatPage />
            </StaffOnly>
          }
        />
        <Route
          path="ordenes"
          element={
            <StaffOnly>
              <OrdersPage />
            </StaffOnly>
          }
        />
        <Route
          path="mesas/:tableId/pos"
          element={
            <StaffOnly>
              <POSPage />
            </StaffOnly>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRouter;
