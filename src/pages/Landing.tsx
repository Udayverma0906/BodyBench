import Navbar from "../components/layout/Navbar";

function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-white">
      <Navbar />

      <section className="px-6 py-24 md:py-32">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          
          {/* Left Content */}
          <div>
            <p className="inline-block px-4 py-2 rounded-full bg-blue-100 text-blue-700 font-medium text-sm mb-6">
              Smarter Fitness Assessment
            </p>

            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight">
              Know Your Body.
              <br />
              Improve With Data.
            </h1>

            <p className="mt-6 text-lg text-gray-600 leading-relaxed max-w-xl">
              BodyBench helps you assess your physical health through simple
              exercises, compare results with trusted fitness benchmarks, and
              track progress over time.
            </p>

            <div className="mt-10 flex flex-wrap gap-4">
              <button className="px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition shadow-md">
                Start Assessment
              </button>

              <button className="px-6 py-3 rounded-xl border border-gray-300 text-gray-700 font-semibold hover:bg-white transition">
                View Demo
              </button>
            </div>
          </div>

          {/* Right Visual */}
          <div className="flex justify-center">
            <div className="w-full max-w-md rounded-3xl bg-white shadow-xl p-8 border border-gray-100">
              <h3 className="text-xl font-bold text-gray-900 mb-6">
                Your Fitness Snapshot
              </h3>

              <div className="space-y-5">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600">Endurance</span>
                    <span className="font-semibold text-blue-600">82%</span>
                  </div>
                  <div className="h-3 bg-gray-200 rounded-full">
                    <div className="h-3 w-[82%] bg-blue-600 rounded-full"></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600">Strength</span>
                    <span className="font-semibold text-green-600">75%</span>
                  </div>
                  <div className="h-3 bg-gray-200 rounded-full">
                    <div className="h-3 w-[75%] bg-green-500 rounded-full"></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600">Mobility</span>
                    <span className="font-semibold text-purple-600">68%</span>
                  </div>
                  <div className="h-3 bg-gray-200 rounded-full">
                    <div className="h-3 w-[68%] bg-purple-500 rounded-full"></div>
                  </div>
                </div>
              </div>

              <div className="mt-8 text-center">
                <span className="text-4xl font-bold text-gray-900">78</span>
                <span className="text-lg text-gray-500"> / 100</span>
                <p className="text-gray-500 mt-2">Overall Health Score</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Landing;