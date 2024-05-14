import type { Signer } from 'ethersv5'
import { Contract, providers } from 'ethersv5'
import { useMemo } from 'react'
import type { Account, Chain, Client, Transport } from 'viem'
import type { Config } from 'wagmi'
import { useClient, useConnectorClient } from 'wagmi'
import { getPublicClient, getWalletClient } from './utils'
import { emitter } from './internal'

export interface ContractOptions<T> {
  interface: T
  address?: string
}

export function clientToProvider(client: Client<Transport, Chain>) {
  const { chain, transport } = client
  const network = {
    chainId: chain.id,
    name: chain.name,
    ensAddress: chain.contracts?.ensRegistry?.address,
  }
  if (transport.type === 'fallback') {
    return new providers.FallbackProvider(
      (transport.transports as ReturnType<Transport>[]).map(
        ({ value }) => new providers.JsonRpcProvider(value?.url, network),
      ),
    )
  }
  return new providers.JsonRpcProvider(transport.url, network)
}

export function clientToSigner(client: Client<Transport, Chain, Account>) {
  const { account, chain, transport } = client
  const network = {
    chainId: chain.id,
    name: chain.name,
    ensAddress: chain.contracts?.ensRegistry?.address,
  }
  const provider = new providers.Web3Provider(transport, network)
  const signer = provider.getSigner(account.address)
  return signer
}

/** Hook to convert a viem Client to an ethers.js Provider. */
export function useEthersProvider({
  chainId,
}: { chainId?: number | undefined } = {}) {
  const client = useClient<Config>({ chainId })
  return useMemo(() => (client ? clientToProvider(client) : undefined), [client])
}

/** Hook to convert a Viem Client to an ethers.js Signer. */
export function useEthersSigner({ chainId }: { chainId?: number } = {}) {
  const { data: client } = useConnectorClient<Config>({ chainId })
  return useMemo(() => (client ? clientToSigner(client) : undefined), [client])
}

export function useEthersContract<T = any>(options: ContractOptions<T>) {
  const provider = useEthersProvider()
  const signer = useEthersSigner()

  function providerToContract(signerOrProvider?: providers.Provider | Signer | undefined) {
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
  const publicClient = getPublicClient()
  const provider = publicClient
    ? clientToProvider(publicClient)
    : undefined
  return provider
}

export function getEthersSigner() {
  const walletClient = getWalletClient()
  return walletClient
    ? clientToSigner(walletClient)
    : undefined
}

export function getEthersContract<T>(options: ContractOptions<T>) {
  const contract = new Contract(
    options.address || '0x0000000000000000000000000000000000000000',
    options.interface as any,
    getEthersSigner() || getEthersProvider(),
  )

  return contract as Contract & T
}
