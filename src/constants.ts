import abi from './AtomicCloak.json'
import dotenv from 'dotenv'
import path from 'path'
dotenv.config({ path: path.resolve(__dirname, '../../.env') })

import { sepolia, goerli, polygonMumbai, optimismGoerli } from '@wagmi/chains'

export const contractAddress = process.env.ATOMIC_CLOAK_ADDRESS ?? ''

export const atomicCloakABI = abi.abi

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
}
export const supportedChains = [
  goerli,
  sepolia,
  polygonMumbai,
  optimismGoerli
  //   mantleTestnet
]

export interface SwapData {
  swapID: string
  timelock: number
  tokenContract: string
  value: number
  sender: string
  recipient: string
  fee: number
}

export interface SwapPrivateData {
  originalSwapID: string
  mirrorSwapID: string
  sharedSecret: string
  qx1: string
  qy1: string
  qx2: string
  qy2: string
  sendingChainID: string
  receivingChainID: string
  recipient: string
}

export const TIME_LOCK = 240
