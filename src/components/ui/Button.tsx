type Variant = "primary" | "outline" | "ghost";

interface Props {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: Variant;
  fullWidth?: boolean;
  disabled?: boolean;
}

const VARIANT_CLASSES: Record<Variant, string> = {
  primary:
    "bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-md shadow-indigo-500/20 hover:from-indigo-600 hover:to-violet-700 hover:shadow-indigo-500/30",
  outline:
    "border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800",
  ghost:
    "text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400",
};

export default function Button({
  children,
  onClick,
  variant = "primary",
  fullWidth = false,
  disabled = false,
}: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={[
        "px-6 py-3 rounded-xl font-semibold transition-all duration-200",
        VARIANT_CLASSES[variant],
        fullWidth ? "w-full" : "",
        disabled
          ? "opacity-50 cursor-not-allowed"
          : "hover:scale-[1.02] active:scale-[0.98]",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </button>
  );
}
