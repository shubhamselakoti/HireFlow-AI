'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Wand2, Loader2, Save, ArrowLeft, Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/axios';
import { useSession } from 'next-auth/react';

const schema = z.object({
  title: z.string().min(2, 'Job title required'),
  department: z.string().optional(),
  location: z.string().optional(),
  jobType: z.enum(['full_time', 'part_time', 'contract', 'intern']),
  experience: z.coerce.number().min(0),
});
type FormData = z.infer<typeof schema>;

export default function NewJobPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');
  const [description, setDescription] = useState('');
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { jobType: 'full_time', experience: 0 },
  });

  const watchedTitle = watch('title');
  const watchedDept = watch('department');

  const addSkill = () => {
    const trimmed = skillInput.trim();
    if (trimmed && !skills.includes(trimmed)) {
      setSkills([...skills, trimmed]);
      setSkillInput('');
    }
  };

  const removeSkill = (skill: string) => setSkills(skills.filter((s) => s !== skill));

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { e.preventDefault(); addSkill(); }
  };

  const generateJD = async () => {
    if (!watchedTitle) { toast.error('Enter a job title first'); return; }
    setGenerating(true);
    setDescription('');

    try {
      const token = (session?.user as any)?.accessToken;
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/ai/generate-jd`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({
          title: watchedTitle,
          department: watchedDept,
          skills,
          experience: 0,
          jobType: 'full_time',
        }),
      });

      if (!res.ok || !res.body) throw new Error('Stream failed');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter((l) => l.startsWith('data: '));
        for (const line of lines) {
          const data = line.slice(6);
          if (data === '[DONE]') break;
          try {
            const parsed = JSON.parse(data);
            if (parsed.content) {
              fullText += parsed.content;
              setDescription(fullText);
            }
          } catch {}
        }
      }
    } catch (err: any) {
      toast.error('JD generation failed: ' + err.message);
    } finally {
      setGenerating(false);
    }
  };

  const onSubmit = async (data: FormData) => {
    if (!description) { toast.error('Please add a job description or generate one with AI'); return; }
    setSaving(true);
    try {
      await api.post('/api/jobs', {
        ...data,
        skills,
        description,
        status: 'draft',
      });
      toast.success('Job posting created!');
      router.push('/dashboard/recruitment/jobs');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <button onClick={() => router.back()}
        className="flex items-center gap-2 text-clay-muted hover:text-clay-text text-sm font-600 transition-colors">
        <ArrowLeft size={16} strokeWidth={2.2} /> Back to Jobs
      </button>

      <div>
        <h1 className="text-2xl font-900 text-clay-text">Post New Job</h1>
        <p className="text-clay-muted text-sm font-500">Use AI to generate a professional job description instantly</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic info */}
        <div className="clay-card p-6 space-y-5">
          <h3 className="font-800 text-clay-text">Job Details</h3>
          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-700 text-clay-text mb-1.5">Job Title *</label>
              <input {...register('title')} placeholder="e.g. Senior Frontend Engineer"
                className="clay-input w-full px-4 py-3 text-sm" />
              {errors.title && <p className="text-red-500 text-xs mt-1 font-600">{errors.title.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-700 text-clay-text mb-1.5">Department</label>
              <input {...register('department')} placeholder="e.g. Engineering"
                className="clay-input w-full px-4 py-3 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-700 text-clay-text mb-1.5">Location</label>
              <input {...register('location')} placeholder="e.g. Bangalore / Remote"
                className="clay-input w-full px-4 py-3 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-700 text-clay-text mb-1.5">Job Type</label>
              <select {...register('jobType')} className="clay-input w-full px-3 py-3 text-sm">
                <option value="full_time">Full Time</option>
                <option value="part_time">Part Time</option>
                <option value="contract">Contract</option>
                <option value="intern">Internship</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-700 text-clay-text mb-1.5">Min Experience (years)</label>
              <input {...register('experience')} type="number" min={0} max={30}
                className="clay-input w-full px-4 py-3 text-sm" />
            </div>
          </div>

          {/* Skills */}
          <div>
            <label className="block text-sm font-700 text-clay-text mb-1.5">Required Skills</label>
            <div className="flex gap-2">
              <input value={skillInput} onChange={(e) => setSkillInput(e.target.value)} onKeyDown={handleKeyDown}
                placeholder="Type a skill and press Enter"
                className="clay-input flex-1 px-4 py-2.5 text-sm" />
              <button type="button" onClick={addSkill}
                className="clay-btn clay-btn-outline px-4 py-2.5 text-sm flex items-center gap-1">
                <Plus size={14} strokeWidth={2.5} /> Add
              </button>
            </div>
            {skills.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {skills.map((s) => (
                  <span key={s} className="flex items-center gap-1.5 badge-lavender text-xs font-700 px-3 py-1.5 rounded-pill">
                    {s}
                    <button type="button" onClick={() => removeSkill(s)} className="hover:text-red-500 transition-colors">
                      <X size={11} strokeWidth={2.5} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* JD Generator */}
        <div className="clay-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-800 text-clay-text flex items-center gap-2">
                <Wand2 size={18} className="text-clay-purple" strokeWidth={2.2} /> AI Job Description Generator
              </h3>
              <p className="text-xs text-clay-muted font-500 mt-0.5">Powered by Groq llama-3.1 · Streams in real time</p>
            </div>
            <button type="button" onClick={generateJD} disabled={generating || !watchedTitle}
              className="clay-btn clay-btn-primary px-5 py-2.5 text-sm font-700 text-white flex items-center gap-2 disabled:opacity-50">
              {generating ? <><Loader2 size={15} className="animate-spin" /> Generating...</> : <><Wand2 size={15} strokeWidth={2.5} /> Generate JD</>}
            </button>
          </div>

          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Click 'Generate JD' to create an AI-powered description, or type your own here..."
            rows={14}
            className="clay-input w-full px-4 py-3 text-sm leading-relaxed resize-none font-mono"
          />

          {generating && (
            <div className="flex items-center gap-2 text-sm text-clay-purple font-600">
              <div className="w-2 h-2 rounded-full bg-clay-purple animate-pulse" />
              AI is writing your job description...
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button type="submit" disabled={saving || generating}
            className="clay-btn clay-btn-primary px-7 py-3 text-sm font-800 text-white flex items-center gap-2">
            {saving ? <><Loader2 size={15} className="animate-spin" /> Saving...</> : <><Save size={15} strokeWidth={2.5} /> Save as Draft</>}
          </button>
          <button type="button" disabled={saving || generating}
            onClick={async (e) => {
              const form = (e.target as HTMLElement).closest('form');
              if (form) {
                const submitBtn = form.querySelector('[type="submit"]') as HTMLButtonElement;
                const data = await new Promise<FormData>((resolve) => handleSubmit(resolve)());
                if (data) {
                  setSaving(true);
                  try {
                    await api.post('/api/jobs', { ...data, skills, description, status: 'open' });
                    toast.success('Job published!');
                    router.push('/dashboard/recruitment/jobs');
                  } catch (err: any) { toast.error(err.message); }
                  finally { setSaving(false); }
                }
              }
            }}
            className="clay-btn clay-btn-outline px-7 py-3 text-sm font-700">
            Publish Now
          </button>
        </div>
      </form>
    </div>
  );
}
