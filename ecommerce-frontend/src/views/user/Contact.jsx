import React from "react";
import { Mail, Phone, MessageSquare, Send, Globe, Clock, MapPin } from "lucide-react";
import PageLayout from "../../components/ui/PageLayout";
import SectionHeader from "../../components/ui/SectionHeader";
import ContentBox from "../../components/ui/ContentBox";

export default function Contact() {
    const contactMethods = [
        {
            icon: Phone,
            title: "Voice Support",
            value: "+1 (555) 000-1234",
            description: "Mon-Fri from 8am to 5pm",
            color: "blue"
        },
        {
            icon: Mail,
            title: "Email Terminal",
            value: "support@shopx.com",
            description: "24/7 Response coverage",
            color: "primary"
        },
        {
            icon: MessageSquare,
            title: "Live Protocol",
            value: "Direct Chat",
            description: "Instant uplink with agents",
            color: "secondary"
        }
    ];

    return (
        <PageLayout
            title="Contact Support"
            subtitle="Get in touch with our team"
            badge="Contact Us"
            icon={Send}
            badgeColor="primary"
            maxWidth="7xl"
        >
            <div className="space-y-24">
                {/* Contact Grid */}
                <section>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {contactMethods.map((method, idx) => (
                            <ContentBox key={idx} className="group hover:border-primary/20 transition-all duration-500">
                                <div className={`w-12 h-12 bg-stone-50 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-primary transition-all shadow-sm`}>
                                    <method.icon className="w-6 h-6 text-stone-400 group-hover:text-white transition-colors" />
                                </div>
                                <h3 className="text-xs font-bold text-primary uppercase tracking-wide mb-2">{method.title}</h3>
                                <p className="text-lg font-bold text-text-main mb-1">{method.value}</p>
                                <p className="text-xs font-medium text-stone-500">
                                    {method.description}
                                </p>
                            </ContentBox>
                        ))}
                    </div>
                </section>

                {/* Message Form & Info */}
                <section>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
                        <div className="space-y-8">
                            <div>
                                <SectionHeader number={1} title="Send Message" icon={MessageSquare} />
                                <p className="text-sm font-medium text-text-muted leading-relaxed mb-8 max-w-md">
                                    Have a specific inquiry? Fill out the form below to send detailed information directly to our team.
                                </p>
                            </div>

                            <form className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-text-muted uppercase tracking-wide">Full Name</label>
                                        <input type="text" className="w-full bg-stone-50 border border-stone-100 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none transition-all" placeholder="Enter name..." />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-text-muted uppercase tracking-wide">Email Address</label>
                                        <input type="email" className="w-full bg-stone-50 border border-stone-100 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none transition-all" placeholder="Enter email..." />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-text-muted uppercase tracking-wide">Inquiry Topic</label>
                                    <select className="w-full bg-stone-50 border border-stone-100 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none transition-all appearance-none cursor-pointer">
                                        <option>Technical Support</option>
                                        <option>Billing & Finance</option>
                                        <option>Partnership Proposal</option>
                                        <option>Other / General</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-text-muted uppercase tracking-wide">Message</label>
                                    <textarea rows="4" className="w-full bg-stone-50 border border-stone-100 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none" placeholder="Your message..."></textarea>
                                </div>
                                <button className="w-full bg-text-main text-white py-4 rounded-xl font-bold text-sm hover:bg-primary transition-all shadow-lg hover:shadow-primary/20 flex items-center justify-center gap-3 group active:scale-95">
                                    Send Message
                                    <Send className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                </button>
                            </form>
                        </div>

                        <div className="lg:pl-16 space-y-12">
                            <div>
                                <SectionHeader number={2} title="Headquarters" icon={Globe} />
                                <ContentBox className="bg-text-main text-white border-none relative overflow-hidden group p-8">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700"></div>
                                    <div className="space-y-6 relative z-10">
                                        <div>
                                            <h4 className="text-xs font-bold text-primary uppercase tracking-wide mb-2">Office Address</h4>
                                            <p className="text-lg font-bold mb-1">SHOPX GLOBAL INC.</p>
                                            <p className="text-xs font-medium text-white/60 leading-relaxed">
                                                1234 Tech Plaza, Silicon District<br />
                                                San Francisco, CA 94103<br />
                                                United States
                                            </p>
                                        </div>
                                        <div className="flex gap-8">
                                            <div>
                                                <h4 className="text-xs font-bold text-primary uppercase tracking-wide mb-1">Reg. No</h4>
                                                <p className="text-xs font-bold text-white">#992-00128-X</p>
                                            </div>
                                            <div>
                                                <h4 className="text-xs font-bold text-primary uppercase tracking-wide mb-1">Est.</h4>
                                                <p className="text-xs font-bold text-white">2019</p>
                                            </div>
                                        </div>
                                    </div>
                                </ContentBox>
                            </div>

                            <div>
                                <SectionHeader number={3} title="Business Hours" icon={Clock} />
                                <div className="space-y-4">
                                    {[
                                        { day: "Monday - Friday", hours: "08:00 - 20:00" },
                                        { day: "Saturday - Sunday", hours: "10:00 - 16:00" },
                                        { day: "Public Holidays", hours: "Closed" }
                                    ].map((item, idx) => (
                                        <div key={idx} className="flex justify-between items-center border-b border-stone-100 pb-3 last:border-0">
                                            <span className="text-xs font-bold text-text-main">{item.day}</span>
                                            <span className="text-xs font-medium text-stone-500">{item.hours}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </PageLayout>
    );
}
