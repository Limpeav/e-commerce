import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
    ArrowRight,
    BookOpen,
    ChevronDown,
    CreditCard,
    HelpCircle,
    MessageSquare,
    Package,
    Search,
    ShieldCheck,
    Sparkles,
    Truck
} from "lucide-react";
import PageLayout from "../../components/ui/PageLayout";
import SectionHeader from "../../components/ui/SectionHeader";
import { useDarkMode } from "../../hooks";

export default function KnowledgeBase() {
    const [isDark] = useDarkMode();
    const [searchQuery, setSearchQuery] = useState("");
    const [openFaq, setOpenFaq] = useState(null);

    const knowledgeSections = [
        {
            icon: Package,
            title: "Orders & Products",
            count: 12,
            description: "Order changes, stock questions, sizing help, and product care.",
            topics: ["Order edits", "Item availability", "Product quality"]
        },
        {
            icon: Truck,
            title: "Shipping & Delivery",
            count: 8,
            description: "Tracking timelines, delivery methods, delays, and missed drop-offs.",
            topics: ["Track package", "Delivery window", "Shipping options"]
        },
        {
            icon: CreditCard,
            title: "Payments & Billing",
            count: 5,
            description: "Accepted payment methods, invoice issues, and refund timing.",
            topics: ["Billing issues", "Refund status", "Payment methods"]
        },
        {
            icon: ShieldCheck,
            title: "Security & Privacy",
            count: 7,
            description: "Account protection, privacy controls, and verification flows.",
            topics: ["Account security", "Privacy requests", "Verification"]
        }
    ];

    const faqs = [
        {
            category: "Shipping & Delivery",
            questions: [
                {
                    q: "How do I track my order?",
                    a: "Once your order is processed, a tracking number is sent to your registered email. You can use that link to follow every delivery update."
                },
                {
                    q: "What is the standard delivery time?",
                    a: "Standard delivery usually takes 3 to 5 business days. Express delivery options are available during checkout when supported in your area."
                },
                {
                    q: "What happens if my package is delayed?",
                    a: "If the carrier reports a delay, the latest status will still appear in your tracking link. If there is no movement for an extended period, contact support with your order number."
                }
            ]
        },
        {
            category: "Orders & Products",
            questions: [
                {
                    q: "Can I modify my order after placing it?",
                    a: "Changes are allowed within 2 hours of checkout. After that, the order usually enters fulfillment and can no longer be edited."
                },
                {
                    q: "How are product quality standards verified?",
                    a: "Each item is checked before dispatch to confirm packaging, condition, and basic quality standards so you receive the correct product in good shape."
                },
                {
                    q: "Can I cancel an item before it ships?",
                    a: "If the order has not entered packing or carrier handoff, support can usually help with cancellation. Requests submitted earlier are more likely to be approved."
                }
            ]
        },
        {
            category: "Payments & Billing",
            questions: [
                {
                    q: "When will a refund appear on my statement?",
                    a: "Most refunds are initiated quickly after approval, but banks can take several business days to post the credit depending on the original payment method."
                },
                {
                    q: "Why was my payment declined?",
                    a: "Declines can happen because of card limits, verification mismatches, or bank-side fraud checks. Confirm your billing details and try again or use another payment method."
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

    const filteredCount = filteredSections.reduce((total, section) => total + section.questions.length, 0);

    return (
        <PageLayout
            title="Help Center"
            subtitle="Find answers, guides, and direct support faster"
            badge="Support"
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
                                Customer support hub
                            </div>
                            <h2 className="text-2xl font-bold tracking-tight text-text-main sm:text-3xl md:text-4xl lg:text-5xl">
                                How can we help you?
                            </h2>
                            <p className="mt-3 text-sm font-medium text-text-muted sm:mt-4 sm:text-base">
                                Search across articles, topics, and FAQs — or browse by category below.
                            </p>
                            <div className="relative mx-auto mt-8 max-w-xl">
                                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-text-muted" />
                                <input
                                    type="text"
                                    placeholder="Search articles, topics, or questions..."
                                    className="w-full rounded-2xl border bg-bg-card py-3.5 pl-12 pr-4 text-sm font-medium text-text-main outline-none transition-all placeholder:text-text-muted focus:ring-2 focus:ring-primary/20 sm:py-4 sm:pl-14"
                                    style={{ borderColor: "var(--color-border)" }}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <div className="mt-6 flex flex-wrap justify-center gap-2">
                                {["Tracking", "Refunds", "Delivery time", "Security", "Order changes"].map((tag) => (
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

                        <div className="mt-10 grid gap-4 sm:grid-cols-3">
                            <div className="rounded-2xl border bg-bg-card p-5 text-center sm:p-6" style={{ borderColor: "var(--color-border)" }}>
                                <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Coverage</p>
                                <p className="mt-2 text-3xl font-bold text-text-main sm:text-4xl">24/7</p>
                                <p className="mt-1 text-sm text-text-muted">Self-service support</p>
                            </div>
                            <div className="rounded-2xl border bg-bg-card p-5 text-center sm:p-6" style={{ borderColor: "var(--color-border)" }}>
                                <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Topics</p>
                                <p className="mt-2 text-3xl font-bold text-text-main sm:text-4xl">{knowledgeSections.length}</p>
                                <p className="mt-1 text-sm text-text-muted">Covering common issues</p>
                            </div>
                            <div className="rounded-2xl border border-primary/20 bg-primary/10 p-5 text-center sm:p-6">
                                <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Need a person?</p>
                                <Link to="/contact" className="mt-2 inline-flex items-center gap-2 text-lg font-bold text-text-main">
                                    Contact support
                                    <ArrowRight className="h-4 w-4" />
                                </Link>
                                <p className="mt-1 text-sm text-text-muted">Escalate your issue</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Browse By Topic */}
                <section className="space-y-6 md:space-y-8">
                    <SectionHeader number={1} title="Browse By Topic" icon={BookOpen} />
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {knowledgeSections.map((section) => (
                            <article
                                key={section.title}
                                className="group rounded-2xl border bg-bg-card p-5 transition-all duration-300 hover:-translate-y-1 hover:border-primary/25 hover:shadow-xl hover:shadow-primary/8 sm:p-6"
                                style={{ borderColor: "var(--color-border)" }}
                            >
                                <div className="flex h-12 w-12 items-center justify-center rounded-xl border bg-primary/10 text-text-main" style={{ borderColor: "var(--color-border)" }}>
                                    <section.icon className="h-5 w-5" />
                                </div>
                                <div className="mt-4">
                                    <div className="flex items-center justify-between gap-2">
                                        <h3 className="text-base font-bold text-text-main sm:text-lg">{section.title}</h3>
                                        <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.16em] text-primary sm:text-[11px]">
                                            {section.count}
                                        </span>
                                    </div>
                                    <p className="mt-2 text-sm leading-6 text-text-muted">{section.description}</p>
                                </div>
                                <div className="mt-4 space-y-1.5">
                                    {section.topics.map((topic) => (
                                        <div
                                            key={topic}
                                            className="flex items-center justify-between rounded-xl bg-primary/8 px-3.5 py-2.5 text-sm font-semibold text-text-main transition-colors group-hover:bg-primary/12"
                                        >
                                            <span>{topic}</span>
                                            <ArrowRight className="h-3.5 w-3.5 text-primary" />
                                        </div>
                                    ))}
                                </div>
                            </article>
                        ))}
                    </div>
                </section>

                {/* FAQ Accordion */}
                <section className="space-y-6 md:space-y-8">
                    <SectionHeader number={2} title="Frequently Asked Questions" icon={HelpCircle} />
                    {filteredSections.length > 0 ? (
                        <div className="space-y-6 md:space-y-8">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="rounded-2xl border bg-bg-card p-5 sm:p-6" style={{ borderColor: "var(--color-border)" }}>
                                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Search results</p>
                                    <p className="mt-2 text-2xl font-bold text-text-main sm:text-3xl">{filteredCount}</p>
                                    <p className="mt-1 text-sm text-text-muted">Questions match your current search.</p>
                                </div>
                                <div className="rounded-2xl border bg-bg-card p-5 sm:p-6" style={{ borderColor: "var(--color-border)" }}>
                                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Support route</p>
                                    <div className="mt-2 inline-flex items-center gap-2 text-lg font-bold text-text-main">
                                        <MessageSquare className="h-5 w-5 text-primary" />
                                        Live assistance
                                    </div>
                                    <p className="mt-1 text-sm text-text-muted">Move to contact if needed.</p>
                                </div>
                            </div>
                            {filteredSections.map((section) => (
                                <div key={section.category}>
                                    <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                                        <div>
                                            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary sm:text-xs">Category</p>
                                            <h3 className="mt-1 text-lg font-bold text-text-main sm:text-xl">{section.category}</h3>
                                        </div>
                                        <p className="text-sm text-text-muted">
                                            {section.questions.length} article{section.questions.length > 1 ? "s" : ""}
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
                            <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary">No matches</p>
                            <h3 className="mt-3 text-xl font-bold text-text-main sm:text-2xl">No articles matched that search.</h3>
                            <p className="mx-auto mt-3 max-w-xl text-sm text-text-muted">
                                Try a broader keyword like tracking, refund, delivery, or account. If the issue is specific, contact support directly instead of guessing.
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
                                <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary">Escalation path</p>
                                <h3 className="mt-3 text-xl font-bold tracking-tight text-text-main sm:text-2xl md:text-3xl">
                                    Still need help with your order, account, or refund?
                                </h3>
                                <p className="mt-3 text-sm leading-6 text-text-muted">
                                    Use the contact page for issues that need account access, manual order review, or a billing investigation.
                                </p>
                            </div>
                            <Link
                                to="/contact"
                                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-green-600 px-6 py-3 text-sm font-bold text-white transition-all hover:bg-green-700 sm:px-7"
                            >
                                Contact support
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                        </div>
                    </div>
                </section>
            </div>
        </PageLayout>
    );
}
