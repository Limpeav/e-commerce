import { Shield, Lock, Eye, Database, Mail } from 'lucide-react';
import PageLayout from '../../components/ui/PageLayout';
import SectionHeader from '../../components/ui/SectionHeader';
import { useLanguage } from '../../context/useLanguage';

const sections = [
    {
        number: 1,
        title: "Information We Collect",
        icon: Database,
        content: (
            <div className="grid gap-5 sm:grid-cols-2">
                <div className="rounded-2xl border bg-bg-card p-5 sm:p-6" style={{ borderColor: "var(--color-border)" }}>
                    <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Personal Data</h3>
                    <ul className="mt-4 space-y-2.5">
                        {['Name & Contact Details', 'Email Address', 'Shipping Address', 'Payment Information'].map((item) => (
                            <li key={item} className="flex items-center gap-3">
                                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary/40" />
                                <span className="text-sm font-medium text-text-muted">{item}</span>
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="rounded-2xl border bg-bg-card p-5 sm:p-6" style={{ borderColor: "var(--color-border)" }}>
                    <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Technical Data</h3>
                    <ul className="mt-4 space-y-2.5">
                        {['IP Address', 'Browser Information', 'Device Type', 'Usage Patterns'].map((item) => (
                            <li key={item} className="flex items-center gap-3">
                                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary/40" />
                                <span className="text-sm font-medium text-text-muted">{item}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        ),
    },
    {
        number: 2,
        title: "How We Use Your Information",
        icon: Eye,
        content: (
            <div className="rounded-2xl border bg-bg-card p-5 sm:p-6" style={{ borderColor: "var(--color-border)" }}>
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {[
                        { label: 'Order Processing', desc: 'Fulfill and deliver your purchases' },
                        { label: 'Customer Support', desc: 'Assist via email and chat channels' },
                        { label: 'Personalization', desc: 'Tailor content and recommendations' },
                        { label: 'Order Updates', desc: 'Send shipping and status notifications' },
                        { label: 'Fraud Prevention', desc: 'Detect and prevent unauthorized activity' },
                        { label: 'Analytics', desc: 'Improve our platform and services' },
                    ].map((item) => (
                        <div key={item.label} className="group cursor-default">
                            <p className="text-sm font-bold text-text-main group-hover:text-primary transition-colors">{item.label}</p>
                            <p className="mt-0.5 text-sm text-text-muted">{item.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        ),
    },
    {
        number: 3,
        title: "Data Protection",
        icon: Lock,
        content: (
            <div className="grid gap-5 sm:grid-cols-2">
                <div className="rounded-2xl border bg-bg-card p-5 sm:p-6" style={{ borderColor: "var(--color-border)" }}>
                    <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Security Measures</h3>
                    <ul className="mt-4 space-y-2.5">
                        {['SSL / TLS Encryption', 'Secure Payment Gateway', 'Regular Security Audits', 'Limited Data Access'].map((item) => (
                            <li key={item} className="flex items-center gap-3">
                                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-green-500" />
                                <span className="text-sm font-medium text-text-muted">{item}</span>
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="rounded-2xl border bg-bg-card p-5 sm:p-6" style={{ borderColor: "var(--color-border)" }}>
                    <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Retention Policy</h3>
                    <p className="mt-4 text-sm leading-6 text-text-muted">
                        We retain your personal data only as long as necessary to fulfill the purposes outlined in this policy, or as required by law. Once no longer needed, your data is securely deleted or anonymized.
                    </p>
                </div>
            </div>
        ),
    },
    {
        number: 4,
        title: "Your Rights",
        icon: Shield,
        content: (
            <div className="rounded-2xl border bg-bg-card p-5 sm:p-6" style={{ borderColor: "var(--color-border)" }}>
                <div className="flex flex-wrap gap-2">
                    {['Right to Access', 'Right to Rectification', 'Right to Erasure', 'Right to Portability', 'Right to Restrict'].map((tag) => (
                        <span key={tag} className="rounded-full border bg-primary/8 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-primary sm:text-xs" style={{ borderColor: "var(--color-border)" }}>
                            {tag}
                        </span>
                    ))}
                </div>
                <p className="mt-4 text-sm leading-6 text-text-muted">
                    You have the right to access, update, or delete your personal data at any time. To exercise any of these rights, please contact us using the information below.
                </p>
            </div>
        ),
    },
];

export default function Privacy() {
    const { language, t } = useLanguage();

    return (
        <PageLayout
            title="Privacy Policy"
            subtitle="How we collect, use, and protect your data"
            badge={`${t("Last Updated")}: ${new Date().toLocaleDateString(language === "kh" ? "km-KH" : undefined, { day: 'numeric', month: 'short', year: 'numeric' })}`}
            icon={Shield}
            badgeColor="green"
            maxWidth="5xl"
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
                    <SectionHeader number={5} title="Contact Us" icon={Mail} />
                    <div className="rounded-2xl border bg-bg-card p-5 sm:p-6" style={{ borderColor: "var(--color-border)" }}>
                        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <p className="text-sm font-medium text-text-muted">
                                    If you have any questions about this Privacy Policy, please reach out to us:
                                </p>
                                <p className="mt-2 text-sm font-bold text-text-main">support@applac.com</p>
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
