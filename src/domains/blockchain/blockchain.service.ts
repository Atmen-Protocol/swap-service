import { Contract, ethers } from 'ethers'
import {
  atomicCloakABI,
  supportedChains,
  contractAddress,
  SwapPrivateData
} from '../../constants'

import { db } from '../database'
import { openSwap, closeSwap } from '../swap/swap.service'

export const getProvider = (chainID: number) => {
  const chain = supportedChains.find((chain) => chain.id === chainID)!
  const provider = new ethers.providers.JsonRpcProvider(
    chain.rpcUrls.default.http[0]
  )
  return provider
}

export const getAtomicCloakContract = async (chainID: number) => {
  const provider = getProvider(chainID)
  const wallet = new ethers.Wallet(
    process.env.BACKEND_PRIVATE_KEY ?? '',
    provider
  )
  const signer = wallet.connect(provider)
  const atomicCloak = new ethers.Contract(
    contractAddress,
    atomicCloakABI,
    signer
  )

  return { provider, signer, atomicCloak }
}

export const eventListener = async (chainID: number) => {
  const { atomicCloak } = await getAtomicCloakContract(chainID)
  //   provider.resetEventsBlock(0)
  atomicCloak.on('Open', async (_swapID) => {
    const swapData = await atomicCloak.swaps(_swapID)

    console.log('Open event', _swapID, swapData)
    db.findOne(
      { originalSwapID: _swapID },
      (err: any, swapPrivateData: SwapPrivateData) => {
        if (err) {
          console.error(err)
        }
        if (swapPrivateData) {
          console.log('Found matching swap', swapPrivateData)
          if (swapData.recipient === process.env.BACKEND_ADDRESS) {
            openSwap(swapPrivateData)
          } else {
            console.log('Recipient does not match')
            db.remove({ originalSwapID: _swapID })
          }
        }
      }
    )
  })

  atomicCloak.on('Close', async (_swapID, _secretKey) => {
    console.log('Close event', _swapID, _secretKey)

    db.findOne(
      { mirrorSwapID: _swapID },
      (err: any, swapPrivateData: SwapPrivateData) => {
        if (err) {
          console.error(err)
        }
        if (swapPrivateData) {
          console.log('Found matching swap', swapPrivateData)
          closeSwap(swapPrivateData, _secretKey)
          db.remove({ mirrorSwapID: _swapID })
        }
      }
    )
  })
}
