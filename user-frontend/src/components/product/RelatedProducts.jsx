import React, { useMemo } from 'react';
import { useProducts } from '../../hooks/useProducts';
import { useWishlist } from '../../context/useWishlist';
import { useCart } from '../../context/useCart';
import { useAuth } from '../../context/useAuth';
import ProductCard from './ProductCard';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { useDarkMode } from '../../hooks';
import { useLanguage } from '../../context/useLanguage';
import { normalizeProductCategory } from '../../constants/productCategories';

import { motion as Motion } from 'framer-motion';

const PRODUCTS_PER_ROW = 8;
const MAX_RELATED_PRODUCTS = PRODUCTS_PER_ROW * 2;

const chunkProducts = (products = [], chunkSize = PRODUCTS_PER_ROW) => {
    const rows = [];

    for (let index = 0; index < products.length; index += chunkSize) {
        rows.push(products.slice(index, index + chunkSize));
    }

    return rows;
};

const RelatedProductRow = ({
    rowId,
    products,
    currentProductId,
    addToCart,
    toggleWishlist,
    isInWishlist,
    user,
    isDark,
    title,
}) => {
    const scrollRef = React.useRef(null);
    const [canScrollPrev, setCanScrollPrev] = React.useState(false);
    const [canScrollNext, setCanScrollNext] = React.useState(false);

    const updateScrollState = React.useCallback(() => {
        const container = scrollRef.current;
        if (!container) return;

        const remainingScroll = container.scrollWidth - container.clientWidth - container.scrollLeft;
        setCanScrollPrev(container.scrollLeft > 4);
        setCanScrollNext(remainingScroll > 4);
    }, []);

    React.useEffect(() => {
        updateScrollState();
        window.addEventListener("resize", updateScrollState);

        return () => {
            window.removeEventListener("resize", updateScrollState);
        };
    }, [products.length, updateScrollState]);

    const scrollProducts = (direction) => {
        const container = scrollRef.current;
        if (!container) return;

        const firstCard = container.querySelector("[data-product-card]");
        const styles = window.getComputedStyle(container);
        const gap = Number.parseFloat(styles.columnGap || styles.gap || "0") || 0;
        const cardWidth = firstCard?.getBoundingClientRect().width || container.clientWidth;
        const visibleCards = window.matchMedia("(max-width: 639px)").matches ? 2 : 1;

        container.scrollBy({
            left: direction === "next" ? (cardWidth + gap) * visibleCards : -(cardWidth + gap) * visibleCards,
            behavior: "smooth",
        });
    };

    return (
        <div className="relative">
            {canScrollPrev && (
                <button
                    type="button"
                    onClick={() => scrollProducts("prev")}
                    className={`absolute left-1 top-1/2 z-20 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border transition-colors sm:left-2 sm:h-12 sm:w-12 ${
                        isDark
                            ? "border-primary/60 bg-slate-950/90 text-slate-200 shadow-xl shadow-primary/20 hover:border-primary hover:text-primary-light"
                            : "border-primary/60 bg-white/95 text-text-muted shadow-xl shadow-primary/20 hover:border-primary hover:text-primary"
                    }`}
                    aria-label={`Scroll ${title} row ${rowId} left`}
                >
                    <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
                </button>
            )}
            {canScrollNext && (
                <button
                    type="button"
                    onClick={() => scrollProducts("next")}
                    className={`absolute right-1 top-1/2 z-20 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border transition-colors sm:right-2 sm:h-12 sm:w-12 ${
                        isDark
                            ? "border-primary/60 bg-slate-950/90 text-slate-200 shadow-xl shadow-primary/20 hover:border-primary hover:text-primary-light"
                            : "border-primary/60 bg-white/95 text-text-muted shadow-xl shadow-primary/20 hover:border-primary hover:text-primary"
                    }`}
                    aria-label={`Scroll ${title} row ${rowId} right`}
                >
                    <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
                </button>
            )}

            <Motion.div
                ref={scrollRef}
                data-product-scroller={`related-products-${currentProductId}-${rowId}`}
                onScroll={updateScrollState}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                variants={{
                    hidden: { opacity: 0 },
                    show: {
                        opacity: 1,
                        transition: {
                            staggerChildren: 0.05
                        }
                    }
                }}
                className="flex snap-x snap-mandatory items-stretch gap-3 overflow-x-auto overscroll-x-contain scroll-smooth pb-5 pr-3 sm:gap-5 md:gap-6"
            >
                {products.map((product, index) => (
                    <ProductCard
                        key={`${rowId}-${product._id}`}
                        product={product}
                        onAddToCart={(p) => addToCart(p, 1)}
                        onWishlistToggle={toggleWishlist}
                        isInWishlist={isInWishlist}
                        user={user}
                        variants={{
                            hidden: { opacity: 0, y: 20 },
                            show: { opacity: 1, y: 0, transition: { duration: 0.5 } }
                        }}
                        productSectionId={`related-products-${currentProductId}-${rowId}`}
                        productIndex={index}
                        className="h-[27rem] w-[calc((100%_-_1.5rem)*0.4545)] flex-none snap-start sm:h-[32rem] sm:w-56 md:h-[34rem] md:w-64 lg:w-72"
                    />
                ))}
            </Motion.div>
        </div>
    );
};

const RelatedProducts = ({ currentProduct }) => {
    const { language, t } = useLanguage();
    const { products, loading } = useProducts(language);
    const { addToCart } = useCart();
    const { toggleWishlist, isInWishlist } = useWishlist();
    const { user } = useAuth();
    const [isDark] = useDarkMode();

    const relatedProducts = useMemo(() => {
        if (!products.length || !currentProduct) return [];

        const currentCategory = normalizeProductCategory(currentProduct.category);

        return products
            .filter((product) =>
                product._id !== currentProduct._id &&
                normalizeProductCategory(product.category) === currentCategory
            )
            .slice(0, MAX_RELATED_PRODUCTS);
    }, [products, currentProduct]);
    const relatedRows = useMemo(() => chunkProducts(relatedProducts), [relatedProducts]);

    if (loading || relatedProducts.length === 0) return null;

    return (
        <div className={`mt-16 sm:mt-24 border-t pt-10 sm:pt-16 ${isDark ? "border-slate-800" : "border-stone-100"}`}>
            <div className="flex items-center gap-2 mb-6 sm:mb-8">
                <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                <h2 className="text-xl sm:text-2xl font-bold text-text-main font-display">
                    {t("product.youMightAlsoLike")}
                </h2>
            </div>

            <div className="space-y-6 sm:space-y-8">
                {relatedRows.map((rowProducts, index) => (
                    <RelatedProductRow
                        key={`related-row-${index + 1}`}
                        rowId={index + 1}
                        products={rowProducts}
                        currentProductId={currentProduct._id}
                        addToCart={addToCart}
                        toggleWishlist={toggleWishlist}
                        isInWishlist={isInWishlist}
                        user={user}
                        isDark={isDark}
                        title={t("product.youMightAlsoLike")}
                    />
                ))}
            </div>
        </div>
    );
};

export default RelatedProducts;
