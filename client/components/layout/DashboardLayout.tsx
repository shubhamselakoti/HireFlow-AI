'use client';
import { useAppStore } from '@/store/useAppStore';
import { cn } from '@/lib/utils';
import AdminSidebar from './AdminSidebar';
import RoleSidebar from './RoleSidebar';
import TopNav from './TopNav';
import HRChatbot from '@/components/shared/HRChatbot';

type LayoutRole = 'admin' | 'manager' | 'recruiter' | 'employee';

interface DashboardLayoutProps {
  children: React.ReactNode;
  role?: LayoutRole;
  title?: string;
  subtitle?: string;
}

export default function DashboardLayout({
  children,
  role = 'admin',
  title,
  subtitle,
}: DashboardLayoutProps) {
  const { sidebarOpen } = useAppStore();

  return (
    <div className="min-h-screen bg-clay-bg">
      {/* Sidebar */}
      {role === 'admin' ? (
        <AdminSidebar />
      ) : (
        <RoleSidebar role={role as 'manager' | 'recruiter' | 'employee'} />
      )}

      {/* Main content */}
      <div className={cn(
        'transition-all duration-300 min-h-screen flex flex-col',
        sidebarOpen ? 'lg:ml-64' : 'lg:ml-16'
      )}>
        <TopNav title={title} subtitle={subtitle} />
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>

      {/* Floating AI Chatbot */}
      <HRChatbot />
    </div>
  );
}
