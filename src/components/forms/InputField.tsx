interface Props {
  label: string;
  value?: number;
  onChange: (value: number | null) => void;
  error?: string;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
}

export default function InputField({
  label,
  value,
  onChange,
  error,
  min,
  max,
  step = 1,
  placeholder,
}: Props) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
      </label>

      <input
        type="number"
        value={value ?? ""}
        min={min}
        max={max}
        step={step}
        placeholder={placeholder}
        onWheel={(e) => (e.target as HTMLInputElement).blur()}
        onKeyDown={(e) => ["e", "E", "+", "-"].includes(e.key) && e.preventDefault()}
        onChange={(e) => {
          const val = e.target.value;
          onChange(val === "" ? null : Number(val));
        }}
        className={[
          "w-full px-4 py-3 rounded-xl border bg-white dark:bg-gray-900",
          "text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600",
          "outline-none transition",
          error
            ? "border-red-400 dark:border-red-500 focus:ring-2 focus:ring-red-200 dark:focus:ring-red-900"
            : "border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-900 focus:border-indigo-400 dark:focus:border-indigo-500",
        ].join(" ")}
      />

      {error && (
        <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}
