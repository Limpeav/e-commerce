import React from 'react';
import { motion } from 'framer-motion';

const Loading = ({ message = 'Loading...' }) => {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white/95 backdrop-blur-sm">
      {/* Standard Spinner */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        className="w-16 h-16 rounded-full border-4 border-slate-100 border-t-indigo-600"
      />

      {/* Branding & Message */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mt-8 text-center space-y-2"
      >
        <h3 className="text-2xl font-bold text-slate-800 tracking-tight font-display">
          ShopX
        </h3>
        <p className="text-sm font-medium text-slate-500 animate-pulse">
          {message}
        </p>
      </motion.div>
    </div>
  );
};

export default Loading;
