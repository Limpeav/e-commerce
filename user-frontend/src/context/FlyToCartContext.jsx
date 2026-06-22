import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const FlyToCartContext = createContext(null);

const CartFlyLayer = ({ shots }) => {
  if (!shots.length) return null;
  return (
    <div className="pointer-events-none fixed inset-0 z-[130]">
      <AnimatePresence>
        {shots.map((shot) => (
          <motion.div
            key={shot.id}
            initial={{ x: shot.start.x, y: shot.start.y, scale: 0.9, opacity: 0.85 }}
            animate={{ x: shot.end.x, y: shot.end.y, scale: 0.45, opacity: 0.1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.65, ease: "easeInOut" }}
            className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-secondary shadow-lg shadow-primary/35"
          />
        ))}
      </AnimatePresence>
    </div>
  );
};

export const FlyToCartProvider = ({ children }) => {
  const [shots, setShots] = useState([]);

  const flyToCart = useCallback((originEl) => {
    if (!originEl) return;
    const cartEl = document.getElementById("cart-icon");
    if (!cartEl) return;

    const originRect = originEl.getBoundingClientRect();
    const targetRect = cartEl.getBoundingClientRect();

    const shot = {
      id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
      start: {
        x: originRect.left + originRect.width / 2,
        y: originRect.top + originRect.height / 2,
      },
      end: {
        x: targetRect.left + targetRect.width / 2,
        y: targetRect.top + targetRect.height / 2,
      },
    };

    setShots((prev) => [...prev, shot]);

    cartEl.classList.add("cart-bump");
    window.setTimeout(() => cartEl.classList.remove("cart-bump"), 360);

    window.setTimeout(() => {
      setShots((prev) => prev.filter((item) => item.id !== shot.id));
    }, 720);
  }, []);

  const value = useMemo(() => ({ flyToCart }), [flyToCart]);

  return (
    <FlyToCartContext.Provider value={value}>
      {children}
      <CartFlyLayer shots={shots} />
    </FlyToCartContext.Provider>
  );
};

export const useFlyToCart = () => {
  const ctx = useContext(FlyToCartContext);
  if (!ctx) throw new Error("useFlyToCart must be used within FlyToCartProvider");
  return ctx;
};
