import { SwapPrivateData, TIME_LOCK } from "../../lib/constants";
import { getContracts } from "../../lib/utils";

import { db } from "../database";

export const setSwapPrivateData = async (swapRequest: any) => {
    console.log("setSwapPrivateData", JSON.parse(swapRequest.body));
    // We postpone validation on the private data to the openSwap function.
    // We are vulnerable to a DoS attack where several requests are done with wrong private data.
    const data = JSON.parse(swapRequest.body);
    const swapPrivateData = {
        originalSwapID: data.originalSwapID,
        mirrorSwapID: data.mirrorSwapID,
        hidingValue: data.hidingValue,
        qx1: data.qx1,
        qy1: data.qy1,
        sendingChainID: data.sendingChainID,
        receivingChainID: data.receivingChainID,
        recipient: data.recipient,
    };

    db.insert(swapPrivateData);
    console.log("setSwapPrivateData inserted", swapPrivateData);
};

export const openSwap = async (swapPrivateData: SwapPrivateData) => {
    console.log("openSwap");
    const { atmenSwap, ecCommit } = await getContracts(swapPrivateData.sendingChainID, true);
    //We verify that the private data we got earlier is valid.
    const originalSwapID = await ecCommit.commitmentFromPoint(swapPrivateData.qx1, swapPrivateData.qy1);

    if (originalSwapID !== swapPrivateData.originalSwapID) {
        console.log("Invalid private data: originalSwapID");
        return;
    }

    const mirrorSwapID = await ecCommit.commitmentFromSharedSecret(swapPrivateData.qx1, swapPrivateData.qy1, swapPrivateData.hidingValue);

    if (mirrorSwapID !== swapPrivateData.mirrorSwapID) {
        console.log("Invalid private data: mirrorSwapID");
        return;
    }

    const swapPublicData = await atmenSwap.swaps(swapPrivateData.originalSwapID);

    const contracts = await getContracts(swapPrivateData.receivingChainID, true);
    const provider = contracts.provider;
    const atmenSwapReceivingChain = contracts.atmenSwap;

    const blockNumberBefore = await provider.getBlockNumber();
    const timestampBefore = (await provider.getBlock(blockNumberBefore)).timestamp;
    const timelock = timestampBefore + TIME_LOCK;

    const gasPrice = await provider.getGasPrice();
    console.log("gasPrice", gasPrice.toNumber());
    try {
        const tx = await atmenSwapReceivingChain.openETHSwap(swapPrivateData.mirrorSwapID, timelock, swapPrivateData.recipient, {
            value: `${swapPublicData.value}`,
            gasPrice: Math.round(gasPrice.toNumber() * 1.03),
            gasLimit: 1000000,
        });
        console.log("Mining transaction:", tx);
        await tx.wait();
        console.log("Open transaction mined");
    } catch (e) {
        console.log("Transaction open failed:", e);
    }
};

export const closeSwap = async (swapPrivateData: SwapPrivateData, secretKey: string) => {
    console.log("closeSwap", swapPrivateData, secretKey);
    const { atmenSwap, ecCommit } = await getContracts(swapPrivateData.sendingChainID, true);

    const fieldOrder = BigInt(await ecCommit.q());

    let newSecretKey: bigint;
    if (BigInt(secretKey) > BigInt(swapPrivateData.hidingValue)) {
        newSecretKey = BigInt(secretKey) - BigInt(swapPrivateData.hidingValue);
    } else {
        newSecretKey = BigInt(fieldOrder) + BigInt(secretKey) - BigInt(swapPrivateData.hidingValue);
    }

    console.log("newSecretKey", newSecretKey);
    try {
        const tx = await atmenSwap.close(swapPrivateData.originalSwapID, Buffer.from(newSecretKey.toString(16), "hex"));
        console.log(await tx.wait());
    } catch (e) {
        console.log("Transaction close failed:", e);
    }
};
