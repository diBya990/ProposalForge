import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Background3D from "@/components/Background3D";
import Reveal from "@/components/Reveal";

// ----- Page content -----
// Keeping the text in arrays makes it easy to edit without touching the layout.

const problems = [
  {
    icon: "⏳",
    title: "Hours lost on every proposal",
    text: "Writing a custom pitch for each job post eats the time you should spend on paid work.",
  },
  {
    icon: "🎯",
    title: "Guessing your price",
    text: "Quote too high and you lose the job. Quote too low and you lose money.",
  },
  {
    icon: "🔕",
    title: "Forgetting to follow up",
    text: "Most replies come after a follow-up, but almost nobody tracks when to send one.",
  },
];

const steps = [
  { number: "1", title: "Set up your profile once", text: "Skills, experience, rate, portfolio links and your writing tone." },
  { number: "2", title: "Paste a job post", text: "From Upwork, Fiverr, LinkedIn or anywhere else." },
  { number: "3", title: "Get your full game plan", text: "A proposal, a price, and a follow-up schedule, ready in seconds." },
];

const features = [
  {
    icon: "✍️",
    title: "Tailored proposal",
    text: "Written in your voice, pointing to the skills and portfolio pieces that match the job.",
    color: "from-indigo-500/20",
  },
  {
    icon: "💰",
    title: "Smart price estimate",
    text: "A suggested price range and timeline, with a short explanation of the reasoning.",
    color: "from-emerald-500/20",
  },
  {
    icon: "📅",
    title: "Follow-up schedule",
    text: "Know exactly when to follow up (day 2, 5, 10) with a ready-to-send message for each.",
    color: "from-amber-500/20",
  },
  {
    icon: "📊",
    title: "Win-rate dashboard",
    text: "Track every proposal as sent, replied, won or lost, and see what is working.",
    color: "from-fuchsia-500/20",
  },
];

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    features: ["5 jobs per month with full AI help", "Job feed matched to your skills", "Proposals, prices and follow-ups", "Earnings dashboard"],
    cta: "Start free",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$12",
    period: "per month",
    features: ["Unlimited jobs and AI advice", "Everything in Free", "Follow-up reminders", "Win-rate analytics"],
    cta: "Go Pro",
    highlighted: true,
  },
];

// ----- The page -----

export default function LandingPage() {
  return (
    <>
      <Background3D />
      <Navbar />

      <main className="flex-1">
        {/* HERO: the first thing visitors see */}
        <section className="mx-auto grid max-w-6xl items-center gap-14 px-4 py-16 md:grid-cols-2 md:py-28">
          <div>
            <p className="glass mb-5 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm text-slate-300">
              <span className="h-2 w-2 animate-pulse rounded-full bg-cyan-400" />
              For freelance developers, designers and writers
            </p>
            <h1 className="text-4xl font-bold leading-tight tracking-tight text-white md:text-6xl">
              Win more freelance jobs, <span className="gradient-text">in less time.</span>
            </h1>
            <p className="mt-6 text-lg text-slate-400">
              Paste a job post. Get a tailored proposal, a smart price estimate and a follow-up plan
              in seconds, all written in your own voice.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/signup" className="btn-glow rounded-xl px-6 py-3 font-semibold text-white">
                Write my first proposal free
              </Link>
              <a
                href="#how-it-works"
                className="btn-soft rounded-xl px-6 py-3 font-semibold text-slate-200"
              >
                See how it works
              </a>
            </div>
            <p className="mt-4 text-sm text-slate-500">5 free jobs with full AI help every month. No credit card needed.</p>
          </div>

          {/* HERO PREVIEW: a still example of what the app produces */}
          <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-6 shadow-2xl shadow-indigo-900/50">
            <div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Job post</p>
                <p className="mt-1 rounded-xl bg-white/5 p-3 text-sm text-slate-400">
                  &ldquo;Need a Next.js developer to build a booking site for my yoga studio...&rdquo;
                </p>
              </div>

              <div className="mt-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Your proposal</p>
                <p className="mt-1 rounded-xl border border-indigo-500/30 bg-indigo-500/10 p-3 text-sm text-slate-200">
                  Hi Sarah, I&apos;ve built 3 booking platforms with Next.js, including one for a fitness
                  studio that cut no-shows by 30%...
                </p>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-emerald-400/30 bg-emerald-500/15 p-3 shadow-lg shadow-emerald-500/20">
                  <p className="text-xs text-emerald-300">Suggested price</p>
                  <p className="font-bold text-white">$1,200 to $1,600</p>
                </div>
                <div className="rounded-xl border border-amber-400/30 bg-amber-500/15 p-3 shadow-lg shadow-amber-500/20">
                  <p className="text-xs text-amber-300">Follow up on</p>
                  <p className="font-bold text-white">Day 2 · 5 · 10</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* PROBLEM */}
        <section className="py-20">
          <div className="mx-auto max-w-6xl px-4">
            <Reveal>
              <h2 className="text-center text-3xl font-bold text-white md:text-4xl">
                Sending proposals shouldn&apos;t be a second job
              </h2>
            </Reveal>
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {problems.map((problem, index) => (
                <Reveal key={problem.title} delay={index * 120}>
                  <div className="glass h-full rounded-2xl p-6">
                    <span className="text-3xl">{problem.icon}</span>
                    <h3 className="mt-3 font-semibold text-white">{problem.title}</h3>
                    <p className="mt-2 text-slate-400">{problem.text}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section id="how-it-works" className="py-20">
          <div className="mx-auto max-w-6xl px-4">
            <Reveal>
              <h2 className="text-center text-3xl font-bold text-white md:text-4xl">How it works</h2>
            </Reveal>
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {steps.map((step, index) => (
                <Reveal key={step.number} delay={index * 120}>
                  <div className="glass h-full rounded-2xl p-6 text-center">
                    <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-xl font-bold text-white shadow-lg shadow-violet-500/40">
                      {step.number}
                    </div>
                    <h3 className="mt-4 font-semibold text-white">{step.title}</h3>
                    <p className="mt-2 text-slate-400">{step.text}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* FEATURES / SOLUTION */}
        <section id="features" className="py-20">
          <div className="mx-auto max-w-6xl px-4">
            <Reveal>
              <h2 className="text-center text-3xl font-bold text-white md:text-4xl">
                More than a <span className="gradient-text">proposal writer</span>
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-center text-slate-400">
                Other tools stop at the text. ProposalForge gives you the whole plan for winning the job.
              </p>
            </Reveal>
            <div className="mt-12 grid gap-6 sm:grid-cols-2">
              {features.map((feature, index) => (
                <Reveal key={feature.title} delay={index * 100}>
                  <div className={`glass h-full rounded-2xl bg-gradient-to-br ${feature.color} to-transparent p-6`}>
                    <div className="flex gap-4">
                      <span className="text-3xl">{feature.icon}</span>
                      <div>
                        <h3 className="font-semibold text-white">{feature.title}</h3>
                        <p className="mt-1 text-slate-400">{feature.text}</p>
                      </div>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* PRICING */}
        <section id="pricing" className="py-20">
          <div className="mx-auto max-w-4xl px-4">
            <Reveal>
              <h2 className="text-center text-3xl font-bold text-white md:text-4xl">Simple pricing</h2>
              <p className="mt-4 text-center text-slate-400">One won job pays for years of Pro.</p>
            </Reveal>
            <div className="mt-12 grid gap-6 md:grid-cols-2">
              {plans.map((plan, index) => (
                <Reveal key={plan.name} delay={index * 150}>
                  <div
                    className={`h-full rounded-3xl p-8 ${
                      plan.highlighted
                        ? "bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 shadow-2xl shadow-violet-600/40"
                        : "glass"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-white">{plan.name}</h3>
                      {plan.highlighted && (
                        <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white">
                          Most popular
                        </span>
                      )}
                    </div>
                    <p className="mt-4 text-white">
                      <span className="text-5xl font-bold">{plan.price}</span>{" "}
                      <span className={plan.highlighted ? "text-indigo-100" : "text-slate-400"}>
                        {plan.period}
                      </span>
                    </p>
                    <ul className={`mt-6 space-y-2 ${plan.highlighted ? "text-white" : "text-slate-300"}`}>
                      {plan.features.map((item) => (
                        <li key={item}>✓ {item}</li>
                      ))}
                    </ul>
                    <Link
                      href="/signup"
                      className={`mt-8 block rounded-xl px-4 py-3 text-center font-semibold transition ${
                        plan.highlighted
                          ? "bg-white text-violet-700 hover:-translate-y-0.5 hover:bg-indigo-50 hover:shadow-xl hover:shadow-white/30"
                          : "btn-glow text-white"
                      }`}
                    >
                      {plan.cta}
                    </Link>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* FINAL CALL TO ACTION */}
        <section className="py-24">
          <Reveal>
            <div className="mx-auto max-w-3xl px-4">
              <div className="glass rounded-3xl p-10 text-center">
                <h2 className="text-3xl font-bold text-white md:text-4xl">
                  Your next client is posting a job <span className="gradient-text">right now.</span>
                </h2>
                <p className="mt-4 text-slate-400">Be the first to send a great proposal.</p>
                <Link
                  href="/signup"
                  className="btn-glow mt-8 inline-block rounded-xl px-8 py-3 font-semibold text-white"
                >
                  Start free
                </Link>
              </div>
            </div>
          </Reveal>
        </section>
      </main>

      <Footer />
    </>
  );
}
