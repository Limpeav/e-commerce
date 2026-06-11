import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

const PageTransition = ({ children }) => {
    const reduceMotion = useReducedMotion();

    return (
        <motion.div
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
        </motion.div>
    );
};

export default PageTransition;
