
import express from "express";

import {
    checkExistingOrder,
    withdrawOrder,
    deleteRejectedOrder,
    placeOrder,
    getCustomerOrders,
    getVendorOrders,
    updateVendorOrderStatus,
} from "../controllers/order.controller.js";
import { verifyToken } from "../middleware/verifyAPI.js";

const router = express.Router();

router.get("/check", verifyToken, checkExistingOrder);
router.patch("/:id/withdraw", verifyToken, withdrawOrder);
router.post("/", verifyToken, placeOrder);

router.delete("/:id/rejected",verifyToken, deleteRejectedOrder);

router.get("/customer/:email", verifyToken, getCustomerOrders);
router.get("/vendor/:email", verifyToken, getVendorOrders);
router.patch("/:id/vendor-status", verifyToken, updateVendorOrderStatus);




export default router;
