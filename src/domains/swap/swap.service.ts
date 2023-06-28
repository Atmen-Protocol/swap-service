import { SwapPrivateData, TIME_LOCK } from "../../lib/constants";
import { getContracts } from "../../lib/utils";

import { db } from "../database";

export const setSwapPrivateData = async (swapRequest: SwapPrivateData) => {
    console.log("setSwapPrivateData", swapRequest);
    // We postpone validation on the private data to the openSwap function.
    // We are vulnerable to a DoS attack where several requests are done with wrong private data.

    const swapPrivateData: SwapPrivateData = {
        originalSwapID: swapRequest.originalSwapID,
        mirrorSwapID: swapRequest.mirrorSwapID,
        sharedSecret: swapRequest.sharedSecret,
        qx1: swapRequest.qx1,
        qy1: swapRequest.qy1,
        sendingChainID: swapRequest.sendingChainID,
        receivingChainID: swapRequest.receivingChainID,
        recipient: swapRequest.recipient,
    };

    db.insert(swapPrivateData);
    console.log("setSwapPrivateData inserted", swapPrivateData);
};

export const openSwap = async (swapPrivateData: SwapPrivateData) => {
    console.log("openSwap");
    const { atmenSwap, ecCommit } = await getContracts(
        parseInt(swapPrivateData.sendingChainID)
    );
    //We verify that the private data we got earlier is valid.
    const originalSwapID = await ecCommit.commitmentFromPoint(
        swapPrivateData.qx1,
        swapPrivateData.qy1
    );

    if (originalSwapID !== swapPrivateData.originalSwapID) {
        throw new Error("Invalid private data");
    }

    const mirrorSwapID = await ecCommit.commitmentFromSharedSecret(
        swapPrivateData.qx1,
        swapPrivateData.qy1,
        swapPrivateData.sharedSecret
    );

    if (mirrorSwapID !== swapPrivateData.mirrorSwapID) {
        throw new Error("Invalid private data");
    }

    const swapPublicData = await atmenSwap.swaps(
        swapPrivateData.originalSwapID
    );

    const contracts = await getContracts(
        parseInt(swapPrivateData.receivingChainID)
    );
    const provider = contracts.provider;
    const atmenSwapReceivingChain = contracts.atmenSwap;

    const blockNumberBefore = await provider.getBlockNumber();
    const timestampBefore = (await provider.getBlock(blockNumberBefore))
        .timestamp;
    const timelock = timestampBefore + TIME_LOCK;

    const gasPrice = await provider.getGasPrice();
    try {
        const tx = await atmenSwapReceivingChain.openETHSwap(
            swapPrivateData.mirrorSwapID,
            timelock,
            swapPrivateData.recipient,
            {
                value: `${swapPublicData.value}`,
                gasPrice: Math.round(gasPrice.toNumber() * 1.03),
                gasLimit: 1000000,
            }
        );
        console.log("Mining transaction:", tx);
        await tx.wait();
    } catch (e) {
        console.log("Transaction open failed:", e);
    }
    console.log("Open transaction mined");
};

export const closeSwap = async (
    swapPrivateData: SwapPrivateData,
    secretKey: string
) => {
    console.log("closeSwap", swapPrivateData, secretKey);
    const { atmenSwap, ecCommit } = await getContracts(
        parseInt(swapPrivateData.sendingChainID)
    );

    const fieldOrder = BigInt(await ecCommit.q());

    let newSecretKey: bigint;
    if (BigInt(secretKey) > BigInt(swapPrivateData.sharedSecret)) {
        newSecretKey = BigInt(secretKey) - BigInt(swapPrivateData.sharedSecret);
    } else {
        newSecretKey =
            BigInt(fieldOrder) +
            BigInt(secretKey) -
            BigInt(swapPrivateData.sharedSecret);
    }

    console.log("newSecretKey", newSecretKey);
    try {
        const tx = await atmenSwap.close(
            swapPrivateData.originalSwapID,
            Buffer.from(newSecretKey.toString(16), "hex")
        );
        console.log(await tx.wait());
    } catch (e) {
        console.log("Transaction close failed:", e);
    }
};
