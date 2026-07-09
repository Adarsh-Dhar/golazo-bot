import "dotenv/config";
import { PublicKey } from "@solana/web3.js";

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not set in .env`);
  }
  return value;
}

export const config = {
  telegramBotToken: required("TELEGRAM_BOT_TOKEN"),

  txline: {
    network: (process.env["TXLINE_NETWORK"] ?? "devnet") as "mainnet" | "devnet",
    solanaKeypairPath: required("SOLANA_KEYPAIR_PATH"),
    // Devnet currently only documents service level 1 (60s-delay World Cup +
    // Int'l Friendlies, free). Service level 12 (real-time, free) is
    // documented as mainnet -- don't switch to 12 on devnet without checking
    // the on-chain pricing matrix first, per the docs' own warning.
    serviceLevelId: Number(process.env["TXLINE_SERVICE_LEVEL_ID"] ?? "1"),
    durationWeeks: Number(process.env["TXLINE_DURATION_WEEKS"] ?? "4"),
    selectedLeagues: (process.env["TXLINE_SELECTED_LEAGUES"] ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .map(Number),
  },
};

// Values copied verbatim from the TxLINE World Cup Free Tier docs
// (Quickstart + /documentation/worldcup, fetched 2026-07-09).
export const TXLINE_NETWORKS = {
  mainnet: {
    rpcUrl: "https://api.mainnet-beta.solana.com",
    apiOrigin: "https://txline.txodds.com",
    programId: new PublicKey("9ExbZjAapQww1vfcisDmrngPinHTEfpjYRWMunJgcKaA"),
    txlTokenMint: new PublicKey("Zhw9TVKp68a1QrftncMSd6ELXKDtpVMNuMGr1jNwdeL"),
  },
  devnet: {
    rpcUrl: "https://api.devnet.solana.com",
    apiOrigin: "https://txline-dev.txodds.com",
    programId: new PublicKey("6pW64gN1s2uqjHkn1unFeEjAwJkPGHoppGvS715wyP2J"),
    txlTokenMint: new PublicKey("4Zao8ocPhmMgq7PdsYWyxvqySMGx7xb9cMftPMkEokRG"),
  },
} as const;
