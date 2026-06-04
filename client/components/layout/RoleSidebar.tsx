'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { cn } from '../../lib/utils';
import { useAppStore } from '../../store/useAppStore';
import { Users, Calendar, ClipboardList, TrendingUp, LogOut, ChevronRight, LayoutDashboard, Briefcase, MessageSquare, User, DollarSign } from 'lucide-react';

interface SidebarProps { role: 'manager' | 'recruiter' | 'employee' }

const navConfig = {
  manager: {
    base: '/manager',
    label: 'Manager Portal',
    items: [
      { href: '/manager', icon: LayoutDashboard, label: 'Dashboard', bg: 'bg-clay-lavender', color: 'text-clay-purple' },
      { href: '/manager/team', icon: Users, label: 'My Team', bg: 'bg-clay-peach', color: 'text-orange-600' },
      { href: '/manager/attendance', icon: Calendar, label: 'Attendance', bg: 'bg-clay-sky', color: 'text-blue-600' },
      { href: '/manager/leave', icon: ClipboardList, label: 'Leave Requests', bg: 'bg-clay-rose', color: 'text-pink-600' },
      { href: '/manager/performance', icon: TrendingUp, label: 'Performance', bg: 'bg-clay-mint', color: 'text-green-600' },
    ],
  },
  recruiter: {
    base: '/recruiter',
    label: 'Recruiter Portal',
    items: [
      { href: '/recruiter', icon: LayoutDashboard, label: 'Dashboard', bg: 'bg-clay-lavender', color: 'text-clay-purple' },
      { href: '/recruiter/jobs', icon: Briefcase, label: 'Jobs', bg: 'bg-clay-peach', color: 'text-orange-600' },
      { href: '/recruiter/candidates', icon: Users, label: 'Candidates', bg: 'bg-clay-mint', color: 'text-green-600' },
      { href: '/recruiter/interviews', icon: MessageSquare, label: 'Interviews', bg: 'bg-clay-sky', color: 'text-blue-600' },
      { href: '/recruiter/ai-screen', icon: TrendingUp, label: 'AI Screen', bg: 'bg-clay-rose', color: 'text-pink-600' },
    ],
  },
  employee: {
    base: '/employee',
    label: 'My Portal',
    items: [
      { href: '/employee', icon: LayoutDashboard, label: 'Dashboard', bg: 'bg-clay-lavender', color: 'text-clay-purple' },
      { href: '/employee/attendance', icon: Calendar, label: 'Attendance', bg: 'bg-clay-sky', color: 'text-blue-600' },
      { href: '/employee/leave', icon: ClipboardList, label: 'Leave', bg: 'bg-clay-rose', color: 'text-pink-600' },
      { href: '/employee/payslips', icon: DollarSign, label: 'Payslips', bg: 'bg-clay-yellow', color: 'text-yellow-600' },
      { href: '/employee/performance', icon: TrendingUp, label: 'Performance', bg: 'bg-clay-mint', color: 'text-green-600' },
      { href: '/employee/profile', icon: User, label: 'My Profile', bg: 'bg-clay-peach', color: 'text-orange-600' },
    ],
  },
};

export default function RoleSidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { sidebarOpen, toggleSidebar } = useAppStore();
  const config = navConfig[role];

  const isActive = (href: string) => {
    if (href === config.base) return pathname === config.base;
    return pathname.startsWith(href);
  };

  return (
    <>
      {sidebarOpen && (
        <div className="fixed inset-0 z-20 bg-clay-text/20 backdrop-blur-sm lg:hidden" onClick={toggleSidebar} />
      )}
      <aside className={cn(
        'clay-sidebar fixed left-0 top-0 h-full z-30 flex flex-col transition-all duration-300',
        sidebarOpen ? 'w-64' : 'w-0 lg:w-16 overflow-hidden'
      )}>
        <div className="flex items-center gap-3 px-5 py-5 border-b border-clay-lavender/50">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-clay-purple to-clay-purple-light flex items-center justify-center shadow-clay-btn flex-shrink-0">
            <span className="text-white font-900 text-sm">H</span>
          </div>
          {sidebarOpen && <span className="font-900 text-lg text-clay-text">HireFlow</span>}
        </div>

        {sidebarOpen && (
          <div className="px-4 py-2">
            <span className="text-xs font-700 text-clay-muted uppercase tracking-widest">{config.label}</span>
          </div>
        )}

        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {config.items.map(({ href, icon: Icon, label, bg, color }) => (
            <Link key={href} href={href}>
              <div className={cn('nav-item', isActive(href) && 'active')}>
                <div className={cn('nav-icon-bg flex-shrink-0', isActive(href) ? 'bg-clay-lavender' : bg)}>
                  <Icon size={16} strokeWidth={2.2} className={cn(isActive(href) ? 'text-clay-purple' : color)} />
                </div>
                {sidebarOpen && <span className="truncate">{label}</span>}
                {sidebarOpen && isActive(href) && <ChevronRight size={14} className="ml-auto text-clay-purple" />}
              </div>
            </Link>
          ))}
        </nav>

        <div className="px-3 pb-4 border-t border-clay-lavender/30 pt-3">
          <div className={cn('flex items-center gap-3 px-2 mb-2', !sidebarOpen && 'justify-center')}>
            <div className="w-8 h-8 rounded-full bg-clay-lavender flex items-center justify-center flex-shrink-0 font-800 text-clay-purple text-sm">
              {session?.user?.name?.[0]?.toUpperCase() || '?'}
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-700 text-clay-text truncate">{session?.user?.name}</p>
                <p className="text-xs text-clay-muted capitalize">{role}</p>
              </div>
            )}
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className={cn('nav-item w-full text-red-400 hover:bg-red-50 hover:text-red-500', !sidebarOpen && 'justify-center px-0')}
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
