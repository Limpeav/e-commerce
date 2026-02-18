import React from 'react';
import { motion } from 'framer-motion';
import { Baby } from 'lucide-react';

const Loading = ({ message = 'Loading...' }) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-stone-50/50 backdrop-blur-sm fixed inset-0 z-50">
      <div className="relative flex items-center justify-center mb-8">
        {/* Rotating outer ring */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          className="w-24 h-24 rounded-full border-[3px] border-primary/20 border-t-primary border-r-primary/50 absolute"
        />
        
        {/* Counter-rotating inner ring */}
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 rounded-full border-[3px] border-secondary/20 border-b-secondary border-l-secondary/50 absolute"
        />

        {/* Pulsing icon */}
        <motion.div
          animate={{ scale: [1, 1.1, 1], opacity: [0.8, 1, 0.8] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="bg-white p-4 rounded-full shadow-lg relative z-10"
        >
          <Baby className="w-8 h-8 text-primary fill-primary/10" />
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-center space-y-2"
      >
        <h3 className="text-xl font-bold text-text-main font-display tracking-tight">
          {message}
        </h3>
        <div className="flex justify-center gap-1">
          <motion.div
            animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1, repeat: Infinity, delay: 0 }}
            className="w-1.5 h-1.5 rounded-full bg-primary"
          />
          <motion.div
            animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
            className="w-1.5 h-1.5 rounded-full bg-primary"
          />
          <motion.div
            animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
            className="w-1.5 h-1.5 rounded-full bg-primary"
          />
        </div>
      </motion.div>
    </div>
  );
};

export default Loading;
