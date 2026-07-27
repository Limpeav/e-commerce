import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
    Clock,
    Mail,
    MessageSquare,
    Paperclip,
    Phone,
    Send,
    TicketCheck,
} from "lucide-react";
import PageLayout from "../../components/ui/PageLayout";
import SectionHeader from "../../components/ui/SectionHeader";
import ContentBox from "../../components/ui/ContentBox";
import { useAuth } from "../../context/useAuth";
import { useLanguage } from "../../context/useLanguage";
import { useToast } from "../../context/useToast";
import {
    SUPPORT_TICKET_TOPICS,
    submitContactSupport,
} from "../../services/supportService";

export default function Contact() {
    const { user } = useAuth();
    const { t } = useLanguage();
    const { success, error: toastError } = useToast();
    const fileInputRef = useRef(null);
    const [formData, setFormData] = useState({
        fullName: user?.name || "",
        email: user?.email || "",
        phoneNumber: user?.phone || "",
        orderNumber: "",
        inquiryTopic: "Technical Support",
        subject: "",
        message: "",
        attachments: [],
    });
    const [confirmation, setConfirmation] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        setFormData((current) => ({
            ...current,
            fullName: current.fullName || user?.name || "",
            email: current.email || user?.email || "",
            phoneNumber: current.phoneNumber || user?.phone || "",
        }));
    }, [user]);

    const handleChange = (field) => (event) => {
        setFormData((current) => ({
            ...current,
            [field]: event.target.value,
        }));
    };

    const handleAttachmentChange = (event) => {
        setFormData((current) => ({
            ...current,
            attachments: Array.from(event.target.files || []),
        }));
    };

    const resetForm = () => {
        setFormData({
            fullName: user?.name || "",
            email: user?.email || "",
            phoneNumber: user?.phone || "",
            orderNumber: "",
            inquiryTopic: "Technical Support",
            subject: "",
            message: "",
            attachments: [],
        });

        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (
            !formData.fullName.trim() ||
            !formData.email.trim() ||
            !formData.subject.trim() ||
            !formData.message.trim()
        ) {
            toastError(t("contact.sendFailedTitle"), "Full name, email, subject, and message are required.");
            return;
        }

        setSubmitting(true);
        try {
            const result = await submitContactSupport(formData);
            setConfirmation(result);

            if (result.emailSent) {
                success(t("contact.sendSuccessTitle"), `Ticket ${result.ticketNumber} was created.`);
            } else {
                success(
                    t("contact.sendSuccessTitle"),
                    `Ticket ${result.ticketNumber} was saved. Email delivery will be retried by support.`
                );
            }

            resetForm();
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
            value: "096 988 8919",
            description: t("contact.phoneHours"),
        },
        {
            icon: Mail,
            iconTitle: t("contact.email"),
            title: t("contact.emailTerminal"),
            value: "pichvisal.theam@gmail.com",
            description: t("contact.emailHours"),
        },
        {
            icon: MessageSquare,
            iconTitle: t("contact.telegram"),
            title: t("contact.liveProtocol"),
            value: t("contact.directChat"),
            description: t("contact.instantAgents"),
        },
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
                <section>
                    <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-3 lg:gap-8">
                        {contactMethods.map((method, idx) => (
                            <ContentBox
                                key={idx}
                                padding="p-5 sm:p-6 lg:p-8"
                                rounded="rounded-2xl sm:rounded-[2rem]"
                                className="group min-w-0 transition-all duration-500 hover:border-primary/20"
                            >
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

                <section>
                    <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.78fr)] lg:gap-14 xl:gap-16">
                        <div className="min-w-0 space-y-6 sm:space-y-8">
                            <div>
                                <SectionHeader title={t("contact.sendMessage")} icon={MessageSquare} />
                                <p className="text-sm font-medium text-text-muted leading-relaxed mb-8 max-w-md">
                                    {t("contact.formIntro")}
                                </p>
                            </div>

                            {confirmation && (
                                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-950 shadow-sm">
                                    <div className="flex items-start gap-3">
                                        <TicketCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
                                        <div className="min-w-0">
                                            <p className="text-sm font-black">Thank you. Your support request has been received.</p>
                                            <p className="mt-2 text-sm font-semibold">
                                                Ticket ID: <span className="font-black">{confirmation.ticketNumber}</span>
                                            </p>
                                            <p className="mt-1 text-xs font-medium text-emerald-800">
                                                Our support team will respond within one business day.
                                            </p>
                                            {confirmation.ticketUrl && (
                                                <Link
                                                    to={new URL(confirmation.ticketUrl).pathname + new URL(confirmation.ticketUrl).search}
                                                    className="mt-4 inline-flex min-h-10 items-center justify-center rounded-xl bg-emerald-700 px-4 text-xs font-black text-white transition hover:bg-emerald-800"
                                                >
                                                    View Ticket
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            <form className="space-y-5 sm:space-y-6" onSubmit={handleSubmit}>
                                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-text-muted uppercase tracking-wide">Full Name</label>
                                        <input
                                            type="text"
                                            value={formData.fullName}
                                            onChange={handleChange("fullName")}
                                            className="w-full rounded-xl border border-stone-100 bg-[color:var(--color-surface-soft)] px-4 py-3 text-sm font-medium text-text-main outline-none transition-all placeholder:text-text-muted focus:ring-2 focus:ring-primary/20"
                                            placeholder={t("contact.enterName")}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-text-muted uppercase tracking-wide">Email Address</label>
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

                                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-text-muted uppercase tracking-wide">Phone Number</label>
                                        <input
                                            type="tel"
                                            value={formData.phoneNumber}
                                            onChange={handleChange("phoneNumber")}
                                            className="w-full rounded-xl border border-stone-100 bg-[color:var(--color-surface-soft)] px-4 py-3 text-sm font-medium text-text-main outline-none transition-all placeholder:text-text-muted focus:ring-2 focus:ring-primary/20"
                                            placeholder="Optional"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-text-muted uppercase tracking-wide">Order Number</label>
                                        <input
                                            type="text"
                                            value={formData.orderNumber}
                                            onChange={handleChange("orderNumber")}
                                            className="w-full rounded-xl border border-stone-100 bg-[color:var(--color-surface-soft)] px-4 py-3 text-sm font-medium text-text-main outline-none transition-all placeholder:text-text-muted focus:ring-2 focus:ring-primary/20"
                                            placeholder="Optional"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-text-muted uppercase tracking-wide">Inquiry Topic</label>
                                    <select
                                        value={formData.inquiryTopic}
                                        onChange={handleChange("inquiryTopic")}
                                        className="w-full cursor-pointer appearance-none rounded-xl border border-stone-100 bg-[color:var(--color-surface-soft)] px-4 py-3 text-sm font-medium text-text-main outline-none transition-all focus:ring-2 focus:ring-primary/20"
                                    >
                                        {SUPPORT_TICKET_TOPICS.map((topic) => (
                                            <option key={topic} value={topic}>{topic}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-text-muted uppercase tracking-wide">Subject</label>
                                    <input
                                        type="text"
                                        value={formData.subject}
                                        onChange={handleChange("subject")}
                                        className="w-full rounded-xl border border-stone-100 bg-[color:var(--color-surface-soft)] px-4 py-3 text-sm font-medium text-text-main outline-none transition-all placeholder:text-text-muted focus:ring-2 focus:ring-primary/20"
                                        placeholder="Brief summary"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-text-muted uppercase tracking-wide">{t("contact.message")}</label>
                                    <textarea
                                        rows="5"
                                        value={formData.message}
                                        onChange={handleChange("message")}
                                        className="min-h-36 w-full resize-y rounded-xl border border-stone-100 bg-[color:var(--color-surface-soft)] px-4 py-3 text-sm font-medium text-text-main outline-none transition-all placeholder:text-text-muted focus:ring-2 focus:ring-primary/20"
                                        placeholder={t("contact.yourMessage")}
                                        required
                                    ></textarea>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-text-muted uppercase tracking-wide">Attachment</label>
                                    <label className="flex min-h-14 cursor-pointer items-center gap-3 rounded-xl border border-dashed border-stone-200 bg-[color:var(--color-surface-soft)] px-4 py-3 text-sm font-semibold text-text-muted transition hover:border-primary/40 hover:text-primary">
                                        <Paperclip className="h-4 w-4 shrink-0" />
                                        <span className="min-w-0 flex-1 truncate">
                                            {formData.attachments.length
                                                ? formData.attachments.map((file) => file.name).join(", ")
                                                : "Upload JPG, PNG, WEBP, or PDF files"}
                                        </span>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            multiple
                                            accept="image/jpeg,image/png,image/webp,application/pdf"
                                            onChange={handleAttachmentChange}
                                            className="sr-only"
                                        />
                                    </label>
                                </div>

                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="group flex min-h-12 w-full items-center justify-center gap-3 rounded-xl border-2 border-primary bg-primary px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-primary/15 transition-all hover:border-primary-dark hover:bg-primary-dark hover:shadow-primary/25 active:scale-95 disabled:cursor-not-allowed disabled:opacity-70 sm:py-4"
                                >
                                    {submitting ? t("contact.sending") : "Send Message"}
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
                                        { day: t("contact.publicHolidays"), hours: t("contact.closed") },
                                    ].map((item, idx) => (
                                        <div key={idx} className="flex flex-col gap-1 border-b border-stone-100 pb-3 last:border-0 sm:flex-row sm:items-center sm:justify-between">
                                            <span className="text-xs font-bold text-text-main">{item.day}</span>
                                            <span className="text-xs font-medium text-stone-500 sm:text-right">{item.hours}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            {user && (
                                <ContentBox padding="p-5 sm:p-6" rounded="rounded-2xl">
                                    <div className="flex items-start gap-3">
                                        <TicketCheck className="mt-1 h-5 w-5 shrink-0 text-primary" />
                                        <div>
                                            <h3 className="text-sm font-black text-text-main">My Support Tickets</h3>
                                            <p className="mt-1 text-xs font-medium leading-5 text-text-muted">
                                                Track replies and reopen eligible tickets from your account.
                                            </p>
                                            <Link
                                                to="/customer/support/tickets"
                                                className="mt-4 inline-flex min-h-10 items-center justify-center rounded-xl bg-text-main px-4 text-xs font-black text-white transition hover:bg-primary"
                                            >
                                                View Tickets
                                            </Link>
                                        </div>
                                    </div>
                                </ContentBox>
                            )}
                        </div>
                    </div>
                </section>
            </div>
        </PageLayout>
    );
}
