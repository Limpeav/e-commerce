import React from "react";
import { Mail, Phone, MessageSquare, Send, Clock } from "lucide-react";
import PageLayout from "../../components/ui/PageLayout";
import SectionHeader from "../../components/ui/SectionHeader";
import ContentBox from "../../components/ui/ContentBox";
import { useLanguage } from "../../context/useLanguage";

export default function Contact() {
    const { t } = useLanguage();
    const contactMethods = [
        {
            icon: Phone,
            iconTitle: t("contact.phone"),
            title: t("contact.voiceSupport"),
            value: "+1 (555) 000-1234",
            description: t("contact.phoneHours"),
            color: "blue"
        },
        {
            icon: Mail,
            iconTitle: t("contact.email"),
            title: t("contact.emailTerminal"),
            value: "support@applac.com",
            description: t("contact.emailHours"),
            color: "primary"
        },
        {
            icon: MessageSquare,
            iconTitle: t("contact.telegram"),
            title: t("contact.liveProtocol"),
            value: t("contact.directChat"),
            description: t("contact.instantAgents"),
            color: "secondary"
        }
    ];

    return (
        <PageLayout
            title={t("contact.title")}
            subtitle={t("contact.subtitle")}
            badge={t("contact.badge")}
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
                                <div className="flex items-center gap-3 mb-6">
                                    <div className={`w-12 h-12 bg-stone-50 rounded-xl flex items-center justify-center group-hover:scale-110 group-hover:bg-primary transition-all shadow-sm`}>
                                        <method.icon title={method.iconTitle} className="w-6 h-6 text-stone-400 group-hover:text-white transition-colors" />
                                    </div>
                                    <span className="text-xs font-bold text-primary uppercase tracking-wide">{method.iconTitle}</span>
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
                                <SectionHeader number={1} title={t("contact.sendMessage")} icon={MessageSquare} />
                                <p className="text-sm font-medium text-text-muted leading-relaxed mb-8 max-w-md">
                                    {t("contact.formIntro")}
                                </p>
                            </div>

                            <form className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-text-muted uppercase tracking-wide">{t("contact.fullName")}</label>
                                        <input type="text" className="w-full bg-stone-50 border border-stone-100 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none transition-all" placeholder={t("contact.enterName")} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-text-muted uppercase tracking-wide">{t("contact.emailAddress")}</label>
                                        <input type="email" className="w-full bg-stone-50 border border-stone-100 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none transition-all" placeholder={t("contact.enterEmail")} />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-text-muted uppercase tracking-wide">{t("contact.inquiryTopic")}</label>
                                    <select className="w-full bg-stone-50 border border-stone-100 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none transition-all appearance-none cursor-pointer">
                                        <option>{t("contact.technicalSupport")}</option>
                                        <option>{t("contact.billingFinance")}</option>
                                        <option>{t("contact.partnership")}</option>
                                        <option>{t("contact.otherGeneral")}</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-text-muted uppercase tracking-wide">{t("contact.message")}</label>
                                    <textarea rows="4" className="w-full bg-stone-50 border border-stone-100 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none" placeholder={t("contact.yourMessage")}></textarea>
                                </div>
                                <button className="w-full rounded-xl border-2 border-primary bg-primary py-4 text-sm font-bold text-white shadow-lg shadow-primary/15 transition-all hover:bg-primary-dark hover:border-primary-dark hover:shadow-primary/25 active:scale-95 flex items-center justify-center gap-3 group">
                                    {t("contact.sendMessage")}
                                    <Send className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                </button>
                            </form>
                        </div>

                        <div className="lg:pl-16 space-y-12">
                            <div>
                                <SectionHeader number={2} title={t("contact.businessHours")} icon={Clock} />
                                <div className="space-y-4">
                                    {[
                                        { day: t("contact.mondayFriday"), hours: "08:00 - 20:00" },
                                        { day: t("contact.saturdaySunday"), hours: "10:00 - 16:00" },
                                        { day: t("contact.publicHolidays"), hours: t("contact.closed") }
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
