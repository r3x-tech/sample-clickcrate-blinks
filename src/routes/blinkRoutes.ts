// src/routes/blinkRoutes.ts

import express from "express";
import {
  getBlink,
  createPurchase,
  handleCallback,
} from "../controllers/blinkController";

const router = express.Router();

router.get("/:clickcrateId", getBlink);
router.post("/purchase", createPurchase);
router.post("/callback/purchase", handleCallback);

export default router;
