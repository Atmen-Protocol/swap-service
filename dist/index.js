"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const cors_1 = __importDefault(require("cors"));
const routes_1 = __importDefault(require("./routes"));
const errorHandler_1 = require("./errors/errorHandler");
const blockchain_service_1 = require("./domains/blockchain/blockchain.service");
const constants_1 = require("./constants");
const main = async () => {
    dotenv_1.default.config({ path: path_1.default.resolve(__dirname, "../.env") });
    const app = (0, express_1.default)();
    app.use((0, cors_1.default)());
    app.use(express_1.default.json());
    app.use("/api/v1", routes_1.default);
    app.use(errorHandler_1.errorHandler);
    constants_1.supportedChains.forEach((chain) => (0, blockchain_service_1.eventListener)(chain.id));
    const port = process.env.BACKEND_PORT;
    app.listen(port, () => {
        console.log(`Server is running at port ${port}`);
    });
};
main().catch((e) => {
    console.error(e);
});
