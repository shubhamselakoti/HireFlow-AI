'use client';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Edit2, Save, X, Upload, Loader2, User, Phone, Building, CreditCard, FileText, KeyRound, Eye, EyeOff } from 'lucide-react';
import { format } from 'date-fns';
import api from '@/lib/axios';
import type { Employee } from '@/types';

// ── Change Password Component ─────────────────────────────────────────────────
function ChangePasswordSection() {
  const [show, setShow] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const pwSchema = z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string()
      .min(8, 'At least 8 characters')
      .regex(/[A-Z]/, 'Must have an uppercase letter')
      .regex(/[0-9]/, 'Must have a number'),
    confirmPassword: z.string(),
  }).refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(pwSchema),
  });

  const onSubmit = async (data: any) => {
    try {
      await api.post('/api/auth/change-password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      toast.success('Password changed successfully! 🔐');
      reset();
      setShow(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to change password');
    }
  };

  return (
    <div className="clay-card p-6">
      <div className="flex items-center justify-between">
        <h3 className="font-800 text-clay-text flex items-center gap-2">
          <KeyRound size={16} className="text-clay-purple" strokeWidth={2.2} /> Password & Security
        </h3>
        <button
          onClick={() => { setShow(!show); reset(); }}
          className="clay-btn clay-btn-outline px-4 py-2 text-sm flex items-center gap-2"
        >
          {show ? <><X size={14} strokeWidth={2.5} /> Cancel</> : <><KeyRound size={14} strokeWidth={2.2} /> Change Password</>}
        </button>
      </div>

      {!show && (
        <p className="text-sm text-clay-muted font-500 mt-3">
          Keep your account secure. Use a strong password with uppercase letters, numbers, and symbols.
        </p>
      )}

      {show && (
        <form onSubmit={handleSubmit(onSubmit)} className="mt-5 space-y-4">
          {/* Current password */}
          <div>
            <label className="block text-sm font-700 text-clay-text mb-1.5">Current Password *</label>
            <div className="relative">
              <input
                {...register('currentPassword')}
                type={showCurrent ? 'text' : 'password'}
                placeholder="Enter your current password"
                className="clay-input w-full px-4 pr-10 py-3 text-sm"
              />
              <button type="button" onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-clay-muted hover:text-clay-text">
                {showCurrent ? <EyeOff size={16} strokeWidth={2.2} /> : <Eye size={16} strokeWidth={2.2} />}
              </button>
            </div>
            {errors.currentPassword && (
              <p className="text-red-500 text-xs mt-1 font-600">{errors.currentPassword.message as string}</p>
            )}
          </div>

          {/* New password */}
          <div>
            <label className="block text-sm font-700 text-clay-text mb-1.5">New Password *</label>
            <div className="relative">
              <input
                {...register('newPassword')}
                type={showNew ? 'text' : 'password'}
                placeholder="Min 8 chars, 1 uppercase, 1 number"
                className="clay-input w-full px-4 pr-10 py-3 text-sm"
              />
              <button type="button" onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-clay-muted hover:text-clay-text">
                {showNew ? <EyeOff size={16} strokeWidth={2.2} /> : <Eye size={16} strokeWidth={2.2} />}
              </button>
            </div>
            {errors.newPassword && (
              <p className="text-red-500 text-xs mt-1 font-600">{errors.newPassword.message as string}</p>
            )}
          </div>

          {/* Confirm password */}
          <div>
            <label className="block text-sm font-700 text-clay-text mb-1.5">Confirm New Password *</label>
            <div className="relative">
              <input
                {...register('confirmPassword')}
                type={showConfirm ? 'text' : 'password'}
                placeholder="Repeat new password"
                className="clay-input w-full px-4 pr-10 py-3 text-sm"
              />
              <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-clay-muted hover:text-clay-text">
                {showConfirm ? <EyeOff size={16} strokeWidth={2.2} /> : <Eye size={16} strokeWidth={2.2} />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-red-500 text-xs mt-1 font-600">{errors.confirmPassword.message as string}</p>
            )}
          </div>

          <div className="bg-clay-yellow/50 border border-yellow-200 rounded-xl p-3">
            <p className="text-xs text-yellow-800 font-600">
              💡 If you received a temporary password in your welcome email, please change it here immediately.
            </p>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="clay-btn clay-btn-primary px-7 py-3 text-sm font-800 text-white flex items-center gap-2"
          >
            {isSubmitting
              ? <><Loader2 size={15} className="animate-spin" /> Changing...</>
              : <><KeyRound size={15} strokeWidth={2.5} /> Change Password</>
            }
          </button>
        </form>
      )}
    </div>
  );
}
// ─────────────────────────────────────────────────────────────────────────────

const schema = z.object({
  phone: z.string().optional(),
  designation: z.string().optional(),
  bankDetails: z.object({
    accountNumber: z.string().optional(),
    ifscCode: z.string().optional(),
    bankName: z.string().optional(),
  }).optional(),
});
type FormData = z.infer<typeof schema>;

export default function EmployeeProfilePage() {
  const [profile, setProfile] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [uploading, setUploading] = useState(false);

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    api.get('/api/employees/my/profile')
      .then((r) => {
        setProfile(r.data.data);
        reset({
          phone: r.data.data.phone || '',
          designation: r.data.data.designation || '',
          bankDetails: r.data.data.bankDetails || {},
        });
      })
      .catch(() => toast.error('Failed to load profile'))
      .finally(() => setLoading(false));
  }, []);

  const onSubmit = async (data: FormData) => {
    try {
      const r = await api.patch(`/api/employees/${profile?._id}`, data);
      setProfile(r.data.data);
      setEditing(false);
      toast.success('Profile updated!');
    } catch (err: any) { toast.error(err.message); }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      const r = await api.patch(`/api/employees/${profile._id}/avatar`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setProfile((prev) => prev ? { ...prev, avatar: r.data.data.avatar } : prev);
      toast.success('Photo updated!');
    } catch { toast.error('Upload failed'); }
    finally { setUploading(false); }
  };

  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;
    const name = prompt('Document name (e.g. "Offer Letter"):');
    if (!name) return;
    try {
      const formData = new FormData();
      formData.append('document', file);
      formData.append('name', name);
      const r = await api.post(`/api/employees/${profile._id}/documents`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setProfile((prev) => prev ? { ...prev, documents: r.data.data } : prev);
      toast.success('Document uploaded!');
    } catch { toast.error('Upload failed'); }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="clay-skeleton h-48 rounded-3xl" />
        <div className="clay-skeleton h-64 rounded-3xl" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="clay-card p-16 text-center">
        <p className="text-clay-muted text-lg font-600">No employee profile linked to your account.</p>
        <p className="text-clay-muted text-sm mt-2">Contact HR to link your profile.</p>
      </div>
    );
  }

  const dept = profile.department as any;
  const manager = profile.managerId as any;

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-900 text-clay-text">My Profile</h1>
          <p className="text-clay-muted text-sm font-500">View and update your personal information</p>
        </div>
        {!editing ? (
          <button onClick={() => setEditing(true)}
            className="clay-btn clay-btn-outline px-4 py-2.5 text-sm flex items-center gap-2">
            <Edit2 size={14} strokeWidth={2.2} /> Edit Profile
          </button>
        ) : (
          <button onClick={() => { setEditing(false); reset(); }}
            className="clay-btn clay-btn-outline px-4 py-2.5 text-sm flex items-center gap-2 text-red-500">
            <X size={14} strokeWidth={2.5} /> Cancel
          </button>
        )}
      </div>

      {/* Profile Header */}
      <div className="clay-card p-6">
        <div className="flex items-start gap-6">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div className="w-24 h-24 rounded-2xl overflow-hidden shadow-clay">
              {profile.avatar ? (
                <img src={profile.avatar} alt={profile.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-clay-lavender to-clay-purple/20 flex items-center justify-center">
                  <span className="text-4xl font-900 text-clay-purple">{profile.name[0]}</span>
                </div>
              )}
            </div>
            <label className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-white shadow-clay flex items-center justify-center cursor-pointer hover:bg-clay-lavender transition-colors">
              {uploading ? (
                <Loader2 size={14} className="text-clay-purple animate-spin" />
              ) : (
                <Upload size={14} className="text-clay-purple" strokeWidth={2.2} />
              )}
              <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
            </label>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-900 text-clay-text">{profile.name}</h2>
            <p className="text-clay-muted font-600">{profile.designation || 'Employee'}</p>
            <p className="text-clay-purple font-700 text-sm mt-1">{profile.employeeCode}</p>
            <div className="flex flex-wrap gap-3 mt-3">
              <span className="badge-mint text-xs font-700 px-3 py-1 rounded-pill">{profile.status}</span>
              <span className="badge-lavender text-xs font-700 px-3 py-1 rounded-pill">
                {profile.employmentType?.replace('_', ' ')}
              </span>
              <span className="badge-sky text-xs font-700 px-3 py-1 rounded-pill">
                {dept?.name || 'No Department'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Editable form / Read-only view */}
      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Personal Info */}
        <div className="clay-card p-6 mb-6">
          <h3 className="font-800 text-clay-text mb-5 flex items-center gap-2">
            <User size={16} className="text-clay-purple" strokeWidth={2.2} /> Personal Information
          </h3>
          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-700 text-clay-muted uppercase tracking-wide mb-1.5">Full Name</label>
              <p className="font-700 text-clay-text">{profile.name}</p>
            </div>
            <div>
              <label className="block text-xs font-700 text-clay-muted uppercase tracking-wide mb-1.5">Email</label>
              <p className="font-700 text-clay-text">{profile.email}</p>
            </div>
            <div>
              <label className="block text-xs font-700 text-clay-muted uppercase tracking-wide mb-1.5">Phone</label>
              {editing ? (
                <input {...register('phone')} className="clay-input w-full px-4 py-2.5 text-sm" placeholder="+91 98765 43210" />
              ) : (
                <p className="font-700 text-clay-text">{profile.phone || '—'}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-700 text-clay-muted uppercase tracking-wide mb-1.5">Designation</label>
              {editing ? (
                <input {...register('designation')} className="clay-input w-full px-4 py-2.5 text-sm" placeholder="e.g. Software Engineer" />
              ) : (
                <p className="font-700 text-clay-text">{profile.designation || '—'}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-700 text-clay-muted uppercase tracking-wide mb-1.5">Join Date</label>
              <p className="font-700 text-clay-text">{format(new Date(profile.joiningDate), 'dd MMMM yyyy')}</p>
            </div>
            <div>
              <label className="block text-xs font-700 text-clay-muted uppercase tracking-wide mb-1.5">Manager</label>
              <p className="font-700 text-clay-text">{manager?.name || '—'}</p>
            </div>
          </div>
        </div>

        {/* Bank Details */}
        <div className="clay-card p-6 mb-6">
          <h3 className="font-800 text-clay-text mb-5 flex items-center gap-2">
            <CreditCard size={16} className="text-clay-purple" strokeWidth={2.2} /> Bank Details
          </h3>
          <div className="grid sm:grid-cols-3 gap-5">
            <div>
              <label className="block text-xs font-700 text-clay-muted uppercase tracking-wide mb-1.5">Bank Name</label>
              {editing ? (
                <input {...register('bankDetails.bankName')} className="clay-input w-full px-4 py-2.5 text-sm" placeholder="HDFC Bank" />
              ) : (
                <p className="font-700 text-clay-text">{profile.bankDetails?.bankName || '—'}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-700 text-clay-muted uppercase tracking-wide mb-1.5">Account Number</label>
              {editing ? (
                <input {...register('bankDetails.accountNumber')} className="clay-input w-full px-4 py-2.5 text-sm" placeholder="XXXXXXXXXXXX" />
              ) : (
                <p className="font-700 text-clay-text">
                  {profile.bankDetails?.accountNumber
                    ? `••••${profile.bankDetails.accountNumber.slice(-4)}`
                    : '—'}
                </p>
              )}
            </div>
            <div>
              <label className="block text-xs font-700 text-clay-muted uppercase tracking-wide mb-1.5">IFSC Code</label>
              {editing ? (
                <input {...register('bankDetails.ifscCode')} className="clay-input w-full px-4 py-2.5 text-sm" placeholder="HDFC0001234" />
              ) : (
                <p className="font-700 text-clay-text">{profile.bankDetails?.ifscCode || '—'}</p>
              )}
            </div>
          </div>
        </div>

        {editing && (
          <button type="submit" disabled={isSubmitting}
            className="clay-btn clay-btn-primary px-8 py-3 text-sm font-800 text-white flex items-center gap-2">
            {isSubmitting ? <><Loader2 size={15} className="animate-spin" /> Saving...</> : <><Save size={15} strokeWidth={2.5} /> Save Changes</>}
          </button>
        )}
      </form>

      {/* Change Password */}
      <ChangePasswordSection />

      {/* Documents */}
      <div className="clay-card p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-800 text-clay-text flex items-center gap-2">
            <FileText size={16} className="text-clay-purple" strokeWidth={2.2} /> Documents
          </h3>
          <label className="clay-btn clay-btn-outline px-4 py-2 text-sm flex items-center gap-2 cursor-pointer">
            <Upload size={14} strokeWidth={2.2} /> Upload
            <input type="file" className="hidden" onChange={handleDocumentUpload} />
          </label>
        </div>

        {(!profile.documents || profile.documents.length === 0) ? (
          <div className="text-center py-6 text-clay-muted font-500 text-sm">
            No documents uploaded yet. Upload offer letter, certificates, etc.
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {profile.documents.map((doc, i) => (
              <a key={i} href={doc.url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-3 p-4 bg-clay-bg rounded-2xl hover:bg-clay-lavender/30 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-clay-lavender flex items-center justify-center flex-shrink-0">
                  <FileText size={16} className="text-clay-purple" strokeWidth={2.2} />
                </div>
                <div>
                  <p className="font-700 text-clay-text text-sm">{doc.name}</p>
                  <p className="text-xs text-clay-muted">{format(new Date(doc.uploadedAt), 'dd MMM yyyy')}</p>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
