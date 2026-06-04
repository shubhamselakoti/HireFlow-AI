'use client';
import Link from 'next/link';
import { useState } from 'react';
import {
  Menu, X, ArrowRight, Play, Star, Twitter, Linkedin, Github,
  CheckCircle, Zap, Users, BarChart3, Calendar, DollarSign,
  Brain, Mic, ChevronRight, Sparkles
} from 'lucide-react';

// ─── Navbar ───────────────────────────────────────────────────────────────────
function Navbar() {
  const [open, setOpen] = useState(false);
  return (
    <nav className="sticky top-0 z-50 bg-clay-bg/80 backdrop-blur-xl border-b border-white/60">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#6D4AFF] to-[#9F7AEA] flex items-center justify-center shadow-clay-btn">
            <Sparkles size={18} className="text-white" strokeWidth={2.5} />
          </div>
          <span className="font-900 text-xl text-clay-text">HireFlow</span>
        </div>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8">
          {['Features', 'Pricing', 'About', 'Login'].map((item) => (
            <Link
              key={item}
              href={item === 'Login' ? '/login' : `#${item.toLowerCase()}`}
              className="text-clay-muted font-600 text-sm hover:text-clay-text transition-colors"
            >
              {item}
            </Link>
          ))}
        </div>

        {/* CTA */}
        <div className="hidden md:block">
          <Link href="/register">
            <button className="clay-btn clay-btn-primary px-6 py-2.5 text-sm font-700 text-white">
              Get Started Free
            </button>
          </Link>
        </div>

        {/* Mobile */}
        <button className="md:hidden text-clay-muted" onClick={() => setOpen(!open)}>
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-white/95 backdrop-blur-xl border-t border-clay-lavender/30 px-6 py-4 space-y-3">
          {['Features', 'Pricing', 'About'].map((item) => (
            <a key={item} href={`#${item.toLowerCase()}`} className="block text-clay-muted font-600 py-2">
              {item}
            </a>
          ))}
          <Link href="/login" className="block text-clay-muted font-600 py-2">Login</Link>
          <Link href="/register">
            <button className="clay-btn clay-btn-primary w-full py-3 text-sm font-700 text-white mt-2">
              Get Started Free
            </button>
          </Link>
        </div>
      )}
    </nav>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────
function Hero() {
  return (
    <section className="relative min-h-[92vh] flex items-center overflow-hidden px-6 py-20">
      {/* Blob backgrounds */}
      <div className="absolute top-[-120px] right-[-80px] w-[600px] h-[600px] rounded-full opacity-40"
        style={{ background: 'radial-gradient(ellipse, #c4b5fd 0%, #e9d5ff 40%, transparent 70%)' }} />
      <div className="absolute bottom-[-80px] left-[-60px] w-[500px] h-[500px] rounded-full opacity-30"
        style={{ background: 'radial-gradient(ellipse, #fed7aa 0%, #fde68a 40%, transparent 70%)' }} />
      <div className="absolute top-1/3 left-1/2 w-[400px] h-[300px] rounded-full opacity-20 blur-3xl"
        style={{ background: 'radial-gradient(ellipse, #99f6e4 0%, transparent 70%)' }} />

      <div className="relative max-w-7xl mx-auto w-full">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left: Copy */}
          <div className="space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-clay-lavender/80 border border-clay-purple/20 rounded-pill px-4 py-2 text-sm font-700 text-clay-purple backdrop-blur-sm">
              <Sparkles size={14} strokeWidth={2.5} />
              AI-Powered HRMS · Now in Beta
            </div>

            {/* Headline */}
            <h1 className="text-5xl lg:text-6xl font-900 leading-tight text-clay-text">
              Hire{' '}
              <span style={{
                background: 'linear-gradient(135deg, #6D4AFF, #9F7AEA, #F472B6)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>
                Smarter.
              </span>
              <br />
              Manage{' '}
              <span style={{
                background: 'linear-gradient(135deg, #F59E0B, #EF4444)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>
                Better.
              </span>
              <br />
              Grow{' '}
              <span style={{
                background: 'linear-gradient(135deg, #10B981, #3B82F6)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>
                Faster.
              </span>
            </h1>

            <p className="text-lg text-clay-muted leading-relaxed max-w-lg font-500">
              The AI-powered HRMS that handles everything from recruitment to payroll — beautifully.
              Manage up to 5,000+ employees with ease, intelligence, and style.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap gap-4">
              <Link href="/register">
                <button className="clay-btn clay-btn-primary px-8 py-3.5 text-base font-700 text-white flex items-center gap-2">
                  Start Free Trial
                  <ArrowRight size={18} strokeWidth={2.5} />
                </button>
              </Link>
              <button className="clay-btn clay-btn-outline px-8 py-3.5 text-base font-700 flex items-center gap-2">
                <Play size={16} strokeWidth={2.5} className="fill-current" />
                Watch Demo
              </button>
            </div>

            {/* Social proof */}
            <div className="flex items-center gap-4">
              <div className="flex -space-x-2">
                {['#6D4AFF','#F59E0B','#10B981','#EF4444','#3B82F6'].map((c, i) => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-800"
                    style={{ background: c }}>
                    {['J','S','M','A','K'][i]}
                  </div>
                ))}
              </div>
              <div>
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={13} className="text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-xs text-clay-muted font-600">Loved by 1,200+ HR teams</p>
              </div>
            </div>
          </div>

          {/* Right: Dashboard mockup */}
          <div className="relative animate-float hidden lg:block">
            <div className="clay-card-lg p-5 relative overflow-hidden">
              {/* Mockup header */}
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
                <div className="flex-1 bg-clay-bg rounded-lg h-6 ml-2" />
              </div>

              {/* Mini dashboard */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                {[
                  { label: 'Employees', val: '1,284', icon: '👥', bg: 'bg-clay-lavender' },
                  { label: 'Open Jobs', val: '23', icon: '💼', bg: 'bg-clay-peach' },
                  { label: 'Present Today', val: '96%', icon: '✅', bg: 'bg-clay-mint' },
                  { label: 'This Month', val: '₹48L', icon: '💰', bg: 'bg-clay-sky' },
                ].map((s) => (
                  <div key={s.label} className={`${s.bg} rounded-2xl p-3`}>
                    <div className="text-xl mb-1">{s.icon}</div>
                    <div className="font-900 text-clay-text text-lg">{s.val}</div>
                    <div className="text-xs text-clay-muted font-600">{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Mini chart bars */}
              <div className="bg-clay-bg rounded-2xl p-3">
                <p className="text-xs font-700 text-clay-muted mb-3">Monthly Attendance</p>
                <div className="flex items-end gap-1.5 h-16">
                  {[65, 80, 72, 90, 85, 95, 88, 92, 78, 96, 91, 88].map((h, i) => (
                    <div key={i} className="flex-1 rounded-t-lg transition-all"
                      style={{
                        height: `${h}%`,
                        background: `linear-gradient(180deg, #6D4AFF ${100 - h}%, #9F7AEA 100%)`,
                        opacity: i === 11 ? 1 : 0.6 + i * 0.03,
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* AI badge */}
              <div className="absolute -top-3 -right-3 bg-gradient-to-br from-[#6D4AFF] to-[#9F7AEA] rounded-xl px-3 py-1.5 shadow-clay-btn">
                <span className="text-white text-xs font-700 flex items-center gap-1">
                  <Brain size={12} strokeWidth={2.5} /> AI Active
                </span>
              </div>
            </div>

            {/* Floating cards */}
            <div className="absolute -left-8 top-1/4 clay-card-sm px-3 py-2 flex items-center gap-2 shadow-clay">
              <div className="w-8 h-8 rounded-full bg-clay-mint flex items-center justify-center">
                <CheckCircle size={14} className="text-green-600" />
              </div>
              <div>
                <p className="text-xs font-800 text-clay-text">Resume Screened</p>
                <p className="text-[10px] text-clay-muted">AI Score: 94/100</p>
              </div>
            </div>

            <div className="absolute -right-8 bottom-1/4 clay-card-sm px-3 py-2 flex items-center gap-2 shadow-clay">
              <div className="w-8 h-8 rounded-full bg-clay-rose flex items-center justify-center">
                <Mic size={14} className="text-pink-600" />
              </div>
              <div>
                <p className="text-xs font-800 text-clay-text">Voice Interview</p>
                <p className="text-[10px] text-clay-muted">In progress...</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Marquee */}
      <div className="absolute bottom-0 left-0 right-0 bg-clay-lavender/40 border-t border-white/50 py-3 overflow-hidden">
        <div className="flex gap-12 animate-marquee whitespace-nowrap">
          {[...Array(3)].fill([
            '🤖 AI Resume Screening', '🎙️ Voice Interviews', '💰 Auto Payroll',
            '📅 Smart Attendance', '📈 Performance Tracking', '🔮 Predictive Analytics',
            '👥 Team Management', '🌿 Leave Management', '📄 Document Vault',
          ]).flat().map((item, i) => (
            <span key={i} className="text-sm font-700 text-clay-purple/70">{item}</span>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Stats Strip ──────────────────────────────────────────────────────────────
function StatsStrip() {
  const stats = [
    { value: '5,000+', label: 'Employees Managed', icon: '👥', tint: 'bg-clay-lavender' },
    { value: '98%', label: 'Payroll Accuracy', icon: '💰', tint: 'bg-clay-peach' },
    { value: '3×', label: 'Faster Hiring', icon: '⚡', tint: 'bg-clay-mint' },
    { value: '50+', label: 'Integrations', icon: '🔗', tint: 'bg-clay-sky' },
  ];
  return (
    <section className="py-16 px-6 bg-white/50">
      <div className="max-w-7xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((s) => (
          <div key={s.label} className={`clay-card p-6 text-center ${s.tint}`}>
            <div className="text-4xl mb-2">{s.icon}</div>
            <div className="text-3xl font-900 text-clay-text mb-1">{s.value}</div>
            <div className="text-sm text-clay-muted font-600">{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Features ─────────────────────────────────────────────────────────────────
function Features() {
  const features = [
    { icon: '🤖', title: 'AI Resume Screening', desc: 'Upload up to 20 resumes at once. Our AI ranks candidates using NLP and semantic similarity in seconds.', tint: 'bg-clay-lavender' },
    { icon: '🎙️', title: 'Voice & Video Interviews', desc: 'Browser-based interviews with real-time transcription, sentiment analysis, and AI scoring.', tint: 'bg-clay-peach' },
    { icon: '💰', title: 'Automated Payroll', desc: 'Run payroll for 5,000+ employees in one click. Auto-calculates PF, tax, HRA and generates payslips.', tint: 'bg-clay-mint' },
    { icon: '📅', title: 'Smart Attendance', desc: 'Clock in/out tracking, monthly calendars, and automatic half-day detection for the whole company.', tint: 'bg-clay-sky' },
    { icon: '📈', title: 'Performance Tracking', desc: '360° reviews with radar charts, goal tracking with progress bars, and quarterly rating history.', tint: 'bg-clay-rose' },
    { icon: '🔮', title: 'Predictive Analytics', desc: 'Brain.js-powered predictions for hire probability, flight risk, and team performance trends.', tint: 'bg-clay-yellow' },
  ];
  return (
    <section id="features" className="py-24 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-clay-lavender rounded-pill px-4 py-2 text-sm font-700 text-clay-purple mb-4">
            <Zap size={14} /> Everything HR
          </div>
          <h2 className="text-4xl font-900 text-clay-text">
            Everything HR, in one{' '}
            <span style={{ background: 'linear-gradient(135deg,#6D4AFF,#9F7AEA)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              beautiful place
            </span>
          </h2>
          <p className="text-clay-muted mt-4 max-w-xl mx-auto font-500">
            From your first job post to your last payslip — HireFlow covers the entire employee lifecycle.
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => (
            <div key={f.title} className={`clay-card p-7 group hover:-translate-y-1 transition-all duration-200 ${f.tint}`}>
              <div className="text-5xl mb-5">{f.icon}</div>
              <h3 className="text-lg font-800 text-clay-text mb-2">{f.title}</h3>
              <p className="text-clay-muted text-sm leading-relaxed font-500">{f.desc}</p>
              <div className="mt-5 flex items-center gap-1 text-clay-purple text-sm font-700 opacity-0 group-hover:opacity-100 transition-opacity">
                Learn more <ChevronRight size={14} strokeWidth={2.5} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── How It Works ─────────────────────────────────────────────────────────────
function HowItWorks() {
  const steps = [
    { num: '01', icon: '📝', title: 'Post Jobs & Screen with AI', desc: 'Create beautiful job listings using our AI JD Generator, then let our resume screener rank applicants automatically by fit.' },
    { num: '02', icon: '🎉', title: 'Onboard & Manage Teams', desc: 'Auto-create employee profiles from hired candidates. Manage attendance, leave, payroll and performance from one dashboard.' },
    { num: '03', icon: '📊', title: 'Analyze & Grow', desc: 'Deep analytics with real MongoDB aggregations reveal trends, predict churn, and surface top performers before reviews.' },
  ];
  return (
    <section className="py-24 px-6 bg-white/40">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-900 text-clay-text">How It Works</h2>
          <p className="text-clay-muted mt-3 font-500">Three steps to transform your entire HR operation.</p>
        </div>
        <div className="grid lg:grid-cols-3 gap-8 relative">
          {/* Connecting line */}
          <div className="hidden lg:block absolute top-16 left-1/4 right-1/4 h-0.5 bg-gradient-to-r from-clay-lavender via-clay-purple/30 to-clay-lavender" />

          {steps.map((s, i) => (
            <div key={s.num} className="clay-card p-8 text-center relative">
              {/* Step bubble */}
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#6D4AFF] to-[#9F7AEA] flex items-center justify-center mx-auto mb-5 shadow-clay-btn">
                <span className="text-white font-900 text-sm">{s.num}</span>
              </div>
              <div className="text-4xl mb-4">{s.icon}</div>
              <h3 className="text-lg font-800 text-clay-text mb-3">{s.title}</h3>
              <p className="text-clay-muted text-sm leading-relaxed font-500">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Testimonials ─────────────────────────────────────────────────────────────
function Testimonials() {
  const testimonials = [
    { name: 'Priya Sharma', role: 'Head of HR', company: 'TechNova India', avatar: '👩🏽', quote: 'HireFlow cut our time-to-hire by 60%. The AI resume screener is genuinely magic — what took our team 2 days now takes 10 minutes.' },
    // { name: 'James O'Brien', role: 'People Ops Lead', company: 'Finrise Global', avatar: '👨🏻', quote: 'The payroll automation alone saves us 3 full days every month. The claymorphism UI is so refreshing — our managers actually enjoy using it.' },
    // { name: 'Aisha Mensah', role: 'CHRO', company: 'BuildCo Africa', avatar: '👩🏿', quote: 'We manage 1,200 employees across 4 countries. HireFlow is the first HRMS that handles our complexity without feeling overwhelming.' },
  ];
  return (
    <section className="py-24 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-900 text-clay-text">Loved by HR teams worldwide</h2>
          <p className="text-clay-muted mt-3 font-500">Don't take our word for it.</p>
        </div>
        <div className="grid lg:grid-cols-3 gap-6">
          {testimonials.map((t) => (
            <div key={t.name} className="clay-card p-7 bg-clay-lavender/30">
              {/* Stars */}
              <div className="flex mb-4">
                {[...Array(5)].map((_, i) => <Star key={i} size={14} className="text-yellow-400 fill-yellow-400" />)}
              </div>
              <p className="text-clay-text text-sm leading-relaxed font-500 mb-6 italic">"{t.quote}"</p>
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-white flex items-center justify-center text-2xl shadow-clay-sm">
                  {t.avatar}
                </div>
                <div>
                  <p className="font-800 text-clay-text text-sm">{t.name}</p>
                  <p className="text-xs text-clay-muted font-600">{t.role} · {t.company}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── CTA Banner ───────────────────────────────────────────────────────────────
function CTABanner() {
  return (
    <section className="py-24 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="clay-card-lg p-16 text-center relative overflow-hidden">
          <div className="absolute -top-20 -left-20 w-64 h-64 rounded-full opacity-30"
            style={{ background: 'radial-gradient(ellipse, #c4b5fd, transparent)' }} />
          <div className="absolute -bottom-16 -right-16 w-56 h-56 rounded-full opacity-25"
            style={{ background: 'radial-gradient(ellipse, #fed7aa, transparent)' }} />
          <div className="relative">
            <div className="text-5xl mb-6">🚀</div>
            <h2 className="text-4xl font-900 text-clay-text mb-4">
              Ready to transform your HR workflow?
            </h2>
            <p className="text-clay-muted font-500 mb-8 max-w-lg mx-auto">
              Join 1,200+ HR teams who've already made the switch. Setup takes under 10 minutes.
            </p>
            <Link href="/register">
              <button className="clay-btn clay-btn-primary px-10 py-4 text-base font-800 text-white flex items-center gap-2 mx-auto">
                Get Started Free — It's Free
                <ArrowRight size={18} strokeWidth={2.5} />
              </button>
            </Link>
            <p className="text-xs text-clay-muted mt-4 font-500">No credit card required · Cancel anytime</p>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="bg-white/60 border-t border-clay-lavender/40 py-16 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          {/* Col 1: Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#6D4AFF] to-[#9F7AEA] flex items-center justify-center">
                <Sparkles size={14} className="text-white" strokeWidth={2.5} />
              </div>
              <span className="font-900 text-lg text-clay-text">HireFlow</span>
            </div>
            <p className="text-sm text-clay-muted font-500 leading-relaxed mb-5">
              The AI-powered HRMS built for modern teams. Beautiful, fast, intelligent.
            </p>
            <div className="flex gap-3">
              {[
                { icon: Twitter, href: 'https://twitter.com' },
                { icon: Linkedin, href: 'https://linkedin.com' },
                { icon: Github, href: 'https://github.com' },
              ].map(({ icon: Icon, href }) => (
                <a key={href} href={href} target="_blank" rel="noopener noreferrer"
                  className="w-9 h-9 rounded-xl bg-clay-lavender flex items-center justify-center text-clay-purple hover:bg-clay-purple hover:text-white transition-all duration-200">
                  <Icon size={15} strokeWidth={2.2} />
                </a>
              ))}
            </div>
          </div>

          {/* Col 2: Product */}
          <div>
            <h4 className="font-800 text-clay-text mb-4 text-sm">Product</h4>
            <ul className="space-y-2.5">
              {['Features', 'Pricing', 'Changelog', 'Roadmap'].map((l) => (
                <li key={l}><a href="#" className="text-sm text-clay-muted font-500 hover:text-clay-text transition-colors">{l}</a></li>
              ))}
            </ul>
          </div>

          {/* Col 3: Company */}
          <div>
            <h4 className="font-800 text-clay-text mb-4 text-sm">Company</h4>
            <ul className="space-y-2.5">
              {['About', 'Blog', 'Careers', 'Press'].map((l) => (
                <li key={l}><a href="#" className="text-sm text-clay-muted font-500 hover:text-clay-text transition-colors">{l}</a></li>
              ))}
            </ul>
          </div>

          {/* Col 4: Legal */}
          <div>
            <h4 className="font-800 text-clay-text mb-4 text-sm">Legal</h4>
            <ul className="space-y-2.5">
              {['Privacy Policy', 'Terms of Service', 'Cookie Policy', 'GDPR'].map((l) => (
                <li key={l}><a href="#" className="text-sm text-clay-muted font-500 hover:text-clay-text transition-colors">{l}</a></li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-clay-lavender/40 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-clay-muted font-500">
            © 2025 HireFlow HRMS. Built with ❤️ for modern HR teams.
          </p>
          <div className="flex gap-6">
            <a href="#" className="text-xs text-clay-muted hover:text-clay-text transition-colors">Privacy</a>
            <a href="#" className="text-xs text-clay-muted hover:text-clay-text transition-colors">Terms</a>
            <a href="#" className="text-xs text-clay-muted hover:text-clay-text transition-colors">Cookies</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-clay-bg font-sans">
      <Navbar />
      <Hero />
      <StatsStrip />
      <Features />
      <HowItWorks />
      <Testimonials />
      <CTABanner />
      <Footer />
    </div>
  );
}