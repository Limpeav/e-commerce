import { Check } from "lucide-react";
import { motion as Motion, useReducedMotion } from "framer-motion";

export default function PremiumCheckbox({
  id,
  checked,
  onChange,
  children,
  disabled = false,
  className = "",
  labelClassName = "",
}) {
  const reduceMotion = useReducedMotion();

  return (
    <label
      htmlFor={id}
      className={`group inline-flex cursor-pointer items-center gap-3 ${
        disabled ? "cursor-not-allowed opacity-60" : ""
      } ${className}`}
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        disabled={disabled}
        className="peer sr-only"
      />

      <Motion.span
        aria-hidden="true"
        animate={
          reduceMotion
            ? undefined
            : checked
              ? { scale: [1, 0.88, 1.06, 1] }
              : { scale: 1 }
        }
        transition={{ duration: 0.32, ease: "easeOut" }}
        className={`relative flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-[0.6rem] border-2 transition-all duration-300 peer-focus-visible:ring-4 peer-focus-visible:ring-primary/20 ${
          checked
            ? "border-primary bg-primary text-white shadow-[0_8px_18px_-8px_rgba(122,150,126,0.9),inset_0_1px_0_rgba(255,255,255,0.35)] dark:shadow-[0_8px_20px_-8px_rgba(0,200,83,0.75)]"
            : "border-stone-200 bg-white text-transparent shadow-[0_6px_16px_rgba(45,49,46,0.12),inset_0_1px_2px_rgba(255,255,255,0.95)] group-hover:-translate-y-0.5 group-hover:border-primary/55 group-hover:shadow-[0_9px_20px_rgba(122,150,126,0.2)] dark:border-slate-600 dark:bg-slate-800 dark:shadow-[0_6px_16px_rgba(0,0,0,0.3),inset_0_1px_1px_rgba(255,255,255,0.08)]"
        }`}
      >
        <span
          className={`absolute inset-[3px] rounded-[0.35rem] transition-opacity duration-300 ${
            checked
              ? "bg-gradient-to-br from-white/25 to-transparent opacity-100"
              : "opacity-0"
          }`}
        />
        <Motion.span
          initial={false}
          animate={{
            opacity: checked ? 1 : 0,
            scale: checked ? 1 : 0.35,
            rotate: checked ? 0 : -20,
          }}
          transition={
            reduceMotion
              ? { duration: 0 }
              : { type: "spring", stiffness: 520, damping: 24 }
          }
          className="relative z-10"
        >
          <Check className="h-[1.15rem] w-[1.15rem]" strokeWidth={3.4} />
        </Motion.span>
      </Motion.span>

      <span
        className={`select-none transition-colors duration-200 group-hover:text-primary ${labelClassName}`}
      >
        {children}
      </span>
    </label>
  );
}
