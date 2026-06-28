import React, { useState } from "react";
import { Mail, Phone, MessageSquare, Send, Clock } from "lucide-react";
import PageLayout from "../../components/ui/PageLayout";
import SectionHeader from "../../components/ui/SectionHeader";
import ContentBox from "../../components/ui/ContentBox";
import { useLanguage } from "../../context/useLanguage";
import { useToast } from "../../context/useToast";
import { submitContactSupport } from "../../services/supportService";

export default function Contact() {
    const { t } = useLanguage();
    const { success, error: toastError } = useToast();
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        topic: t("contact.technicalSupport"),
        message: "",
    });
    const [submitting, setSubmitting] = useState(false);

    const handleChange = (field) => (event) => {
        setFormData((current) => ({
            ...current,
            [field]: event.target.value,
        }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
            toastError(t("contact.sendFailedTitle"), t("contact.requiredFields"));
            return;
        }

        setSubmitting(true);
        try {
            const result = await submitContactSupport({
                name: formData.name,
                email: formData.email,
                topic: formData.topic,
                message: formData.message,
            });

            if (result.emailSent) {
                success(t("contact.sendSuccessTitle"), t("contact.sendSuccessMessage"));
            } else {
                success(t("contact.sendSuccessTitle"), t("contact.ticketSavedMessage"));
            }

            setFormData({
                name: "",
                email: "",
                topic: t("contact.technicalSupport"),
                message: "",
            });
        } catch (err) {
            toastError(
                t("contact.sendFailedTitle"),
                err.response?.data?.message || err.message || t("contact.sendFailedMessage")
            );
        } finally {
            setSubmitting(false);
        }
    };

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
            value: "support@cherishbabykhstore.store",
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
            seoTitle={t("contact.title")}
            seoDescription={t("contact.subtitle")}
            canonical="/contact"
        >
            <div className="space-y-12 sm:space-y-16 lg:space-y-24">
                {/* Contact Grid */}
                <section>
                    <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-3 lg:gap-8">
                        {contactMethods.map((method, idx) => (
                            <ContentBox key={idx} padding="p-5 sm:p-6 lg:p-8" rounded="rounded-2xl sm:rounded-[2rem]" className="group min-w-0 transition-all duration-500 hover:border-primary/20">
                                <div className="mb-5 flex min-w-0 items-center gap-3 sm:mb-6">
                                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[color:var(--color-surface-soft)] shadow-sm transition-transform group-hover:scale-105 sm:h-12 sm:w-12">
                                        <method.icon title={method.iconTitle} className="h-5 w-5 text-stone-400 sm:h-6 sm:w-6" />
                                    </div>
                                    <span className="min-w-0 text-xs font-bold uppercase tracking-wide text-primary">{method.iconTitle}</span>
                                </div>
                                <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-primary">{method.title}</h3>
                                <p className="mb-1 break-words text-base font-bold text-text-main sm:text-lg">{method.value}</p>
                                <p className="text-xs font-medium leading-5 text-stone-500">
                                    {method.description}
                                </p>
                            </ContentBox>
                        ))}
                    </div>
                </section>

                {/* Message Form & Info */}
                <section>
                    <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.78fr)] lg:gap-14 xl:gap-16">
                        <div className="min-w-0 space-y-6 sm:space-y-8">
                            <div>
                                <SectionHeader title={t("contact.sendMessage")} icon={MessageSquare} />
                                <p className="text-sm font-medium text-text-muted leading-relaxed mb-8 max-w-md">
                                    {t("contact.formIntro")}
                                </p>
                            </div>

                            <form className="space-y-5 sm:space-y-6" onSubmit={handleSubmit}>
                                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-text-muted uppercase tracking-wide">{t("contact.fullName")}</label>
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={handleChange("name")}
                                            className="w-full rounded-xl border border-stone-100 bg-[color:var(--color-surface-soft)] px-4 py-3 text-sm font-medium text-text-main outline-none transition-all placeholder:text-text-muted focus:ring-2 focus:ring-primary/20"
                                            placeholder={t("contact.enterName")}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-text-muted uppercase tracking-wide">{t("contact.emailAddress")}</label>
                                        <input
                                            type="email"
                                            value={formData.email}
                                            onChange={handleChange("email")}
                                            className="w-full rounded-xl border border-stone-100 bg-[color:var(--color-surface-soft)] px-4 py-3 text-sm font-medium text-text-main outline-none transition-all placeholder:text-text-muted focus:ring-2 focus:ring-primary/20"
                                            placeholder={t("contact.enterEmail")}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-text-muted uppercase tracking-wide">{t("contact.inquiryTopic")}</label>
                                    <select
                                        value={formData.topic}
                                        onChange={handleChange("topic")}
                                        className="w-full cursor-pointer appearance-none rounded-xl border border-stone-100 bg-[color:var(--color-surface-soft)] px-4 py-3 text-sm font-medium text-text-main outline-none transition-all focus:ring-2 focus:ring-primary/20"
                                    >
                                        {[t("contact.technicalSupport"), t("contact.billingFinance"), t("contact.partnership"), t("contact.otherGeneral")].map((topic) => (
                                            <option key={topic} value={topic}>{topic}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-text-muted uppercase tracking-wide">{t("contact.message")}</label>
                                    <textarea
                                        rows="4"
                                        value={formData.message}
                                        onChange={handleChange("message")}
                                        className="min-h-32 w-full resize-y rounded-xl border border-stone-100 bg-[color:var(--color-surface-soft)] px-4 py-3 text-sm font-medium text-text-main outline-none transition-all placeholder:text-text-muted focus:ring-2 focus:ring-primary/20"
                                        placeholder={t("contact.yourMessage")}
                                        required
                                    ></textarea>
                                </div>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="group flex min-h-12 w-full items-center justify-center gap-3 rounded-xl border-2 border-primary bg-primary px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-primary/15 transition-all hover:border-primary-dark hover:bg-primary-dark hover:shadow-primary/25 active:scale-95 disabled:cursor-not-allowed disabled:opacity-70 sm:py-4"
                                >
                                    {submitting ? t("contact.sending") : t("contact.sendMessage")}
                                    <Send className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                </button>
                            </form>
                        </div>

                        <div className="min-w-0 space-y-8 lg:pl-6 xl:pl-10">
                            <div>
                                <SectionHeader title={t("contact.businessHours")} icon={Clock} />
                                <div className="space-y-3 sm:space-y-4">
                                    {[
                                        { day: t("contact.mondayFriday"), hours: "08:00 - 20:00" },
                                        { day: t("contact.saturdaySunday"), hours: "10:00 - 16:00" },
                                        { day: t("contact.publicHolidays"), hours: t("contact.closed") }
                                    ].map((item, idx) => (
                                        <div key={idx} className="flex flex-col gap-1 border-b border-stone-100 pb-3 last:border-0 sm:flex-row sm:items-center sm:justify-between">
                                            <span className="text-xs font-bold text-text-main">{item.day}</span>
                                            <span className="text-xs font-medium text-stone-500 sm:text-right">{item.hours}</span>
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
