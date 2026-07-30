import { useEffect, useState } from "react";
import { Star, UserRound } from "lucide-react";
import {
  AnimatePresence,
  motion as Motion,
  useReducedMotion,
} from "framer-motion";

const cardVariants = {
  hidden: {
    opacity: 0,
    y: 24,
    scale: 0.94,
    filter: "blur(14px)",
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: {
      type: "spring",
      stiffness: 260,
      damping: 22,
      mass: 0.95,
      staggerChildren: 0.1,
      delayChildren: 0.08,
    },
  },
  exit: {
    opacity: 0,
    y: 8,
    scale: 0.96,
    filter: "blur(12px)",
    transition: {
      duration: 0.35,
      ease: [0.4, 0, 0.2, 1],
    },
  },
};

const badgeVariants = {
  hidden: { opacity: 0, scale: 0.45, rotate: -14 },
  visible: {
    opacity: 1,
    scale: 1,
    rotate: 0,
    transition: {
      type: "spring",
      stiffness: 420,
      damping: 16,
    },
  },
};

const contentVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 260,
      damping: 24,
    },
  },
};

const starVariants = {
  hidden: { opacity: 0, scale: 0.35, y: 12, rotate: -18 },
  visible: (index) => ({
    opacity: 1,
    scale: [0.35, 1.24, 1],
    y: 0,
    rotate: 0,
    transition: {
      delay: 0.48 + index * 0.08,
      duration: 0.48,
      ease: [0.34, 1.56, 0.64, 1],
    },
  }),
};

export default function AlreadyRatedCard({ onDismiss, className = "" }) {
  const reduceMotion = useReducedMotion();
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const dismissTimer = window.setTimeout(() => {
      setIsVisible(false);
    }, 3800);

    return () => {
      window.clearTimeout(dismissTimer);
    };
  }, []);

  const instantTransition = reduceMotion ? { duration: 0 } : undefined;

  return (
    <div className={`flex w-full items-center justify-center px-4 ${className}`}>
      <AnimatePresence onExitComplete={onDismiss}>
        {isVisible && (
          <Motion.section
            role="status"
            aria-live="polite"
            initial={reduceMotion ? false : "hidden"}
            animate={reduceMotion ? { opacity: 1 } : "visible"}
            exit={reduceMotion ? { opacity: 0 } : "exit"}
            variants={cardVariants}
            transition={instantTransition}
            className="w-full max-w-[400px] rounded-2xl border border-slate-200 bg-white px-7 py-10 text-center shadow-[0_24px_70px_rgba(15,23,42,0.12)] sm:px-10 sm:py-12"
          >
            <Motion.div
              variants={reduceMotion ? undefined : badgeVariants}
              className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100"
            >
              <UserRound
                className="h-8 w-8 text-green-600"
                fill="none"
                strokeWidth={2.25}
                aria-hidden="true"
              />
            </Motion.div>

            <Motion.h2
              variants={reduceMotion ? undefined : contentVariants}
              className="mt-8 font-serif text-[28px] font-bold leading-tight text-slate-950"
            >
              Thank you for your rating
            </Motion.h2>

            <Motion.p
              variants={reduceMotion ? undefined : contentVariants}
              className="mx-auto mt-4 max-w-[320px] text-base leading-7 text-gray-500"
            >
              We've already got your review on file — it means a lot to us.
            </Motion.p>

            <div
              className="mt-8 flex items-center justify-center gap-2"
              aria-label="5 out of 5 stars"
            >
              {[0, 1, 2, 3, 4].map((index) => (
                <Motion.span
                  key={index}
                  custom={index}
                  initial={reduceMotion ? false : "hidden"}
                  animate={reduceMotion ? { opacity: 1 } : "visible"}
                  variants={starVariants}
                  transition={instantTransition}
                  className="inline-flex"
                >
                  <Star
                    className="h-7 w-7 fill-amber-400 text-amber-400"
                    strokeWidth={1.75}
                    aria-hidden="true"
                  />
                </Motion.span>
              ))}
            </div>
          </Motion.section>
        )}
      </AnimatePresence>
    </div>
  );
}
