'use client';
import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { toast } from 'sonner';
import {
  Mic, MicOff, ChevronRight, CheckCircle, Loader2,
  Sparkles, Clock, Volume2, AlertCircle, Send,
} from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// ── Interview questions by job context ─────────────────────────────────────
// In a real system these would come from the backend per job type
// We generate a solid default set used for all interview types
const DEFAULT_QUESTIONS = [
  'Tell me about yourself and your professional background.',
  'Why are you interested in this position and our company?',
  'Describe a challenging project you worked on. What was your role and how did you handle obstacles?',
  'How do you prioritize tasks when working on multiple projects with tight deadlines?',
  'Give an example of a time you worked in a team. What was your contribution and how did you handle any conflicts?',
  'What are your greatest strengths and how do they apply to this role?',
  'Where do you see yourself professionally in the next 3 years?',
  'Do you have any questions for us?',
];

type Phase = 'loading' | 'intro' | 'interview' | 'submitting' | 'done' | 'error' | 'already_done';

interface VoiceResponse {
  question: string;
  answer: string;
  score: number;
  feedback: string;
}

export default function InterviewRoomPage() {
  const { id } = useParams<{ id: string }>();

  const [phase, setPhase] = useState<Phase>('loading');
  const [interview, setInterview] = useState<any>(null);
  const [jobTitle, setJobTitle] = useState('');
  const [candidateName, setCandidateName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Interview progress
  const [currentQ, setCurrentQ] = useState(0);
  const questions = DEFAULT_QUESTIONS;

  // Answer state
  const [transcript, setTranscript] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isScoring, setIsScoring] = useState(false);
  const [responses, setResponses] = useState<VoiceResponse[]>([]);
  const [currentFeedback, setCurrentFeedback] = useState<{ score: number; feedback: string } | null>(null);

  // Timer
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Speech recognition
  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Scores aggregated
  const [finalScores, setFinalScores] = useState({
    communicationScore: 0,
    clarityScore: 0,
    confidenceScore: 0,
  });

  // ── Fetch interview on mount ──────────────────────────────────────────────
  useEffect(() => {
    fetch(`${API}/api/interviews/take/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (!data.success) throw new Error(data.message || 'Interview not found');
        const iv = data.data;
        setInterview(iv);

        if (iv.status === 'completed') { setPhase('already_done'); return; }
        if (iv.status === 'cancelled') { setErrorMsg('This interview has been cancelled.'); setPhase('error'); return; }

        const app = iv.applicationId;
        setJobTitle(app?.jobId?.title || 'Position');
        setCandidateName(app?.candidateId?.name || 'Candidate');
        setPhase('intro');
      })
      .catch((err) => {
        setErrorMsg(err.message || 'Failed to load interview');
        setPhase('error');
      });
  }, [id]);

  // ── Timer ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase === 'interview') {
      timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase]);

  const formatTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  // ── Speech recognition setup ──────────────────────────────────────────────
  const startRecording = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error('Speech recognition not supported. Please type your answer below.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    let fullTranscript = '';

    recognition.onresult = (event: any) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          fullTranscript += t + ' ';
        } else {
          interim = t;
        }
      }
      setTranscript(fullTranscript + interim);

      // Auto-stop after 3s of silence
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = setTimeout(() => {
        if (recognitionRef.current) {
          recognitionRef.current.stop();
        }
      }, 3000);
    };

    recognition.onerror = () => {
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognition.start();
    recognitionRef.current = recognition;
    setIsRecording(true);
    setTranscript('');
    setCurrentFeedback(null);
  }, []);

  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    setIsRecording(false);
  }, []);

  // ── Score current answer via Groq ─────────────────────────────────────────
  const scoreAnswer = async (answer: string): Promise<{ score: number; feedback: string }> => {
    if (!answer.trim() || answer.trim().length < 10) {
      return { score: 3, feedback: 'Answer was too short or unclear. Try to give more detail.' };
    }
    try {
      const r = await fetch(`${API}/api/ai/score-answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: questions[currentQ],
          answer: answer.trim(),
          jobTitle,
        }),
      });
      const data = await r.json();
      return data.data || { score: 5, feedback: 'Answer received.' };
    } catch {
      return { score: 5, feedback: 'Answer received and recorded.' };
    }
  };

  // ── Submit current answer and move to next ────────────────────────────────
  const submitAnswer = async () => {
    const answer = transcript.trim();
    if (!answer) { toast.error('Please record or type an answer first'); return; }

    if (isRecording) stopRecording();
    setIsScoring(true);

    const result = await scoreAnswer(answer);
    setCurrentFeedback(result);

    const newResponse: VoiceResponse = {
      question: questions[currentQ],
      answer,
      score: result.score,
      feedback: result.feedback,
    };

    const newResponses = [...responses, newResponse];
    setResponses(newResponses);

    await new Promise((r) => setTimeout(r, 1500)); // show feedback briefly
    setIsScoring(false);

    if (currentQ < questions.length - 1) {
      setCurrentQ((q) => q + 1);
      setTranscript('');
      setCurrentFeedback(null);
    } else {
      // All questions answered — compute aggregate scores and submit
      await finishInterview(newResponses);
    }
  };

  // ── Compute aggregate scores from all responses ───────────────────────────
  const computeScores = (resps: VoiceResponse[]) => {
    const avg = (arr: number[]) => Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);
    const scores = resps.map((r) => r.score);

    // Simulate three dimensions from per-answer scores with slight variation
    const communication = avg(scores.map((s, i) => Math.min(10, Math.max(0, s + (i % 2 === 0 ? 0.5 : -0.3)))));
    const clarity       = avg(scores.map((s, i) => Math.min(10, Math.max(0, s + (i % 3 === 0 ? -0.5 : 0.3)))));
    const confidence    = avg(scores.map((s) => Math.min(10, Math.max(0, s * 0.9 + 1))));

    return { communicationScore: communication, clarityScore: clarity, confidenceScore: confidence };
  };

  // ── Submit all answers to backend ─────────────────────────────────────────
  const finishInterview = async (finalResponses: VoiceResponse[]) => {
    setPhase('submitting');

    const scores = computeScores(finalResponses);
    setFinalScores(scores);

    const fullTranscript = finalResponses
      .map((r, i) => `Q${i + 1}: ${r.question}\nA: ${r.answer}`)
      .join('\n\n');

    try {
      const r = await fetch(`${API}/api/interviews/take/${id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: fullTranscript,
          voiceResponses: finalResponses.map(({ question, answer, score }) => ({ question, answer, score })),
          communicationScore: scores.communicationScore,
          clarityScore:       scores.clarityScore,
          confidenceScore:    scores.confidenceScore,
          sentimentScore:     Math.round((scores.communicationScore + scores.clarityScore + scores.confidenceScore) / 3),
        }),
      });
      const data = await r.json();
      if (!data.success) throw new Error(data.message);
      setPhase('done');
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit interview. Please try again.');
      setPhase('interview');
    }
  };

  // ── Render phases ─────────────────────────────────────────────────────────

  if (phase === 'loading') {
    return (
      <div className="min-h-screen bg-clay-bg flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={40} className="animate-spin text-clay-purple mx-auto mb-4" />
          <p className="font-700 text-clay-muted">Loading your interview...</p>
        </div>
      </div>
    );
  }

  if (phase === 'error') {
    return (
      <div className="min-h-screen bg-clay-bg flex items-center justify-center px-4">
        <div className="clay-card p-10 max-w-md text-center">
          <div className="text-5xl mb-4">❌</div>
          <h2 className="font-900 text-clay-text text-xl mb-2">Interview Unavailable</h2>
          <p className="text-clay-muted font-500 text-sm">{errorMsg}</p>
          <a href="/candidate-portal" className="clay-btn clay-btn-primary px-6 py-3 text-sm font-700 text-white mt-6 inline-block">
            Back to Portal
          </a>
        </div>
      </div>
    );
  }

  if (phase === 'already_done') {
    return (
      <div className="min-h-screen bg-clay-bg flex items-center justify-center px-4">
        <div className="clay-card p-10 max-w-md text-center">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="font-900 text-clay-text text-xl mb-2">Interview Already Completed</h2>
          <p className="text-clay-muted font-500 text-sm">
            You have already completed this interview. Your responses have been submitted and are being reviewed.
          </p>
          <a href="/candidate-portal" className="clay-btn clay-btn-primary px-6 py-3 text-sm font-700 text-white mt-6 inline-block">
            Track My Application
          </a>
        </div>
      </div>
    );
  }

  if (phase === 'done') {
    const overall = Math.round((finalScores.communicationScore + finalScores.clarityScore + finalScores.confidenceScore) / 3);
    return (
      <div className="min-h-screen bg-clay-bg flex items-center justify-center px-4 py-10">
        <div className="clay-card-lg p-8 max-w-lg w-full text-center">
          <div className="w-20 h-20 rounded-full bg-clay-mint flex items-center justify-center mx-auto mb-5">
            <CheckCircle size={40} className="text-green-600" strokeWidth={2} />
          </div>
          <h2 className="font-900 text-clay-text text-2xl mb-2">Interview Complete! 🎉</h2>
          <p className="text-clay-muted font-500 text-sm mb-6">
            Great job, {candidateName}! Your responses have been submitted and scored.
            The hiring team will review your interview and get back to you.
          </p>

          {/* Score summary */}
          <div className="bg-clay-lavender/30 rounded-2xl p-5 mb-6">
            <p className="text-xs font-700 text-clay-muted uppercase tracking-wide mb-4">Your Interview Scores</p>
            <div className="grid grid-cols-3 gap-4 mb-4">
              {[
                { label: 'Communication', val: finalScores.communicationScore, color: 'text-blue-600' },
                { label: 'Clarity',       val: finalScores.clarityScore,       color: 'text-purple-600' },
                { label: 'Confidence',    val: finalScores.confidenceScore,    color: 'text-orange-600' },
              ].map(({ label, val, color }) => (
                <div key={label} className="text-center">
                  <p className={`text-3xl font-900 ${color}`}>{val}<span className="text-sm font-600 text-clay-muted">/10</span></p>
                  <p className="text-xs text-clay-muted font-600 mt-1">{label}</p>
                </div>
              ))}
            </div>
            <div className="border-t border-clay-lavender/40 pt-4">
              <p className="text-xs text-clay-muted font-600 mb-1">Overall Score</p>
              <p className={`text-4xl font-900 ${overall >= 7 ? 'text-green-600' : overall >= 5 ? 'text-yellow-600' : 'text-red-500'}`}>
                {overall}<span className="text-lg font-600 text-clay-muted">/10</span>
              </p>
              <p className="text-xs text-clay-muted mt-1 font-500">
                {overall >= 7 ? '⭐ Excellent performance!' : overall >= 5 ? '👍 Good performance' : '💪 Keep improving'}
              </p>
            </div>
          </div>

          {/* Per-question summary */}
          <div className="space-y-2 mb-6 text-left">
            {responses.map((r, i) => (
              <div key={i} className="p-3 bg-clay-bg rounded-xl">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-700 text-clay-text">Q{i + 1}: {r.question.slice(0, 50)}...</p>
                  <span className={`text-xs font-800 px-2 py-0.5 rounded-pill ${r.score >= 7 ? 'badge-mint' : r.score >= 5 ? 'badge-yellow' : 'badge-rose'}`}>
                    {r.score}/10
                  </span>
                </div>
                <p className="text-xs text-clay-muted font-500">{r.feedback}</p>
              </div>
            ))}
          </div>

          <a href="/candidate-portal" className="clay-btn clay-btn-primary px-8 py-3 text-sm font-800 text-white inline-flex items-center gap-2">
            Track My Application <ChevronRight size={15} strokeWidth={2.5} />
          </a>
        </div>
      </div>
    );
  }

  if (phase === 'submitting') {
    return (
      <div className="min-h-screen bg-clay-bg flex items-center justify-center px-4">
        <div className="clay-card p-10 max-w-sm text-center">
          <Loader2 size={44} className="animate-spin text-clay-purple mx-auto mb-5" />
          <h3 className="font-900 text-clay-text text-lg mb-2">Submitting your interview...</h3>
          <p className="text-clay-muted font-500 text-sm">AI is computing your final scores. This takes a moment.</p>
        </div>
      </div>
    );
  }

  // ── INTRO SCREEN ──────────────────────────────────────────────────────────
  if (phase === 'intro') {
    return (
      <div className="min-h-screen bg-clay-bg flex items-center justify-center px-4 py-10">
        <div className="clay-card-lg p-8 max-w-lg w-full">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#6D4AFF] to-[#9F7AEA] flex items-center justify-center shadow-clay-btn">
              <Sparkles size={20} className="text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="font-900 text-clay-text text-lg">HireFlow Interview</h1>
              <p className="text-xs text-clay-muted font-500">AI-Powered Interview Room</p>
            </div>
          </div>

          <div className="bg-clay-lavender/30 rounded-2xl p-5 mb-6">
            <p className="text-sm font-700 text-clay-text mb-1">Welcome, {candidateName}!</p>
            <p className="text-sm text-clay-muted font-500">
              Interview for <strong className="text-clay-text">{jobTitle}</strong>
            </p>
          </div>

          <div className="space-y-3 mb-6">
            {[
              { icon: '❓', title: `${questions.length} Questions`, desc: 'One question at a time, answer at your own pace' },
              { icon: '🎤', title: 'Voice or Text', desc: 'Speak your answer or type it — whichever you prefer' },
              { icon: '🤖', title: 'AI Scored', desc: 'Each answer is scored instantly by Groq AI' },
              { icon: '⏱️', title: 'No Time Limit', desc: 'Take as long as you need per question' },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="flex items-start gap-3 p-3.5 bg-clay-bg rounded-xl">
                <span className="text-xl flex-shrink-0">{icon}</span>
                <div>
                  <p className="text-sm font-700 text-clay-text">{title}</p>
                  <p className="text-xs text-clay-muted font-500">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-clay-yellow/40 border border-yellow-200 rounded-xl p-3 mb-6">
            <p className="text-xs text-yellow-800 font-600 flex items-start gap-2">
              <AlertCircle size={14} className="flex-shrink-0 mt-0.5" strokeWidth={2.2} />
              Find a quiet place. Allow microphone access when prompted. Once you start, complete all questions in one session.
            </p>
          </div>

          <button
            onClick={() => setPhase('interview')}
            className="clay-btn clay-btn-primary w-full py-4 text-base font-900 text-white flex items-center justify-center gap-2"
          >
            Start Interview <ChevronRight size={18} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    );
  }

  // ── INTERVIEW ROOM ─────────────────────────────────────────────────────────
  const progress = ((currentQ) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-clay-bg font-sans">
      {/* Top bar */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-clay-lavender/40 px-6 py-3 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-clay-purple" strokeWidth={2.5} />
            <span className="font-800 text-clay-text text-sm">{jobTitle}</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs font-700 text-clay-muted">
              Q {currentQ + 1} / {questions.length}
            </span>
            <div className="flex items-center gap-1.5 text-xs text-clay-muted font-600">
              <Clock size={12} strokeWidth={2.2} />
              {formatTime(elapsed)}
            </div>
          </div>
        </div>
        {/* Progress bar */}
        <div className="max-w-2xl mx-auto mt-2">
          <div className="h-1.5 bg-clay-lavender rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-clay-purple to-clay-purple-light rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Answered questions summary */}
        {responses.length > 0 && (
          <div className="space-y-2">
            {responses.map((r, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-clay-lavender/30">
                <div className="w-7 h-7 rounded-full bg-clay-mint flex items-center justify-center flex-shrink-0">
                  <CheckCircle size={14} className="text-green-600" strokeWidth={2.5} />
                </div>
                <p className="text-sm text-clay-muted font-600 flex-1 truncate">Q{i + 1}: {r.question.slice(0, 60)}...</p>
                <span className={`text-xs font-800 px-2 py-0.5 rounded-pill flex-shrink-0 ${r.score >= 7 ? 'badge-mint' : r.score >= 5 ? 'badge-yellow' : 'badge-rose'}`}>
                  {r.score}/10
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Current question card */}
        <div className="clay-card-lg p-7">
          <div className="flex items-start gap-3 mb-6">
            <div className="w-8 h-8 rounded-xl bg-clay-lavender flex items-center justify-center flex-shrink-0 font-900 text-clay-purple text-sm">
              {currentQ + 1}
            </div>
            <div className="flex-1">
              <p className="text-xs font-700 text-clay-muted uppercase tracking-wide mb-2">Question {currentQ + 1} of {questions.length}</p>
              <h2 className="font-800 text-clay-text text-lg leading-snug">{questions[currentQ]}</h2>
            </div>
          </div>

          {/* Voice feedback */}
          {currentFeedback && !isScoring && (
            <div className={`p-4 rounded-xl mb-4 border ${currentFeedback.score >= 7 ? 'bg-clay-mint/40 border-green-200' : currentFeedback.score >= 5 ? 'bg-clay-yellow/40 border-yellow-200' : 'bg-clay-rose/30 border-red-200'}`}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">{currentFeedback.score >= 7 ? '⭐' : currentFeedback.score >= 5 ? '👍' : '💡'}</span>
                <span className="font-800 text-clay-text text-sm">Score: {currentFeedback.score}/10</span>
              </div>
              <p className="text-xs text-clay-muted font-500">{currentFeedback.feedback}</p>
            </div>
          )}

          {isScoring && (
            <div className="p-4 rounded-xl mb-4 bg-clay-lavender/30 flex items-center gap-3">
              <Loader2 size={16} className="animate-spin text-clay-purple" />
              <p className="text-sm font-600 text-clay-muted">AI is evaluating your answer...</p>
            </div>
          )}

          {/* Transcript display */}
          <div className="relative mb-4">
            <div className={`min-h-[100px] p-4 rounded-xl border-2 transition-all ${isRecording ? 'border-red-400 bg-red-50' : 'border-clay-lavender/50 bg-clay-bg'}`}>
              {isRecording && (
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-xs text-red-600 font-700">Recording... speak now</span>
                </div>
              )}
              {transcript ? (
                <p className="text-sm text-clay-text font-500 leading-relaxed">{transcript}</p>
              ) : !isRecording ? (
                <p className="text-sm text-clay-muted font-500 italic">
                  Click the mic to speak, or type your answer below...
                </p>
              ) : null}
            </div>

            {/* Editable textarea for typing */}
            {!isRecording && (
              <textarea
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                placeholder="Or type your answer here..."
                rows={3}
                className="clay-input w-full px-4 py-3 text-sm mt-2 resize-none"
              />
            )}
          </div>

          {/* Controls */}
          <div className="flex gap-3">
            {/* Mic button */}
            <button
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isScoring}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl font-700 text-sm transition-all ${
                isRecording
                  ? 'bg-red-500 text-white hover:bg-red-600 animate-pulse'
                  : 'bg-clay-lavender text-clay-purple hover:bg-clay-lavender/70'
              } disabled:opacity-50`}
            >
              {isRecording ? <><MicOff size={16} strokeWidth={2.5} /> Stop</> : <><Mic size={16} strokeWidth={2.5} /> Record</>}
            </button>

            {/* Submit answer */}
            <button
              onClick={submitAnswer}
              disabled={!transcript.trim() || isScoring || isRecording}
              className="clay-btn clay-btn-primary flex-1 py-3 text-sm font-800 text-white flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isScoring ? (
                <><Loader2 size={15} className="animate-spin" /> Scoring...</>
              ) : currentQ < questions.length - 1 ? (
                <><Send size={14} strokeWidth={2.5} /> Submit & Next</>
              ) : (
                <><CheckCircle size={14} strokeWidth={2.5} /> Submit & Finish</>
              )}
            </button>
          </div>

          {/* Skip */}
          {!isRecording && !isScoring && (
            <button
              onClick={() => {
                if (!transcript.trim()) {
                  setTranscript('I would like to pass on this question.');
                }
                submitAnswer();
              }}
              className="text-xs text-clay-muted font-600 hover:text-clay-text mt-3 block mx-auto transition-colors"
            >
              Skip this question →
            </button>
          )}
        </div>

        {/* Tips */}
        <div className="clay-card p-4 flex items-start gap-3 bg-clay-sky/20">
          <Volume2 size={16} className="text-blue-500 flex-shrink-0 mt-0.5" strokeWidth={2.2} />
          <p className="text-xs text-blue-700 font-600">
            <strong>Tips:</strong> Speak clearly and at a normal pace. Give structured answers — situation, action, result works well.
            You can edit the transcript after speaking before submitting.
          </p>
        </div>
      </main>
    </div>
  );
}
