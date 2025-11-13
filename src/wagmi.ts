import { cookieStorage, createConfig, createStorage, http } from "wagmi";
import { base } from "wagmi/chains";
import { baseAccount } from "wagmi/connectors";

export function getConfig() {
  return createConfig({
    chains: [base],
    connectors: [
      baseAccount({
        preference: {
          walletUrl: "http://localhost:3005/connect",
        },
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
  });
}

declare module "wagmi" {
  interface Register {
    config: ReturnType<typeof getConfig>;
  }
}
