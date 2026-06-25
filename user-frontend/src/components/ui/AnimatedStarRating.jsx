import { useState } from "react";
import { Star } from "lucide-react";
import {
  AnimatePresence,
  motion as Motion,
  useReducedMotion,
} from "framer-motion";

const ratingLabels = {
  0: "Select a rating",
  1: "Terrible",
  2: "Poor",
  3: "Okay",
  4: "Good",
  5: "Excellent",
};

export default function AnimatedStarRating({
  value = 0,
  onChange,
  isDark = false,
  name = "rating",
}) {
  const [hoveredRating, setHoveredRating] = useState(0);
  const reduceMotion = useReducedMotion();
  const selectedRating = Math.min(5, Math.max(0, Number(value) || 0));
  const displayedRating = hoveredRating || selectedRating;

  const updateWithKeyboard = (event) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) {
      return;
    }

    event.preventDefault();

    if (event.key === "Home") {
      onChange(1);
      return;
    }

    if (event.key === "End") {
      onChange(5);
      return;
    }

    const direction = event.key === "ArrowRight" ? 1 : -1;
    onChange(Math.min(5, Math.max(1, selectedRating + direction)));
  };

  return (
    <div
      className={`inline-flex min-w-0 flex-col items-start rounded-2xl border px-4 py-4 sm:px-5 ${
        isDark
          ? "border-slate-700 bg-slate-950/45"
          : "border-amber-100 bg-amber-50/45"
      }`}
    >
      <div
        role="radiogroup"
        aria-label="Product rating"
        onKeyDown={updateWithKeyboard}
        onMouseLeave={() => setHoveredRating(0)}
        className="flex items-center gap-1 sm:gap-2"
      >
        {[1, 2, 3, 4, 5].map((rating) => {
          const isActive = displayedRating >= rating;
          const isSelected = selectedRating === rating;

          return (
            <Motion.button
              key={rating}
              type="button"
              role="radio"
              aria-checked={isSelected}
              aria-label={`${rating} star${rating === 1 ? "" : "s"}: ${ratingLabels[rating]}`}
              name={name}
              onClick={() => onChange(rating)}
              onMouseEnter={() => setHoveredRating(rating)}
              onFocus={() => setHoveredRating(rating)}
              onBlur={() => setHoveredRating(0)}
              whileHover={reduceMotion ? undefined : { scale: 1.13, y: -2 }}
              whileTap={reduceMotion ? undefined : { scale: 0.86 }}
              className="relative flex h-12 w-12 items-center justify-center rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 sm:h-14 sm:w-14"
            >
              <AnimatePresence>
                {isSelected && (
                  <Motion.span
                    key={`ring-${selectedRating}`}
                    initial={reduceMotion ? false : { opacity: 0.75, scale: 0.45 }}
                    animate={{ opacity: 0, scale: 1.45 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: reduceMotion ? 0 : 0.55, ease: "easeOut" }}
                    className="pointer-events-none absolute inset-2 rounded-full border-2 border-amber-400"
                  />
                )}
              </AnimatePresence>

              <Motion.span
                key={`${selectedRating}-${rating}`}
                initial={
                  !reduceMotion && selectedRating >= rating
                    ? { scale: 0.5, rotate: -18, opacity: 0.35 }
                    : false
                }
                animate={{ scale: 1, rotate: 0, opacity: 1 }}
                transition={{
                  delay: reduceMotion ? 0 : rating * 0.045,
                  type: "spring",
                  stiffness: 420,
                  damping: 18,
                }}
                className="relative block"
              >
                <Star
                  strokeWidth={2.25}
                  className={`h-9 w-9 transition-all duration-200 sm:h-10 sm:w-10 ${
                    isActive
                      ? "fill-amber-400 text-amber-500 drop-shadow-[0_5px_8px_rgba(245,158,11,0.28)]"
                      : isDark
                        ? "fill-transparent text-slate-500"
                        : "fill-transparent text-stone-300"
                  }`}
                />
              </Motion.span>
            </Motion.button>
          );
        })}
      </div>

      <div aria-live="polite" className="mt-2 min-h-7 w-full text-center">
        <AnimatePresence mode="wait" initial={false}>
          <Motion.p
            key={displayedRating}
            initial={reduceMotion ? false : { opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: -5 }}
            transition={{ duration: reduceMotion ? 0 : 0.16 }}
            className={`font-display text-lg font-black ${
              displayedRating ? "text-amber-600" : "text-text-muted"
            }`}
          >
            {ratingLabels[displayedRating]}
          </Motion.p>
        </AnimatePresence>
      </div>
    </div>
  );
}
