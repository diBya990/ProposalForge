# ProposalForge

**Paste a job post, get a winning proposal, price and follow-up plan.**

ProposalForge helps freelancers (developers, designers, writers) win more jobs in less time. Paste a job post from Upwork, Fiverr, LinkedIn or anywhere else and get:

1. **A tailored proposal** written in your voice, using your saved profile
2. **A price estimate**: a suggested range and timeline, with the reasoning
3. **A follow-up schedule**: when to follow up, with a ready-to-send message for each

Built for the **Galuxium Nexus V2** hackathon.

## Pricing

| Plan | Price | What you get |
|------|-------|--------------|
| Free | $0 | 5 proposals / month |
| Pro  | $12 / month | Unlimited proposals, follow-up reminders, win-rate analytics |

## Business rules

| Rule | Where it is enforced |
|------|----------------------|
| Free plan: 5 proposals per calendar month; Pro: unlimited | Database trigger (`supabase/schema.sql`) + dashboard usage meter |
| Deleting proposals doesn't give free proposals back (a monthly counter is used) | Database trigger |
| Users can't change their own plan; only payments can | Database column permissions |
| Users can only see and edit their own data | Row Level Security on every table |
| AI proposals unlock once name, 3+ skills, a 50+ character experience summary and hourly rate are set | `src/lib/rules.ts` |
| Income counts only for completed projects, on their completion date; cancelled never counts | `src/lib/earnings.ts` |
| A completed project needs a completion date, which can't be before the start or in the future | Server action + database check |
| Win rate = proposals won ÷ proposals sent (drafts excluded) | `src/lib/rules.ts` |

## Tech stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- Supabase (database + auth)
- Claude API (AI generation)
- Stripe (payments, test mode)
- Vercel (hosting)

## Run it locally

```bash
npm install
cp .env.example .env.local   # then fill in your own keys
# Once: in Supabase -> SQL Editor, run supabase/schema.sql
npm run dev
```

Open http://localhost:3000.

## Progress

- [x] Step 0: Project setup
- [x] Step 1: Landing page
- [x] Step 2: Sign up / login (email + Google) and 3D landing page redesign
- [x] Step 3: Freelancer profile, work history & earnings, dashboard with earnings graph
- [ ] Step 4: AI proposal generator
- [ ] Step 5: Edit and copy
- [ ] Step 6: Proposal history and status
- [ ] Step 7: Dashboard
- [ ] Step 8: Stripe payments
- [ ] Step 9: Polish
- [ ] Step 10: Submission
