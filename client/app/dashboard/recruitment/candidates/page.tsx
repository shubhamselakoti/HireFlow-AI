'use client';
import { getDownloadUrl } from '@/lib/utils';
import { useEffect, useState, useRef } from 'react';
import { Upload, Search, Brain, Download, Loader2, FileText, X, Eye } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/axios';
import EmptyState from '@/components/shared/EmptyState';
import type { Candidate, Job } from '@/types';

const SCORE_BADGE = (score: number) =>
  score >= 70 ? 'badge-mint' : score >= 40 ? 'badge-yellow' : 'badge-rose';

export default function CandidatesPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState('');
  const [search, setSearch] = useState('');
  const [selectedJob, setSelectedJob] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchCandidates();
  }, [search]);

  useEffect(() => {
    api.get('/api/jobs/all?limit=100').then((r) => setJobs(r.data.data)).catch(() => {});
  }, []);

  const fetchCandidates = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: '100', ...(search && { search }) });
      const r = await api.get(`/api/candidates?${params}`);
      setCandidates(r.data.data);
      setTotal(r.data.total);
    } catch {
      toast.error('Failed to load candidates');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const pdfFiles = Array.from(files).filter((f) => f.type === 'application/pdf');
    if (pdfFiles.length === 0) { toast.error('Please upload PDF files only'); return; }
    if (pdfFiles.length > 20) { toast.error('Maximum 20 resumes at once'); return; }

    setUploading(true);
    setUploadProgress(0);
    setUploadStatus(`Uploading ${pdfFiles.length} resume${pdfFiles.length > 1 ? 's' : ''}...`);

    const formData = new FormData();
    pdfFiles.forEach((f) => formData.append('resumes', f));
    if (selectedJob) formData.append('jobId', selectedJob);

    const progressInterval = setInterval(() => {
      setUploadProgress((p) => {
        if (p < 40) return p + 5;
        if (p < 75) return p + 3;
        return p + 1;
      });
    }, 300);

    try {
      setUploadProgress(30);
      setUploadStatus('Extracting text from PDFs...');
      await new Promise((r) => setTimeout(r, 500));
      setUploadStatus('AI scoring candidates against job requirements...');
      setUploadProgress(60);

      const r = await api.post('/api/candidates/bulk-upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      const { processed, failedCount, candidates: newCandidates } = r.data.data;
      toast.success(
        `✅ Screened ${processed} resume${processed !== 1 ? 's' : ''}${failedCount > 0 ? ` · ${failedCount} failed` : ''}`,
      );

      setCandidates((prev) => {
        const existingIds = new Set(prev.map((c) => c._id));
        const fresh = (newCandidates || []).filter((c: Candidate) => !existingIds.has(c._id));
        return [...fresh, ...prev].sort((a, b) => b.aiScore - a.aiScore);
      });
      setTotal((t) => t + processed);
    } catch (err: any) {
      clearInterval(progressInterval);
      toast.error(err.message || 'Upload failed');
    } finally {
      setUploading(false);
      setUploadProgress(0);
      setUploadStatus('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const exportCSV = () => {
    const headers = ['Name', 'Email', 'Phone', 'Skills', 'Experience (yrs)', 'AI Score'];
    const rows = candidates.map((c) => [
      `"${c.name}"`,
      c.email,
      c.phone || '',
      `"${c.skills.join('; ')}"`,
      c.yearsExperience,
      c.aiScore,
    ]);
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `candidates_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-900 text-clay-text">AI Resume Screener</h1>
          <p className="text-clay-muted text-sm font-500">
            {total} candidate{total !== 1 ? 's' : ''} · ranked by AI match score
          </p>
        </div>
        <button
          onClick={exportCSV}
          className="clay-btn clay-btn-outline px-4 py-2.5 text-sm flex items-center gap-2"
        >
          <Download size={15} strokeWidth={2.2} /> Export CSV
        </button>
      </div>

      {/* Upload zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); handleUpload(e.dataTransfer.files); }}
        onClick={() => !uploading && fileInputRef.current?.click()}
        className={`clay-card p-8 text-center cursor-pointer transition-all duration-200 border-2 border-dashed ${
          dragOver ? 'border-clay-purple bg-clay-lavender/30 scale-[1.01]' :
          'border-clay-lavender/60 hover:border-clay-purple/40 hover:bg-clay-lavender/10'
        } ${uploading ? 'pointer-events-none' : ''}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,application/pdf"
          className="hidden"
          onChange={(e) => handleUpload(e.target.files)}
        />

        {uploading ? (
          <div className="space-y-5">
            <Brain size={40} className="text-clay-purple mx-auto animate-pulse" strokeWidth={1.8} />
            <div>
              <p className="font-800 text-clay-text text-lg">AI is screening resumes...</p>
              <p className="text-clay-muted text-sm font-500 mt-1">{uploadStatus}</p>
            </div>
            <div className="max-w-sm mx-auto">
              <div className="h-3 bg-clay-lavender rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-clay-purple to-clay-purple-light rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${Math.min(uploadProgress, 99)}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-clay-muted mt-2 font-600">
                <span>Processing...</span>
                <span>{Math.min(uploadProgress, 99)}%</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-clay-lavender flex items-center justify-center mx-auto shadow-clay-sm">
              <Upload size={28} className="text-clay-purple" strokeWidth={1.8} />
            </div>
            <div>
              <p className="font-800 text-clay-text text-lg">Drop PDF resumes here or click to upload</p>
              <p className="text-clay-muted text-sm font-500 mt-1">
                Up to 20 PDF resumes · AI extracts skills, scores fit, ranks by relevance
              </p>
            </div>

            {/* Job selector */}
            <div
              className="flex items-center justify-center gap-3"
              onClick={(e) => e.stopPropagation()}
            >
              <select
                value={selectedJob}
                onChange={(e) => setSelectedJob(e.target.value)}
                className="clay-input px-4 py-2.5 text-sm max-w-56"
              >
                <option value="">General screen (no job)</option>
                {jobs.map((j) => (
                  <option key={j._id} value={j._id}>{j.title}</option>
                ))}
              </select>
              <span className="text-xs text-clay-muted font-500 hidden sm:block">
                {selectedJob ? '← Match against selected job' : '← Select a job for better scoring'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Search */}
      <div className="clay-card p-4">
        <div className="relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-clay-muted" strokeWidth={2.2} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search candidates by name or email..."
            className="clay-input w-full pl-10 pr-4 py-2.5 text-sm"
          />
        </div>
      </div>

      {/* Score legend */}
      <div className="flex items-center gap-4 text-xs font-600 text-clay-muted">
        <span className="font-700 text-clay-text">AI Score:</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-green-400" /> 70–100 Strong match</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-yellow-400" /> 40–69 Moderate</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-red-400" /> 0–39 Weak</span>
      </div>

      {/* Candidates table */}
      <div className="clay-table overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr>
              <th className="text-left px-5 py-3">Candidate</th>
              <th className="text-left px-4 py-3">Skills</th>
              <th className="text-left px-4 py-3">Exp.</th>
              <th className="text-left px-4 py-3">AI Score</th>
              <th className="text-left px-4 py-3">Resume</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(6)].map((_, i) => (
                <tr key={i}>
                  {[...Array(5)].map((__, j) => (
                    <td key={j} className="px-5 py-3">
                      <div className="clay-skeleton h-4 rounded" />
                    </td>
                  ))}
                </tr>
              ))
            ) : candidates.length === 0 ? (
              <tr>
                <td colSpan={5}>
                  <EmptyState
                    icon="📄"
                    title="No candidates yet"
                    description="Upload PDF resumes above to start screening candidates with AI."
                  />
                </td>
              </tr>
            ) : (
              candidates.map((c, idx) => (
                <tr key={c._id} className="border-b border-clay-lavender/20 hover:bg-clay-lavender/10 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-clay-lavender flex items-center justify-center font-800 text-clay-purple text-sm flex-shrink-0">
                        {c.name[0]?.toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-700 text-clay-text text-sm">{c.name}</p>
                          {idx < 3 && (
                            <span className="text-[10px] font-800 px-1.5 py-0.5 rounded-full bg-yellow-100 text-yellow-700">
                              #{idx + 1}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-clay-muted">{c.email}</p>
                        {c.phone && <p className="text-xs text-clay-muted">{c.phone}</p>}
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1 max-w-44">
                      {c.skills.slice(0, 3).map((s) => (
                        <span key={s} className="badge-lavender text-[10px] font-700 px-1.5 py-0.5 rounded-pill">{s}</span>
                      ))}
                      {c.skills.length > 3 && (
                        <span className="text-[10px] text-clay-muted font-600">+{c.skills.length - 3} more</span>
                      )}
                      {c.skills.length === 0 && (
                        <span className="text-xs text-clay-muted">—</span>
                      )}
                    </div>
                  </td>

                  <td className="px-4 py-3 text-sm font-600 text-clay-text">
                    {c.yearsExperience > 0 ? `${c.yearsExperience} yr${c.yearsExperience !== 1 ? 's' : ''}` : 'N/A'}
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-clay-lavender rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            c.aiScore >= 70 ? 'bg-green-400' :
                            c.aiScore >= 40 ? 'bg-yellow-400' : 'bg-red-400'
                          }`}
                          style={{ width: `${c.aiScore}%` }}
                        />
                      </div>
                      <span className={`text-xs font-800 px-2 py-0.5 rounded-pill min-w-[38px] text-center ${SCORE_BADGE(c.aiScore)}`}>
                        {c.aiScore}
                      </span>
                    </div>
                  </td>

                  <td className="px-4 py-3">
                    {c.resumeUrl ? (
                      <a
                        href={getDownloadUrl(c.resumeUrl, `resume_${c.name.replace(/\s+/g, '_')}`)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-clay-purple font-700 hover:underline bg-clay-lavender/40 px-2.5 py-1.5 rounded-pill transition-colors hover:bg-clay-lavender"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Download size={12} strokeWidth={2.5} /> Download
                      </a>
                    ) : (
                      <span className="text-xs text-clay-muted">No resume</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Hiring workflow info */}
      <div className="clay-card p-5 bg-clay-sky/30 border border-blue-200/50">
        <h4 className="font-800 text-clay-text mb-3 flex items-center gap-2">
          <span className="text-xl">💡</span> How to hire a candidate
        </h4>
        <div className="flex flex-wrap gap-3">
          {[
            { step: '1', label: 'Screen resumes', desc: 'Upload PDFs above — AI ranks automatically', color: 'bg-clay-lavender' },
            { step: '2', label: 'Schedule interview', desc: 'Go to Interviews → Create for shortlisted candidates', color: 'bg-clay-peach' },
            { step: '3', label: 'Mark as Hired', desc: 'In Applications → change status to "Hired"', color: 'bg-clay-mint' },
            { step: '4', label: 'Employee auto-created', desc: 'Employee record + onboarding checklist created instantly', color: 'bg-clay-yellow' },
          ].map(({ step, label, desc, color }) => (
            <div key={step} className={`flex items-start gap-3 flex-1 min-w-48 ${color} rounded-xl p-3`}>
              <div className="w-7 h-7 rounded-full bg-white/70 flex items-center justify-center font-900 text-clay-text text-xs flex-shrink-0">
                {step}
              </div>
              <div>
                <p className="font-700 text-clay-text text-sm">{label}</p>
                <p className="text-xs text-clay-muted font-500 mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
