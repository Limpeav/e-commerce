import express from "express";
import {
  getPurchaseOrders,
  getPOById,
  createPO,
  updatePO,
  receivePOStock,
  recordPOPayment,
  deletePO,
} from "../controllers/purchaseOrderController.js";
import { protect, admin } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect, admin);

router.route("/")
  .get(getPurchaseOrders)
  .post(createPO);

router.route("/:id")
  .get(getPOById)
  .put(updatePO)
  .delete(deletePO);

router.post("/:id/receive", receivePOStock);
router.post("/:id/payment", recordPOPayment);

export default router;
