import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useDarkMode } from "../../hooks";
import bannerImage from "../../assets/banner.jpg";

export default function Hero() {
    const [isDark] = useDarkMode();
    const [activeSlide, setActiveSlide] = useState(0);

    const slides = [
        {
            image: bannerImage,
            alt: "Featured shopping banner 1",
        },
        {
            image: bannerImage,
            alt: "Featured shopping banner 2",
        },
        {
            image: bannerImage,
            alt: "Featured shopping banner 3",
        },
    ];

    useEffect(() => {
        const intervalId = window.setInterval(() => {
            setActiveSlide((current) => (current + 1) % slides.length);
        }, 4500);

        return () => window.clearInterval(intervalId);
    }, [slides.length]);

    return (
        <div className={`w-full pb-6 sm:pb-12 pt-1 sm:pt-2 px-0 sm:px-4 md:px-6 transition-colors duration-300 ${isDark ? "bg-slate-950" : "bg-bg-base"}`}>
            <div className="max-w-7xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className={`w-full relative rounded-none sm:rounded-[3rem] overflow-hidden min-h-[280px] sm:min-h-[400px] md:min-h-[500px] text-white ${
                        isDark
                            ? "bg-slate-900 shadow-[0_30px_80px_-24px_rgba(15,23,42,0.95)]"
                            : "bg-white shadow-2xl"
                    }`}
                >
                    <motion.div
                        animate={{ x: `${-activeSlide * 100}%` }}
                        transition={{ duration: 0.8, ease: "easeInOut" }}
                        className="relative z-10 flex h-full"
                    >
                        {slides.map((slide, index) => (
                            <div
                                key={`${slide.alt}-${index}`}
                                className="relative w-full min-w-full min-h-[280px] sm:min-h-[400px] md:min-h-[500px]"
                            >
                                <img
                                    src={slide.image}
                                    alt={slide.alt}
                                    className="block h-full min-h-[280px] w-full object-cover sm:min-h-[400px] md:min-h-[500px]"
                                />
                            </div>
                        ))}
                    </motion.div>

                    <div className="absolute bottom-6 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 rounded-full bg-black/10 px-3 py-2 backdrop-blur-md">
                        {slides.map((slide, index) => (
                            <button
                                key={`${slide.alt}-indicator-${index}`}
                                type="button"
                                onClick={() => setActiveSlide(index)}
                                aria-label={`Go to slide ${index + 1}`}
                                className={`h-2.5 rounded-full transition-all duration-300 ${activeSlide === index ? "w-8 bg-primary" : `w-2.5 ${isDark ? "bg-white/45 hover:bg-white/70" : "bg-black/25 hover:bg-black/45"}`}`}
                            />
                        ))}
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
