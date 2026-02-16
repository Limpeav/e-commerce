import { Quote, Star } from "lucide-react";

const REVIEWS = [
  {
    name: "Emily R.",
    role: "Mom of 1",
    quote:
      "The diaper and skincare quality is excellent. I can find what I need quickly even while holding my baby.",
    rating: 5,
    initials: "ER",
  },
  {
    name: "Daniel & Mia",
    role: "Parents of twins",
    quote:
      "Fast delivery and easy returns make this store stress-free. Product details are clear and trustworthy.",
    rating: 5,
    initials: "DM",
  },
  {
    name: "Sarah K.",
    role: "New parent",
    quote:
      "Warm design, simple checkout, and very helpful filtering. It feels made for busy parents like me.",
    rating: 4,
    initials: "SK",
  },
];

export default function ParentReviews() {
  return (
    <section className="px-4 md:px-6" aria-label="Customer reviews">
      <div className="max-w-7xl mx-auto rounded-3xl border border-primary/12 bg-white p-4 shadow-[0_10px_22px_rgba(116,178,226,0.12)] md:p-5">
        <div className="mb-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Parent Reviews</p>
          <h2 className="mt-1 text-2xl font-bold text-text-main md:text-3xl">Trusted by families every day</h2>
        </div>

        <div className="grid grid-cols-1 gap-2.5 md:grid-cols-3 md:gap-3">
          {REVIEWS.map((review) => (
            <article key={review.name} className="rounded-2xl border border-primary/12 bg-gradient-to-br from-white to-blue-soft/20 p-3.5 shadow-sm">
              <div className="mb-2.5 flex items-center justify-between">
                <div className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 text-sm font-bold text-primary">
                  {review.initials}
                </div>
                <Quote className="h-4.5 w-4.5 text-primary/70" />
              </div>

              <p className="line-clamp-3 text-xs leading-relaxed text-text-muted">{review.quote}</p>

              <div className="mt-3 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-text-main md:text-sm">{review.name}</p>
                  <p className="text-xs text-text-muted">{review.role}</p>
                </div>
                <div className="inline-flex items-center gap-0.5">
                  {Array.from({ length: 5 }, (_, index) => (
                    <Star
                      key={`${review.name}-${index}`}
                      className={`h-3.5 w-3.5 ${index < review.rating ? "fill-secondary text-secondary" : "text-primary/25"}`}
                    />
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
