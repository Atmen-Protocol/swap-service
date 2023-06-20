"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const swap_controller_1 = require("./swap.controller");
const router = (0, express_1.Router)();
router.route('/').post(swap_controller_1.open);
exports.default = router;
