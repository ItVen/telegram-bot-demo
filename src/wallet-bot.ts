import TonConnect, { CHAIN, toUserFriendlyAddress } from "@tonconnect/sdk";
import {
  getConnector,
  getWalletInfo,
  getWallets,
  TonConnectStorage,
} from "./wallets";
import QRCode from "qrcode";
import TelegramBot from "node-telegram-bot-api";

export const walletBot = (bot: TelegramBot) => {
  bot.onText(/\/connect/, async (msg) => {
    const chatId = msg.chat.id;
    const wallets = await getWallets();

    const connector = new TonConnect({
      storage: new TonConnectStorage(chatId),
      manifestUrl: process.env.MANIFEST_URL,
    });

    connector.onStatusChange(async (wallet) => {
      if (wallet) {
        const walletName =
          (await getWalletInfo(connector.wallet!.device.appName))?.name ||
          connector.wallet!.device.appName;

        const signedMessage = wallet.connectItems?.tonProof;
        let publicKey = wallet.account.publicKey;
        let walletStateInit = wallet.account.walletStateInit;
        console.log({ signedMessage, walletStateInit, publicKey });
        bot.sendMessage(
          chatId,
          `${wallet.device.appName} wallet connected! \n Connected wallet: ${walletName}\n`
        );
      }
    });
    const telegramWallet = wallets.find(
      (wallet) => wallet.appName === "telegram-wallet"
    )!;
    console.log({ telegramWallet });
    const request = {
      tonProof: JSON.stringify({
        domain: {
          lengthBytes: 16,
          value: "your-domain",
        },
        payload: {
          lengthBytes: 32,
          value: "your-message",
        },
      }),
    };

    const link = connector.connect(
      {
        bridgeUrl: telegramWallet.bridgeUrl,
        universalLink: telegramWallet.universalLink,
      },
      {
        request,
      }
    );
    const image = await QRCode.toBuffer(link);

    await bot.sendPhoto(chatId, image, {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "Open Link",
              url: `https://ton-connect.github.io/open-tc?connect=${encodeURIComponent(
                link
              )}`,
            },
          ],
        ],
      },
    });
  });

  bot.onText(/\/my_wallet/, async (msg) => {
    const chatId = msg.chat.id;

    const connector = getConnector(chatId);
    await connector.restoreConnection();
    if (!connector.connected) {
      await bot.sendMessage(chatId, "You didn't connect a wallet");
      return;
    }
    const walletName =
      (await getWalletInfo(connector.wallet!.device.appName))?.name ||
      connector.wallet!.device.appName;
    const tonProof = connector.wallet!.connectItems?.tonProof;
    console.log(connector.wallet);
    connector.wallet!.provider;
    // console.log(
    //   await connector.sendTransaction({
    //     validUntil: Math.floor(new Date().getTime() / 1000) + 360,
    //     messages: [
    //       {
    //         address: connector.wallet!.account.address,
    //         amount: "200000",
    //       },
    //     ],
    //   })
    // );

    await bot.sendMessage(
      chatId,
      `Connected wallet: ${walletName}\nYour address: ${toUserFriendlyAddress(
        connector.wallet!.account.address,
        connector.wallet!.account.chain === CHAIN.TESTNET
      )}`
    );
  });
};
