import {
  Baby,
  Gift,
  Milk,
  ShieldCheck,
  Shirt,
  Truck,
} from "lucide-react";
import { useDarkMode } from "../../hooks";

const CATEGORY_CARDS = [
  {
    label: "Diapers",
    icon: Baby,
    keywords: ["diaper", "nappy", "pants"],
    tone: "from-blue-soft/85 to-white",
  },
  {
    label: "Milk & Feeding",
    icon: Milk,
    keywords: ["milk", "feeding", "bottle", "formula"],
    tone: "from-blue-soft/85 to-white",
  },
  {
    label: "Clothing",
    icon: Shirt,
    keywords: ["clothing", "shirt", "dress", "outfit"],
    tone: "from-yellow-soft/80 to-white",
  },
  {
    label: "Toys",
    icon: Gift,
    keywords: ["toy", "play"],
    tone: "from-mint-soft/90 to-white",
  },
  {
    label: "Baby Care",
    icon: ShieldCheck,
    keywords: ["care", "shampoo", "soap", "lotion"],
    tone: "from-blue-soft/65 to-white",
  },
  {
    label: "Strollers",
    icon: Truck,
    keywords: ["stroller", "travel", "carrier"],
    tone: "from-secondary-light/60 to-white",
  },
];

const findCategoryMatch = (categories, keywords) => {
  return (
    categories.find((category) => {
      const normalized = category.toLowerCase();
      return keywords.some((keyword) => normalized.includes(keyword));
    }) || ""
  );
};

const getProductCount = (products, keywords) => {
  return products.filter((product) => {
    const source = `${product.category || ""} ${product.name || ""} ${product.title || ""} ${product.type || ""}`
      .toLowerCase()
      .trim();
    return keywords.some((keyword) => source.includes(keyword));
  }).length;
};

export default function CategoryQuickAccess({ categories, products, onSelectCategory }) {
  const [isDark] = useDarkMode();

  return (
    <section className="px-4 md:px-6" aria-label="Quick category access">
      <div className={`max-w-7xl mx-auto rounded-3xl border p-4 md:p-5 ${isDark ? "border-slate-800 bg-slate-900 shadow-[0_22px_60px_-30px_rgba(2,6,23,0.9)]" : "border-primary/12 bg-white shadow-[0_10px_22px_rgba(116,178,226,0.12)]"}`}>
        <div className="mb-3">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Quick Access</p>
          <h2 className="mt-1 text-2xl font-bold text-text-main md:text-3xl">Shop by Category</h2>
        </div>

        <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-6">
          {CATEGORY_CARDS.map((card) => {
            const Icon = card.icon;
            const matchedCategory = findCategoryMatch(categories, card.keywords);
            const count = getProductCount(products, card.keywords);

            return (
              <button
                key={card.label}
                type="button"
                onClick={() => onSelectCategory({ matchedCategory, fallbackQuery: card.label })}
                className={`group rounded-2xl border p-2.5 text-left shadow-sm transition-transform hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary md:p-3 ${isDark ? "border-slate-700 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800" : `border-primary/12 bg-gradient-to-br ${card.tone}`}`}
              >
                <div className={`mb-1.5 inline-flex h-8 w-8 items-center justify-center rounded-lg text-primary md:h-9 md:w-9 ${isDark ? "bg-slate-800" : "bg-white"}`}>
                  <Icon className="h-4 w-4" />
                </div>

                <p className="text-[13px] font-semibold text-text-main md:text-sm">{card.label}</p>
                <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-primary">
                  {count > 0 ? `${count} items` : "Browse now"}
                </p>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
