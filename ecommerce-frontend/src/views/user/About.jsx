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

const stats = [
    { label: "Daily Products", value: "4.2K+" },
    { label: "Value Delivered", value: "$10M+" },
    { label: "Happy Customers", value: "50K+" },
    { label: "Trusted Brands", value: "100+" },
];

const values = [
    {
        icon: ShieldCheck,
        title: "Secure Technology",
        description: "Your security is our priority. We use state-of-the-art encryption to ensure your data and transactions are always safe.",
    },
    {
        icon: Award,
        title: "Quality Assurance",
        description: "We handpick every item in our collection. Only the best products make it to our store shelves with certified verification.",
    },
    {
        icon: Smile,
        title: "Customer Support",
        description: "Our dedicated support team is here to help you around the clock. Your satisfaction is 100% guaranteed.",
    },
];

const team = [
    { name: "Sophea Chea", role: "CEO & Founder" },
    { name: "Vannak Som", role: "Head of Operations" },
    { name: "Borey Khiev", role: "Tech Lead" },
    { name: "Ratanak Meas", role: "Marketing Director" },
];

const milestones = [
    { year: "2019", label: "Founded", detail: "Launched with a vision to transform online shopping" },
    { year: "2021", label: "10K Customers", detail: "Reached 10,000 happy customers across Cambodia" },
    { year: "2023", label: "Regional Expansion", detail: "Expanded delivery network to 5 provinces" },
    { year: "2025", label: "50K Milestone", detail: "Served 50,000 customers with 100+ brand partners" },
];

export default function About() {
    return (
        <PageLayout
            title="About Us"
            subtitle="Redefining the online shopping experience since 2019"
            badge="Our Story"
            icon={Sparkles}
            badgeColor="primary"
            maxWidth="7xl"
        >
            <div className="space-y-16 md:space-y-20 lg:space-y-24">

                {/* Mission & Vision */}
                <section>
                    <div className="grid gap-8 md:grid-cols-2 md:gap-12 lg:gap-16">
                        <div className="space-y-8 md:space-y-10">
                            <div>
                                <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">Our Mission</span>
                                <h2 className="mt-3 text-2xl font-bold tracking-tight text-text-main sm:text-3xl md:text-4xl">Curated Quality</h2>
                                <p className="mt-4 text-sm leading-6 text-text-muted sm:leading-7">
                                    To revolutionize your online shopping experience by curating exceptional products that
                                    enhance your lifestyle. We're committed to making premium quality accessible while
                                    maintaining the highest standards of customer service and satisfaction.
                                </p>
                            </div>
                            <div>
                                <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-secondary">Our Vision</span>
                                <h2 className="mt-3 text-2xl font-bold tracking-tight text-text-main sm:text-3xl md:text-4xl">Modern Essentials</h2>
                                <p className="mt-4 text-sm leading-6 text-text-muted sm:leading-7">
                                    To become the world's most trusted online marketplace where quality meets convenience.
                                    We envision a future where every customer can shop with confidence, knowing they're getting
                                    the best products at fair prices with exceptional service.
                                </p>
                            </div>
                            <div className="flex flex-wrap gap-6 pt-2">
                                {[
                                    { icon: Target, label: "Customer First", sub: "Our top priority" },
                                    { icon: Globe, label: "Global Reach", sub: "Delivering everywhere" },
                                ].map((item) => (
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
                                    <p className="mt-2 text-xs font-bold uppercase tracking-[0.2em] text-text-muted">Years of Growth</p>
                                    <p className="mt-6 max-w-xs text-sm leading-6 text-text-muted">
                                        Building trust and delivering quality to thousands of customers across Cambodia.
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
                        <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">Our Advantages</span>
                        <h2 className="mt-3 text-2xl font-bold tracking-tight text-text-main sm:text-3xl md:text-4xl">Why Choose Us</h2>
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
                        <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">Our Journey</span>
                        <h2 className="mt-3 text-2xl font-bold tracking-tight text-text-main sm:text-3xl md:text-4xl">Milestones</h2>
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
                        <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">Leadership</span>
                        <h2 className="mt-3 text-2xl font-bold tracking-tight text-text-main sm:text-3xl md:text-4xl">Our Team</h2>
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
