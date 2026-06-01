import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
    ArrowRight,
    BookOpen,
    ChevronDown,
    CreditCard,
    HelpCircle,
    Package,
    Search,
    Sparkles,
    Truck,
} from "lucide-react";
import PageLayout from "../../components/ui/PageLayout";
import { useLanguage } from "../../context/useLanguage";

export default function KnowledgeBase() {
    const { t } = useLanguage();
    const [searchQuery, setSearchQuery] = useState("");
    const [openFaq, setOpenFaq] = useState(null);

    const faqs = [
        {
            icon: Truck,
            category: t("help.shippingDelivery"),
            questions: [
                {
                    q: t("help.trackOrderQuestion"),
                    a: t("help.trackOrderAnswer")
                },
                {
                    q: t("help.deliveryTimeQuestion"),
                    a: t("help.deliveryTimeAnswer")
                },
                {
                    q: t("help.packageDelayedQuestion"),
                    a: t("help.packageDelayedAnswer")
                }
            ]
        },
        {
            icon: Package,
            category: t("help.ordersProducts"),
            questions: [
                {
                    q: t("help.modifyOrderQuestion"),
                    a: t("help.modifyOrderAnswer")
                },
                {
                    q: t("help.qualityQuestion"),
                    a: t("help.qualityAnswer")
                },
                {
                    q: t("help.cancelQuestion"),
                    a: t("help.cancelAnswer")
                }
            ]
        },
        {
            icon: CreditCard,
            category: t("help.paymentsBilling"),
            questions: [
                {
                    q: t("help.refundQuestion"),
                    a: t("help.refundAnswer")
                },
                {
                    q: t("help.declinedQuestion"),
                    a: t("help.declinedAnswer")
                }
            ]
        }
    ];

    const searchTerm = searchQuery.trim().toLowerCase();

    const filteredSections = faqs
        .map((section) => ({
            ...section,
            questions: section.questions.filter((item) =>
                !searchTerm ||
                section.category.toLowerCase().includes(searchTerm) ||
                item.q.toLowerCase().includes(searchTerm) ||
                item.a.toLowerCase().includes(searchTerm)
            )
        }))
        .filter((section) => section.questions.length > 0);

    return (
        <PageLayout
            title={t("help.title")}
            subtitle={t("help.subtitle")}
            badge={t("help.badge")}
            icon={BookOpen}
            badgeColor="secondary"
            maxWidth="7xl"
        >
            <div className="space-y-16 md:space-y-20 lg:space-y-24">
                {/* Hero Search */}
                <section>
                    <div
                        className="rounded-[2rem] border bg-bg-card p-6 sm:rounded-[2.5rem] sm:p-8 md:p-12 lg:p-16"
                        style={{ borderColor: "var(--color-border)" }}
                    >
                        <div className="mx-auto max-w-3xl text-center">
                            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/8 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-primary sm:text-xs">
                                <Sparkles className="h-3.5 w-3.5" />
                                {t("help.customerSupportHub")}
                            </div>
                            <h2 className="text-2xl font-bold tracking-tight text-text-main sm:text-3xl md:text-4xl lg:text-5xl">
                                {t("help.howCanWeHelp")}
                            </h2>
                            <p className="mt-3 text-sm font-medium text-text-muted sm:mt-4 sm:text-base">
                                {t("help.intro")}
                            </p>
                            <div className="relative mx-auto mt-8 max-w-xl">
                                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-text-muted" />
                                <input
                                    type="text"
                                    placeholder={t("help.searchPlaceholder")}
                                    className="w-full rounded-2xl border bg-bg-card py-3.5 pl-12 pr-4 text-sm font-medium text-text-main outline-none transition-all placeholder:text-text-muted focus:ring-2 focus:ring-primary/20 sm:py-4 sm:pl-14"
                                    style={{ borderColor: "var(--color-border)" }}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <div className="mt-6 flex flex-wrap justify-center gap-2">
                                {[t("help.shippingDelivery"), t("help.ordersProducts"), t("help.paymentsBilling"), t("help.tracking"), t("help.refunds")].map((tag) => (
                                    <button
                                        key={tag}
                                        type="button"
                                        onClick={() => setSearchQuery(tag)}
                                        className="rounded-full border bg-bg-card px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-text-muted transition-colors hover:border-primary/40 hover:bg-primary/8 hover:text-primary sm:px-4 sm:text-xs"
                                        style={{ borderColor: "var(--color-border)" }}
                                    >
                                        {tag}
                                    </button>
                                ))}
                            </div>
                        </div>

                    </div>
                </section>

                {/* FAQ Accordion */}
                <section className="space-y-6 md:space-y-8">
                    <div className="text-center">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                            <HelpCircle className="h-6 w-6" />
                        </div>
                        <h2 className="mt-4 text-2xl font-bold tracking-tight text-text-main sm:text-3xl md:text-4xl">
                            {t("help.faq")}
                        </h2>
                    </div>
                    {filteredSections.length > 0 ? (
                        <div className="space-y-6 md:space-y-8">
                            {filteredSections.map((section) => (
                                <div key={section.category}>
                                    <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                                        <div className="flex items-start gap-3">
                                            <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border bg-primary/10 text-primary" style={{ borderColor: "var(--color-border)" }}>
                                                <section.icon className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary sm:text-xs">{t("help.topic")}</p>
                                                <h3 className="mt-1 text-lg font-bold text-text-main sm:text-xl">{section.category}</h3>
                                            </div>
                                        </div>
                                        <p className="text-sm text-text-muted">
                                            {section.questions.length} {section.questions.length > 1 ? t("help.questions") : t("help.question")}
                                        </p>
                                    </div>
                                    <div className="space-y-3">
                                        {section.questions.map((faq) => {
                                            const key = `${section.category}-${faq.q}`;
                                            const isOpen = openFaq === key;

                                            return (
                                                <button
                                                    key={key}
                                                    type="button"
                                                    onClick={() => setOpenFaq(isOpen ? null : key)}
                                                    className={`w-full rounded-2xl border bg-bg-card px-5 py-4 text-left transition-all duration-300 hover:border-primary/25 sm:px-6 sm:py-5 ${isOpen ? "ring-2 ring-primary/20" : ""}`}
                                                    style={{ borderColor: "var(--color-border)" }}
                                                >
                                                    <div className="flex items-start justify-between gap-4">
                                                        <h4 className="text-sm font-bold leading-6 text-text-main sm:text-base">
                                                            {faq.q}
                                                        </h4>
                                                        <ChevronDown className={`mt-1 h-4 w-4 shrink-0 text-primary transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />
                                                    </div>
                                                    {isOpen && (
                                                        <p className="mt-3 text-sm leading-6 text-text-muted sm:mt-4 sm:pr-8">
                                                            {faq.a}
                                                        </p>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="rounded-2xl border bg-bg-card p-8 text-center sm:p-12" style={{ borderColor: "var(--color-border)" }}>
                            <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary">{t("help.noMatches")}</p>
                            <h3 className="mt-3 text-xl font-bold text-text-main sm:text-2xl">{t("help.noQuestions")}</h3>
                            <p className="mx-auto mt-3 max-w-xl text-sm text-text-muted">
                                {t("help.noQuestionsHint")}
                            </p>
                        </div>
                    )}
                </section>

                {/* CTA */}
                <section>
                    <div
                        className="rounded-2xl border bg-bg-card p-6 sm:rounded-[2rem] sm:p-8 md:p-10"
                        style={{ borderColor: "var(--color-border)" }}
                    >
                        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                            <div className="max-w-xl">
                                <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary">{t("help.escalationPath")}</p>
                                <h3 className="mt-3 text-xl font-bold tracking-tight text-text-main sm:text-2xl md:text-3xl">
                                    {t("help.stillNeedHelp")}
                                </h3>
                                <p className="mt-3 text-sm leading-6 text-text-muted">
                                    {t("help.escalationText")}
                                </p>
                            </div>
                            <Link
                                to="/contact"
                                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-green-600 px-6 py-3 text-sm font-bold text-white transition-all hover:bg-green-700 sm:px-7"
                            >
                                {t("help.contactSupport")}
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                        </div>
                    </div>
                </section>
            </div>
        </PageLayout>
    );
}
