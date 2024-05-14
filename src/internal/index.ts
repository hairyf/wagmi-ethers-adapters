import type { Account, Chain, Client, Transport } from 'viem'
import mitt from 'mitt'

export const emitter = mitt<{
  'updated:wallet': unknown
  'updated:public': unknown
}>()

export const clients = {
  walletClient: undefined as Client<Transport, Chain, Account> | undefined,
  publicClient: undefined as Client<Transport, Chain> | undefined,
}
