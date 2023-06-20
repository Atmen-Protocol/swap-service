"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const swap_1 = require("./domains/swap");
const router = (0, express_1.Router)();
router.use('/swap', swap_1.swapRouter);
exports.default = router;
