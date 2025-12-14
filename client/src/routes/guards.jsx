// routes/guards.jsx
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { getAccessToken, getUserInfo } from "@/utils/storage";

export function RequireAuth() {
  const location = useLocation();
  const token = getAccessToken();

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return <Outlet />;
}

export function RequireRole({ allowedRoles = [] }) {
  const user = getUserInfo(); // { role: ... }
  const role = user?.role;

  // Nếu token có nhưng userInfo thiếu coi như chưa đủ điều kiện
  if (!role) return <Navigate to="/login" replace />;

  if (!allowedRoles.includes(role)) {
    return <Navigate to="/403" replace />;
  }

  return <Outlet />;
}
