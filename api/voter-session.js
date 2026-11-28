import { db, json, verifySameOrigin, getOrCreateSession } from './_voting.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed.' });
  if (!verifySameOrigin(req)) return json(res, 403, { error: 'Request origin not allowed.' });
  try {
    const session = await getOrCreateSession(req, res);
    const votes = await db('votes?select=category&voter_id=eq.' + encodeURIComponent(session.id));
    const votedCategories = [...new Set((votes || []).map(row => row.category).filter(Boolean))];
    return json(res, 200, { ok: true, session_created: session.created, voted_categories: votedCategories });
  } catch (error) {
    console.error('Voter session initialization failed:', error);
    return json(res, 503, { error: 'Voting is temporarily unavailable. Please try again shortly.' });
  }
}
