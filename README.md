# ProposalForge

**Paste a job post, get a winning proposal, price and follow-up plan.**

ProposalForge helps freelancers (developers, designers, writers) win more jobs in less time. Paste a job post from Upwork, Fiverr, LinkedIn or anywhere else and get:

1. **A tailored proposal** written in your voice, using your saved profile
2. **A price estimate**: a suggested range and timeline, with the reasoning
3. **A follow-up schedule**: when to follow up, with a ready-to-send message for each

Built for the **Galuxium Nexus V2** hackathon.

🔗 **Live app:** https://proposal-forge-six.vercel.app

## Pricing

| Plan | Price | What you get |
|------|-------|--------------|
| Free | $0 | 5 jobs / month with full AI help (3 advisors + proposal) |
| Pro  | $12 / month | Unlimited jobs and AI advice, follow-up reminders, win-rate analytics |

## Business rules

| Rule | Where it is enforced |
|------|----------------------|
| Free plan: 5 jobs per calendar month; Pro: unlimited. The first AI action on a job uses 1 credit; after that, all 3 advisors and the proposal for that job are included | Database function `use_job_credit` + trigger (`supabase/schema.sql`) |
| Deleting jobs or proposals doesn't give credits back (a monthly counter is used) | Database |
| Users can't change their own plan; only the signed payment webhook can | Database column permissions + webhook signature check (`src/lib/billing.ts`) |
| Pro while the subscription is active, on trial, retrying a failed payment, or cancelled but paid until its end date; Free when expired, unpaid or paused | `planFromStatus` in `src/lib/billing.ts` |
| Users can only see and edit their own data | Row Level Security on every table |
| AI proposals unlock once name, 3+ skills, a 50+ character experience summary and hourly rate are set | `src/lib/rules.ts` |
| Income counts only for completed projects, on their completion date; cancelled never counts | `src/lib/earnings.ts` |
| A completed project needs a completion date, which can't be before the start or in the future | Server action + database check |
| Win rate = proposals won ÷ proposals sent (drafts excluded) | `src/lib/rules.ts` |
| Follow-ups are due 2, 5 and 10 days after a proposal is marked Sent, and stop once the client replies or the job is won/lost | `src/lib/followups.ts` |
| A won proposal can be added to Work & earnings once (as an in-progress project) | Server action |

## Tech stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- Supabase (database + auth)
- Google Gemini API, free tier (AI generation; provider isolated in `src/lib/ai.ts`)
- Lemon Squeezy (payments, test mode). Chosen because Stripe does not support sellers in Bangladesh; Lemon Squeezy is a merchant of record that handles global sales tax
- Vercel (hosting)
- Job listings: free public APIs from [Himalayas](https://himalayas.app), [Remote OK](https://remoteok.com) and [Remotive](https://remotive.com), credited with links to every original post

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
- [x] Step 2: Sign up / login (email + Google)
- [x] Step 3: Freelancer profile, work history & earnings, dashboard with earnings graph
- [x] Step 4: AI proposal generator (proposal + price estimate + follow-up schedule)
- [x] Step 5: Job feed: real remote jobs matched to your skills (Himalayas, Remote OK, Remotive)
- [x] Step 6: Job page with 3 AI advisors: Should I apply?, Rate & income coach, Payment & contract assistant
- [x] Step 7: Edit and copy, proposal history and status, follow-up reminders
- [x] Step 8: Deploy to Vercel
- [x] Step 9: Payments with Lemon Squeezy (test mode): upgrade to Pro, webhook, billing page
- [ ] Step 9b: Polish
- [ ] Step 10: Submission
