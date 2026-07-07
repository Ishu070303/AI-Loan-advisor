// This file is our "mock database" for chat sessions.
// In a real app this would be a proper database with real user accounts.
// Here we just keep everything in memory, in a plain Map, so the demo
// stays simple. Each userId points to that person's saved profile and
// chat history, so nobody can see someone else's data.
//
// We attach the Map to `globalThis` so it survives Next.js's dev-mode
// hot-reloading (which would otherwise wipe our in-memory data every
// time we save a file and the route module gets reloaded).

import { BorrowerProfile } from './eligibility';

export type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
};

export type UserSession = {
  profile: BorrowerProfile | null;
  history: ChatMessage[];
  createdAt: number;
};

type GlobalWithStore = typeof globalThis & {
  __loanAdvisorSessionStore?: Map<string, UserSession>;
};

const globalWithStore = globalThis as GlobalWithStore;

export const sessionStore: Map<string, UserSession> =
  globalWithStore.__loanAdvisorSessionStore ?? new Map();

globalWithStore.__loanAdvisorSessionStore = sessionStore;

// Creates a brand new session and hands back its id.
// This id acts like a mock login token - the frontend keeps hold of it
// and sends it with every chat message so we know whose data to use.
export function createSession(): string {
  const userId = crypto.randomUUID();
  sessionStore.set(userId, { profile: null, history: [], createdAt: Date.now() });
  return userId;
}

// Checks whether a userId is one we actually handed out.
// This is our simulated "token-based access control" - if a request
// shows up with a userId we never issued (or none at all), we treat it
// the same as an invalid or missing auth token and reject it.
export function isKnownUser(userId: unknown): userId is string {
  return typeof userId === 'string' && sessionStore.has(userId);
}
