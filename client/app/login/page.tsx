'use client';
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Loader2, Sparkles, Mail, Lock } from 'lucide-react';
import { toast } from 'sonner';

function getRoleHome(role: string): string {
  switch (role) {
    case 'management_admin': return '/dashboard';
    case 'senior_manager':   return '/manager';
    case 'hr_recruiter':     return '/recruiter';
    case 'employee':         return '/employee';
    case 'candidate':        return '/candidate-portal';
    default:                 return '/candidate-portal';
  }
}

const schema = z.object({
  email:    z.string().min(1, 'Email is required'),
  password: z.string().min(1, 'Password is required'),
});
type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const [showPw, setShowPw]           = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    const result = await signIn('credentials', {
      email:    data.email,
      password: data.password,
      redirect: false,
    });

    if (result?.error) {
      setError('password', { message: 'Invalid email or password' });
      return;
    }

    const sessionRes = await fetch('/api/auth/session');
    const session    = await sessionRes.json();
    const role       = (session?.user as any)?.role;

    toast.success('Welcome back! 👋');

    const callbackUrl = searchParams.get('callbackUrl');
    if (callbackUrl && !callbackUrl.includes('/login')) {
      router.push(callbackUrl);
    } else {
      router.push(getRoleHome(role));
    }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    await signIn('google', { callbackUrl: '/' });
  };

  return (
    <div className="min-h-screen bg-clay-bg flex items-center justify-center px-4 py-16 relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-[-100px] right-[-80px] w-[500px] h-[500px] rounded-full opacity-40 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse, #c4b5fd 0%, transparent 70%)' }} />
      <div className="absolute bottom-[-80px] left-[-60px] w-[400px] h-[400px] rounded-full opacity-30 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse, #fed7aa 0%, transparent 70%)' }} />

      <div className="w-full max-w-md relative">
        <div className="clay-card-lg p-8 sm:p-10">

          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#6D4AFF] to-[#9F7AEA] flex items-center justify-center shadow-clay-btn mb-4">
              <Sparkles size={24} className="text-white" strokeWidth={2.5} />
            </div>
            <h1 className="text-2xl font-900 text-clay-text">Welcome back</h1>
            <p className="text-clay-muted text-sm font-500 mt-1">Sign in to your HireFlow account</p>
          </div>

          {/* Google */}
          <button
            onClick={handleGoogle}
            disabled={googleLoading || isSubmitting}
            className="clay-btn clay-btn-outline w-full py-3 flex items-center justify-center gap-3 mb-6 font-700 text-sm"
          >
            {googleLoading ? <Loader2 size={16} className="animate-spin" /> : (
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )}
            Continue with Google
          </button>

          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-clay-lavender" />
            <span className="text-xs text-clay-muted font-600">or sign in with email</span>
            <div className="flex-1 h-px bg-clay-lavender" />
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-700 text-clay-text mb-1.5">Email / Login ID</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-clay-muted" strokeWidth={2.2} />
                <input
                  {...register('email')}
                  type="text"
                  placeholder="you@email.com or john.doe@hireflow.com"
                  autoComplete="username"
                  className="clay-input w-full pl-10 pr-4 py-3 text-sm"
                />
              </div>
              {errors.email && <p className="text-red-500 text-xs mt-1 font-600">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-700 text-clay-text mb-1.5">Password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-clay-muted" strokeWidth={2.2} />
                <input
                  {...register('password')}
                  type={showPw ? 'text' : 'password'}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  className="clay-input w-full pl-10 pr-10 py-3 text-sm"
                />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-clay-muted hover:text-clay-text">
                  {showPw ? <EyeOff size={15} strokeWidth={2.2} /> : <Eye size={15} strokeWidth={2.2} />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1 font-600">{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={isSubmitting || googleLoading}
              className="clay-btn clay-btn-primary w-full py-3.5 text-sm font-800 text-white mt-1 flex items-center justify-center gap-2"
            >
              {isSubmitting ? <><Loader2 size={15} className="animate-spin" /> Signing in...</> : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-sm text-clay-muted font-500 mt-6">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-clay-purple font-700 hover:underline">Sign up free</Link>
          </p>

          <div className="mt-4 pt-4 border-t border-clay-lavender/30">
            <p className="text-center text-xs text-clay-muted font-500">
              Looking for jobs?{' '}
              <Link href="/candidate-portal" className="text-clay-purple font-600 hover:underline">
                Browse open positions →
              </Link>
            </p>
          </div>

          {/* Hint for new employees only — no action possible from here */}
          <div className="mt-4 p-3 bg-clay-lavender/20 rounded-xl">
            <p className="text-xs text-clay-muted font-600 text-center leading-relaxed">
              New employee? Use your{' '}
              <span className="text-clay-purple font-700">firstname.lastname@hireflow.com</span>{' '}
              and the temp password from your welcome email.
              Change your password after login from{' '}
              <span className="text-clay-purple font-700">My Profile</span>.
            </p>
          </div>
        </div>

        <p className="text-center mt-4">
          <Link href="/" className="text-xs text-clay-muted font-600 hover:text-clay-text transition-colors">
            ← Back to HireFlow
          </Link>
        </p>
      </div>
    </div>
  );
}
