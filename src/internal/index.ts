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

export function proxy<T>(initObject?: T) {
  let target: any = initObject
  const proxy = new Proxy<any>({}, {
    get: (t, p) => target?.[p],
    set: (t, p, v) => {
      target[p] = v
      return true
    },
  }) as T
  function update(object: T) {
    target = object
  }
  return {
    proxy,
    update,
  }
}
