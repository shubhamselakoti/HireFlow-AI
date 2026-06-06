'use client';
import { useAppStore } from '@/store/useAppStore';
import { Menu, Mic, Bell, Search } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface TopNavProps {
  title?: string;
  subtitle?: string;
}

export default function TopNav({ title, subtitle }: TopNavProps) {
  const { toggleSidebar, sidebarOpen, setChatOpen } = useAppStore();
  const [isListening, setIsListening] = useState(false);

  const handleVoice = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Voice recognition is not supported in your browser.');
      return;
    }
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = 'en-US';

    setIsListening(true);
    recognition.start();

    recognition.onresult = async (event: any) => {
      const text = event.results[0][0].transcript;
      setIsListening(false);
      try {
        const { default: api } = await import('@/lib/axios');
        const res = await api.post('/api/ai/voice-chat', { text });
        const reply = res.data.data.reply;
        if ('speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance(reply);
          utterance.rate = 1;
          utterance.pitch = 1;
          window.speechSynthesis.speak(utterance);
        }
      } catch (err) {
        console.error('Voice chat error:', err);
      }
    };

    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
  };

  return (
    <header className="sticky top-0 z-10 bg-clay-bg/80 backdrop-blur-md border-b border-clay-lavender/30 px-6 py-4">
      <div className="flex items-center gap-4">
        {/* Menu toggle */}
        <button
          onClick={toggleSidebar}
          className="w-9 h-9 rounded-xl bg-white shadow-clay-sm flex items-center justify-center text-clay-muted hover:text-clay-text transition-colors"
        >
          <Menu size={18} strokeWidth={2.2} />
        </button>

        {/* Title */}
        {title && (
          <div>
            <h1 className="text-lg font-800 text-clay-text leading-tight">{title}</h1>
            {subtitle && <p className="text-xs text-clay-muted">{subtitle}</p>}
          </div>
        )}

        <div className="flex-1" />

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Voice assistant */}
          <button
            onClick={handleVoice}
            title="Voice Assistant"
            className={cn(
              'w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200',
              isListening
                ? 'bg-clay-rose text-red-500 animate-pulse shadow-clay-btn'
                : 'bg-white shadow-clay-sm text-clay-muted hover:text-clay-purple'
            )}
          >
            <Mic size={16} strokeWidth={2.2} />
          </button>

          {/* Notifications */}
          <button className="w-9 h-9 rounded-xl bg-white shadow-clay-sm flex items-center justify-center text-clay-muted hover:text-clay-text relative">
            <Bell size={16} strokeWidth={2.2} />
            <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-clay-rose rounded-full flex items-center justify-center">
              <span className="text-[8px] font-800 text-red-500">3</span>
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}
