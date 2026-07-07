'use client';

// The chat thread itself: the back-and-forth messages between the user
// and the assistant, plus the box at the bottom where the user types.

import { useEffect, useRef, useState } from 'react';
import { ChatBubble } from '@/lib/types';

type Props = {
  messages: ChatBubble[];
  onSend: (text: string) => void;
  loading: boolean;
  inputDisabled: boolean;
  inputDisabledHint: string;
};

export default function ChatPanel({
  messages,
  onSend,
  loading,
  inputDisabled,
  inputDisabledHint,
}: Props) {
  const [draft, setDraft] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  // Keep the newest message in view whenever the thread grows.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, loading]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = draft.trim();
    if (!text || loading || inputDisabled) return;
    onSend(text);
    setDraft('');
  }

  return (
    <div className="bg-white rounded-2xl shadow-card border border-slate-100 flex flex-col h-[480px] sm:h-[560px]">
      <div className="px-4 sm:px-5 py-3 border-b border-slate-100">
        <h2 className="text-sm font-semibold text-slate-900">Chat with your loan advisor</h2>
      </div>

      <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-4 space-y-3">
        {messages.length === 0 && (
          <p className="text-sm text-slate-400 text-center mt-10">
            Fill in your profile and send a message to see your options.
          </p>
        )}

        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed whitespace-pre-wrap ${
                message.role === 'user'
                  ? 'bg-brand-600 text-white rounded-br-sm'
                  : 'bg-slate-100 text-slate-800 rounded-bl-sm'
              }`}
            >
              {message.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-slate-100 text-slate-500 rounded-2xl rounded-bl-sm px-3.5 py-2 text-sm flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.2s]" />
              <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.1s]" />
              <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSubmit} className="p-3 border-t border-slate-100 flex gap-2">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          disabled={inputDisabled || loading}
          placeholder={inputDisabled ? inputDisabledHint : 'Ask about your loan options...'}
          className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 disabled:bg-slate-50 disabled:text-slate-400"
        />
        <button
          type="submit"
          disabled={inputDisabled || loading || !draft.trim()}
          className="rounded-lg bg-brand-600 text-white text-sm font-medium px-4 py-2 hover:bg-brand-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Send
        </button>
      </form>
    </div>
  );
}
