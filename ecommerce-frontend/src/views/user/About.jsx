import React from "react";
import {
    Users,
    Target,
    Heart,
    Globe,
    Award,
    ShieldCheck,
    TrendingUp,
    Smile,
    Sparkles
} from "lucide-react";
import PageLayout from "../../components/ui/PageLayout";
import { useLanguage } from "../../context/useLanguage";

export default function About() {
    const { t } = useLanguage();

    const stats = [
        { label: t("about.stats.dailyProducts"), value: "4.2K+" },
        { label: t("about.stats.valueDelivered"), value: "$10M+" },
        { label: t("about.stats.happyCustomers"), value: "50K+" },
        { label: t("about.stats.trustedBrands"), value: "100+" },
    ];

    const values = [
        {
            icon: ShieldCheck,
            title: t("about.values.secureTechnology.title"),
            description: t("about.values.secureTechnology.description"),
        },
        {
            icon: Award,
            title: t("about.values.qualityAssurance.title"),
            description: t("about.values.qualityAssurance.description"),
        },
        {
            icon: Smile,
            title: t("about.values.customerSupport.title"),
            description: t("about.values.customerSupport.description"),
        },
    ];

    const team = [
        { name: "Sophea Chea", role: t("about.team.ceoFounder") },
        { name: "Vannak Som", role: t("about.team.headOfOperations") },
        { name: "Borey Khiev", role: t("about.team.techLead") },
        { name: "Ratanak Meas", role: t("about.team.marketingDirector") },
    ];

    const milestones = [
        { year: "2019", label: t("about.milestones.founded.label"), detail: t("about.milestones.founded.detail") },
        { year: "2021", label: t("about.milestones.customers10k.label"), detail: t("about.milestones.customers10k.detail") },
        { year: "2023", label: t("about.milestones.regionalExpansion.label"), detail: t("about.milestones.regionalExpansion.detail") },
        { year: "2025", label: t("about.milestones.milestone50k.label"), detail: t("about.milestones.milestone50k.detail") },
    ];

    const missionHighlights = [
        { icon: Target, label: t("about.customerFirst"), sub: t("about.customerFirstSub") },
        { icon: Globe, label: t("about.globalReach"), sub: t("about.globalReachSub") },
    ];

    return (
        <PageLayout
            title={t("about.title")}
            subtitle={t("about.subtitle")}
            badge={t("about.badge")}
            icon={Sparkles}
            badgeColor="primary"
            maxWidth="7xl"
            seoTitle={t("about.title")}
            seoDescription={t("about.subtitle")}
            canonical="/about"
        >
            <div className="space-y-16 md:space-y-20 lg:space-y-24">

                {/* Mission & Vision */}
                <section>
                    <div className="grid gap-8 md:grid-cols-2 md:gap-12 lg:gap-16">
                        <div className="space-y-8 md:space-y-10">
                            <div>
                                <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">{t("about.mission")}</span>
                                <h2 className="mt-3 text-2xl font-bold tracking-tight text-text-main sm:text-3xl md:text-4xl">{t("about.curatedQuality")}</h2>
                                <p className="mt-4 text-sm leading-6 text-text-muted sm:leading-7">
                                    {t("about.missionText")}
                                </p>
                            </div>
                            <div>
                                <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-secondary">{t("about.vision")}</span>
                                <h2 className="mt-3 text-2xl font-bold tracking-tight text-text-main sm:text-3xl md:text-4xl">{t("about.modernEssentials")}</h2>
                                <p className="mt-4 text-sm leading-6 text-text-muted sm:leading-7">
                                    {t("about.visionText")}
                                </p>
                            </div>
                            <div className="flex flex-wrap gap-6 pt-2">
                                {missionHighlights.map((item) => (
                                    <div key={item.label} className="flex items-center gap-4">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-xl border bg-primary/10" style={{ borderColor: "var(--color-border)" }}>
                                            <item.icon className="h-5 w-5 text-primary" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-text-main">{item.label}</p>
                                            <p className="text-xs font-medium text-text-muted">{item.sub}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="relative">
                            <div className="aspect-square rounded-[2rem] border bg-bg-card overflow-hidden sm:rounded-[2.5rem] md:rounded-[3rem]" style={{ borderColor: "var(--color-border)" }}>
                                <div className="flex h-full flex-col items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10 p-8 text-center">
                                    <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl border bg-primary/10" style={{ borderColor: "var(--color-border)" }}>
                                        <Award className="h-8 w-8 text-primary" />
                                    </div>
                                    <p className="text-5xl font-bold text-text-main sm:text-6xl md:text-7xl">05+</p>
                                    <p className="mt-2 text-xs font-bold uppercase tracking-[0.2em] text-text-muted">{t("about.yearsOfGrowth")}</p>
                                    <p className="mt-6 max-w-xs text-sm leading-6 text-text-muted">
                                        {t("about.growthText")}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Stats */}
                <section>
                    <div className="rounded-2xl border bg-bg-card p-6 sm:p-8 md:p-10" style={{ borderColor: "var(--color-border)" }}>
                        <div className="grid grid-cols-2 gap-8 md:grid-cols-4 md:gap-12">
                            {stats.map((stat) => (
                                <div key={stat.label} className="text-center">
                                    <p className="text-3xl font-bold text-text-main sm:text-4xl md:text-5xl">{stat.value}</p>
                                    <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.16em] text-text-muted sm:text-xs">{stat.label}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Values */}
                <section>
                    <div className="mb-8 max-w-xl md:mb-10">
                        <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">{t("about.advantages")}</span>
                        <h2 className="mt-3 text-2xl font-bold tracking-tight text-text-main sm:text-3xl md:text-4xl">{t("about.whyChooseUs")}</h2>
                    </div>
                    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                        {values.map((item) => (
                            <article
                                key={item.title}
                                className="group rounded-2xl border bg-bg-card p-6 transition-all duration-300 hover:-translate-y-1 hover:border-primary/25 hover:shadow-xl hover:shadow-primary/8 sm:p-8"
                                style={{ borderColor: "var(--color-border)" }}
                            >
                                <div className="flex h-12 w-12 items-center justify-center rounded-xl border bg-primary/10 text-text-main transition-all group-hover:bg-primary group-hover:text-white" style={{ borderColor: "var(--color-border)" }}>
                                    <item.icon className="h-5 w-5 transition-colors" />
                                </div>
                                <h3 className="mt-5 text-lg font-bold text-text-main">{item.title}</h3>
                                <p className="mt-3 text-sm leading-6 text-text-muted">{item.description}</p>
                            </article>
                        ))}
                    </div>
                </section>

                {/* Timeline */}
                <section>
                    <div className="mb-8 max-w-xl md:mb-10">
                        <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">{t("about.journey")}</span>
                        <h2 className="mt-3 text-2xl font-bold tracking-tight text-text-main sm:text-3xl md:text-4xl">{t("about.milestonesTitle")}</h2>
                    </div>
                    <div className="rounded-2xl border bg-bg-card p-6 sm:p-8 md:p-10" style={{ borderColor: "var(--color-border)" }}>
                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                            {milestones.map((m, i) => (
                                <div key={m.year} className="relative pl-6 border-l-2 border-primary/20">
                                    <div className="absolute left-[-5px] top-0 h-2 w-2 rounded-full bg-primary" />
                                    <p className="text-2xl font-bold text-primary sm:text-3xl">{m.year}</p>
                                    <p className="mt-1 text-sm font-bold text-text-main">{m.label}</p>
                                    <p className="mt-1 text-xs leading-5 text-text-muted">{m.detail}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Team */}
                <section>
                    <div className="mb-8 text-center md:mb-10">
                        <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">{t("about.leadership")}</span>
                        <h2 className="mt-3 text-2xl font-bold tracking-tight text-text-main sm:text-3xl md:text-4xl">{t("about.teamTitle")}</h2>
                    </div>
                    <div className="grid grid-cols-2 gap-5 md:grid-cols-4">
                        {team.map((member) => (
                            <div key={member.name} className="group rounded-2xl border bg-bg-card p-6 text-center transition-all duration-300 hover:-translate-y-1 hover:border-primary/25 hover:shadow-xl hover:shadow-primary/8" style={{ borderColor: "var(--color-border)" }}>
                                <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl border bg-primary/10 sm:h-24 sm:w-24" style={{ borderColor: "var(--color-border)" }}>
                                    <Users className="h-8 w-8 text-primary sm:h-10 sm:w-10" />
                                </div>
                                <h4 className="text-sm font-bold text-text-main sm:text-base">{member.name}</h4>
                                <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.14em] text-primary/60 sm:text-xs">{member.role}</p>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </PageLayout>
    );
}
