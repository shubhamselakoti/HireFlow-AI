'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/useAppStore';
import {
  LayoutDashboard, Users, Briefcase, Calendar, DollarSign,
  BarChart3, Settings, LogOut, Menu, X, ClipboardList,
  TrendingUp, ChevronRight, Bell, GitMerge, CalendarCheck,
} from 'lucide-react';

const navItems = [
  { href: '/dashboard',                                  icon: LayoutDashboard, label: 'Dashboard',   bg: 'bg-clay-lavender', color: 'text-clay-purple' },
  { href: '/dashboard/employees',                        icon: Users,           label: 'Employees',   bg: 'bg-clay-peach',    color: 'text-orange-600'  },
  { href: '/dashboard/recruitment', icon: Briefcase, label: 'Recruitment', bg: 'bg-clay-mint', color: 'text-green-600' },
  { href: '/dashboard/recruitment/applications', icon: GitMerge, label: 'Pipeline', bg: 'bg-clay-mint', color: 'text-teal-600' },
  { href: '/dashboard/recruitment/interviews', icon: CalendarCheck, label: 'Interviews', bg: 'bg-clay-sky', color: 'text-blue-600' },
  { href: '/dashboard/attendance', icon: Calendar, label: 'Attendance', bg: 'bg-clay-sky', color: 'text-blue-600' },
  { href: '/dashboard/leave', icon: ClipboardList, label: 'Leave', bg: 'bg-clay-rose', color: 'text-pink-600' },
  { href: '/dashboard/payroll', icon: DollarSign, label: 'Payroll', bg: 'bg-clay-yellow', color: 'text-yellow-600' },
  { href: '/dashboard/performance', icon: TrendingUp, label: 'Performance', bg: 'bg-clay-lavender', color: 'text-purple-600' },
  { href: '/dashboard/analytics', icon: BarChart3, label: 'Analytics', bg: 'bg-clay-peach', color: 'text-orange-500' },
  { href: '/dashboard/settings', icon: Settings, label: 'Settings', bg: 'bg-clay-mint', color: 'text-teal-600' },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { sidebarOpen, toggleSidebar } = useAppStore();

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-clay-text/20 backdrop-blur-sm lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      <aside className={cn(
        'clay-sidebar fixed left-0 top-0 h-full z-30 flex flex-col transition-all duration-300',
        sidebarOpen ? 'w-64' : 'w-0 lg:w-16 overflow-hidden'
      )}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-clay-lavender/50">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-clay-purple to-clay-purple-light flex items-center justify-center shadow-clay-btn flex-shrink-0">
            <span className="text-white font-900 text-sm">H</span>
          </div>
          {sidebarOpen && (
            <span className="font-900 text-lg text-clay-text">HireFlow</span>
          )}
          <button onClick={toggleSidebar} className="ml-auto text-clay-muted hover:text-clay-text lg:hidden">
            <X size={18} />
          </button>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map(({ href, icon: Icon, label, bg, color }) => (
            <Link key={href} href={href}>
              <div className={cn('nav-item', isActive(href) && 'active')}>
                <div className={cn('nav-icon-bg flex-shrink-0', isActive(href) ? 'bg-clay-lavender' : bg)}>
                  <Icon size={16} strokeWidth={2.2} className={cn(isActive(href) ? 'text-clay-purple' : color)} />
                </div>
                {sidebarOpen && <span className="truncate">{label}</span>}
                {sidebarOpen && isActive(href) && (
                  <ChevronRight size={14} className="ml-auto text-clay-purple" />
                )}
              </div>
            </Link>
          ))}
        </nav>

        {/* User Footer */}
        <div className="px-3 pb-4 border-t border-clay-lavender/30 pt-3">
          <div className={cn('flex items-center gap-3 px-2 mb-2', !sidebarOpen && 'justify-center')}>
            <div className="w-8 h-8 rounded-full bg-clay-lavender flex items-center justify-center flex-shrink-0 font-800 text-clay-purple text-sm">
              {session?.user?.name?.[0]?.toUpperCase() || 'A'}
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-700 text-clay-text truncate">{session?.user?.name}</p>
                <p className="text-xs text-clay-muted">Admin</p>
              </div>
            )}
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className={cn(
              'nav-item w-full text-red-400 hover:bg-red-50 hover:text-red-500',
              !sidebarOpen && 'justify-center px-0'
            )}
          >
            <div className="nav-icon-bg bg-red-50 flex-shrink-0">
              <LogOut size={16} strokeWidth={2.2} className="text-red-400" />
            </div>
            {sidebarOpen && <span>Sign Out</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
