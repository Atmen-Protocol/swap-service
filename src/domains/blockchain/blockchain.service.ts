import { SwapPrivateData } from "../../lib/constants";

import { db } from "../database";
import { openSwap, closeSwap } from "../swap/swap.service";
import { getContracts } from "../../lib/utils";

export const eventListener = async (chainID: number) => {
    const { atmenSwap } = await getContracts(chainID);
    //   provider.resetEventsBlock(0)
    atmenSwap.on("Open", async (_swapID) => {
        const swapData = await atmenSwap.swaps(_swapID);

        console.log("Open event", _swapID, swapData);
        db.findOne(
            { originalSwapID: _swapID },
            (err: any, swapPrivateData: SwapPrivateData) => {
                if (err) {
                    console.error(err);
                }
                if (swapPrivateData) {
                    console.log("Found matching swap", swapPrivateData);
                    if (swapData.recipient === process.env.BACKEND_ADDRESS) {
                        openSwap(swapPrivateData);
                    } else {
                        console.log("Recipient does not match");
                        db.remove({ originalSwapID: _swapID });
                    }
                }
            }
        );
    });

    atmenSwap.on("Close", async (_swapID, _secretKey) => {
        console.log("Close event", _swapID, _secretKey);

        db.findOne(
            { mirrorSwapID: _swapID },
            (err: any, swapPrivateData: SwapPrivateData) => {
                if (err) {
                    console.error(err);
                }
                if (swapPrivateData) {
                    console.log("Found matching swap", swapPrivateData);
                    closeSwap(swapPrivateData, _secretKey);
                    db.remove({ mirrorSwapID: _swapID });
                }
            }
        );
    });
};
