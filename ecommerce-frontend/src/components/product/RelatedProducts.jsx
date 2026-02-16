import React, { useMemo } from 'react';
import { useProducts } from '../../hooks/useProducts';
import { useWishlist } from '../../context/WishlistContext';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import ProductCard from './ProductCard';
import { Sparkles } from 'lucide-react';

import { motion } from 'framer-motion';

const RelatedProducts = ({ currentProduct }) => {
    const { products, loading } = useProducts();
    const { addToCart } = useCart();
    const { toggleWishlist, isInWishlist } = useWishlist();
    const { user } = useAuth();

    const relatedProducts = useMemo(() => {
        if (!products.length || !currentProduct) return [];

        const byRelevance = (a, b) => {
            const ratingDiff = Number(b.rating || 0) - Number(a.rating || 0);
            if (ratingDiff !== 0) {
                return ratingDiff;
            }

            const reviewsDiff = Number(b.numReviews || 0) - Number(a.numReviews || 0);
            if (reviewsDiff !== 0) {
                return reviewsDiff;
            }

            return String(a._id || "").localeCompare(String(b._id || ""));
        };

        // Filter by same category, exclude current product
        let related = products.filter(p =>
            p._id !== currentProduct._id &&
            p.category === currentProduct.category
        ).sort(byRelevance);

        // If not enough related products, fill with other products
        if (related.length < 4) {
            const otherProducts = products.filter(p =>
                p._id !== currentProduct._id &&
                p.category !== currentProduct.category
            ).sort(byRelevance);
            related = [...related, ...otherProducts];
        }

        // Slice to get 4 products (limit)
        return related.slice(0, 4);
    }, [products, currentProduct]);

    if (loading || relatedProducts.length === 0) return null;

    return (
        <div className="mt-10">
            <div className="mb-5 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-bold text-text-main md:text-2xl">
                    You Might Also Like
                </h2>
            </div>

            <motion.div
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                variants={{
                    hidden: { opacity: 0 },
                    show: {
                        opacity: 1,
                        transition: {
                            staggerChildren: 0.1
                        }
                    }
                }}
                className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4"
            >
                {relatedProducts.map(product => (
                    <ProductCard
                        key={product._id}
                        product={product}
                        onAddToCart={(p) => addToCart(p, 1)}
                        onWishlistToggle={toggleWishlist}
                        isInWishlist={isInWishlist}
                        user={user}
                        // Passing simplified variants as ProductCard expects them, 
                        // though ProductCard handles hover effects internally.
                        variants={{
                            hidden: { opacity: 0, y: 20 },
                            show: { opacity: 1, y: 0, transition: { duration: 0.5 } }
                        }}
                    />
                ))}
            </motion.div>
        </div>
    );
};

export default RelatedProducts;
