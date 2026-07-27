import { FileText, AlertCircle, Users, Package, Truck, Shield, Mail } from 'lucide-react';
import PageLayout from '../../components/ui/PageLayout';
import SectionHeader from '../../components/ui/SectionHeader';
import { useLanguage } from '../../context/useLanguage';

const sections = [
    {
        number: 1,
        title: "Acceptance of Terms",
        icon: FileText,
        content: (
            <div className="rounded-2xl border bg-bg-card p-5 sm:p-6" style={{ borderColor: "var(--color-border)" }}>
                <p className="text-sm leading-6 text-text-muted">
                    By accessing and using our platform, you accept and agree to be bound by these Terms of Service
                    and our Privacy Policy. If you do not agree to these terms, please do not use our services.
                </p>
            </div>
        ),
    },
    {
        number: 2,
        title: "Products & Services",
        icon: Package,
        content: (
            <div className="grid gap-5 sm:grid-cols-2">
                <div className="rounded-2xl border bg-bg-card p-5 sm:p-6" style={{ borderColor: "var(--color-border)" }}>
                    <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Product Information</h3>
                    <p className="mt-3 text-sm leading-6 text-text-muted">
                        We strive for accuracy in product descriptions, pricing, and availability.
                        However, we reserve the right to correct any errors or omissions and to update information at any time.
                    </p>
                </div>
                <div className="rounded-2xl border bg-bg-card p-5 sm:p-6" style={{ borderColor: "var(--color-border)" }}>
                    <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Pricing & Availability</h3>
                    <p className="mt-3 text-sm leading-6 text-text-muted">
                        Prices are subject to change without notice. We reserve the right to modify or discontinue
                        any product without liability at any time.
                    </p>
                </div>
            </div>
        ),
    },
    {
        number: 3,
        title: "User Accounts",
        icon: Users,
        content: (
            <div className="grid gap-5 sm:grid-cols-2">
                <div className="rounded-2xl border bg-bg-card p-5 sm:p-6" style={{ borderColor: "var(--color-border)" }}>
                    <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Account Responsibilities</h3>
                    <ul className="mt-4 space-y-2.5">
                        {[
                            'Provide accurate and complete information',
                            'Maintain the confidentiality of your password',
                            'You are responsible for all activities under your account',
                            'Notify us immediately of any security breach',
                        ].map((item) => (
                            <li key={item} className="flex items-start gap-3">
                                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/40" />
                                <span className="text-sm text-text-muted">{item}</span>
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="rounded-2xl border bg-bg-card p-5 sm:p-6" style={{ borderColor: "var(--color-border)" }}>
                    <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Termination</h3>
                    <p className="mt-3 text-sm leading-6 text-text-muted">
                        We reserve the right to suspend or terminate your account at any time for violation of
                        these terms or unauthorized activity, without prior notice.
                    </p>
                </div>
            </div>
        ),
    },
    {
        number: 4,
        title: "Orders & Payment",
        icon: Package,
        content: (
            <div className="grid gap-5 sm:grid-cols-2">
                <div className="rounded-2xl border bg-bg-card p-5 sm:p-6" style={{ borderColor: "var(--color-border)" }}>
                    <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Order Confirmation</h3>
                    <p className="mt-3 text-sm leading-6 text-text-muted">
                        Receipt of an order confirmation does not constitute acceptance. We reserve the right to
                        cancel or refuse any order at our discretion.
                    </p>
                </div>
                <div className="rounded-2xl border bg-bg-card p-5 sm:p-6" style={{ borderColor: "var(--color-border)" }}>
                    <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Payment Terms</h3>
                    <p className="mt-3 text-sm leading-6 text-text-muted">
                        All payments are processed securely. Prices are listed in the applicable currency and
                        include applicable taxes. Payment is due at the time of purchase.
                    </p>
                </div>
            </div>
        ),
    },
    {
        number: 5,
        title: "Shipping & Warranty Support",
        icon: Truck,
        content: (
            <div className="grid gap-5 sm:grid-cols-2">
                <div className="rounded-2xl border bg-bg-card p-5 sm:p-6" style={{ borderColor: "var(--color-border)" }}>
                    <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Delivery</h3>
                    <p className="mt-3 text-sm leading-6 text-text-muted">
                        Standard delivery typically takes 3-5 business days. Express options may be available.
                        We are not responsible for delays caused by the carrier or unforeseen circumstances.
                    </p>
                </div>
                <div className="rounded-2xl border bg-bg-card p-5 sm:p-6" style={{ borderColor: "var(--color-border)" }}>
                    <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Warranty Support</h3>
                    <p className="mt-3 text-sm leading-6 text-text-muted">
                        Delivered orders can be reviewed within the product warranty period when one is available.
                        Products without warranty coverage use a 7-day support window after delivery for product issues.
                    </p>
                </div>
            </div>
        ),
    },
    {
        number: 6,
        title: "Intellectual Property",
        icon: Shield,
        content: (
            <div className="rounded-2xl border bg-bg-card p-5 sm:p-6" style={{ borderColor: "var(--color-border)" }}>
                <p className="text-sm leading-6 text-text-muted">
                    All content on this platform — including text, images, logos, and designs — is the property of
                    our company and is protected by applicable intellectual property laws. Unauthorized use,
                    reproduction, or distribution is strictly prohibited.
                </p>
            </div>
        ),
    },
    {
        number: 7,
        title: "Limitation of Liability",
        icon: AlertCircle,
        content: (
            <div className="rounded-2xl border bg-[color:var(--color-surface-soft)] p-5 sm:p-6" style={{ borderColor: "var(--color-border)" }}>
                <div className="flex items-start gap-3">
                    <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                    <div>
                        <h3 className="text-sm font-bold text-text-main">Liability Cap</h3>
                        <p className="mt-2 text-sm leading-6 text-text-muted">
                            Our liability is limited to the maximum extent permitted by law. We are not liable for
                            indirect, incidental, or consequential damages arising from your use of our services.
                            In any case, our total liability is capped at the purchase price of the product in question.
                        </p>
                    </div>
                </div>
            </div>
        ),
    },
];

export default function Terms() {
    const { language, t } = useLanguage();

    return (
        <PageLayout
            title="Terms of Service"
            subtitle="The rules and guidelines governing your use of our platform"
            badge={`${t("Version")} 2.4 // ${new Date().toLocaleDateString(language === "kh" ? "km-KH" : undefined, { month: 'short', year: 'numeric' })}`}
            icon={FileText}
            maxWidth="5xl"
            seoTitle="Terms of Service"
            seoDescription="The rules and guidelines governing your use of our platform"
            canonical="/terms"
        >
            <div className="space-y-12 md:space-y-16">
                {sections.map((section) => (
                    <section key={section.number}>
                        <SectionHeader number={section.number} title={section.title} icon={section.icon} />
                        {section.content}
                    </section>
                ))}

                {/* Contact */}
                <section>
                    <SectionHeader number={8} title="Contact Us" icon={Mail} />
                    <div className="rounded-2xl border bg-bg-card p-5 sm:p-6" style={{ borderColor: "var(--color-border)" }}>
                        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <p className="text-sm font-medium text-text-muted">
                                    For questions about these terms, please reach out to us:
                                </p>
                                <p className="mt-2 text-sm font-bold text-text-main">pichvisal.theam@gmail.com</p>
                            </div>
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl border bg-primary/10" style={{ borderColor: "var(--color-border)" }}>
                                <Mail className="h-5 w-5 text-primary" />
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </PageLayout>
    );
}
