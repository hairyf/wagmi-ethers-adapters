import type { Signer } from 'ethersv5'
import { Contract, providers } from 'ethersv5'
import { Interface } from 'ethersv6'
import { useMemo } from 'react'
import type { Account, Chain, Client, Transport } from 'viem'
import type { Config } from 'wagmi'
import { useClient, useConnectorClient } from 'wagmi'

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

export function useEthersContract<T = any>(options: { address: string, interface: T }) {
  const provider = useEthersProvider()
  const signer = useEthersSigner()

  function providerToContract(signerOrProvider?: providers.Provider | Signer | undefined) {
    return new Contract(options.address, options.interface as any, signerOrProvider)
  }

  return useMemo(() => (
    signer
      ? providerToContract(signer)
      : providerToContract(provider)
  ), [provider, signer])
}
