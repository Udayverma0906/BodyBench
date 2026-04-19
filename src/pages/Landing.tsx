import { useState } from "react";
import { BarChart2, TrendingUp, Users, ChevronRight } from "lucide-react";
import Navbar from "../components/layout/Navbar";
import Button from "../components/ui/Button";
import BasePopup from "../components/ui/BasePopup";
import ScoreRing from "../components/ui/ScoreRing";

interface Props {
  onStart: () => void;
}

const SAMPLE_METRICS = [
  { label: "Endurance", value: 82, bar: "bg-indigo-500",  text: "text-indigo-500 dark:text-indigo-400" },
  { label: "Strength",  value: 75, bar: "bg-emerald-500", text: "text-emerald-600 dark:text-emerald-400" },
  { label: "Core",      value: 68, bar: "bg-violet-500",  text: "text-violet-600 dark:text-violet-400" },
];

const FEATURES = [
  {
    icon: <BarChart2 className="w-5 h-5" />,
    color: "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400",
    title: "Science-Backed Scoring",
    desc: "Benchmarks from validated fitness standards, weighted by age and body composition for a fair result.",
  },
  {
    icon: <TrendingUp className="w-5 h-5" />,
    color: "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400",
    title: "Track Progress Over Time",
    desc: "Every assessment is saved to your history with trend charts so you can see the work paying off.",
  },
  {
    icon: <Users className="w-5 h-5" />,
    color: "bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400",
    title: "Trainer-Led Gyms",
    desc: "Trainers manage their roster from a live gym dashboard. Clients connect instantly with a join code.",
  },
];

const STEPS = [
  { n: "01", title: "Enter Your Details",   desc: "Age and weight personalise your benchmark targets." },
  { n: "02", title: "Do the Exercises",     desc: "Push-ups, squats, plank hold, and a 1 km run." },
  { n: "03", title: "Get Your Score",       desc: "Instant weighted score out of 100 with a full metric breakdown." },
  { n: "04", title: "Track & Improve",      desc: "History, trends, and trainer feedback keep you accountable." },
];

const HOW_TO_STEPS = [
  { step: "1", title: "Enter Your Details",   desc: "Provide your age and body weight so the scoring engine can personalise your results." },
  { step: "2", title: "Complete the Exercises", desc: "Record your push-up count, squat count, plank hold time, and a 1 km jog time." },
  { step: "3", title: "Calculate Your Score",  desc: 'Hit "Calculate Score" to get a weighted score out of 100 with a per-metric breakdown.' },
  { step: "4", title: "Review & Improve",      desc: "See your fitness category (Excellent → Needs Improvement) and use the breakdown to target weak spots." },
];

export default function Landing({ onStart }: Props) {
  const [showHelp, setShowHelp] = useState(false);

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 flex flex-col">
      <Navbar />

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden flex-1 flex items-center px-6 pt-8 pb-16 md:pt-10 md:pb-24 min-h-[88vh]">

        {/* Background — dot grid + blobs */}
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute inset-0 opacity-60 dark:opacity-40"
            style={{
              backgroundImage: 'radial-gradient(circle, rgba(99,102,241,0.15) 1px, transparent 1px)',
              backgroundSize: '28px 28px',
            }}
          />
          <div className="absolute -top-48 -left-48 w-[700px] h-[700px] bg-indigo-400/10 dark:bg-indigo-500/8 rounded-full blur-3xl" />
          <div className="absolute bottom-0 -right-32 w-[500px] h-[500px] bg-violet-400/10 dark:bg-violet-600/8 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-6xl mx-auto w-full grid md:grid-cols-2 gap-12 lg:gap-20 items-center">

          {/* Left — copy */}
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-100 dark:bg-indigo-950 border border-indigo-200/70 dark:border-indigo-800/70 mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse shrink-0" />
              <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-300">v3.0 — Now with trainer gyms</span>
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.06]">
              <span className="bg-gradient-to-r from-indigo-600 via-violet-500 to-purple-500 bg-clip-text text-transparent">
                Know Your
              </span>
              <br />
              <span className="text-gray-900 dark:text-white">
                Fitness Level.
              </span>
            </h1>

            <p className="mt-5 text-lg text-gray-500 dark:text-gray-400 leading-relaxed max-w-md">
              A weighted score out of 100 — personalised by age, benchmarked
              against proven standards, and tracked over time so you can see growth.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button onClick={onStart}>Start Assessment</Button>
              <Button variant="outline" onClick={() => setShowHelp(true)}>How It Works</Button>
            </div>

            {/* Stats */}
            <div className="mt-10 pt-8 border-t border-gray-100 dark:border-zinc-800 flex gap-10">
              {[
                { v: "4",   l: "Core metrics"  },
                { v: "5",   l: "Score tiers"   },
                { v: "100", l: "Point scale"   },
              ].map(({ v, l }) => (
                <div key={l}>
                  <p className="text-3xl font-extrabold text-gray-900 dark:text-white leading-none">{v}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 font-medium">{l}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right — demo score card */}
          <div className="relative flex justify-center md:justify-end">
            <div className="absolute inset-4 bg-indigo-500/10 dark:bg-indigo-500/15 rounded-full blur-3xl" />

            <div className="relative w-full max-w-sm rounded-3xl bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-700/80 shadow-2xl shadow-indigo-500/15 p-7">

              <div className="flex items-center justify-between mb-5">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">Sample Score</p>
                  <p className="text-sm font-bold text-gray-900 dark:text-white mt-0.5">Alex, 26 yrs</p>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60">
                  Demo
                </span>
              </div>

              <div className="flex flex-col items-center gap-2.5 mb-5">
                <ScoreRing score={75} size={130} colorClass="text-indigo-500 dark:text-indigo-400" />
                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400">
                  Good — Keep pushing!
                </span>
              </div>

              <div className="space-y-3.5 pt-4 border-t border-gray-100 dark:border-zinc-700/60">
                {SAMPLE_METRICS.map(({ label, value, bar, text }) => (
                  <div key={label}>
                    <div className="flex justify-between mb-1">
                      <span className="text-xs text-gray-500 dark:text-gray-400">{label}</span>
                      <span className={`text-xs font-bold ${text}`}>{value}%</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 dark:bg-zinc-700 rounded-full overflow-hidden">
                      <div className={`h-full ${bar} rounded-full`} style={{ width: `${value}%` }} />
                    </div>
                  </div>
                ))}
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* ── Features ──────────────────────────────────────────────────────── */}
      <section className="bg-gray-50 dark:bg-zinc-900/60 border-y border-gray-100 dark:border-zinc-800 px-6 py-20">
        <div className="max-w-5xl mx-auto">
          <p className="text-center text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-3">
            Why BodyBench
          </p>
          <h2 className="text-center text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white mb-12">
            Everything you need to benchmark your fitness
          </h2>

          <div className="grid md:grid-cols-3 gap-5">
            {FEATURES.map(({ icon, color, title, desc }) => (
              <div
                key={title}
                className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-700/80 p-6 hover:shadow-lg hover:shadow-indigo-500/5 hover:-translate-y-0.5 transition-all duration-200"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 shrink-0 ${color}`}>
                  {icon}
                </div>
                <p className="font-bold text-gray-900 dark:text-white mb-2">{title}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ──────────────────────────────────────────────────── */}
      <section className="px-6 py-20 bg-white dark:bg-zinc-950">
        <div className="max-w-5xl mx-auto">
          <p className="text-center text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-3">
            How It Works
          </p>
          <h2 className="text-center text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white mb-14">
            Your score in four steps
          </h2>

          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-8 md:gap-4 relative">
            {/* Connecting line */}
            <div className="hidden md:block absolute top-5 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-transparent via-indigo-200 dark:via-indigo-800/60 to-transparent" />

            {STEPS.map(({ n, title, desc }) => (
              <div key={n} className="relative flex flex-col items-start md:items-center md:text-center">
                <div className="w-10 h-10 rounded-2xl bg-indigo-100 dark:bg-indigo-900/50 border border-indigo-200/60 dark:border-indigo-800/60 flex items-center justify-center mb-4 shrink-0 z-10">
                  <span className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400">{n}</span>
                </div>
                <p className="font-bold text-gray-900 dark:text-white mb-1.5">{title}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA band ──────────────────────────────────────────────────────── */}
      <section className="px-6 py-20 bg-gradient-to-br from-indigo-600 via-indigo-600 to-violet-700 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.15) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />
        <div className="relative max-w-2xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4 leading-tight">
            Ready to benchmark your fitness?
          </h2>
          <p className="text-indigo-200 text-base md:text-lg mb-9 leading-relaxed">
            Takes less than 15 minutes. No equipment needed. Free forever.
          </p>
          <button
            onClick={onStart}
            className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-white text-indigo-700 font-bold text-base hover:bg-indigo-50 active:scale-[0.98] transition-all shadow-2xl shadow-indigo-900/30"
          >
            Start Your Assessment
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* ── How-to popup (kept for navbar trigger) ────────────────────────── */}
      <BasePopup isOpen={showHelp} onClose={() => setShowHelp(false)} title="How to Use BodyBench">
        <ol className="space-y-4">
          {HOW_TO_STEPS.map(({ step, title, desc }) => (
            <li key={step} className="flex gap-4">
              <span className="flex-shrink-0 w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400 text-sm font-bold flex items-center justify-center">
                {step}
              </span>
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{title}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{desc}</p>
              </div>
            </li>
          ))}
        </ol>
      </BasePopup>
    </div>
  );
}
