import { useEffect } from "react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  /** Controls max width of the card. Default: "sm" */
  size?: "sm" | "md" | "lg";
}

function CloseIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

/**
 * BasePopup — generic reusable modal.
 *
 * Usage:
 *   <BasePopup isOpen={show} onClose={() => setShow(false)} title="My Popup">
 *     <p>Content goes here</p>
 *   </BasePopup>
 *
 * Features:
 *   - Backdrop with blur, closes on click-outside or Escape key
 *   - Smooth fade + scale transition
 *   - Locks body scroll while open
 */
const SIZE_CLASS = { sm: "max-w-sm", md: "max-w-md", lg: "max-w-lg" };

export default function BasePopup({ isOpen, onClose, title, children, size = "sm" }: Props) {
  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  // Lock body scroll while open
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  return (
    // Always in DOM so CSS transitions play on both open and close
    <div
      aria-modal="true"
      role="dialog"
      aria-hidden={!isOpen}
      onClick={onClose}
      className={[
        "fixed inset-0 z-50 flex items-center justify-center px-4",
        "bg-black/50 backdrop-blur-sm",
        "transition-all duration-200",
        isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
      ].join(" ")}
    >
      {/* Card — stop propagation so clicking inside doesn't close */}
      <div
        onClick={(e) => e.stopPropagation()}
        className={[
          `relative w-full ${SIZE_CLASS[size]}`,
          "bg-white dark:bg-gray-800",
          "rounded-2xl border border-gray-100 dark:border-gray-700 shadow-2xl",
          "p-6 transition-all duration-200",
          isOpen ? "scale-100 opacity-100" : "scale-95 opacity-0",
        ].join(" ")}
      >
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              {title}
            </h2>
            <button
              onClick={onClose}
              aria-label="Close"
              className="p-1.5 rounded-lg text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition"
            >
              <CloseIcon />
            </button>
          </div>
        )}

        {children}
      </div>
    </div>
  );
}
