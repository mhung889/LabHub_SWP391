import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Users, Zap, BarChart3, GraduationCap } from 'lucide-react';

import { Button } from '@/components/ui/button';

export default function AdminLayout() {
  const tabs = [
    { to: '/admin/overview', label: 'Tổng Quan', icon: BarChart3 },
    { to: '/admin/labs', label: 'Quản Lý Lab', icon: Zap },
    { to: '/admin/mentors', label: 'Quản Lý Mentor', icon: Users },
    { to: '/admin/students', label: 'Quản Lý Sinh Viên', icon: GraduationCap },
  ];

  const location = useLocation();

  const titleMap = {
    '/admin/overview': 'Overview',
    '/admin/labs': 'Lab Management',
    '/admin/mentors': 'Mentor Management',
    '/admin/students': 'Student Management',
  };

  // Tìm tab hiện tại để hiển thị title đúng
  const currentTab = tabs.find((t) => location.pathname.startsWith(t.to));
  const headerTitle = currentTab ? titleMap[currentTab.to] : 'Trang quản trị';

  return (
    <div className='min-h-screen flex bg-background'>
      {/* SIDEBAR */}
      <aside className='w-1/6 border-r border-border bg-card flex flex-col'>
        <div className='px-4 py-4 border-b border-border'>
          <p className='text-2xl font-bold text-foreground'>Admin Dashboard</p>
        </div>

        <nav className='flex-1 px-2 py-4 space-y-1'>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <NavLink
                key={tab.to}
                to={tab.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-3 rounded-lg text-base font-semibold !no-underline
                  transition-colors text-black
                  ${isActive ? 'bg-primary text-primary-foreground' : ''}`
                }
                end
              >
                <Icon className='w-5 h-5' />
                <span>{tab.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className='px-4 py-4 border-t border-border flex justify-center'>
          <Button
            variant='outline'
            size='sm'
            className='w-28 text-black !rounded-[10px] border py-3'
          >
            Đăng xuất
          </Button>
        </div>
      </aside>

      <div className='flex-1 flex flex-col'>
        <header className='border-b border-border bg-card px-6 py-4'>
          <h2 className='text-xl font-semibold text-foreground'>
            {headerTitle}
          </h2>
        </header>

        <main className='flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8'>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
