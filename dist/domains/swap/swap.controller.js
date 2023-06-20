"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.open = void 0;
const swap_service_1 = require("./swap.service");
const open = (req, res, next) => {
    (0, swap_service_1.setSwapPrivateData)(req.body)
        .then((result) => res.json(result))
        .catch((err) => {
        next(err);
    });
};
exports.open = open;
