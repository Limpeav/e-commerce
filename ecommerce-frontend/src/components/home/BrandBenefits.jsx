import { Award, RotateCcw, ShieldCheck, Truck } from "lucide-react";

const benefits = [
  {
    icon: ShieldCheck,
    title: "Safe Products",
    description: "Carefully selected essentials with baby-first safety standards.",
    tone: "from-blue-soft/65 to-white",
  },
  {
    icon: Truck,
    title: "Fast Delivery",
    description: "Quick shipping for urgent parent needs and daily essentials.",
    tone: "from-mint-soft/70 to-white",
  },
  {
    icon: RotateCcw,
    title: "Easy Return",
    description: "Simple 30-day return policy with clear steps and support.",
    tone: "from-blue-soft/62 to-white",
  },
  {
    icon: Award,
    title: "Trusted Brands",
    description: "Popular brands loved by families and verified by our team.",
    tone: "from-yellow-soft/70 to-white",
  },
];

export default function BrandBenefits() {
  return (
    <section className="px-4 md:px-6">
      <div className="mx-auto max-w-7xl rounded-3xl border border-primary/12 bg-white p-4 shadow-[0_10px_22px_rgba(116,178,226,0.12)] md:p-5">
        <div className="mb-4">
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.14em] text-primary">Trust & Safety</p>
          <h3 className="text-2xl font-bold text-text-main md:text-3xl">Why parents feel confident shopping here</h3>
        </div>

        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4 md:gap-3">
          {benefits.map((item) => (
            <article
              key={item.title}
              className={`rounded-2xl border border-primary/12 bg-gradient-to-br ${item.tone} p-3.5 shadow-sm md:p-4`}
            >
              <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-white text-primary">
                <item.icon className="h-4.5 w-4.5" />
              </div>
              <h4 className="text-base font-semibold text-text-main">{item.title}</h4>
              <p className="mt-1 line-clamp-2 text-xs text-text-muted">{item.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
