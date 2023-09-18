import Datastore from "nedb";
import { SwapPrivateData } from "../../lib/constants";

export const db = new Datastore();

export const findSwapByID = (swapID: string): Promise<SwapPrivateData> => {
    return new Promise((resolve, reject) => {
        db.findOne({ $or: [{ originalSwapID: swapID }, { mirrorSwapID: swapID }] }, (err: any, swapPrivateData: SwapPrivateData) => {
            if (err) {
                console.error(err);
                reject(err);
            }
            if (swapPrivateData) {
                resolve(swapPrivateData);
            } else {
                reject(new Error("Swap not found"));
            }
        });
    });
};
