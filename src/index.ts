import express, { type Express } from "express";
import dotenv from "dotenv";
import path from "path";
import cors from "cors";
import appRouter from "./routes";
import { errorHandler } from "./errors/errorHandler";
import { eventListener } from "./domains/blockchain/blockchain.service";
import supportedChains from "./lib/chains";

const main = async () => {
    dotenv.config({ path: path.resolve(__dirname, "../.env") });
    const app: Express = express();

    app.use(cors());
    app.use(express.json());

    app.use("/api/v1", appRouter);

    app.use(errorHandler);
    for (let chainID in supportedChains) {
        eventListener(parseInt(chainID));
    }

    const port = process.env.BACKEND_PORT;
    app.listen(port, () => {
        console.log(`Server is running at port ${port}`);
    });
};

main().catch((e) => {
    console.error(e);
});
