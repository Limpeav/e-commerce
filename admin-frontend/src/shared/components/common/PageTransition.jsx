import React from 'react';
import { motion as Motion, useReducedMotion } from 'framer-motion';

const PageTransition = ({ children }) => {
    const reduceMotion = useReducedMotion();

    return (
        <Motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 10, scale: 0.998 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={
                reduceMotion
                    ? { duration: 0 }
                    : { duration: 0.28, ease: [0.22, 1, 0.36, 1] }
            }
            className="admin-page-transition w-full h-full"
        >
            {children}
        </Motion.div>
    );
};

export default PageTransition;
