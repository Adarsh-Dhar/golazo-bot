import "dotenv/config";

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
    serviceLevelId: Number(process.env["TXLINE_SERVICE_LEVEL_ID"] ?? "1"),
    selectedLeagues: (process.env["TXLINE_SELECTED_LEAGUES"] ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .map(Number),
  },
};

// Network-specific endpoints/program IDs, mirrored from the TxLINE quickstart.
// Confirm these against /documentation/quickstart before going live — these
// values move independently of this codebase.
export const TXLINE_NETWORKS = {
  mainnet: {
    rpcUrl: "https://api.mainnet-beta.solana.com",
    apiOrigin: "https://txline.txodds.com",
    programId: "9ExbZjAapQww1vfcisDmrngPinHTEfpjYRWMunJgcKaA",
    txlTokenMint: "Zhw9TVKp68a1QrftncMSd6ELXKDtpVMNuMGr1jNwdeL",
  },
  devnet: {
    rpcUrl: "https://api.devnet.solana.com",
    apiOrigin: "https://txline-dev.txodds.com",
    programId: "6pW64gN1s2uqjHkn1unFeEjAwJkPGHoppGvS715wyP2J",
    txlTokenMint: "4Zao8ocPhmMgq7PdsYWyxvqySMGx7xb9cMftPMkEokRG",
  },
} as const;
