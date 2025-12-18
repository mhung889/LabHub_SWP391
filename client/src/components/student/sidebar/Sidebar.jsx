import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import LogoutButton from '../../LogoutButton';
import attendanceApi from '../../../api/attendanceApi';
import { toast } from 'sonner';

const Sidebar = ({ user, items }) => {
  const navigate = useNavigate();

  // ==========================================
  // XỬ LÝ NHẤN "Điểm danh bằng khuôn mặt"
  // ==========================================
  const handleFaceAttendance = async () => {
    try {
      const res = await attendanceApi.checkFaceStatus();

      if (!res.data.registered) {
        toast.info('Bạn chưa đăng ký khuôn mặt. Vui lòng đăng ký trước.');
        return navigate('/student/register-face');
      }

      return navigate('/student/attendance');
    } catch (err) {
      console.error(err);
      toast.error('Không thể kiểm tra trạng thái khuôn mặt.');
    }
  };

  // Menu mặc định
  const defaultItems = [
    {
      to: '/student',
      icon: 'dashboard',
      label: 'Bảng điều khiển',
      exact: true,
    },
    {
      // ⭐ Nút điểm danh bằng khuôn mặt (không dùng NavLink)
      action: handleFaceAttendance,
      icon: 'photo_camera',
      label: 'Điểm danh ',
    },
    // {
    //   to: "/student/history",
    //   icon: "history",
    //   label: "Lịch sử điểm danh",
    // },
    {
      to: '/student/tasks',
      icon: 'task',
      label: 'Quản Lý Task',
    },
    {
      to: '/student/leave',
      icon: 'event_busy',
      label: 'Đơn xin nghỉ',
    },
    {
      to: '/student/notifications',
      icon: 'notifications',
      label: 'Thông báo',
    },
    {
      to: '/student/profile',
      icon: 'person',
      label: 'Hồ sơ',
    },
  ];

  const navItems = items && items.length ? items : defaultItems;

  return (
    <aside className='sidebar-wrapper d-flex flex-column flex-shrink-0 p-4 d-none d-lg-flex'>
      {/* Logo */}
      <div className='d-flex align-items-center gap-2 px-2 mb-5'>
        <span className='material-symbols-outlined text-primary-custom fs-2'>
          task_alt
        </span>
        <h2 className='h4 fw-bold m-0 text-dark'>LabHub</h2>
      </div>

      {/* User info */}
      <div className='mb-4'>
        <div className='d-flex align-items-center gap-3 mb-4'>
          <div
            className='avatar bg-light d-flex align-items-center justify-content-center'
            style={{
              backgroundImage: user?.image ? `url("${user.image}")` : 'none',
              backgroundColor: user?.image ? 'transparent' : '#e2e8f0',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            {!user?.image && (
              <span
                className='material-symbols-outlined text-secondary'
                style={{ fontSize: '24px' }}
              >
                person
              </span>
            )}
          </div>
          <div>
            <h1 className='h6 fw-bold mb-0 text-dark'>
              {user?.fullName || 'Student'}
            </h1>
            {user?.email && (
              <small className='text-secondary'>{user.email}</small>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className='d-flex flex-column gap-2'>
          {navItems.map((item, index) => {
            // ⭐ Nếu item có action (nút Face Attendance)
            if (item.action) {
              return (
                // <button
                //   key={index}
                //   onClick={item.action}
                //   className="nav-link-custom text-start"
                //   style={{ border: "none", background: "none", padding: 0 }}
                // >
                //   <span className="material-symbols-outlined">{item.icon}</span>
                //   {item.label}
                // </button>
                <button
                  key={index}
                  type='button'
                  onClick={item.action}
                  className='nav-link-custom w-100 d-flex align-items-center gap-2'
                  style={{
                    border: 'none',
                    background: 'transparent',
                    textAlign: 'left',
                  }}
                >
                  <span className='material-symbols-outlined'>{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              );
            }

            // ⭐ Các NavLink bình thường
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.exact}
                className={({ isActive }) =>
                  `nav-link-custom ${isActive ? 'active' : ''}`
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className='material-symbols-outlined'
                      style={{
                        fontVariationSettings: isActive
                          ? "'FILL' 1"
                          : "'FILL' 0",
                      }}
                    >
                      {item.icon}
                    </span>
                    {item.label}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Logout Button */}
      <div className='mt-auto d-flex flex-column gap-3'>
        <LogoutButton />
      </div>
    </aside>
  );
};

export default Sidebar;
