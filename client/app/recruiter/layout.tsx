import DashboardLayout from '@/components/layout/DashboardLayout';
export default function RecruiterLayout({ children }: { children: React.ReactNode }) {
  return <DashboardLayout role="recruiter">{children}</DashboardLayout>;
}
