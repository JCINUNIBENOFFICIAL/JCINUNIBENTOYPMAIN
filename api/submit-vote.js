import { db, json, requireSession, verifySameOrigin } from '../lib/voting.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed.' });
  if (!verifySameOrigin(req)) return json(res, 403, { error: 'Request origin not allowed.' });

  try {
    const voterId = await requireSession(req);
    if (!voterId) {
      return json(res, 401, { error: 'Your voting session is missing or expired. Refresh the page and try again.' });
    }

    const nominationId = Number(req.body?.nomination_id);
    if (!Number.isSafeInteger(nominationId) || nominationId < 1) {
      return json(res, 400, { error: 'Choose a valid nominee.' });
    }

    const forwarded = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
    const userAgent = String(req.headers['user-agent'] || '').slice(0, 500);
    await db('rpc/submit_browser_vote', {
      method: 'POST',
      body: JSON.stringify({
        p_voter_id: voterId,
        p_nomination_id: nominationId,
        p_ip_address: forwarded || null,
        p_user_agent: userAgent || null
      })
    });

    return json(res, 201, { ok: true, message: 'Your vote has been recorded.' });
  } catch (error) {
    if (error.code === '23505') {
      return json(res, 409, { error: 'This browser has already voted in this category.' });
    }
    if (error.code === '55000') {
      return json(res, 403, { error: 'Voting is currently closed.' });
    }
    if (error.code === '28000') {
      return json(res, 401, { error: 'Your voting session is invalid or expired. Refresh the page and try again.' });
    }
    if (error.code === '22023') {
      return json(res, 400, { error: 'This nominee is not currently eligible for voting.' });
    }
    console.error('Vote submission failed:', error);
    return json(res, 503, { error: 'We could not record your vote. Please try again shortly.' });
  }
}
