"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.eventListener = exports.getAtomicCloakContract = exports.getProvider = void 0;
const ethers_1 = require("ethers");
const constants_1 = require("../../constants");
const database_1 = require("../database");
const swap_service_1 = require("../swap/swap.service");
const getProvider = (chainID) => {
    const chain = constants_1.supportedChains.find((chain) => chain.id === chainID);
    const provider = new ethers_1.ethers.providers.JsonRpcProvider(chain.rpcUrls.default.http[0]);
    return provider;
};
exports.getProvider = getProvider;
const getAtomicCloakContract = async (chainID) => {
    var _a;
    const provider = (0, exports.getProvider)(chainID);
    const wallet = new ethers_1.ethers.Wallet((_a = process.env.BACKEND_PRIVATE_KEY) !== null && _a !== void 0 ? _a : '', provider);
    const signer = wallet.connect(provider);
    const atomicCloak = new ethers_1.ethers.Contract(constants_1.contractAddress, constants_1.atomicCloakABI, signer);
    return { provider, signer, atomicCloak };
};
exports.getAtomicCloakContract = getAtomicCloakContract;
const eventListener = async (chainID) => {
    const { atomicCloak } = await (0, exports.getAtomicCloakContract)(chainID);
    //   provider.resetEventsBlock(0)
    atomicCloak.on('Open', async (_swapID) => {
        const swapData = await atomicCloak.swaps(_swapID);
        console.log('Open event', _swapID, swapData);
        database_1.db.findOne({ originalSwapID: _swapID }, (err, swapPrivateData) => {
            if (err) {
                console.error(err);
            }
            if (swapPrivateData) {
                console.log('Found matching swap', swapPrivateData);
                if (swapData.recipient === process.env.BACKEND_ADDRESS) {
                    (0, swap_service_1.openSwap)(swapPrivateData);
                }
                else {
                    console.log('Recipient does not match');
                    database_1.db.remove({ originalSwapID: _swapID });
                }
            }
        });
    });
    atomicCloak.on('Close', async (_swapID, _secretKey) => {
        console.log('Close event', _swapID, _secretKey);
        database_1.db.findOne({ mirrorSwapID: _swapID }, (err, swapPrivateData) => {
            if (err) {
                console.error(err);
            }
            if (swapPrivateData) {
                console.log('Found matching swap', swapPrivateData);
                (0, swap_service_1.closeSwap)(swapPrivateData, _secretKey);
                database_1.db.remove({ mirrorSwapID: _swapID });
            }
        });
    });
};
exports.eventListener = eventListener;
