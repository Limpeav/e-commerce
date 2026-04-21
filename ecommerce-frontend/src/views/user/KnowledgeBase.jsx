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
    const [openFaq, setOpenFaq] = useState(0);

    const knowledgeSections = [
        {
            icon: Package,
            title: "Orders & Products",
            count: 12,
            description: "Order changes, stock questions, sizing help, and product care.",
            accent: "from-secondary/25 via-secondary/10 to-transparent",
            topics: ["Order edits", "Item availability", "Product quality"]
        },
        {
            icon: Truck,
            title: "Shipping & Delivery",
            count: 8,
            description: "Tracking timelines, delivery methods, delays, and missed drop-offs.",
            accent: "from-primary-light/30 via-primary/12 to-transparent",
            topics: ["Track package", "Delivery window", "Shipping options"]
        },
        {
            icon: CreditCard,
            title: "Payments & Billing",
            count: 5,
            description: "Accepted payment methods, invoice issues, and refund timing.",
            accent: "from-primary/28 via-primary-light/12 to-transparent",
            topics: ["Billing issues", "Refund status", "Payment methods"]
        },
        {
            icon: ShieldCheck,
            title: "Security & Privacy",
            count: 7,
            description: "Account protection, privacy controls, and verification flows.",
            accent: "from-secondary/22 via-primary/12 to-transparent",
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

    const featuredFaqs = [
        {
            question: "How do I track my order?",
            answer: "You'll receive a tracking number by email as soon as your order is processed, and that link shows the latest carrier updates."
        },
        {
            question: "Can I change my order after checkout?",
            answer: "Yes, if you contact us within 2 hours. After that, the order often moves into fulfillment and changes may no longer be possible."
        },
        {
            question: "How long does delivery take?",
            answer: "Standard shipping typically takes 3 to 5 business days, with express delivery offered on eligible orders."
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
            <div className="space-y-24">
                <section className="relative overflow-hidden rounded-[3rem] border border-transparent">
                    <div className={`absolute inset-0 ${isDark ? "bg-[radial-gradient(circle_at_top_left,_rgba(167,199,173,0.16),_transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(212,163,139,0.14),_transparent_30%)]" : "bg-[radial-gradient(circle_at_top_left,_rgba(141,170,145,0.16),_transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(230,186,163,0.18),_transparent_30%)]"}`}></div>
                    <div className={`relative overflow-hidden rounded-[3rem] border p-8 md:p-10 lg:p-14 ${isDark ? "bg-bg-card/90" : "bg-[color:var(--color-surface-soft)]/80"}`} style={{ borderColor: "var(--color-border)" }}>
                        <div className="pointer-events-none absolute inset-0 opacity-40" style={{ backgroundImage: isDark ? "linear-gradient(to right, rgba(226,227,222,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(226,227,222,0.05) 1px, transparent 1px)" : "linear-gradient(to right, rgba(45,49,46,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(45,49,46,0.05) 1px, transparent 1px)", backgroundSize: "48px 48px" }}></div>
                        <div className="relative z-10 grid gap-8 lg:grid-cols-[1.25fr_0.75fr] lg:items-end">
                            <div className="space-y-8">
                                <div className="inline-flex items-center gap-3 rounded-full border border-primary/20 bg-primary/8 px-4 py-2 text-xs font-bold uppercase tracking-[0.22em] text-primary">
                                    <Sparkles className="h-4 w-4" />
                                    Customer support hub
                                </div>

                                <div className="max-w-3xl space-y-5">
                                    <h2 className="text-4xl font-bold tracking-tight text-text-main md:text-5xl lg:text-6xl">
                                        Find answers before your order becomes a support ticket.
                                    </h2>
                                    <p className="max-w-2xl text-sm font-medium leading-7 text-text-muted md:text-base">
                                        Search the most common delivery, billing, account, and product questions. The page is structured for quick scanning first, then deeper reading when you need specifics.
                                    </p>
                                </div>

                                <div className="relative max-w-2xl">
                                    <Search className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-text-muted" />
                                    <input
                                        type="text"
                                        placeholder="Search articles, topics, or questions..."
                                        className="w-full rounded-2xl border bg-bg-card py-4 pl-14 pr-5 text-sm font-medium text-text-main outline-none transition-all placeholder:text-text-muted focus:ring-2 focus:ring-primary/20"
                                        style={{ borderColor: "var(--color-border)" }}
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>

                                <div className="flex flex-wrap gap-3">
                                    {["Tracking", "Refunds", "Delivery time", "Security", "Order changes"].map((tag) => (
                                        <button
                                            key={tag}
                                            type="button"
                                            onClick={() => setSearchQuery(tag)}
                                            className="rounded-full border bg-bg-card px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-text-muted transition-colors hover:border-primary/40 hover:bg-primary/8 hover:text-primary"
                                            style={{ borderColor: "var(--color-border)" }}
                                        >
                                            {tag}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
                                <div className="rounded-[2rem] border bg-bg-card p-6" style={{ borderColor: "var(--color-border)" }}>
                                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Coverage</p>
                                    <p className="mt-3 text-4xl font-bold text-text-main">24/7</p>
                                    <p className="mt-2 text-sm leading-6 text-text-muted">Self-service support with quick article discovery.</p>
                                </div>
                                <div className="rounded-[2rem] border bg-bg-card p-6" style={{ borderColor: "var(--color-border)" }}>
                                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Popular topics</p>
                                    <p className="mt-3 text-4xl font-bold text-text-main">{knowledgeSections.length}</p>
                                    <p className="mt-2 text-sm leading-6 text-text-muted">Shipping, payments, orders, and account safety.</p>
                                </div>
                                <div className="rounded-[2rem] border border-primary/20 bg-primary/10 p-6">
                                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Need a person?</p>
                                    <Link to="/contact" className="mt-3 inline-flex items-center gap-2 text-lg font-bold text-text-main">
                                        Contact support
                                        <ArrowRight className="h-4 w-4" />
                                    </Link>
                                    <p className="mt-2 text-sm leading-6 text-text-muted">Escalate delivery, billing, or account issues directly.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="space-y-8">
                    <SectionHeader number={1} title="Browse By Topic" icon={BookOpen} />
                    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                        {knowledgeSections.map((section) => (
                            <article
                                key={section.title}
                                className="group relative overflow-hidden rounded-[2rem] border bg-bg-card p-6 transition-all duration-300 hover:-translate-y-1 hover:border-primary/25 hover:shadow-xl hover:shadow-primary/8"
                                style={{ borderColor: "var(--color-border)" }}
                            >
                                <div className={`absolute inset-x-0 top-0 h-24 bg-gradient-to-br ${section.accent}`}></div>
                                <div className="relative z-10 space-y-5">
                                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl border bg-primary/10 text-text-main" style={{ borderColor: "var(--color-border)" }}>
                                        <section.icon className="h-6 w-6" />
                                    </div>

                                    <div>
                                        <div className="flex items-center justify-between gap-4">
                                            <h3 className="text-lg font-bold text-text-main">{section.title}</h3>
                                            <span className="rounded-full bg-primary/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-primary">
                                                {section.count} articles
                                            </span>
                                        </div>
                                        <p className="mt-3 text-sm leading-6 text-text-muted">
                                            {section.description}
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        {section.topics.map((topic) => (
                                            <div
                                                key={topic}
                                                className="flex items-center justify-between rounded-2xl bg-primary/8 px-4 py-3 text-sm font-semibold text-text-main transition-colors group-hover:bg-primary/12"
                                            >
                                                <span>{topic}</span>
                                                <ArrowRight className="h-4 w-4 text-primary" />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                </section>

                <section className="space-y-8">
                    <SectionHeader number={2} title="Featured Answers" icon={HelpCircle} />
                    <div className="grid gap-8 lg:grid-cols-[0.88fr_1.12fr]">
                        <div className={`rounded-[2.5rem] border p-8 md:p-10 ${isDark ? "bg-bg-card" : "bg-[color:var(--color-surface-soft)]/85"}`} style={{ borderColor: "var(--color-border)" }}>
                            <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary">Fast path</p>
                            <h3 className="mt-4 text-3xl font-bold tracking-tight text-text-main">
                                Start with the questions customers open most.
                            </h3>
                            <p className="mt-4 text-sm leading-7 text-text-muted">
                                These answers cover the highest-volume issues across delivery, checkout, and order management. Expand one to read the details without leaving the page.
                            </p>

                            <div className="mt-8 grid gap-4 sm:grid-cols-2">
                                <div className="rounded-[1.75rem] border bg-bg-card p-5" style={{ borderColor: "var(--color-border)" }}>
                                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Search results</p>
                                    <p className="mt-3 text-3xl font-bold text-text-main">{filteredCount}</p>
                                    <p className="mt-2 text-sm text-text-muted">Questions match your current search.</p>
                                </div>
                                <div className="rounded-[1.75rem] border bg-bg-card p-5" style={{ borderColor: "var(--color-border)" }}>
                                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Support route</p>
                                    <div className="mt-3 inline-flex items-center gap-3 text-lg font-bold text-text-main">
                                        <MessageSquare className="h-5 w-5 text-primary" />
                                        Live assistance
                                    </div>
                                    <p className="mt-2 text-sm text-text-muted">Move to contact if the answer here is not enough.</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {featuredFaqs.map((faq, index) => {
                                const isOpen = openFaq === index;

                                return (
                                    <button
                                        key={faq.question}
                                        type="button"
                                        onClick={() => setOpenFaq(isOpen ? -1 : index)}
                                        className={`w-full rounded-[2rem] border bg-bg-card px-6 py-5 text-left transition-all duration-300 hover:border-primary/25 hover:shadow-lg hover:shadow-primary/8 ${isOpen ? "ring-2 ring-primary/20" : ""}`}
                                        style={{ borderColor: "var(--color-border)" }}
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div>
                                                <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Featured question</p>
                                                <h4 className="mt-3 text-xl font-bold leading-tight text-text-main md:text-2xl">
                                                    {faq.question}
                                                </h4>
                                            </div>
                                            <ChevronDown className={`mt-1 h-5 w-5 shrink-0 text-primary transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />
                                        </div>
                                        {isOpen && (
                                            <p className="mt-4 max-w-2xl text-sm leading-7 text-text-muted md:text-base">
                                                {faq.answer}
                                            </p>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </section>

                <section className="space-y-10">
                    <SectionHeader number={3} title="Knowledge Library" icon={HelpCircle} />
                    {filteredSections.length > 0 ? (
                        <div className="space-y-12">
                            {filteredSections.map((section) => (
                                <div key={section.category} className="space-y-6">
                                    <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                                        <div>
                                            <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Category</p>
                                            <h3 className="mt-2 text-2xl font-bold text-text-main">{section.category}</h3>
                                        </div>
                                        <p className="text-sm text-text-muted">
                                            {section.questions.length} article{section.questions.length > 1 ? "s" : ""} found
                                        </p>
                                    </div>

                                    <div className="grid gap-6 md:grid-cols-2">
                                        {section.questions.map((faq) => (
                                            <article
                                                key={faq.q}
                                                className="group rounded-[2rem] border bg-bg-card p-7 transition-all duration-300 hover:border-primary/25 hover:shadow-xl hover:shadow-primary/8"
                                                style={{ borderColor: "var(--color-border)" }}
                                            >
                                                <div className="flex items-start justify-between gap-4">
                                                    <h4 className="text-lg font-bold leading-7 text-text-main">{faq.q}</h4>
                                                    <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-primary transition-transform group-hover:translate-x-1" />
                                                </div>
                                                <p className="mt-4 text-sm leading-7 text-text-muted">
                                                    {faq.a}
                                                </p>
                                            </article>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className={`rounded-[2.5rem] border p-10 text-center ${isDark ? "bg-bg-card" : "bg-[color:var(--color-surface-soft)]/85"}`} style={{ borderColor: "var(--color-border)" }}>
                            <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary">No matches</p>
                            <h3 className="mt-4 text-3xl font-bold text-text-main">No articles matched that search.</h3>
                            <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-text-muted">
                                Try a broader keyword like tracking, refund, delivery, or account. If the issue is specific, contact support directly instead of guessing.
                            </p>
                        </div>
                    )}
                </section>

                <section>
                    <div className={`rounded-[2.5rem] border p-8 md:p-10 lg:p-12 ${isDark ? "bg-[linear-gradient(135deg,#242723_0%,#20231F_55%,#1A1C19_100%)]" : "bg-[linear-gradient(135deg,#F6EFE7_0%,#FFFFFF_55%,#FCF9F5_100%)]"}`} style={{ borderColor: "var(--color-border)" }}>
                        <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
                            <div className="max-w-2xl">
                                <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary">Escalation path</p>
                                <h3 className="mt-4 text-3xl font-bold tracking-tight text-text-main md:text-4xl">
                                    Still need help with your order, account, or refund?
                                </h3>
                                <p className="mt-4 text-sm leading-7 text-text-muted md:text-base">
                                    Use the contact page for issues that need account access, manual order review, or a billing investigation. The help center is for quick answers; support handles exceptions.
                                </p>
                            </div>

                            <div className="flex flex-col gap-4 sm:flex-row">
                                <Link
                                    to="/contact"
                                    className="inline-flex items-center justify-center gap-3 rounded-2xl bg-text-main px-7 py-4 text-sm font-bold text-white transition-all hover:bg-primary"
                                >
                                    Contact support
                                    <ArrowRight className="h-4 w-4" />
                                </Link>
                                <button
                                    type="button"
                                    onClick={() => setSearchQuery("")}
                                    className="rounded-2xl border bg-bg-card px-7 py-4 text-sm font-bold text-text-main transition-colors hover:border-primary/25 hover:bg-primary/8"
                                    style={{ borderColor: "var(--color-border)" }}
                                >
                                    Reset search
                                </button>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </PageLayout>
    );
}
