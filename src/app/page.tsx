import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

// ----- Page content -----
// Keeping the text in arrays makes it easy to edit without touching the layout.

const problems = [
  {
    title: "Hours lost on every proposal",
    text: "Writing a custom pitch for each job post eats the time you should spend on paid work.",
  },
  {
    title: "Guessing your price",
    text: "Quote too high and you lose the job. Quote too low and you lose money.",
  },
  {
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
  },
  {
    icon: "💰",
    title: "Smart price estimate",
    text: "A suggested price range and timeline, with a short explanation of the reasoning.",
  },
  {
    icon: "📅",
    title: "Follow-up schedule",
    text: "Know exactly when to follow up (day 2, 5, 10) with a ready-to-send message for each.",
  },
  {
    icon: "📊",
    title: "Win-rate dashboard",
    text: "Track every proposal as sent, replied, won or lost, and see what is working.",
  },
];

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    features: ["5 proposals per month", "Price estimates", "Follow-up schedule", "Proposal history"],
    cta: "Start free",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$12",
    period: "per month",
    features: [
      "Unlimited proposals",
      "Everything in Free",
      "Follow-up reminders",
      "Win-rate analytics",
    ],
    cta: "Go Pro",
    highlighted: true,
  },
];

// ----- The page -----

export default function LandingPage() {
  return (
    <>
      <Navbar />

      <main className="flex-1">
        {/* HERO: the first thing visitors see */}
        <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 md:grid-cols-2 md:py-24">
          <div>
            <p className="mb-4 inline-block rounded-full bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-700">
              For freelance developers, designers and writers
            </p>
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 md:text-5xl">
              Win more freelance jobs, <span className="text-indigo-600">in less time.</span>
            </h1>
            <p className="mt-5 text-lg text-slate-600">
              Paste a job post. Get a tailored proposal, a smart price estimate and a follow-up plan
              in seconds, all written in your own voice.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/signup"
                className="rounded-lg bg-indigo-600 px-6 py-3 font-semibold text-white hover:bg-indigo-700"
              >
                Write my first proposal free
              </Link>
              <a
                href="#how-it-works"
                className="rounded-lg border border-slate-300 bg-white px-6 py-3 font-semibold text-slate-700 hover:bg-slate-50"
              >
                See how it works
              </a>
            </div>
            <p className="mt-3 text-sm text-slate-500">5 free proposals every month. No credit card needed.</p>
          </div>

          {/* A fake preview of the result, so visitors instantly get the idea */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xl shadow-indigo-100">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Job post</p>
            <p className="mt-1 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
              &ldquo;Need a Next.js developer to build a booking site for my yoga studio...&rdquo;
            </p>

            <p className="mt-5 text-xs font-semibold uppercase tracking-wide text-slate-400">Your proposal</p>
            <p className="mt-1 text-sm text-slate-700">
              Hi Sarah, I&apos;ve built 3 booking platforms with Next.js, including one for a fitness
              studio that cut no-shows by 30%...
            </p>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-emerald-50 p-3">
                <p className="text-xs text-emerald-700">Suggested price</p>
                <p className="font-bold text-emerald-900">$1,200 to $1,600</p>
              </div>
              <div className="rounded-lg bg-amber-50 p-3">
                <p className="text-xs text-amber-700">Follow up on</p>
                <p className="font-bold text-amber-900">Day 2 · 5 · 10</p>
              </div>
            </div>
          </div>
        </section>

        {/* PROBLEM */}
        <section className="bg-white py-16">
          <div className="mx-auto max-w-6xl px-4">
            <h2 className="text-center text-3xl font-bold text-slate-900">
              Sending proposals shouldn&apos;t be a second job
            </h2>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {problems.map((problem) => (
                <div key={problem.title} className="rounded-xl border border-slate-200 p-6">
                  <h3 className="font-semibold text-slate-900">{problem.title}</h3>
                  <p className="mt-2 text-slate-600">{problem.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section id="how-it-works" className="py-16">
          <div className="mx-auto max-w-6xl px-4">
            <h2 className="text-center text-3xl font-bold text-slate-900">How it works</h2>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {steps.map((step) => (
                <div key={step.number} className="text-center">
                  <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-indigo-600 text-lg font-bold text-white">
                    {step.number}
                  </div>
                  <h3 className="mt-4 font-semibold text-slate-900">{step.title}</h3>
                  <p className="mt-2 text-slate-600">{step.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FEATURES / SOLUTION */}
        <section className="bg-white py-16">
          <div className="mx-auto max-w-6xl px-4">
            <h2 className="text-center text-3xl font-bold text-slate-900">
              More than a proposal writer
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-center text-slate-600">
              Other tools stop at the text. ProposalForge gives you the whole plan for winning the job.
            </p>
            <div className="mt-10 grid gap-6 sm:grid-cols-2">
              {features.map((feature) => (
                <div key={feature.title} className="flex gap-4 rounded-xl border border-slate-200 p-6">
                  <span className="text-3xl">{feature.icon}</span>
                  <div>
                    <h3 className="font-semibold text-slate-900">{feature.title}</h3>
                    <p className="mt-1 text-slate-600">{feature.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* PRICING */}
        <section id="pricing" className="py-16">
          <div className="mx-auto max-w-4xl px-4">
            <h2 className="text-center text-3xl font-bold text-slate-900">Simple pricing</h2>
            <p className="mt-3 text-center text-slate-600">
              One won job pays for years of Pro.
            </p>
            <div className="mt-10 grid gap-6 md:grid-cols-2">
              {plans.map((plan) => (
                <div
                  key={plan.name}
                  className={`rounded-2xl p-8 ${
                    plan.highlighted
                      ? "bg-indigo-600 text-white shadow-xl shadow-indigo-200"
                      : "border border-slate-200 bg-white text-slate-900"
                  }`}
                >
                  <h3 className="text-lg font-semibold">{plan.name}</h3>
                  <p className="mt-4">
                    <span className="text-4xl font-bold">{plan.price}</span>{" "}
                    <span className={plan.highlighted ? "text-indigo-100" : "text-slate-500"}>
                      {plan.period}
                    </span>
                  </p>
                  <ul className="mt-6 space-y-2">
                    {plan.features.map((item) => (
                      <li key={item}>✓ {item}</li>
                    ))}
                  </ul>
                  <Link
                    href="/signup"
                    className={`mt-8 block rounded-lg px-4 py-3 text-center font-semibold ${
                      plan.highlighted
                        ? "bg-white text-indigo-700 hover:bg-indigo-50"
                        : "bg-indigo-600 text-white hover:bg-indigo-700"
                    }`}
                  >
                    {plan.cta}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FINAL CALL TO ACTION */}
        <section className="bg-slate-900 py-16 text-center text-white">
          <div className="mx-auto max-w-2xl px-4">
            <h2 className="text-3xl font-bold">Your next client is posting a job right now.</h2>
            <p className="mt-3 text-slate-300">Be the first to send a great proposal.</p>
            <Link
              href="/signup"
              className="mt-8 inline-block rounded-lg bg-indigo-500 px-6 py-3 font-semibold text-white hover:bg-indigo-400"
            >
              Start free
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
