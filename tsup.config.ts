import type { Options } from 'tsup'

export default <Options>{
  entryPoints: [
    'src/*.ts',
  ],
  external: ['ethers', 'ethersv5', 'ethersv6', 'react', 'viem', 'wagmi'],
  clean: true,
  format: ['cjs', 'esm'],
  dts: true,
}
