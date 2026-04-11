import Navbar from "../components/layout/Navbar";
import Button from "../components/ui/Button";

interface Props {
  onStart: () => void;
}

const SAMPLE_METRICS = [
  { label: "Endurance", value: 82, barClass: "bg-blue-600",   textClass: "text-blue-600 dark:text-blue-400"   },
  { label: "Strength",  value: 75, barClass: "bg-green-500",  textClass: "text-green-600 dark:text-green-400"  },
  { label: "Core",      value: 68, barClass: "bg-purple-500", textClass: "text-purple-600 dark:text-purple-400" },
];

export default function Landing({ onStart }: Props) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-white dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <Navbar />

      <section className="px-6 pt-16 pb-24 md:pt-20 md:pb-28">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">

          {/* Left — hero copy */}
          <div className="relative">
            <div className="absolute -top-10 -left-10 w-72 h-72 bg-blue-100 dark:bg-blue-950 rounded-full blur-3xl opacity-30 pointer-events-none" />

            <p className="inline-block px-4 py-2 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400 font-medium text-sm mb-6">
              Smarter Fitness Assessment
            </p>

            <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 dark:text-white leading-tight tracking-tight">
              Know Your Body.
              <br />
              Improve With Data.
            </h1>

            <p className="mt-6 text-lg text-gray-600 dark:text-gray-400 leading-relaxed max-w-lg">
              BodyBench helps you assess your physical health through simple
              exercises, compare results with trusted fitness benchmarks, and
              track progress over time.
            </p>

            <div className="mt-10 flex flex-wrap gap-4">
              <Button onClick={onStart}>Start Assessment</Button>
              <Button variant="outline">Learn More</Button>
            </div>
          </div>

          {/* Right — sample score card */}
          <div className="flex justify-center">
            <div className="w-full max-w-md rounded-3xl bg-white dark:bg-gray-800 shadow-2xl p-8 border border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  Sample Snapshot
                </h3>
                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                  Demo
                </span>
              </div>

              <div className="space-y-5">
                {SAMPLE_METRICS.map(({ label, value, barClass, textClass }) => (
                  <div key={label}>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400">{label}</span>
                      <span className={`text-sm font-semibold ${textClass}`}>{value}%</span>
                    </div>
                    <div className="h-2.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={`h-2.5 ${barClass} rounded-full`}
                        style={{ width: `${value}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-700 text-center">
                <span className="text-5xl font-extrabold text-gray-900 dark:text-white">78</span>
                <span className="text-xl text-gray-400"> / 100</span>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Overall Score</p>
              </div>
            </div>
          </div>

        </div>
      </section>
    </div>
  );
}
