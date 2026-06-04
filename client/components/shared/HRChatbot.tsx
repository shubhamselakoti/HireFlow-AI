'use client';
import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/useAppStore';
import api from '@/lib/axios';
import type { ChatMessage } from '@/types';

export default function HRChatbot() {
  const { chatOpen, setChatOpen, chatMessages, addChatMessage } = useAppStore();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg: ChatMessage = { role: 'user', content: input.trim(), timestamp: new Date() };
    addChatMessage(userMsg);
    setInput('');
    setLoading(true);

    try {
      const history = chatMessages.slice(-6).map((m) => ({ role: m.role, content: m.content }));
      const res = await api.post('/api/ai/chat', {
        message: userMsg.content,
        conversationHistory: history,
      });
      addChatMessage({
        role: 'assistant',
        content: res.data.data.reply,
        timestamp: new Date(),
      });
    } catch {
      addChatMessage({
        role: 'assistant',
        content: 'Sorry, I ran into an issue. Please try again.',
        timestamp: new Date(),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setChatOpen(!chatOpen)}
        className={cn(
          'fixed bottom-6 right-6 z-50 w-14 h-14 rounded-pill shadow-clay-lg',
          'bg-gradient-to-br from-clay-purple to-clay-purple-light text-white',
          'flex items-center justify-center transition-all duration-200',
          'hover:scale-105 active:scale-95',
          chatOpen && 'scale-95'
        )}
      >
        {chatOpen ? <X size={22} strokeWidth={2.5} /> : <MessageCircle size={22} strokeWidth={2.5} />}
      </button>

      {/* Chat panel */}
      {chatOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-80 sm:w-96 clay-card-lg overflow-hidden flex flex-col"
          style={{ height: '480px' }}>
          {/* Header */}
          <div className="bg-gradient-to-r from-clay-purple to-clay-purple-light p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
              <Bot size={18} className="text-white" strokeWidth={2.2} />
            </div>
            <div>
              <p className="text-white font-800 text-sm">HireFlow AI</p>
              <p className="text-white/70 text-xs">HR Assistant · Always here</p>
            </div>
            <div className="ml-auto w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-clay-bg/50">
            {chatMessages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="text-4xl mb-3">🤖</div>
                <p className="font-700 text-clay-text text-sm">Hi! I'm HireFlow AI</p>
                <p className="text-xs text-clay-muted mt-1">Ask me anything about HR, policies, or your team.</p>
                <div className="flex flex-wrap gap-2 mt-4 justify-center">
                  {['How much leave do I have?', 'When was payroll last run?', 'Show attendance summary'].map((q) => (
                    <button
                      key={q}
                      onClick={() => setInput(q)}
                      className="text-xs bg-white border border-clay-lavender rounded-pill px-3 py-1.5 text-clay-purple font-600 hover:bg-clay-lavender transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {chatMessages.map((msg, i) => (
              <div key={i} className={cn('flex gap-2 items-end', msg.role === 'user' && 'flex-row-reverse')}>
                <div className={cn(
                  'w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0',
                  msg.role === 'assistant' ? 'bg-clay-lavender' : 'bg-clay-purple'
                )}>
                  {msg.role === 'assistant'
                    ? <Bot size={14} className="text-clay-purple" />
                    : <User size={14} className="text-white" />
                  }
                </div>
                <div className={cn(
                  'max-w-[75%] px-3 py-2 rounded-2xl text-sm leading-relaxed',
                  msg.role === 'assistant'
                    ? 'bg-white shadow-clay-sm text-clay-text rounded-bl-sm'
                    : 'bg-clay-purple text-white rounded-br-sm'
                )}>
                  {msg.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-2 items-end">
                <div className="w-7 h-7 rounded-full bg-clay-lavender flex items-center justify-center">
                  <Bot size={14} className="text-clay-purple" />
                </div>
                <div className="bg-white shadow-clay-sm px-3 py-2 rounded-2xl rounded-bl-sm">
                  <Loader2 size={14} className="text-clay-purple animate-spin" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-clay-lavender/30 bg-white">
            <div className="flex gap-2 items-center">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()}
                placeholder="Ask me anything..."
                className="clay-input flex-1 px-3 py-2 text-sm"
              />
              <button
                onClick={send}
                disabled={!input.trim() || loading}
                className="w-9 h-9 rounded-pill bg-gradient-to-br from-clay-purple to-clay-purple-light text-white flex items-center justify-center disabled:opacity-50 shadow-clay-btn hover:shadow-clay transition-all"
              >
                <Send size={14} strokeWidth={2.5} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
