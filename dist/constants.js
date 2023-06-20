"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TIME_LOCK = exports.supportedChains = exports.atomicCloakABI = exports.contractAddress = void 0;
const AtomicCloak_json_1 = __importDefault(require("./AtomicCloak.json"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../../.env') });
const chains_1 = require("@wagmi/chains");
exports.contractAddress = (_a = process.env.ATOMIC_CLOAK_ADDRESS) !== null && _a !== void 0 ? _a : '';
exports.atomicCloakABI = AtomicCloak_json_1.default.abi;
const mantleTestnet = {
    id: 5001,
    network: 'Mantle Testnet',
    name: 'mantle',
    nativeCurrency: {
        name: 'Mantle Testnet',
        symbol: 'MNT',
        decimals: 18
    },
    rpcUrls: {
        default: {
            http: ['https://rpc.testnet.mantle.xyz']
        },
        public: {
            http: ['https://rpc.testnet.mantle.xyz']
        }
    },
    blockExplorers: {
        default: {
            name: 'Mantle Ringwood',
            url: 'https://explorer.testnet.mantle.xyz'
        }
    },
    testnet: true
};
exports.supportedChains = [
    chains_1.goerli,
    chains_1.sepolia,
    chains_1.polygonMumbai,
    chains_1.optimismGoerli
    //   mantleTestnet
];
exports.TIME_LOCK = 240;
