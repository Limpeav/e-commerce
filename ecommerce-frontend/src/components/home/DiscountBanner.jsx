import React from "react";
import { ArrowRight, Timer, Tag } from "lucide-react";
import { Link } from "react-router-dom";

export default function DiscountBanner() {
    return (
        <div className="relative w-full max-w-7xl mx-auto px-6 mb-16">
            <div className="relative overflow-hidden rounded-[2.5rem] bg-primary-dark shadow-2xl shadow-primary/20">
                {/* Abstract Background Shapes */}
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-primary rounded-full blur-[100px] opacity-20"></div>
                <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-secondary rounded-full blur-[80px] opacity-20"></div>

                {/* Content Container */}
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between p-8 md:p-12 gap-8">

                    {/* Left Content */}
                    <div className="flex-1 space-y-6 text-center md:text-left">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 text-primary-light text-sm font-bold uppercase tracking-wider">
                            <Tag className="w-4 h-4" />
                            <span>Limited Time Offer</span>
                        </div>

                        <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white font-display leading-[1.1]">
                            Summer Sale <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-light to-secondary-light">
                                Up to 50% OFF
                            </span>
                        </h2>

                        <p className="text-white/80 text-lg max-w-lg font-medium">
                            Grab your favorites before they're gone! Premium baby essentials at unbeatable prices.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
                            <Link
                                to="/products?sort=sale"
                                className="px-8 py-4 bg-white text-primary-dark rounded-2xl font-bold text-lg hover:bg-stone-50 transition-all transform hover:scale-105 hover:shadow-lg flex items-center gap-2 group"
                            >
                                Shop Sale
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </Link>

                            <div className="flex items-center gap-2 px-6 py-4 bg-black/20 rounded-2xl border border-white/5 backdrop-blur-sm">
                                <Timer className="w-5 h-5 text-secondary" />
                                <span className="text-white font-mono font-bold">Ends in 24h</span>
                            </div>
                        </div>
                    </div>

                    {/* Right Image/Graphic area */}
                    <div className="flex-1 w-full max-w-md md:max-w-none flex items-center justify-center relative">
                        <div className="relative z-10 w-full aspect-square md:aspect-[4/3] flex items-center justify-center">
                            {/* Decorative circles */}
                            <div className="absolute inset-0 border border-white/10 rounded-full scale-90 animate-[spin_10s_linear_infinite]"></div>
                            <div className="absolute inset-0 border border-white/10 rounded-full scale-75 animate-[spin_15s_linear_infinite_reverse]"></div>

                            <div className="bg-gradient-to-br from-white to-stone-50 text-primary-dark rounded-full w-48 h-48 flex flex-col items-center justify-center shadow-2xl animate-bounce duration-[2000ms]">
                                <span className="text-xl font-bold uppercase tracking-widest opacity-90">Save</span>
                                <span className="text-6xl font-black font-display">50%</span>
                                <span className="text-sm font-bold opacity-90">On Selected Items</span>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
