import { Router } from "express";
import { swapRouter } from "./domains/swap";
import { offersRouter } from "./domains/offers";
import { bundlerRouter } from "./domains/bundler";

const router = Router();

router.use("/swap", swapRouter);
router.use("/offer", offersRouter);
router.use("/bundler", bundlerRouter);

export default router;
