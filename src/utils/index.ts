import type { Config } from 'wagmi'
import { useClient, useConnectorClient } from 'wagmi'
import { useWhenever } from '../hooks'
import { clients, emitter } from '../internal'

export function subscribeClientsForEthersAdapters() {
  const publicClient = useClient()
  const { data: walletClient } = useConnectorClient<Config>()

  useWhenever(walletClient, (wallet) => {
    clients.walletClient = wallet!
    emitter.emit('updated:wallet')
  })
  useWhenever(publicClient, (wallet) => {
    clients.publicClient = wallet!
    emitter.emit('updated:public')
  })
}

export function getWalletClient() {
  return clients.walletClient
}

export function getPublicClient() {
  return clients.publicClient
}
