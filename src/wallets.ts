// src/ton-connect/wallets.ts
import "dotenv/config";
import TonConnect, {
  IStorage,
  isWalletInfoRemote,
  WalletInfo,
  WalletInfoRemote,
  WalletsListManager,
} from "@tonconnect/sdk";
import * as process from "process";
import nacl from "tweetnacl";

const walletsListManager = new WalletsListManager({
  cacheTTLMs: Number(process.env.WALLETS_LIST_CACHE_TTL_MS),
});

export async function getWallets(): Promise<WalletInfoRemote[]> {
  const wallets = await walletsListManager.getWallets();
  return wallets.filter(isWalletInfoRemote);
}

export async function getWalletInfo(
  walletAppName: string
): Promise<WalletInfo | undefined> {
  const wallets = await getWallets();
  return wallets.find(
    (wallet) => wallet.appName.toLowerCase() === walletAppName.toLowerCase()
  );
}

const storage = new Map<string, string>(); // temporary storage implementation. We will replace it with the redis later

export class TonConnectStorage implements IStorage {
  constructor(private readonly chatId: number) {} // we need to have different stores for different users

  private getKey(key: string): string {
    return this.chatId.toString() + key; // we will simply have different keys prefixes for different users
  }

  async removeItem(key: string): Promise<void> {
    storage.delete(this.getKey(key));
  }

  async setItem(key: string, value: string): Promise<void> {
    storage.set(this.getKey(key), value);
  }

  async getItem(key: string): Promise<string | null> {
    return storage.get(this.getKey(key)) || null;
  }
}

type StoredConnectorData = {
  connector: TonConnect;
  timeout: ReturnType<typeof setTimeout>;
  onConnectorExpired: ((connector: TonConnect) => void)[];
};

const connectors = new Map<number, StoredConnectorData>();

export function getConnector(
  chatId: number,
  onConnectorExpired?: (connector: TonConnect) => void
): TonConnect {
  let storedItem: StoredConnectorData;
  if (connectors.has(chatId)) {
    storedItem = connectors.get(chatId)!;
    clearTimeout(storedItem.timeout);
  } else {
    storedItem = {
      connector: new TonConnect({
        manifestUrl: process.env.MANIFEST_URL,
        storage: new TonConnectStorage(chatId),
      }),
      onConnectorExpired: [],
    } as unknown as StoredConnectorData;
  }

  if (onConnectorExpired) {
    storedItem.onConnectorExpired.push(onConnectorExpired);
  }

  storedItem.timeout = setTimeout(() => {
    if (connectors.has(chatId)) {
      const storedItem = connectors.get(chatId)!;
      storedItem.connector.pauseConnection();
      storedItem.onConnectorExpired.forEach((callback) =>
        callback(storedItem.connector)
      );
      connectors.delete(chatId);
    }
  }, Number(process.env.CONNECTOR_TTL_MS));

  connectors.set(chatId, storedItem);
  return storedItem.connector;
}
