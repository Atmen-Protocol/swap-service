"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const errorHandler = (err, req, res, next) => {
    console.error(`[error]: ${err.message}, ${err.stack}`);
    const status = err.status || 500;
    res.status(status).send({ error: err.message });
};
exports.errorHandler = errorHandler;
