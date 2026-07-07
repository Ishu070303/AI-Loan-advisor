// Shared shapes used by both the API route and the frontend components,
// so both sides agree on what a "recommendation" or "chat message" looks
// like. Kept separate from eligibility.ts/catalog.ts because these are
// the shapes sent over the network (JSON), not the internal server types.

import { EmploymentType } from './catalog';

// One loan option we are recommending, with its numbers already worked
// out by the server. The frontend just displays these - it never
// calculates anything itself.
export type Recommendation = {
  productId: string;
  productName: string;
  annualRatePct: number;
  tenureMonths: number;
  emi: number;
  totalRepayment: number;
  totalInterest: number;
  requiresCollateral: boolean;
  whyItFits: string;
};

// A slimmer, numbers-only version of the same list, handy for things
// like the downloadable summary.
export type EmiBreakdownRow = {
  productId: string;
  productName: string;
  tenureMonths: number;
  emi: number;
  totalRepayment: number;
  totalInterest: number;
};

// One line of the chat thread shown on screen.
export type ChatBubble = {
  role: 'user' | 'assistant';
  content: string;
};

// The borrower details collected by the profile form.
export type ProfileFormValues = {
  loanAmount: string;
  purpose: string;
  income: string;
  existingEmi: string;
  tenureMonths: string;
  employmentType: EmploymentType;
};

// What the /api/chat endpoint sends back.
export type ChatApiResponse = {
  reply: string;
  recommendations: Recommendation[];
  emiBreakdown: EmiBreakdownRow[];
};
