'use client';
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Loader2, Sparkles, Mail, Lock, User, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/axios';

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Must contain at least one number'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type FormData = z.infer<typeof schema>;

const passwordRules = [
  { label: '8+ characters', test: (pw: string) => pw.length >= 8 },
  { label: 'Uppercase letter', test: (pw: string) => /[A-Z]/.test(pw) },
  { label: 'Number', test: (pw: string) => /[0-9]/.test(pw) },
];

export default function RegisterPage() {
  const router = useRouter();
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: 'onChange',
  });

  const passwordValue = watch('password', '');

  const onSubmit = async (data: FormData) => {
    try {
      await api.post('/api/auth/register', {
        name: data.name,
        email: data.email,
        password: data.password,
      });

      // Auto sign-in after registration
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        toast.success('Account created! Please sign in.');
        router.push('/login');
        return;
      }

      toast.success('Welcome to HireFlow! 🎉');
      router.push('/candidate-portal');
    } catch (err: any) {
      toast.error(err.message || 'Registration failed. Please try again.');
    }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    await signIn('google', { callbackUrl: '/candidate-portal' });
  };

  return (
    <div className="min-h-screen bg-clay-bg flex items-center justify-center px-4 py-16 relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-[-80px] left-[-60px] w-[450px] h-[450px] rounded-full opacity-35 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse, #c4b5fd 0%, transparent 70%)' }} />
      <div className="absolute bottom-[-100px] right-[-80px] w-[400px] h-[400px] rounded-full opacity-30 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse, #bbf7d0 0%, transparent 70%)' }} />

      <div className="w-full max-w-md relative">
        <div className="clay-card-lg p-8 sm:p-10">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#6D4AFF] to-[#9F7AEA] flex items-center justify-center shadow-clay-btn mb-4">
              <Sparkles size={24} className="text-white" strokeWidth={2.5} />
            </div>
            <h1 className="text-2xl font-900 text-clay-text">Create your account</h1>
            <p className="text-clay-muted text-sm font-500 mt-1">Create an account to apply for jobs</p>
          </div>

          {/* Google OAuth */}
          <button
            onClick={handleGoogle}
            disabled={googleLoading || isSubmitting}
            className="clay-btn clay-btn-outline w-full py-3 flex items-center justify-center gap-3 mb-6 font-700 text-sm"
          >
            {googleLoading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )}
            Continue with Google
          </button>

          {/* Divider */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px bg-clay-lavender" />
            <span className="text-xs text-clay-muted font-600">or register with email</span>
            <div className="flex-1 h-px bg-clay-lavender" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-700 text-clay-text mb-1.5">Full Name</label>
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-clay-muted" strokeWidth={2.2} />
                <input
                  {...register('name')}
                  type="text"
                  placeholder="Jane Smith"
                  className="clay-input w-full pl-10 pr-4 py-3 text-sm"
                />
              </div>
              {errors.name && (
                <p className="text-red-500 text-xs mt-1 font-600">{errors.name.message}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-700 text-clay-text mb-1.5">Work Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-clay-muted" strokeWidth={2.2} />
                <input
                  {...register('email')}
                  type="email"
                  placeholder="jane@company.com"
                  className="clay-input w-full pl-10 pr-4 py-3 text-sm"
                />
              </div>
              {errors.email && (
                <p className="text-red-500 text-xs mt-1 font-600">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-700 text-clay-text mb-1.5">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-clay-muted" strokeWidth={2.2} />
                <input
                  {...register('password')}
                  type={showPw ? 'text' : 'password'}
                  placeholder="Create a strong password"
                  className="clay-input w-full pl-10 pr-10 py-3 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-clay-muted hover:text-clay-text"
                >
                  {showPw ? <EyeOff size={16} strokeWidth={2.2} /> : <Eye size={16} strokeWidth={2.2} />}
                </button>
              </div>

              {/* Password strength indicators */}
              {passwordValue && (
                <div className="flex gap-3 mt-2">
                  {passwordRules.map((rule) => (
                    <div key={rule.label} className="flex items-center gap-1">
                      <CheckCircle
                        size={12}
                        strokeWidth={2.5}
                        className={rule.test(passwordValue) ? 'text-green-500' : 'text-clay-muted/40'}
                      />
                      <span className={`text-[10px] font-600 ${rule.test(passwordValue) ? 'text-green-600' : 'text-clay-muted/60'}`}>
                        {rule.label}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {errors.password && (
                <p className="text-red-500 text-xs mt-1 font-600">{errors.password.message}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-700 text-clay-text mb-1.5">Confirm Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-clay-muted" strokeWidth={2.2} />
                <input
                  {...register('confirmPassword')}
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="Repeat your password"
                  className="clay-input w-full pl-10 pr-10 py-3 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-clay-muted hover:text-clay-text"
                >
                  {showConfirm ? <EyeOff size={16} strokeWidth={2.2} /> : <Eye size={16} strokeWidth={2.2} />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-red-500 text-xs mt-1 font-600">{errors.confirmPassword.message}</p>
              )}
            </div>

            {/* Terms */}
            <p className="text-xs text-clay-muted font-500 leading-relaxed">
              By creating an account, you agree to our{' '}
              <a href="#" className="text-clay-purple font-700 hover:underline">Terms of Service</a>
              {' '}and{' '}
              <a href="#" className="text-clay-purple font-700 hover:underline">Privacy Policy</a>.
            </p>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting || googleLoading}
              className="clay-btn clay-btn-primary w-full py-3.5 text-sm font-800 text-white mt-1 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <><Loader2 size={16} className="animate-spin" /> Creating account...</>
              ) : (
                'Create Free Account'
              )}
            </button>
          </form>

          {/* Footer */}
          <p className="text-center text-sm text-clay-muted font-500 mt-6">
            Already have an account?{' '}
            <Link href="/login" className="text-clay-purple font-700 hover:underline">
              Sign in
            </Link>
          </p>
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
