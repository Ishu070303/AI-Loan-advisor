// This is a tiny mock "login" endpoint.
// A real app would check a password or a real auth token here. Since this
// is a take-home demo, we just hand out a fresh random id and remember it
// on the server. The frontend calls this once when the page loads, then
// sends that id along with every chat message so we know which person's
// profile and history to use.

import { NextResponse } from 'next/server';
import { createSession } from '@/lib/store';

export async function POST() {
  const userId = createSession();
  return NextResponse.json({ userId });
}
