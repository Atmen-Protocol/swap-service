import { SwapPrivateData } from "../../lib/constants";

import { db } from "../database";
import { openSwap, closeSwap } from "../swap/swap.service";
import { getContracts } from "../../lib/utils";
import { Transaction } from "@ethereumjs/tx";

export const eventListener = async (chainID: number) => {
    const { atmenSwap } = await getContracts(chainID, false);
    //   provider.resetEventsBlock(0)

    atmenSwap.on("Open", async (...parameters) => {
        // const event = parameters[parameters.length - 1];
        // const trs = new Transaction(await event.getTransaction());

        // const pk = ethers.utils.recoverPublicKey(ethers.utils.arrayify(ethers.utils.hashMessage(ethers.utils.arrayify(trs.hash))), trs.sig);
        // console.log("Open event", event, trs, trs.getSenderPublicKey().toString("hex"));
        const _swapID = parameters[0];
        const swapData = await atmenSwap.swaps(_swapID);

        // console.log("Open event", typeof _swapID, _swapID, swapData);
        db.findOne({ originalSwapID: _swapID }, (err: any, swapPrivateData: SwapPrivateData) => {
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
        });
    });

    atmenSwap.on("Close", async (...parameters) => {
        const event = parameters[parameters.length - 1];
        console.log("Close event", event);
        const _swapID = parameters[0];
        const _secretKey = parameters[1];
        console.log("Close event", _swapID, _secretKey);
        db.findOne({ mirrorSwapID: _swapID }, (err: any, swapPrivateData: SwapPrivateData) => {
            if (err) {
                console.error(err);
            }
            if (swapPrivateData) {
                console.log("Found matching swap", swapPrivateData);
                closeSwap(swapPrivateData, _secretKey);
                db.remove({ mirrorSwapID: _swapID });
            }
        });
    });
};
