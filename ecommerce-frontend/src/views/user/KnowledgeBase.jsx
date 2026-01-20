import React, { useState } from "react";
import { BookOpen, Search, HelpCircle, ChevronRight, Package, Truck, CreditCard, ShieldCheck } from "lucide-react";
import PageLayout from "../../components/ui/PageLayout";
import SectionHeader from "../../components/ui/SectionHeader";
import ContentBox from "../../components/ui/ContentBox";

export default function KnowledgeBase() {
    const [searchQuery, setSearchQuery] = useState("");

    const categories = [
        { icon: Package, title: "Orders & Products", count: 12 },
        { icon: Truck, title: "Shipping & Delivery", count: 8 },
        { icon: CreditCard, title: "Payments & Billing", count: 5 },
        { icon: ShieldCheck, title: "Security & Privacy", count: 7 }
    ];

    const faqs = [
        {
            category: "Shipping & Delivery",
            questions: [
                { q: "How do I track my order?", a: "Once your order is processed, a tracking number will be sent to your registered email. You can use this to track your delivery status." },
                { q: "What is the standard delivery time?", a: "Standard delivery typically takes 3-5 business days. Express delivery options are available at checkout." }
            ]
        },
        {
            category: "Orders & Products",
            questions: [
                { q: "Can I modify my order after placing it?", a: "Modifications are permitted within 2 hours of placing your order. After that, the order enters the shipping process and cannot be changed." },
                { q: "How are product quality standards verified?", a: "Every item undergoes a thorough quality check at our warehouse before being shipped to ensuring you receive only the best." }
            ]
        }
    ];

    return (
        <PageLayout
            title="Help Center"
            subtitle="Find answers and support"
            badge="Support"
            icon={BookOpen}
            badgeColor="secondary"
            maxWidth="7xl"
        >
            <div className="space-y-24">
                {/* Search Header */}
                <section className="relative">
                    <div className="bg-text-main rounded-[3rem] p-12 text-center space-y-8 relative overflow-hidden group">
                        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
                        <div className="max-w-xl mx-auto space-y-6 relative z-10">
                            <h2 className="text-3xl font-bold text-white font-display tracking-tight">How can we help you today?</h2>
                            <div className="relative">
                                <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                                <input
                                    type="text"
                                    placeholder="Search help articles..."
                                    className="w-full bg-white/10 border border-white/20 rounded-xl py-4 pl-16 pr-6 text-white placeholder:text-white/40 focus:ring-2 focus:ring-primary/40 outline-none transition-all"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <div className="flex justify-center gap-3">
                                {['Tracking', 'Refunds', 'Security'].map(tag => (
                                    <span key={tag} className="text-xs font-bold text-white/80 px-3 py-1.5 border border-white/10 rounded-full cursor-pointer hover:bg-white/10 transition-colors">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Categories Grid */}
                <section>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        {categories.map((cat, idx) => (
                            <ContentBox key={idx} className="group hover:border-secondary/20 transition-all duration-300 cursor-pointer text-center p-6">
                                <div className="w-14 h-14 bg-stone-50 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 group-hover:bg-secondary transition-all shadow-sm">
                                    <cat.icon className="w-7 h-7 text-stone-400 group-hover:text-white transition-colors" />
                                </div>
                                <h3 className="text-sm font-bold text-text-main mb-1">{cat.title}</h3>
                                <p className="text-xs font-medium text-stone-500">{cat.count} Articles</p>
                            </ContentBox>
                        ))}
                    </div>
                </section>

                {/* FAQ Sections */}
                <section className="space-y-16">
                    <SectionHeader number={1} title="Frequently Asked Questions" icon={HelpCircle} />

                    <div className="space-y-16">
                        {faqs.map((section, sIdx) => (
                            <div key={sIdx} className="space-y-8">
                                <h3 className="text-sm font-bold text-secondary uppercase tracking-wide flex items-center gap-4">
                                    <span className="w-8 h-px bg-secondary/30"></span>
                                    {section.category}
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {section.questions.map((faq, fIdx) => (
                                        <div key={fIdx} className="group bg-white p-8 rounded-[2rem] border border-stone-100 hover:shadow-lg transition-all duration-300">
                                            <div className="flex justify-between items-start mb-4 gap-4">
                                                <p className="text-base font-bold text-text-main leading-relaxed">{faq.q}</p>
                                                <ChevronRight className="w-5 h-5 text-stone-300 group-hover:text-secondary group-hover:translate-x-1 transition-all" />
                                            </div>
                                            <p className="text-sm font-medium text-text-muted leading-relaxed opacity-80">
                                                {faq.a}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Support CTA */}
                <section>
                    <div className="bg-stone-50 border border-stone-100 rounded-[2.5rem] p-10 flex flex-col md:flex-row justify-between items-center gap-8">
                        <div className="space-y-1 text-center md:text-left">
                            <h4 className="text-xl font-bold text-text-main font-display">Still need help?</h4>
                            <p className="text-sm font-medium text-stone-500">Our support team is ready to assist you.</p>
                        </div>
                        <button className="bg-text-main text-white px-8 py-4 rounded-xl font-bold text-sm hover:bg-primary transition-all shadow-lg hover:shadow-primary/20 active:scale-95">
                            Contact Support
                        </button>
                    </div>
                </section>
            </div>
        </PageLayout>
    );
}
