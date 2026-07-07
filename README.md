# AI Loan Advisor Chatbot

A small fintech demo app: a user fills in their loan details, and a chat
assistant recommends loan products they qualify for. Every number shown
(EMI, interest, eligibility) is calculated by plain TypeScript code. The
AI is only ever used to explain those numbers in friendly language — it
never does math and never invents products.

## Getting started

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`. Fill in the profile form on the left
and click "Get recommendations" to start the chat.

Environment variables (see `.env.example`):

```
LLM_URL=...     # base URL of the LLM wrapper service
LLM_TOKEN=...   # bearer token for that service
```

`.env.local` already contains working values for this take-home and is
git-ignored, so it never gets committed.

## System Architecture

**The most important rule in this codebase: all financial math and all
product selection happen in deterministic TypeScript functions. The LLM
never calculates a number and never picks or invents a product.**

Why this matters: language models are good at writing sentences, but
they are not reliable calculators, and they can "hallucinate" — state
things confidently that are simply wrong. For a fintech product, a wrong
EMI or an invented interest rate isn't a cosmetic bug, it's a broken
promise to a real borrower. So this app draws a hard line: numbers come
from code, words come from the AI, and the two never swap roles.

How the request flows, end to end:

1. **`lib/catalog.ts`** — a fixed list of 6 loan products (Personal
   Loan, Salary Advance, BNPL, SME Loan, Top-up Loan, Secured Loan), each
   with its own rate, amount range, tenure limit, minimum income, allowed
   employment types, and whether it needs collateral. This is mock data,
   but the shape is what a real product catalog table would look like.

2. **`lib/emi.ts`** — one pure function, `calculateEmi(principal,
   annualRatePct, tenureMonths)`, implementing the standard EMI formula.
   No side effects, no I/O — same inputs always give the same outputs,
   which is what makes it easy to unit test and easy to trust.

3. **`lib/eligibility.ts`** — takes a borrower's profile and checks it
   against every product in the catalog: amount range, minimum income,
   employment type, FOIR (existing + new EMI must stay under 50% of
   income), and tenure limit. It calls `emi.ts` to work out the actual
   EMI for each product, then ranks the products the borrower qualifies
   for by lowest total interest. Every pass and every fail comes with a
   plain-English reason.

4. **`lib/llm.ts`** — a thin wrapper around the external LLM service.
   Posts to `${LLM_URL}/llm/query` with a bearer token, has a timeout, and
   falls back to a friendly canned message if the service errors out or
   times out. The token only ever lives on the server (`process.env`),
   never in code that ships to the browser.

5. **`app/api/chat/route.ts`** — the orchestrator that ties it together
   for each incoming chat message:
   - Checks the `userId` against the in-memory session store (mock auth —
     see Security & Privacy below). Unknown or missing `userId` gets a
     `401`.
   - Runs eligibility + EMI in code (steps 2–3 above) — this is the only
     place any "loan math" happens for this request.
   - Builds a single grounded prompt containing only the computed
     products/numbers and a strict system instruction (see Prompt
     Strategy below), and sends it to the LLM.
   - Returns `{ reply, recommendations, emiBreakdown }` to the browser.

6. **Frontend (`app/page.tsx` + `components/`)** — a profile form, a chat
   thread, and recommendation cards. The frontend only ever displays
   numbers it received from the API; it doesn't recompute anything
   (the one exception is a clearly-labelled "illustrative" EMI preview
   next to the tenure slider, using the same pure `emi.ts` function, just
   so the user can see the tenure trade-off before they've submitted the
   form and gotten real matched products).

## Prompt Strategy

Every chat request builds one text prompt (see `buildGroundedPrompt` in
`app/api/chat/route.ts`) with four parts:

1. **A strict system instruction block**, telling the model:
   - Use only the products/rates/numbers given below — never invent,
     guess, or adjust a figure.
   - Never do arithmetic, even simple addition — everything needed is
     already computed.
   - Never promise or guarantee approval.
   - Always end the reply with an exact disclaimer sentence.
   - Politely decline anything outside the loan-recommendation topic.
   - Reply in plain sentences (no markdown tables/headers/emoji), since
     the numbers already have their own cards on screen — repeating a
     full table in the chat bubble would just be noisy and harder to
     read.

2. **The borrower's profile** (amount, purpose, income, existing EMI,
   tenure, employment type) — so the model can reference it.

3. **The already-computed results**: eligible products ranked cheapest
   first (with their EMI/interest/repayment numbers) and ineligible
   products with the one-line reason they failed. The model is told
   explicitly not to recalculate any of this.

4. **A short slice of recent chat history** (last 6 messages) plus the
   user's latest message — enough context to answer a follow-up
   question, without letting the prompt grow unbounded.

**Why this is the anti-hallucination approach**: the model is never
given a reason or an opportunity to compute anything, because every
number it could possibly reference is already sitting in the prompt as a
finished fact. Its job shrinks down to "explain these facts nicely,"
which is a job language models are actually good at. If the model
ignores the instructions and states some other number, that's a prompt
quality issue to keep improving — but it can't ever invent a product
that doesn't exist in the catalog, because the catalog it sees is the
literal, complete list.

## Security & Privacy

**How it works now (mock auth for this demo):**
- `POST /api/session` hands out a random `userId` (a `crypto.randomUUID()`)
  and creates an empty session for it in an in-memory `Map`
  (`lib/store.ts`). The frontend fetches this once on page load and sends
  it with every `/api/chat` request, the same way a real app would send a
  bearer token or session cookie.
- `/api/chat` looks up the `userId` in that Map. If it's missing or was
  never issued by `/api/session`, the request is rejected with `401`
  before any other work happens — this simulates checking a real auth
  token.
- Each session's chat history and profile are stored under that
  session's own key, so one user's data is never mixed into another
  user's request — a simple, in-memory version of row-level scoping.
- Because the store is a plain in-memory `Map`, it resets whenever the
  server restarts, and doesn't work across multiple server instances.
  That's fine for a demo; a real deployment needs the version below.

**How a real implementation would do this:**
- **Real authentication** — actual login (password, OTP, OAuth) issuing a
  signed JWT or session cookie, verified on every request, instead of a
  bare random id anyone could technically pass in.
- **Row-level access control** — every profile/chat row in the database
  tagged with the owning `userId`, and every query filtered by the
  authenticated user's id at the database layer (e.g. Postgres row-level
  security policies), not just "hope the app code remembers to filter."
- **PII minimization** — only store the fields actually needed for
  eligibility decisions; avoid storing raw income/ID documents longer
  than required; mask sensitive values in logs.
- **Encryption in transit and at rest** — HTTPS/TLS everywhere in
  transit; encrypt the database and any backups at rest; keep the LLM
  token (and any future secrets) in a secrets manager, not plain env
  files, in production.
- **Audit logging** — an append-only log of who accessed or changed
  what profile/loan data and when, so any dispute or incident can be
  traced — separate from the app's regular operational logs.

## Assumptions & Limitations

- Amounts are treated as Indian Rupees (₹) and eligibility uses FOIR
  (Fixed Obligation to Income Ratio), a common Indian lending concept —
  the app assumes an Indian lending context throughout.
- The product catalog, rates, and thresholds are all invented for this
  demo — they are realistic-looking, not real bank offers.
- Session storage is in-memory only (see Security & Privacy) — it's
  reset on server restart and won't work if the app is scaled to
  multiple server instances without moving to a real database.
- The LLM wrapper's exact response shape wasn't fully documented for
  this exercise, so `lib/llm.ts` accepts a few likely field names
  (`reply`, `response`, `text`, `output`) and falls back to a friendly
  error message if none match.
- No automated test framework (e.g. Jest) is wired up; instead, `emi.ts`
  and `eligibility.ts` are written as small, pure, easily-testable
  functions, and the worked examples below double as manual test cases.
- Client-side form validation is minimal (basic required/number checks);
  the server re-validates everything before doing any math, since the
  server can never fully trust the client.
- The "illustrative" EMI preview next to the tenure slider (in the
  profile form) uses a representative rate, not the borrower's actual
  matched product — it's clearly labelled as an example, and the real
  numbers always come from the server after submission.

## Test Cases

These use the exact formula in `lib/emi.ts`:
`EMI = P × r × (1+r)ⁿ / ((1+r)ⁿ − 1)`, where `r = annualRatePct / 12 / 100`.

### Worked EMI examples

| # | Product (rate) | Principal (P) | Tenure (n) | EMI | Total Repayment | Total Interest |
|---|---|---|---|---|---|---|
| 1 | Personal Loan (14% p.a.) | ₹300,000 | 36 months | ₹10,253.29 | ₹369,118.40 | ₹69,118.40 |
| 2 | Top-up Loan (12% p.a.) | ₹300,000 | 36 months | ₹9,964.29 | ₹358,714.55 | ₹58,714.55 |
| 3 | SME Loan (13% p.a.) | ₹1,000,000 | 60 months | ₹22,753.07 | ₹1,365,184.38 | ₹365,184.38 |
| 4 | Secured Loan (9.5% p.a.) | ₹2,000,000 | 120 months | ₹25,879.51 | ₹3,105,541.38 | ₹1,105,541.38 |

**Edge case — 0% interest**: when `annualRatePct` is `0`, the formula's
denominator would be zero, so `emi.ts` special-cases it to a plain even
split: `EMI = P / n`. Example: `P = ₹6,000`, `n = 6` → `EMI = ₹1,000`,
`totalRepayment = ₹6,000`, `totalInterest = ₹0`.

### Eligibility rejection example

Profile: loan amount ₹800,000, monthly income ₹8,000, existing EMI
₹6,000, tenure 24 months, employment type `salaried`.

Result: **no product is eligible.** Every product in the catalog has a
minimum monthly income requirement of at least ₹10,000 (BNPL's minimum,
the lowest in the catalog), and this borrower's income of ₹8,000 is
below all of them — so every product fails the income check before FOIR
or amount range are even considered. On top of that, the FOIR check
would also fail for every product: 50% of ₹8,000 income is a ₹4,000
monthly budget, which is already less than the existing ₹6,000 EMI
alone, before adding any new loan payment. The API responds with an
empty `recommendations` array, and the assistant explains in plain
language that the borrower doesn't currently qualify and suggests either
waiting until their income situation changes or applying with a
co-applicant.
