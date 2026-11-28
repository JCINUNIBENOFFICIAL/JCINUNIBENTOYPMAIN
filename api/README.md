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
   - Creates a private browser session table and a separate `browser_votes` table.
   - Keeps the existing `votes` table, auth.users foreign key, policies, grants,
     unique constraint, and existing vote records unchanged.
   - Adds a server-only atomic RPC for browser-cookie vote submissions.
3. Public website repository:
   `database/proposals/public-voting-standings.sql`
   - Returns one aggregate row per canonical nominee.
   - Includes canonical nomination IDs for the ballot and aggregates both existing
     authenticated votes and new browser-cookie votes, including linked records.
   - Reports voting open only when the Boolean setting and configured start/close
     timestamps all permit voting.

Apply in this order after review: admin soft-merge schema, browser-cookie voting
schema, then public standings function. The browser voting API requires the first two
proposals. Do not apply any proposal without explicit approval.

## Behaviour and limitations

- The API issues a random 256-bit token in an HttpOnly, Secure, SameSite=Lax cookie.
  Only the SHA-256 token hash is stored in the database.
- Browser-cookie votes are kept in `browser_votes`; the existing authenticated
  `votes` table is not modified by this feature.
- The server validates the session, nominee eligibility, finalist stage, voting window,
  and category in one database transaction before inserting a browser vote.
- A database unique constraint enforces one vote per browser identity/category.
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
