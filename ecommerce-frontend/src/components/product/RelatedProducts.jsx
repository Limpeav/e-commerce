import React, { useMemo } from 'react';
import { useProducts } from '../../hooks/useProducts';
import { useWishlist } from '../../context/WishlistContext';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import ProductCard from './ProductCard';
import { Sparkles } from 'lucide-react';
import { useDarkMode } from '../../hooks';

import { motion } from 'framer-motion';

const RelatedProducts = ({ currentProduct }) => {
    const { products, loading } = useProducts();
    const { addToCart } = useCart();
    const { toggleWishlist, isInWishlist } = useWishlist();
    const { user } = useAuth();
    const [isDark] = useDarkMode();

    const relatedProducts = useMemo(() => {
        if (!products.length || !currentProduct) return [];

        // Filter by same category, exclude current product
        let related = products.filter(p =>
            p._id !== currentProduct._id &&
            p.category === currentProduct.category
        );

        // If not enough related products, fill with other products
        if (related.length < 4) {
            const otherProducts = products.filter(p =>
                p._id !== currentProduct._id &&
                p.category !== currentProduct.category
            );
            // Shuffle other products to get variety
            const shuffledOthers = otherProducts.sort(() => 0.5 - Math.random());
            related = [...related, ...shuffledOthers];
        }

        // Slice to get 4 products (limit)
        return related.slice(0, 4);
    }, [products, currentProduct]);

    if (loading || relatedProducts.length === 0) return null;

    return (
        <div className={`mt-16 sm:mt-24 border-t pt-10 sm:pt-16 ${isDark ? "border-slate-800" : "border-stone-100"}`}>
            <div className="flex items-center gap-2 mb-6 sm:mb-8">
                <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                <h2 className="text-xl sm:text-2xl font-bold text-text-main font-display">
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
                className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 md:gap-8"
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
