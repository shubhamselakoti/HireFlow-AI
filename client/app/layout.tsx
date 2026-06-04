import type { Metadata } from 'next';
import './globals.css';
import { SessionProvider } from 'next-auth/react';
import { Toaster } from 'sonner';

export const metadata: Metadata = {
  title: 'HireFlow HRMS — AI-Powered Human Resource Management',
  description: 'Hire smarter, manage better, grow faster. The AI-powered HRMS that handles everything from recruitment to payroll.',
  icons: { icon: '/favicon.ico' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SessionProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                fontFamily: 'Nunito, sans-serif',
                borderRadius: '16px',
                border: '1.5px solid rgba(255,255,255,0.8)',
                boxShadow: '0 8px 32px rgba(100, 80, 200, 0.12)',
              },
            }}
          />
        </SessionProvider>
      </body>
    </html>
  );
}
