'use client';

// The main screen of the app. This component holds all the state
// (session id, chat messages, recommendations) and wires the pieces
// together: the profile form, the chat thread, and the recommendation
// cards. All the actual loan math happens on the server - this file
// only displays whatever the server sends back.

import { useEffect, useState } from 'react';
import DisclaimerBanner from '@/components/DisclaimerBanner';
import ProfileForm from '@/components/ProfileForm';
import ChatPanel from '@/components/ChatPanel';
import RecommendationsPanel from '@/components/RecommendationsPanel';
import { ChatApiResponse, ChatBubble, ProfileFormValues, Recommendation } from '@/lib/types';

// Turns the string values from the form into the numeric shape the
// server's eligibility/EMI code expects.
function toApiProfile(values: ProfileFormValues) {
  return {
    loanAmount: Number(values.loanAmount),
    purpose: values.purpose,
    income: Number(values.income),
    existingEmi: Number(values.existingEmi) || 0,
    tenureMonths: Number(values.tenureMonths),
    employmentType: values.employmentType,
  };
}

export default function Home() {
  const [userId, setUserId] = useState<string | null>(null);
  const [sessionError, setSessionError] = useState(false);

  const [messages, setMessages] = useState<ChatBubble[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [profile, setProfile] = useState<ProfileFormValues | null>(null);
  const [hasSubmittedOnce, setHasSubmittedOnce] = useState(false);
  const [loading, setLoading] = useState(false);

  // Start a mock "session" as soon as the page loads. This stands in for
  // logging in - it gives us a userId the server will recognize on every
  // later request.
  useEffect(() => {
    fetch('/api/session', { method: 'POST' })
      .then((res) => {
        if (!res.ok) throw new Error('session request failed');
        return res.json();
      })
      .then((data) => setUserId(data.userId))
      .catch(() => setSessionError(true));
  }, []);

  async function sendMessage(text: string, apiProfile?: ReturnType<typeof toApiProfile>) {
    if (!userId) return;

    // Show the user's message immediately, without waiting for the
    // server - this keeps the chat feeling instant.
    setMessages((prev) => [...prev, { role: 'user', content: text }]);
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, message: text, profile: apiProfile }),
      });

      const data = await res.json();

      if (!res.ok) {
        const friendly =
          res.status === 401
            ? "Your session expired. Please refresh the page and try again."
            : data?.error || "Something went wrong. Please try again.";
        setMessages((prev) => [...prev, { role: 'assistant', content: friendly }]);
        return;
      }

      const chatData = data as ChatApiResponse;
      setMessages((prev) => [...prev, { role: 'assistant', content: chatData.reply }]);
      setRecommendations(chatData.recommendations);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: "Sorry, I couldn't reach the server. Please check your connection and try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleProfileSubmit(values: ProfileFormValues) {
    setProfile(values);
    const isFirstTime = !hasSubmittedOnce;
    setHasSubmittedOnce(true);

    const message = isFirstTime
      ? 'Please suggest the best loan options for my profile.'
      : "I've updated my details - please suggest updated loan options.";

    sendMessage(message, toApiProfile(values));
  }

  function handleChatSend(text: string) {
    sendMessage(text);
  }

  const inputDisabled = !userId || !hasSubmittedOnce;
  const inputDisabledHint = sessionError
    ? 'Could not start a session. Please refresh the page.'
    : !userId
      ? 'Connecting...'
      : 'Fill in your profile above first';

  return (
    <div className="min-h-screen flex flex-col">
      <DisclaimerBanner />

      <header className="border-b border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
          <h1 className="text-lg font-semibold text-slate-900">AI Loan Advisor</h1>
          <p className="text-sm text-slate-500">
            Real numbers, calculated in code. The assistant only explains them.
          </p>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-6 grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6 items-start">
        <div className="lg:sticky lg:top-6">
          <ProfileForm
            onSubmit={handleProfileSubmit}
            disabled={loading || !userId}
            hasSubmittedOnce={hasSubmittedOnce}
          />
        </div>

        <div className="space-y-6">
          <ChatPanel
            messages={messages}
            onSend={handleChatSend}
            loading={loading}
            inputDisabled={inputDisabled}
            inputDisabledHint={inputDisabledHint}
          />

          <RecommendationsPanel recommendations={recommendations} profile={profile} />
        </div>
      </main>
    </div>
  );
}
