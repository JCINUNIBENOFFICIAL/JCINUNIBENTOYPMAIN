import { db, json, requireSession, verifySameOrigin, votingIsOpen } from '../lib/voting.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed.' });
  if (!verifySameOrigin(req)) return json(res, 403, { error: 'Request origin not allowed.' });

  try {
    const voterId = await requireSession(req);
    if (!voterId) return json(res, 401, { error: 'Your voting session is missing. Refresh the page and try again.' });

    const nominationId = Number(req.body?.nomination_id);
    if (!Number.isSafeInteger(nominationId) || nominationId < 1) {
      return json(res, 400, { error: 'Choose a valid nominee.' });
    }
    if (!(await votingIsOpen())) return json(res, 403, { error: 'Voting is currently closed.' });

    const roots = await db('nominations?select=id,category,merged_into_id&id=eq.' +
      nominationId + '&merged_into_id=is.null&limit=1');
    const nominee = roots?.[0];
    if (!nominee || !nominee.category) {
      return json(res, 400, { error: 'This nominee is not currently eligible for voting.' });
    }
    const eligibleMembers = await db('nominations?select=id&or=(id.eq.' + nominationId +
      ',merged_into_id.eq.' + nominationId + ')&ready_for_voting=is.true&stage=eq.finalist&limit=1');
    if (!eligibleMembers?.length) {
      return json(res, 400, { error: 'This nominee is not currently eligible for voting.' });
    }

    const forwarded = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
    const userAgent = String(req.headers['user-agent'] || '').slice(0, 500);
    await db('votes', {
      method: 'POST',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({
        nomination_id: nominee.id,
        voter_id: voterId,
        category: nominee.category,
        ip_address: forwarded || null,
        user_agent: userAgent || null
      })
    });
    return json(res, 201, { ok: true, message: 'Your vote has been recorded.' });
  } catch (error) {
    if (error.code === '23505') {
      return json(res, 409, { error: 'This browser has already voted in this category.' });
    }
    console.error('Vote submission failed:', error);
    return json(res, 503, { error: 'We could not record your vote. Please try again shortly.' });
  }
}
