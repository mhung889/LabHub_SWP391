import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { BarChart3, ClipboardList, Users, LogOut, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getAccessToken, clearStorage } from '@/utils/storage';
import { toast } from 'sonner';

export default function MentorLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const tabs = [
    { to: '/mentor/dashboard', label: 'Tổng Quan', icon: BarChart3 },
    { to: '/mentor/tasks', label: 'Quản Lý Task', icon: ClipboardList },
    { to: '/mentor/students', label: 'Sinh Viên Của Tôi', icon: Users },
    { to: '/mentor/notifications', label: 'Thông báo', icon: Bell },
  ];

  const titleMap = {
    '/mentor/dashboard': 'Dashboard',
    '/mentor/tasks': 'Quản Lý Task',
    '/mentor/students': 'Sinh Viên Của Tôi',
    '/mentor/notifications': 'Thông báo',
  };

  const currentTab = tabs.find((t) => location.pathname.startsWith(t.to));
  const headerTitle = currentTab ? titleMap[currentTab.to] : 'Mentor Dashboard';

  const handleLogout = () => {
    clearStorage();
    toast.success('Đã đăng xuất');
    navigate('/login');
  };

  return (
    <div className='min-h-screen flex bg-background'>
      <aside className='w-1/6 border-r border-border bg-card flex flex-col'>
        <div className='px-4 py-4 border-b border-border'>
          <p className='text-2xl font-bold text-foreground'>Mentor Dashboard</p>
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
            onClick={handleLogout}
          >
            <LogOut className='w-4 h-4 mr-2' />
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

