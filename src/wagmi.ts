import { cookieStorage, createConfig, createStorage, http } from 'wagmi'
import { base } from 'wagmi/chains'
import { baseAccount, injected, walletConnect } from 'wagmi/connectors'

export function getConfig() {
  return createConfig({
    chains: [base],
    connectors: [
      baseAccount({
        subAccounts: {
          creation: "on-connect",
          defaultAccount: "sub",
          funding: "manual",
        },
      }),
    ],
    storage: createStorage({
      storage: cookieStorage,
    }),
    ssr: true,
    transports: {
      [base.id]: http(),
    },
  })
}

declare module 'wagmi' {
  interface Register {
    config: ReturnType<typeof getConfig>
  }
}
