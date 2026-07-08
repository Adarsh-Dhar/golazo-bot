import axios from "axios";
import fs from "node:fs";
import nacl from "tweetnacl";
import { Keypair } from "@solana/web3.js";
import { config, TXLINE_NETWORKS } from "../config";

export interface TxLineCredentials {
  jwt: string;
  apiToken: string;
  apiOrigin: string;
}

function loadKeypair(path: string): Keypair {
  const raw = JSON.parse(fs.readFileSync(path, "utf-8"));
  return Keypair.fromSecretKey(Uint8Array.from(raw));
}

/**
 * Free-tier (World Cup / Int'l Friendlies) activation.
 *
 * IMPORTANT: this mirrors the documented flow (guest JWT -> sign -> activate),
 * but the free-tier path in /documentation/worldcup may skip the on-chain
 * `subscribe` call entirely for service levels 1/12 (no TxL to spend).
 * Verify against that page and adjust `txSig` handling below — if the free
 * tier really needs zero on-chain transaction, `txSig` may be a fixed
 * sentinel value or omitted. Treat this function as a starting point, not
 * a guaranteed-correct final implementation.
 */
export async function activateTxLineFreeTier(): Promise<TxLineCredentials> {
  const net = TXLINE_NETWORKS[config.txline.network];
  const keypair = loadKeypair(config.txline.solanaKeypairPath);

  // Step 1: guest JWT
  const authResponse = await axios.post(`${net.apiOrigin}/auth/guest/start`);
  const jwt: string = authResponse.data.token;

  // Step 2: sign the activation message.
  // For a paid subscription this signs `${txSig}:${leagues.join(",")}:${jwt}`
  // where txSig comes from the on-chain `subscribe` call. Confirm what the
  // free-tier docs expect here before relying on this in production.
  const txSig = "FREE_TIER"; // placeholder — replace per worldcup docs
  const leagues = config.txline.selectedLeagues;
  const messageString = `${txSig}:${leagues.join(",")}:${jwt}`;
  const message = new TextEncoder().encode(messageString);
  const signatureBytes = nacl.sign.detached(message, keypair.secretKey);
  const walletSignature = Buffer.from(signatureBytes).toString("base64");

  // Step 3: activate
  const activationResponse = await axios.post(
    `${net.apiOrigin}/api/token/activate`,
    { txSig, walletSignature, leagues },
    { headers: { Authorization: `Bearer ${jwt}` } }
  );

  const apiToken: string = activationResponse.data.token ?? activationResponse.data;

  return { jwt, apiToken, apiOrigin: net.apiOrigin };
}

export function authHeaders(creds: TxLineCredentials) {
  return {
    Authorization: `Bearer ${creds.jwt}`,
    "X-Api-Token": creds.apiToken,
  };
}
