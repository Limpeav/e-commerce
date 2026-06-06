import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useDarkMode } from "../../hooks";
import { BannerController } from "../../controllers/bannerController";
import { subscribeRealtimeDomains } from "../../services/realtime";

export default function Hero() {
    const [isDark] = useDarkMode();
    const [activeSlide, setActiveSlide] = useState(0);
    const [containerWidth, setContainerWidth] = useState(0);
    const [dragOffset, setDragOffset] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [slides, setSlides] = useState([]);
    const sliderRef = useRef(null);
    const dragStartXRef = useRef(0);
    const dragDeltaRef = useRef(0);

    useEffect(() => {
        if (!sliderRef.current) return undefined;

        const updateWidth = () => {
            setContainerWidth(sliderRef.current?.offsetWidth || 0);
        };

        updateWidth();

        const observer = new ResizeObserver(() => {
            updateWidth();
        });

        observer.observe(sliderRef.current);

        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        let isMounted = true;

        const loadBanners = async () => {
            const result = await BannerController.getHomepageBanners();

            if (!isMounted) {
                return;
            }

            setSlides(result.data);
            setActiveSlide(0);
        };

        loadBanners();
        const unsubscribe = subscribeRealtimeDomains(["banners"], loadBanners);

        return () => {
            isMounted = false;
            unsubscribe();
        };
    }, []);

    useEffect(() => {
        if (isDragging || slides.length <= 1) return undefined;

        const intervalId = window.setInterval(() => {
            setActiveSlide((current) => (current + 1) % slides.length);
        }, 4500);

        return () => window.clearInterval(intervalId);
    }, [isDragging, slides.length]);

    const handleDragStart = (event) => {
        dragStartXRef.current = event.clientX;
        dragDeltaRef.current = 0;
        setDragOffset(0);
        setIsDragging(true);
    };

    const handleDragMove = (event) => {
        if (!isDragging) return;

        const delta = event.clientX - dragStartXRef.current;
        dragDeltaRef.current = delta;
        setDragOffset(delta);
    };

    const handleDragEnd = () => {
        if (!isDragging) return;

        const swipeThreshold = Math.max(40, containerWidth * 0.12);
        const delta = dragDeltaRef.current;

        if (delta <= -swipeThreshold) {
            setActiveSlide((current) => (current + 1) % slides.length);
        } else if (delta >= swipeThreshold) {
            setActiveSlide((current) => (current - 1 + slides.length) % slides.length);
        }

        dragStartXRef.current = 0;
        dragDeltaRef.current = 0;
        setDragOffset(0);
        setIsDragging(false);
    };

    const trackOffset = containerWidth > 0 ? -(activeSlide * containerWidth) + dragOffset : 0;

    return (
        <div className={`w-full px-3 pb-4 pt-1 transition-colors duration-300 sm:px-4 sm:pb-8 sm:pt-2 md:px-6 ${isDark ? "bg-slate-950" : "bg-bg-base"}`}>
            <div className="max-w-6xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    ref={sliderRef}
                    className={`w-full relative rounded-2xl sm:rounded-[2.5rem] overflow-hidden min-h-[200px] sm:min-h-[280px] md:min-h-[340px] lg:min-h-[380px] text-white ${
                        isDark
                            ? "bg-slate-900 shadow-[0_30px_80px_-24px_rgba(15,23,42,0.95)]"
                            : "bg-white shadow-2xl"
                    }`}
                >
                    <div
                        onPointerDown={handleDragStart}
                        onPointerMove={handleDragMove}
                        onPointerUp={handleDragEnd}
                        onPointerCancel={handleDragEnd}
                        onPointerLeave={handleDragEnd}
                        className="relative overflow-hidden touch-pan-y"
                    >
                        <div
                            className={`relative z-10 flex h-full ${isDragging ? "" : "transition-transform duration-500 ease-out"}`}
                            style={{
                                transform: `translate3d(${trackOffset}px, 0, 0)`,
                                willChange: "transform",
                            }}
                        >
                            {slides.map((slide, index) => (
                                <div
                                    key={`${slide.alt}-${index}`}
                                    className="relative min-h-[200px] min-w-full sm:min-h-[280px] md:min-h-[340px] lg:min-h-[380px]"
                                    style={{ width: containerWidth || "100%" }}
                                >
                                    <img
                                        src={slide.image}
                                        alt={slide.alt}
                                        draggable="false"
                                        className="pointer-events-none block h-full min-h-[200px] w-full select-none object-cover sm:min-h-[280px] md:min-h-[340px] lg:min-h-[380px]"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 rounded-full bg-black/10 px-2.5 py-1.5 backdrop-blur-md sm:bottom-5 sm:px-3 sm:py-2">
                        {slides.map((slide, index) => (
                            <button
                                key={`${slide.alt}-indicator-${index}`}
                                type="button"
                                onClick={() => setActiveSlide(index)}
                                aria-label={`Go to slide ${index + 1}`}
                                className={`h-2 rounded-full transition-all duration-300 sm:h-2.5 ${activeSlide === index ? "w-6 sm:w-8 bg-primary" : `w-2 ${isDark ? "bg-white/45 hover:bg-white/70" : "bg-black/25 hover:bg-black/45"} sm:w-2.5`}`}
                            />
                        ))}
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
