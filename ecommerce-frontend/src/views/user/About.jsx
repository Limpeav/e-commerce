import React from "react";
import {
    Users,
    Target,
    Heart,
    Globe,
    Award,
    ShieldCheck,
    TrendingUp,
    Smile
} from "lucide-react";

export default function About() {
    return (
        <div className="min-h-screen bg-bg-base font-sans overflow-hidden">
            {/* Hero Section */}
            <div className="relative pt-40 pb-32 px-6">
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-24 -left-24 w-[40rem] h-[40rem] bg-primary/5 rounded-full blur-[120px] animate-pulse"></div>
                    <div className="absolute top-1/2 -right-24 w-[30rem] h-[30rem] bg-secondary/5 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: "2s" }}></div>
                </div>

                <div className="max-w-7xl mx-auto relative z-10 text-center">
                    <h1 className="text-6xl md:text-8xl font-bold text-text-main mb-8 font-display tracking-tight leading-none">
                        Our Story
                    </h1>
                    <p className="text-text-muted font-medium text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
                        Redefining the online shopping experience for parents and families since 2019.
                    </p>
                </div>
            </div>

            {/* Mission & Vision Section */}
            <div className="py-32 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
                        <div className="space-y-16">
                            <div className="relative group">
                                <div className="absolute -left-10 top-0 w-1 h-20 bg-primary/20 group-hover:h-full transition-all duration-700"></div>
                                <h2 className="text-xs font-bold text-primary uppercase tracking-widest mb-6">Our Mission</h2>
                                <h3 className="text-4xl font-bold text-text-main font-display mb-8">Curated Quality</h3>
                                <p className="text-text-muted font-medium text-base leading-relaxed">
                                    To revolutionize your online shopping experience by curating exceptional products that
                                    enhance your lifestyle. We're committed to making premium quality accessible while
                                    maintaining the highest standards of customer service and satisfaction.
                                </p>
                            </div>

                            <div className="relative group">
                                <div className="absolute -left-10 top-0 w-1 h-20 bg-secondary/20 group-hover:h-full transition-all duration-700"></div>
                                <h2 className="text-xs font-bold text-secondary uppercase tracking-widest mb-6">Our Vision</h2>
                                <h3 className="text-4xl font-bold text-text-main font-display mb-8">Modern Essentials</h3>
                                <p className="text-text-muted font-medium text-base leading-relaxed">
                                    To become the world's most trusted online marketplace where quality meets convenience.
                                    We envision a future where every customer can shop with confidence, knowing they're getting
                                    the best products at fair prices with exceptional service.
                                </p>
                            </div>

                            <div className="flex flex-wrap gap-12 pt-8">
                                <div className="flex items-center gap-6 group">
                                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-xl border border-stone-100 group-hover:rotate-12 transition-transform">
                                        <Target className="w-7 h-7 text-primary" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-text-main mb-1">Customer First</h4>
                                        <p className="text-xs font-medium text-primary/60">Our top priority</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-6 group">
                                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-xl border border-stone-100 group-hover:rotate-12 transition-transform">
                                        <Globe className="w-7 h-7 text-primary" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-text-main mb-1">Global Reach</h4>
                                        <p className="text-xs font-medium text-primary/60">Delivering everywhere</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="relative">
                            <div className="aspect-square rounded-[4rem] bg-text-main overflow-hidden shadow-[0_64px_128px_-32px_rgba(19,78,74,0.2)] relative">
                                <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/80 to-secondary opacity-40 mix-blend-overlay"></div>
                                <div className="absolute inset-x-0 bottom-0 p-12 bg-gradient-to-t from-text-main to-transparent text-white">
                                    <div className="flex items-end justify-between">
                                        <div>
                                            <p className="text-6xl font-bold font-display leading-none mb-2">05+</p>
                                            <p className="text-xs font-semibold uppercase tracking-widest opacity-60">Years of Growth</p>
                                        </div>
                                        <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center">
                                            <Award className="w-8 h-8 text-white" />
                                        </div>
                                    </div>
                                </div>
                                {/* Abstract Grid Pattern Overlay */}
                                <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>
                            </div>
                            {/* Floatings element */}
                            <div className="absolute -top-12 -right-12 w-48 h-48 bg-white rounded-[2.5rem] shadow-2xl border border-stone-100 p-8 flex flex-col justify-center animate-bounce-slow">
                                <p className="text-3xl font-black text-primary mb-1">99%</p>
                                <p className="text-[8px] font-black text-text-muted uppercase tracking-widest">Sync Satisfaction</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Section */}
            <div className="py-24 bg-white border-y border-stone-100">
                <div className="max-w-7xl mx-auto px-6">
                    <dl className="grid grid-cols-2 md:grid-cols-4 gap-12 text-center md:text-left">
                        <div className="space-y-4">
                            <dt className="text-xs font-bold text-primary/60 uppercase tracking-widest">Daily Products</dt>
                            <dd className="text-4xl md:text-6xl font-bold text-text-main font-display">4.2K+</dd>
                        </div>
                        <div className="space-y-4">
                            <dt className="text-xs font-bold text-primary/60 uppercase tracking-widest">Value Delivered</dt>
                            <dd className="text-4xl md:text-6xl font-bold text-text-main font-display">$10M+</dd>
                        </div>
                        <div className="space-y-4">
                            <dt className="text-xs font-bold text-primary/60 uppercase tracking-widest">Happy Parents</dt>
                            <dd className="text-4xl md:text-6xl font-bold text-text-main font-display">50K+</dd>
                        </div>
                        <div className="space-y-4">
                            <dt className="text-xs font-bold text-primary/60 uppercase tracking-widest">Trusted Brands</dt>
                            <dd className="text-4xl md:text-6xl font-bold text-text-main font-display">100+</dd>
                        </div>
                    </dl>
                </div>
            </div>

            {/* Values Section */}
            <div className="py-32 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="max-w-3xl mb-24">
                        <h2 className="text-xs font-bold text-primary uppercase tracking-widest mb-6">Our Advantages</h2>
                        <h3 className="text-5xl font-bold text-text-main font-display tracking-tight">Why Choose Us</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="group bg-white p-12 rounded-[3.5rem] hover:shadow-2xl transition-all duration-500 border border-stone-100 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-2 h-0 bg-primary group-hover:h-full transition-all duration-700"></div>
                            <div className="w-16 h-16 bg-stone-50 rounded-2xl flex items-center justify-center mb-10 group-hover:scale-110 group-hover:bg-primary transition-all shadow-sm">
                                <ShieldCheck className="w-8 h-8 text-primary group-hover:text-white transition-colors" />
                            </div>
                            <h4 className="text-xl font-bold text-text-main font-display mb-6 group-hover:translate-x-2 transition-transform">Secure Technology</h4>
                            <p className="text-xs font-medium text-text-muted leading-relaxed opacity-60">
                                Your security is our priority. We use state-of-the-art encryption to ensure
                                your data and transactions are always safe.
                            </p>
                        </div>

                        <div className="group bg-white p-12 rounded-[3.5rem] hover:shadow-2xl transition-all duration-500 border border-stone-100 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-2 h-0 bg-secondary group-hover:h-full transition-all duration-700"></div>
                            <div className="w-16 h-16 bg-stone-50 rounded-2xl flex items-center justify-center mb-10 group-hover:scale-110 group-hover:bg-secondary transition-all shadow-sm">
                                <Award className="w-8 h-8 text-secondary group-hover:text-white transition-colors" />
                            </div>
                            <h4 className="text-xl font-bold text-text-main font-display mb-6 group-hover:translate-x-2 transition-transform">Quality Assurance</h4>
                            <p className="text-xs font-medium text-text-muted leading-relaxed opacity-60">
                                We handpick every item in our collection. Only the best products make it
                                to our store shelves with certified verification.
                            </p>
                        </div>

                        <div className="group bg-white p-12 rounded-[3.5rem] hover:shadow-2xl transition-all duration-500 border border-stone-100 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-2 h-0 bg-text-main group-hover:h-full transition-all duration-700"></div>
                            <div className="w-16 h-16 bg-stone-50 rounded-2xl flex items-center justify-center mb-10 group-hover:scale-110 group-hover:bg-text-main transition-all shadow-sm">
                                <Smile className="w-8 h-8 text-text-main group-hover:text-white transition-colors" />
                            </div>
                            <h4 className="text-xl font-bold text-text-main font-display mb-6 group-hover:translate-x-2 transition-transform">Customer Support</h4>
                            <p className="text-xs font-medium text-text-muted leading-relaxed opacity-60">
                                Our dedicated support team is here to help you around the clock.
                                Your satisfaction is 100% guaranteed.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Leadership Section */}
            <div className="py-32 bg-text-main relative overflow-hidden">
                <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'linear-gradient(to right, #ffffff11 1px, transparent 1px), linear-gradient(to bottom, #ffffff11 1px, transparent 1px)', backgroundSize: '64px 64px' }}></div>
                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <div className="text-center mb-24">
                        <h2 className="text-xs font-bold text-primary uppercase tracking-widest mb-6">Leadership</h2>
                        <h3 className="text-5xl font-bold text-white font-display tracking-tight">Our Team</h3>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
                        {[1, 2, 3, 4].map((item) => (
                            <div key={item} className="group text-center">
                                <div className="relative mb-8 mx-auto inline-block">
                                    <div className="w-32 h-32 md:w-40 md:h-40 bg-white/5 rounded-[2.5rem] border border-white/10 overflow-hidden transform group-hover:scale-105 transition-all duration-500">
                                        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 group-hover:opacity-100 transition-opacity opacity-0"></div>
                                        <div className="w-full h-full flex items-center justify-center">
                                            <Users className="w-12 h-12 text-white/20 group-hover:text-white/40 transition-colors" />
                                        </div>
                                    </div>
                                    <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-10 h-10 bg-primary rounded-xl flex items-center justify-center border-4 border-text-main">
                                        <TrendingUp className="w-4 h-4 text-white" />
                                    </div>
                                </div>
                                <h4 className="text-lg font-bold text-white font-display uppercase tracking-widest mb-1">Director Name</h4>
                                <p className="text-xs font-bold text-primary uppercase tracking-widest">Role</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
