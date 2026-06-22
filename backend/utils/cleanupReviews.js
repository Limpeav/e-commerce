import mongoose from "mongoose";
import Product from "../models/Product.js";
import User from "../models/userModel.js";

// Utility function to clean up all reviews from deleted users
export const cleanupOrphanedReviews = async () => {
  try {
    console.log("Starting cleanup of orphaned reviews...");
    
    const products = await Product.find({});
    let totalRemoved = 0;
    let productsUpdated = 0;

    for (const product of products) {
      if (!product.reviews || product.reviews.length === 0) continue;

      const validReviews = [];
      let hasChanges = false;

      for (const review of product.reviews) {
        try {
          const userExists = await User.exists({ _id: review.user });
          
          if (userExists) {
            validReviews.push(review);
          } else {
            hasChanges = true;
            totalRemoved++;
            console.log(`Removing review from deleted user ${review.user} from product ${product._id}`);
          }
        } catch (error) {
          hasChanges = true;
          totalRemoved++;
          console.log(`Error checking user ${review.user}, removing review:`, error);
        }
      }

      if (hasChanges) {
        product.reviews = validReviews;
        product.numReviews = validReviews.length;
        
        if (validReviews.length > 0) {
          product.rating =
            validReviews.reduce((acc, item) => item.rating + acc, 0) /
            validReviews.length;
        } else {
          product.rating = 0;
        }
        
        await product.save();
        productsUpdated++;
        console.log(`Updated product ${product._id}: ${validReviews.length} reviews remaining`);
      }
    }

    console.log(`Cleanup completed: ${totalRemoved} reviews removed from ${productsUpdated} products`);
    return { totalRemoved, productsUpdated };
  } catch (error) {
    console.error("Error during cleanup:", error);
    throw error;
  }
};

// Run cleanup if called directly
if (process.argv[1] === new URL(import.meta.url).pathname) {
  mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/ecommerce')
    .then(() => {
      console.log("Connected to MongoDB");
      return cleanupOrphanedReviews();
    })
    .then((result) => {
      console.log("Cleanup result:", result);
      process.exit(0);
    })
    .catch((error) => {
      console.error("Cleanup failed:", error);
      process.exit(1);
    });
}
