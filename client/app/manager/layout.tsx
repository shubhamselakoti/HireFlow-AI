import DashboardLayout from '@/components/layout/DashboardLayout';
export default function ManagerLayout({ children }: { children: React.ReactNode }) {
  return <DashboardLayout role="manager">{children}</DashboardLayout>;
}
