// Server-side only. Never import this from /src — ADMIN_EMAIL must stay off the client.

const USER_MESSAGES = {
  503: "**Merridian is experiencing high demand right now.**\n\nPlease try again in a few minutes. If this keeps happening, please contact the admin.",
  429: "**Merridian has reached its usage limit for now.**\n\nPlease try again later. If this keeps happening, please contact the admin.",
  default: "**Something went wrong while generating a response.**\n\nPlease try again shortly. If the problem continues, please contact the admin.",
};

const ADMIN_MESSAGES = {
  503: "**[Admin] Gemini is overloaded (503).**\n\nGoogle's shared servers are at capacity. This is not caused by your API usage or quota. Retried 3 times automatically. Try again in a few minutes, or switch to a less busy model.",
  429: "**[Admin] Your Gemini quota is exhausted (429).**\n\nYour API key has hit its per-minute or daily limit. Wait for the reset, or upgrade the plan in Google AI Studio.",
  401: "**[Admin] Gemini rejected your API key.**\n\nCheck that `GEMINI_API_KEY` is set correctly in Vercel → Settings → Environment Variables, then redeploy.",
  403: "**[Admin] Gemini rejected your API key.**\n\nCheck that `GEMINI_API_KEY` is set correctly in Vercel → Settings → Environment Variables, then redeploy.",
  'no-key': "**[Admin] `GEMINI_API_KEY` is not configured.**\n\nAdd it in Vercel → Settings → Environment Variables, then redeploy.",
  default: "**[Admin] Request failed.**\n\nCheck Vercel → Logs for the full error.",
};

// Verifies the Supabase access token server-side and checks the email against ADMIN_EMAIL.
export async function isAdminRequest(authHeader) {
  const admins = (process.env.ADMIN_EMAIL || '')
    .split(',').map(e => e.trim().toLowerCase()).filter(Boolean);
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  if (!admins.length || !url || !anonKey || !authHeader?.startsWith('Bearer ')) return false;

  try {
    const base = url.startsWith('http') ? url : `https://${url}`;
    const res = await fetch(`${base.replace(/\/$/, '')}/auth/v1/user`, {
      headers: { Authorization: authHeader, apikey: anonKey },
    });
    if (!res.ok) return false;
    const user = await res.json();
    return admins.includes((user.email || '').toLowerCase());
  } catch {
    return false;
  }
}

export function errorMessage(code, isAdmin) {
  const table = isAdmin ? ADMIN_MESSAGES : USER_MESSAGES;
  return table[code] || table.default;
}
