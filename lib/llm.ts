// This file talks to the outside LLM (AI) service.
// It only runs on the server - it reads the secret token from environment
// variables, which are never sent to the browser. The rest of the app
// should only ever call the function below, never fetch the LLM directly.

const LLM_TIMEOUT_MS = 15_000; // give up and fall back after 15 seconds

// What we hand back to whoever called queryLlm.
export type LlmQueryResult = {
  ok: boolean; // false means we had to use the fallback message
  reply: string;
};

// A friendly message to show if the LLM service is down, slow, or broken.
// We keep this separate so the rest of the app never crashes just because
// the AI part had a bad moment - the loan numbers still work fine without it.
function fallbackMessage(): string {
  return (
    "Sorry, I'm having trouble reaching the assistant right now. " +
    "Please try again in a moment. The loan numbers shown below are " +
    "calculated directly by our system, so you can still trust those " +
    "even while the assistant is unavailable."
  );
}

// Sends a prompt to the LLM wrapper service and returns its reply.
// prompt  - the full text we want the AI to respond to
// traceId - an id we attach so this request can be traced/debugged later
export async function queryLlm(
  prompt: string,
  traceId: string
): Promise<LlmQueryResult> {
  const baseUrl = process.env.LLM_URL;
  const token = process.env.LLM_TOKEN;

  // If the app isn't configured properly, fail safely instead of crashing.
  if (!baseUrl || !token) {
    console.error('LLM_URL or LLM_TOKEN is missing from environment variables');
    return { ok: false, reply: fallbackMessage() };
  }

  // AbortController lets us cancel the request if it takes too long.
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), LLM_TIMEOUT_MS);

  try {
    const response = await fetch(`${baseUrl}/llm/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        prompt,
        metadata: { traceId },
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      console.error(`LLM service replied with an error status: ${response.status}`);
      return { ok: false, reply: fallbackMessage() };
    }

    const data = await response.json();

    // We're not 100% sure of the exact shape the wrapper sends back, so we
    // check a few likely field names for the actual text reply.
    const reply = data?.reply ?? data?.response ?? data?.text ?? data?.output;

    if (typeof reply !== 'string' || reply.trim().length === 0) {
      console.error('LLM response did not include usable text:', data);
      return { ok: false, reply: fallbackMessage() };
    }

    return { ok: true, reply };
  } catch (error) {
    // This catches network errors, timeouts (abort), and JSON parse errors.
    console.error('Error while calling the LLM wrapper service:', error);
    return { ok: false, reply: fallbackMessage() };
  } finally {
    clearTimeout(timeoutId);
  }
}
