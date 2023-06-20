import { SwapPrivateData, TIME_LOCK } from '../../constants'
import { getAtomicCloakContract } from '../blockchain/blockchain.service'

import { db } from '../database'

export const setSwapPrivateData = async (swapRequest: SwapPrivateData) => {
  console.log('setSwapPrivateData', swapRequest)
  // We postpone validation on the private data to the openSwap function.
  // We are vulnerable to a DoS attack where several requests are done with wrong private data.

  const swapPrivateData: SwapPrivateData = {
    originalSwapID: swapRequest.originalSwapID,
    mirrorSwapID: swapRequest.mirrorSwapID,
    sharedSecret: swapRequest.sharedSecret,
    qx1: swapRequest.qx1,
    qy1: swapRequest.qy1,
    qx2: swapRequest.qx2,
    qy2: swapRequest.qy2,
    sendingChainID: swapRequest.sendingChainID,
    receivingChainID: swapRequest.receivingChainID,
    recipient: swapRequest.recipient
  }

  db.insert(swapPrivateData)
  console.log('setSwapPrivateData inserted', swapPrivateData)
}

export const openSwap = async (swapPrivateData: SwapPrivateData) => {
  console.log('openSwap')
  const { atomicCloak } = await getAtomicCloakContract(
    parseInt(swapPrivateData.sendingChainID)
  )
  //We verify that the private data we got earlier is valid.
  const originalSwapID = await atomicCloak.commitmentToAddress(
    swapPrivateData.qx1,
    swapPrivateData.qy1
  )

  if (originalSwapID !== swapPrivateData.originalSwapID) {
    throw new Error('Invalid private data')
  }

  const [qx2, qy2] = await atomicCloak.commitmentFromSharedSecret(
    swapPrivateData.qx1,
    swapPrivateData.qy1,
    swapPrivateData.sharedSecret
  )

  if (!swapPrivateData.qx2 === qx2._hex || !swapPrivateData.qy2 === qy2._hex) {
    throw new Error('Invalid private data')
  }

  const swapPublicData = await atomicCloak.swaps(swapPrivateData.originalSwapID)

  const atomicCloakData = await getAtomicCloakContract(
    parseInt(swapPrivateData.receivingChainID)
  )
  const provider = atomicCloakData.provider
  const atomicCloakReceivingChain = atomicCloakData.atomicCloak

  const blockNumberBefore = await provider.getBlockNumber()
  const timestampBefore = (await provider.getBlock(blockNumberBefore)).timestamp
  const timelock = timestampBefore + TIME_LOCK

  const gasPrice = await provider.getGasPrice()

  const tx = await atomicCloakReceivingChain.openETHSwap(
    swapPrivateData.qx2,
    swapPrivateData.qy2,
    swapPrivateData.recipient,
    timelock,
    {
      value: `${swapPublicData.value}`,
      gasPrice: Math.round(gasPrice.toNumber() * 1.03),
      gasLimit: 1000000
    }
  )
  console.log('Mining transaction:', tx)
  await tx.wait()
  console.log('Open transaction mined')
}

export const closeSwap = async (
  swapPrivateData: SwapPrivateData,
  secretKey: string
) => {
  console.log('closeSwap', swapPrivateData, secretKey)
  const { atomicCloak } = await getAtomicCloakContract(
    parseInt(swapPrivateData.sendingChainID)
  )

  const curveOrder = await atomicCloak.curveOrder()

  let newSecretKey: bigint
  if (BigInt(secretKey) > BigInt(swapPrivateData.sharedSecret)) {
    newSecretKey = BigInt(secretKey) - BigInt(swapPrivateData.sharedSecret)
  } else {
    newSecretKey =
      BigInt(curveOrder) +
      BigInt(secretKey) -
      BigInt(swapPrivateData.sharedSecret)
  }

  console.log('newSecretKey', newSecretKey)
  const tx = await atomicCloak.closeSwap(
    swapPrivateData.originalSwapID,
    newSecretKey
  )
  console.log(await tx.wait())
}
