import React from 'react';
import { Lock } from 'lucide-react';

const LoginPrompt = () => {
  return (
    <div className="fixed top-24 left-1/2 transform -translate-x-1/2 z-[200] animate-slideDown">
      <div className="bg-text-main text-white px-8 py-5 rounded-3xl shadow-2xl border border-white/10 flex items-center gap-4 backdrop-blur-xl">
        <div className="bg-primary p-2 rounded-xl">
          <Lock className="w-6 h-6 text-white" />
        </div>
        <div>
          <p className="font-bold text-sm tracking-wide">Please Sign In</p>
          <p className="text-xs text-white/70 font-medium">
            Redirecting to login...
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPrompt;
