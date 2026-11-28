import { createHash, randomBytes } from 'node:crypto';

const COOKIE_NAME = 'toyp_voter';
const SESSION_SECONDS = 60 * 60 * 24 * 365;

export function json(res, status, payload) {
  res.status(status).setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(payload));
}

export function verifySameOrigin(req) {
  const origin = req.headers.origin;
  const host = req.headers.host;
  if (!origin || !host) return false;
  try {
    const parsed = new URL(origin);
    return parsed.protocol === 'https:' && parsed.host.toLowerCase() === host.toLowerCase();
  } catch {
    return false;
  }
}

export function cookieValue(req) {
  const header = req.headers.cookie || '';
  const item = header.split(';').map(part => part.trim()).find(part => part.startsWith(COOKIE_NAME + '='));
  return item ? decodeURIComponent(item.slice(COOKIE_NAME.length + 1)) : '';
}

export function issueCookie(res, token) {
  res.setHeader('Set-Cookie', `${COOKIE_NAME}=${encodeURIComponent(token)}; Max-Age=${SESSION_SECONDS}; Path=/; HttpOnly; Secure; SameSite=Lax`);
}

export function tokenHash(token) {
  return createHash('sha256').update(token).digest('hex');
}

export function newToken() {
  return randomBytes(32).toString('base64url');
}

function config() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Voting API environment is not configured.');
  return { url: url.replace(/\/$/, ''), key };
}

export async function db(path, options = {}) {
  const { url, key } = config();
  const response = await fetch(url + '/rest/v1/' + path, {
    ...options,
    headers: {
      apikey: key,
      Authorization: 'Bearer ' + key,
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });
  const body = await response.text();
  let data = null;
  try { data = body ? JSON.parse(body) : null; } catch { data = body; }
  if (!response.ok) {
    const error = new Error(data?.message || 'Database request failed.');
    error.status = response.status;
    error.code = data?.code;
    throw error;
  }
  return data;
}

export async function getOrCreateSession(req, res) {
  let token = cookieValue(req);
  if (token && token.length >= 32 && token.length <= 128) {
    const hash = tokenHash(token);
    const existing = await db('browser_voter_sessions?select=id,expires_at&token_hash=eq.' +
      encodeURIComponent(hash) + '&revoked_at=is.null&expires_at=gt.' +
      encodeURIComponent(new Date().toISOString()) + '&limit=1');
    if (existing?.length) return { id: existing[0].id, created: false };
  }

  token = newToken();
  const expiresAt = new Date(Date.now() + SESSION_SECONDS * 1000).toISOString();
  const created = await db('browser_voter_sessions?select=id', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify({ token_hash: tokenHash(token), expires_at: expiresAt })
  });
  if (!created?.[0]?.id) throw new Error('Could not create a voting session.');
  issueCookie(res, token);
  return { id: created[0].id, created: true };
}

export async function requireSession(req) {
  const token = cookieValue(req);
  if (!token || token.length < 32 || token.length > 128) return null;
  const rows = await db('browser_voter_sessions?select=id&token_hash=eq.' +
    encodeURIComponent(tokenHash(token)) + '&revoked_at=is.null&expires_at=gt.' +
    encodeURIComponent(new Date().toISOString()) + '&limit=1');
  return rows?.[0]?.id || null;
}

export async function votingIsOpen() {
  const rows = await db("settings?select=key,value&key=in.(voting_open,voting_start_time,voting_close_time)");
  const settings = Object.fromEntries((rows || []).map(row => [row.key, row.value]));
  if (String(settings.voting_open).toLowerCase() !== 'true') return false;
  const now = Date.now();
  if (settings.voting_start_time && Date.parse(settings.voting_start_time) > now) return false;
  if (settings.voting_close_time && Date.parse(settings.voting_close_time) <= now) return false;
  return true;
}
