// src/components/student/sidebar/Sidebar.jsx
import React, { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import LogoutButton from "../../LogoutButton";

const Sidebar = ({ user, items }) => {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        if (!user) return;
        const { default: api } = await import('../../../api/notificationApi');
        const res = await api.getStudentNotifications();
        if (mounted) setUnreadCount(res.data.unreadCount || 0);
      } catch (err) {
        // ignore
      }
    };
    load();
    const onRead = (e) => {
      try {
        const c = Number(e?.detail?.unreadCount);
        if (!Number.isNaN(c)) setUnreadCount(c);
      } catch (_) {}
    };
    window.addEventListener('notificationRead', onRead);
    return () => { mounted = false };
  }, [user]);
  // Menu mặc định
  const defaultItems = [
    {
      to: "/student",
      icon: "dashboard",
      label: "Bảng điều khiển",
      exact: true,
    },
    {
      to: "/student/history",
      icon: "history",
      label: "Lịch sử điểm danh",
    },
    {
      to: "/student/leave",
      icon: "event_busy",
      label: "Đơn xin nghỉ",
    },
    {
      to: "/student/notifications",
      icon: "notifications",
      label: "Thông báo",
    },
    {
      to: "/student/profile",
      icon: "person",
      label: "Hồ sơ",
    },
  ];

  const navItems = items && items.length ? items : defaultItems;

  return (
    <aside className="sidebar-wrapper d-flex flex-column flex-shrink-0 p-4 d-none d-lg-flex">
      {/* Logo */}
      <div className="d-flex align-items-center gap-2 px-2 mb-5">
        <span className="material-symbols-outlined text-primary-custom fs-2">
          task_alt
        </span>
        <h2 className="h4 fw-bold m-0 text-dark">LabHub</h2>
      </div>

      {/* User info */}
      <div className="mb-4">
        <div className="d-flex align-items-center gap-3 mb-4">
          <div
            className="avatar bg-light d-flex align-items-center justify-content-center"
            style={{
              backgroundImage: user?.image ? `url("${user.image}")` : "none",
              backgroundColor: user?.image ? "transparent" : "#e2e8f0",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            {!user?.image && (
              <span
                className="material-symbols-outlined text-secondary"
                style={{ fontSize: "24px" }}
              >
                person
              </span>
            )}
          </div>
          <div>
            <h1 className="h6 fw-bold mb-0 text-dark">
              {user?.fullName || "Student"}
            </h1>
            {user?.email && (
              <small className="text-secondary">{user.email}</small>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="d-flex flex-column gap-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.exact}
              className={({ isActive }) =>
                `nav-link-custom ${isActive ? "active" : ""}`
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className="material-symbols-outlined"
                    style={{
                      fontVariationSettings: isActive
                        ? "'FILL' 1"
                        : "'FILL' 0",
                    }}
                  >
                    {item.icon}
                  </span>
                  {item.label}
                  {item.to === '/student/notifications' && unreadCount > 0 && (
                    <span className="badge bg-danger ms-2">{unreadCount}</span>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Logout Button */}
      <div className="mt-auto d-flex flex-column gap-3">
        <LogoutButton />
      </div>
    </aside>
  );
};

export default Sidebar;
