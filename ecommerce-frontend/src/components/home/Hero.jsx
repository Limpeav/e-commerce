import React from "react";
import { ArrowRight, Sparkles, Star, Heart } from "lucide-react";
import { motion } from "framer-motion";

export default function Hero() {
    return (
        <div className="w-full bg-bg-base pb-12 pt-2 px-4 md:px-6">
            <div className="max-w-7xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="w-full relative bg-primary rounded-[3rem] overflow-hidden shadow-2xl min-h-[500px] flex items-center p-8 md:p-20 text-white"
                >
                    {/* Background Decorative Elements */}
                    <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-primary-light/10 rounded-full blur-[120px] animate-pulse"></div>
                    <div className="absolute bottom-[-20%] left-[-10%] w-[400px] h-[400px] bg-secondary/10 rounded-full blur-[100px]"></div>

                    {/* Floating Ornaments */}
                    <motion.div
                        animate={{ y: [0, -15, 0] }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute top-20 right-[20%] hidden xl:block"
                    >
                        <div className="p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 rotate-12 shadow-xl">
                            <Heart className="w-6 h-6 text-secondary fill-secondary" />
                        </div>
                    </motion.div>

                    <motion.div
                        animate={{ y: [0, 15, 0] }}
                        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                        className="absolute bottom-20 right-[35%] hidden xl:block"
                    >
                        <div className="p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 -rotate-12 shadow-xl">
                            <Star className="w-6 h-6 text-amber-300 fill-amber-300" />
                        </div>
                    </motion.div>

                    <div className="relative z-10 max-w-2xl text-center md:text-left">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3, duration: 0.6 }}
                            className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-primary-light text-xs font-bold uppercase tracking-[0.2em] mb-8"
                        >
                            <Sparkles className="w-4 h-4 text-amber-300" />
                            <span>Premium Baby Essentials 2024</span>
                        </motion.div>

                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5, duration: 0.8 }}
                            className="text-4xl md:text-6xl font-bold font-display leading-tight mb-8 tracking-tight"
                        >
                            Gentle touch for pure joy
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.7, duration: 0.8 }}
                            className="text-white/80 text-lg md:text-xl font-medium mb-12 max-w-lg leading-relaxed"
                        >
                            Curating the finest organic fabrics and sustainable products for your baby's delicate journey.
                        </motion.p>


                    </div>

                    {/* Stats/Offer Card */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 1, duration: 0.8 }}
                        className="hidden lg:flex absolute right-16 top-1/2 -translate-y-1/2 flex-col items-center justify-center w-72 h-72 border-2 border-white/10 rounded-full before:content-[''] before:absolute before:inset-0 before:rounded-full before:border before:border-white/5 before:animate-ping"
                    >
                        <div className="text-center relative">
                            <div className="absolute -top-10 -left-10 w-20 h-20 bg-secondary rounded-full flex items-center justify-center -rotate-12 shadow-lg">
                                <span className="text-sm font-black uppercase">Save</span>
                            </div>
                            <span className="block text-7xl font-bold text-white mb-2 font-display">25%</span>
                            <span className="block text-sm font-bold text-primary-light uppercase tracking-widest">Off Your First Order</span>
                            <div className="mt-4 pt-4 border-t border-white/10 text-xs font-medium text-white/60">
                                Use code: <span className="text-white font-bold">WELCOME2024</span>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            </div>
        </div>
    );
}

