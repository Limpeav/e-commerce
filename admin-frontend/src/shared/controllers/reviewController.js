import { adminService } from "../services/adminService.js";
import { AdminModels, modelResponse } from "../models/adminModels.js";

export const ReviewController = {
  async getQueue(params) {
    return modelResponse(
      await adminService.getReviewQueue(params),
      AdminModels.reviewQueue
    );
  },

  async moderate(productId, reviewId, payload) {
    return adminService.moderateReview(productId, reviewId, payload);
  },
};
