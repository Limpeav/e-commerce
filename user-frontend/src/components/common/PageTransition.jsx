import React from 'react';
import { motion as Motion } from 'framer-motion';

const PageTransition = ({ children }) => {
    return (
        <Motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            className="w-full h-full"
        >
            {children}
        </Motion.div>
    );
};

export default PageTransition;
