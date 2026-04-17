interface Props {
  score: number;
  max?: number;
  size?: number;
  colorClass?: string;
}

export default function ScoreRing({
  score,
  max = 100,
  size = 180,
  colorClass = "text-indigo-500 dark:text-indigo-400",
}: Props) {
  const strokeWidth = 14;
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(score, max) / max) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg
        width={size}
        height={size}
        style={{ transform: "rotate(-90deg)" }}
        aria-hidden="true"
      >
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-gray-200 dark:text-gray-700"
        />
        {/* Progress arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={colorClass}
          style={{ transition: "stroke-dashoffset 1s ease-in-out" }}
        />
      </svg>
      <div className="absolute flex flex-col items-center leading-tight">
        <span className="text-4xl font-extrabold text-gray-900 dark:text-white">
          {score}
        </span>
        <span className="text-sm text-gray-500 dark:text-gray-400">/ {max}</span>
      </div>
    </div>
  );
}
