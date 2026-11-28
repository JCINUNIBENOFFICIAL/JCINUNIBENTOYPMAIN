import { json, verifySameOrigin, getOrCreateSession } from './_voting.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed.' });
  if (!verifySameOrigin(req)) return json(res, 403, { error: 'Request origin not allowed.' });
  try {
    const session = await getOrCreateSession(req, res);
    return json(res, 200, { ok: true, session_created: session.created });
  } catch (error) {
    console.error('Voter session initialization failed:', error);
    return json(res, 503, { error: 'Voting is temporarily unavailable. Please try again shortly.' });
  }
}
