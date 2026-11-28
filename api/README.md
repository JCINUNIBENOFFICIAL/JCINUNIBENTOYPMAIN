# Cookie-based voting API setup

The voting API in this repository uses Vercel Node.js serverless functions under `/api`.
It must be deployed on the **same origin** as the public voting page so the browser's
HttpOnly cookie is first-party. A static GitHub Pages deployment cannot run these API
routes.

## Required Vercel environment variable

Set this server-side variable in the Vercel project for the public site:

- `SUPABASE_URL`: `https://xbrndlhzaluksjhdbnur.supabase.co`
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase server-only service-role secret. Never use a
  publishable/anon key here and never prefix this secret with `NEXT_PUBLIC_`.

Do not commit secrets to this repository. Restrict this key to Vercel server-side
environment variables.

## Database proposals that must be reviewed and applied

1. `database/proposals/browser-cookie-voting.sql`
   - creates the private browser session table;
   - removes the auth.users foreign key from `votes.voter_id`, allowing UUIDs for
     server-issued browser identities while preserving existing vote IDs;
   - retains the unique one-vote-per-identity/category constraint.
2. `database/proposals/manual-nomination-soft-merge.sql` in the admin dashboard repo
   - adds the nullable `nominations.merged_into_id` relationship and merge audit table;
   - installs the administrator-gated soft-merge RPC.
3. `database/proposals/public-voting-standings.sql`
   - returns one public row for each confirmed canonical nominee;
   - includes the canonical nomination ID for the ballot and aggregates votes against
     retained linked nomination records.

Apply and verify the admin soft-merge schema before the public standings function,
because the latter reads `merged_into_id`. Apply none of these SQL proposals without
review and explicit approval.

## Behaviour and limitations

- The API issues a random 256-bit token in an HttpOnly, Secure, SameSite=Lax cookie.
  Only the SHA-256 token hash is stored in the database.
- The API validates the cookie, nominee eligibility, finalist stage, voting window,
  and category server-side. The database unique constraint prevents a second vote
  from the same browser identity in the same category.
- The browser can vote once in each category, not just once overall.
- Clearing cookies, using private browsing, another browser, or another device creates
  a new browser identity. Cookie-based voting is therefore a low-friction deterrent,
  not verified one-person-one-vote identity.
- The public standings RPC exposes aggregate counts and nominee identifiers only.
  Individual voter identity and vote metadata are not returned to the public.
- Do not enable voting until the migrations, Vercel environment, same-origin API
  deployment, and mobile browser tests have all been completed.
