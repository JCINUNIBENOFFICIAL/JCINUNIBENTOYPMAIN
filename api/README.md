# Cookie-based voting API setup

The voting API uses Vercel Node.js serverless functions under `/api`. It must be
deployed on the **same origin** as the public voting page so the HttpOnly cookie is
first-party. A static GitHub Pages deployment cannot run these API routes.

## Required Vercel environment variables

Set these server-side variables in the Vercel project for the public site:

- `SUPABASE_URL`: `https://xbrndlhzaluksjhdbnur.supabase.co`
- `SUPABASE_SERVICE_ROLE_KEY`: the Supabase server-only service-role secret.

Never expose the service-role secret in browser code, commit it to this repository, or
prefix it with `NEXT_PUBLIC_`.

## Database proposals and required order

These files are proposals only. Review and obtain explicit approval before applying
any SQL to Supabase.

1. Admin dashboard repository:
   `database/proposals/manual-nomination-soft-merge.sql`
   - Adds `nominations.merged_into_id` and the private merge audit table.
   - Adds a guarded, administrator-only soft-merge RPC.
   - Does not rename, delete, or overwrite original nomination data.
2. Public website repository:
   `database/proposals/browser-cookie-voting.sql`
   - Creates the private browser session table.
   - Removes the `auth.users` foreign key from `votes.voter_id`; existing vote rows
     are retained and the existing unique (voter_id, category) constraint remains.
   - Revokes direct vote insertion from browser roles and provides the atomic
     `submit_browser_vote` RPC for the server-side API.
3. Public website repository:
   `database/proposals/public-voting-standings.sql`
   - Returns one aggregate row per canonical nominee.
   - Includes canonical nomination IDs for the ballot and counts votes against linked
     records.
   - Reports voting open only when the Boolean setting and configured start/close
     timestamps all permit voting.

The admin soft-merge schema must be applied before the voting and standings proposals,
because both voting functions rely on `nominations.merged_into_id`. The voting
proposal must be applied before the API can create sessions or submit votes.

## Behaviour and limitations

- The API issues a random 256-bit token in an HttpOnly, Secure, SameSite=Lax cookie.
  Only the SHA-256 token hash is stored in the database.
- The server validates the session, nominee eligibility, finalist stage, voting window,
  and category in one database transaction before inserting a vote.
- The database unique constraint enforces one vote per browser identity/category.
  Concurrent submissions from the same session are serialized and duplicates rejected.
- The browser can vote once in each category, not just once overall.
- Clearing cookies, using private browsing, another browser, or another device creates
  a new browser identity. This is a low-friction deterrent, not verified
  one-person-one-vote identity.
- Public standings expose aggregate counts and canonical nomination identifiers only;
  voter identity and vote metadata are not returned.
- Expired browser sessions are not currently automatically purged. A scheduled cleanup
  can be added later after operational review.
- Do not enable voting until the SQL proposals, Vercel environment, same-origin API
  deployment, and mobile browser tests have all been completed.
