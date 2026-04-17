import { useState } from "react";
import Navbar from "../components/layout/Navbar";
import Button from "../components/ui/Button";
import BasePopup from "../components/ui/BasePopup";
import ScoreRing from "../components/ui/ScoreRing";

interface Props {
  onStart: () => void;
}

const HOW_TO_STEPS = [
  {
    step: "1",
    title: "Enter Your Details",
    desc: "Provide your age and body weight so the scoring engine can personalise your results.",
  },
  {
    step: "2",
    title: "Complete the Exercises",
    desc: "Record your push-up count, squat count, plank hold time, and a 1 km jog time.",
  },
  {
    step: "3",
    title: "Calculate Your Score",
    desc: 'Hit "Calculate Score" to get a weighted score out of 100 with a per-metric breakdown.',
  },
  {
    step: "4",
    title: "Review & Improve",
    desc: "See your fitness category (Excellent → Needs Improvement) and use the breakdown to target weak spots.",
  },
];

const SAMPLE_METRICS = [
  { label: "Endurance", value: 82, barClass: "bg-indigo-500",  textClass: "text-indigo-500 dark:text-indigo-400" },
  { label: "Strength",  value: 75, barClass: "bg-emerald-500", textClass: "text-emerald-600 dark:text-emerald-400" },
  { label: "Core",      value: 68, barClass: "bg-violet-500",  textClass: "text-violet-600 dark:text-violet-400" },
];

const FEATURES = ["Science-backed scoring", "Track progress over time", "Free to use"];

export default function Landing({ onStart }: Props) {
  const [showHelp, setShowHelp] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-zinc-950 relative overflow-hidden">

      {/* Ambient blobs — positioned on the solid background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -left-32 w-[560px] h-[560px] bg-indigo-400/10 dark:bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -right-20 w-[420px] h-[420px] bg-violet-400/10 dark:bg-violet-600/10 rounded-full blur-3xl -translate-y-1/2" />
      </div>

      <Navbar />

      <section className="relative flex-1 flex items-center px-6 py-10">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-14 items-center w-full">

          {/* ── Left: hero copy ── */}
          <div>
            <p className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-medium text-sm mb-6 border border-indigo-200/60 dark:border-indigo-800/60">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 inline-block" />
              Smarter Fitness Assessment
            </p>

            <h1 className="text-5xl md:text-6xl font-extrabold leading-tight tracking-tight">
              <span className="bg-gradient-to-r from-indigo-600 to-violet-500 bg-clip-text text-transparent">
                Know Your Body.
              </span>
              <br />
              <span className="text-gray-900 dark:text-white">
                Improve With Data.
              </span>
            </h1>

            <p className="mt-6 text-lg text-gray-600 dark:text-gray-300 leading-relaxed max-w-lg">
              BodyBench helps you assess your physical health through simple
              exercises, compare results with trusted fitness benchmarks, and
              track progress over time.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Button onClick={onStart}>Start Assessment</Button>
              <Button variant="outline" onClick={() => setShowHelp(true)}>How to Use</Button>
            </div>

            {/* Feature pills */}
            <div className="mt-7 flex flex-wrap gap-x-6 gap-y-2">
              {FEATURES.map((f) => (
                <span key={f} className="flex items-center gap-2 text-sm text-gray-400 dark:text-gray-500">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 dark:bg-indigo-600 shrink-0" />
                  {f}
                </span>
              ))}
            </div>
          </div>

          {/* ── Right: sample score card ── */}
          <div className="flex justify-center">
            <div className="w-full max-w-md rounded-3xl bg-white dark:bg-zinc-900 shadow-2xl shadow-indigo-500/10 p-8 border border-gray-100 dark:border-zinc-700/80 ring-1 ring-inset ring-indigo-500/10 dark:ring-indigo-400/10">

              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Sample Result</h3>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                  Demo
                </span>
              </div>

              <div className="flex flex-col items-center gap-3 mb-6">
                <ScoreRing score={75} size={140} colorClass="text-indigo-500 dark:text-indigo-400" />
                <span className="text-sm font-semibold px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400">
                  Good — Keep pushing!
                </span>
              </div>

              <div className="space-y-4 pt-5 border-t border-gray-100 dark:border-zinc-700/80">
                {SAMPLE_METRICS.map(({ label, value, barClass, textClass }) => (
                  <div key={label}>
                    <div className="flex justify-between mb-1.5">
                      <span className="text-sm text-gray-600 dark:text-gray-400">{label}</span>
                      <span className={`text-sm font-semibold ${textClass}`}>{value}%</span>
                    </div>
                    <div className="h-2 bg-gray-100 dark:bg-zinc-700 rounded-full overflow-hidden">
                      <div className={`h-2 ${barClass} rounded-full`} style={{ width: `${value}%` }} />
                    </div>
                  </div>
                ))}
              </div>

            </div>
          </div>

        </div>
      </section>

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
