import type { Provider, Signer } from 'ethersv6'
import { BrowserProvider, Contract, FallbackProvider, JsonRpcProvider, JsonRpcSigner } from 'ethersv6'

import { useMemo } from 'react'
import type { Account, Chain, Client, Transport } from 'viem'
import { type Config, useClient, useConnectorClient } from 'wagmi'
import { getPublicClient, getWalletClient } from './utils'
import type { ContractOptions } from './ethers-v5'
import { emitter, proxy } from './internal'

export function clientToProvider(client: Client<Transport, Chain>) {
  const { chain, transport } = client
  const network = {
    chainId: chain.id,
    name: chain.name,
    ensAddress: chain.contracts?.ensRegistry?.address,
  }
  if (transport.type === 'fallback') {
    const providers = (transport.transports as ReturnType<Transport>[]).map(
      ({ value }) => new JsonRpcProvider(value?.url, network),
    )
    if (providers.length === 1)
      return providers[0]
    return new FallbackProvider(providers)
  }
  return new JsonRpcProvider(transport.url, network)
}

export function clientToSigner(client: Client<Transport, Chain, Account>) {
  const { account, chain, transport } = client
  const network = {
    chainId: chain.id,
    name: chain.name,
    ensAddress: chain.contracts?.ensRegistry?.address,
  }
  const provider = new BrowserProvider(transport, network)
  return new JsonRpcSigner(provider, account.address)
}

/** Action to convert a viem Client to an ethers.js Provider. */
export function useEthersProvider({ chainId }: { chainId?: number } = {}) {
  const client = useClient<Config>({ chainId })
  return useMemo(() => (client ? clientToProvider(client) : undefined), [client])
}

/** Hook to convert a viem Wallet Client to an ethers.js Signer. */
export function useEthersSigner({ chainId }: { chainId?: number } = {}) {
  const { data: client } = useConnectorClient<Config>({ chainId })
  return useMemo(() => (client ? clientToSigner(client) : undefined), [client])
}

export function useEthersContract<T = any>(options: { address: string, interface: T }) {
  const provider = useEthersProvider()
  const signer = useEthersSigner()

  function providerToContract(signerOrProvider?: Provider | Signer | undefined) {
    return new Contract(
      options.address || '0x0000000000000000000000000000000000000000',
      options.interface as any,
      signerOrProvider,
    )
  }

  return useMemo(() => (
    signer
      ? providerToContract(signer)
      : providerToContract(provider)
  ), [provider, signer])
}

export function getEthersProvider() {
  function structure() {
    const publicClient = getPublicClient()
    return publicClient
      ? clientToProvider(publicClient)
      : undefined
  }
  return structure()
}

export function getEthersSigner() {
  function structure() {
    const walletClient = getWalletClient()
    return walletClient
      ? clientToSigner(walletClient)
      : undefined
  }
  return structure()
}

export function getEthersContract<T>(options: ContractOptions<T>) {
  function structure() {
    const publicClient = getPublicClient()
    const walletClient = getWalletClient()
    const provider = publicClient ? clientToProvider(publicClient) : undefined
    const signer = walletClient ? clientToSigner(walletClient) : undefined
    return new Contract(
      options.address || '0x0000000000000000000000000000000000000000',
      options.interface as any,
      signer || provider,
    ) as Contract & T
  }
  return structure()
}
