import axios from "axios";
import fs from "node:fs";
import nacl from "tweetnacl";
import * as anchor from "@coral-xyz/anchor";
import { Connection, Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
  createAssociatedTokenAccountIdempotentInstruction,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
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
 * Real free-tier flow per /documentation/worldcup:
 *   1. Subscribe on-chain (program.methods.subscribe) -- zero TxL cost for
 *      service levels 1/12, but still a real transaction, so the wallet
 *      needs a small amount of SOL for gas (devnet SOL is free via faucet).
 *   2. Sign an activation message locally with the same keypair.
 *   3. POST to /api/token/activate to get the API token.
 *
 * The IDL isn't bundled with this repo -- rather than fabricate one, this
 * fetches it directly from the chain via Program.fetchIdl(), which works
 * for any Anchor program that published its IDL on-chain via a standard
 * `anchor deploy` (the common case). If this throws "IDL not found", the
 * IDL needs to be sourced separately from TxODDS and swapped in here.
 */
export async function activateTxLineFreeTier(): Promise<TxLineCredentials> {
  const net = TXLINE_NETWORKS[config.txline.network];
  const keypair = loadKeypair(config.txline.solanaKeypairPath);
  const wallet = new anchor.Wallet(keypair);

  const connection = new Connection(net.rpcUrl, "confirmed");
  const provider = new anchor.AnchorProvider(connection, wallet, {
    commitment: "confirmed",
  });
  anchor.setProvider(provider);

  const idl = await anchor.Program.fetchIdl(net.programId, provider);
  if (!idl) {
    throw new Error(
      `Could not fetch IDL on-chain for program ${net.programId.toBase58()} on ${config.txline.network}. ` +
        `The program may not publish its IDL on-chain -- source idl/txoracle.json from TxODDS directly ` +
        `and load it here instead of using fetchIdl().`
    );
  }
  const program = new anchor.Program(idl, provider);

  // --- Step 1: subscribe on-chain ---
  const SERVICE_LEVEL_ID = config.txline.serviceLevelId;
  const DURATION_WEEKS = config.txline.durationWeeks;
  const SELECTED_LEAGUES = config.txline.selectedLeagues;

  const [tokenTreasuryPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("token_treasury_v2")],
    program.programId
  );
  const tokenTreasuryVault = getAssociatedTokenAddressSync(
    net.txlTokenMint,
    tokenTreasuryPda,
    true,
    TOKEN_2022_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  );
  const [pricingMatrixPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("pricing_matrix")],
    program.programId
  );
  const userTokenAccount = getAssociatedTokenAddressSync(
    net.txlTokenMint,
    provider.wallet.publicKey,
    false,
    TOKEN_2022_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  );

  // subscribe() expects userTokenAccount to already exist (Anchor Account<T>,
  // not init_if_needed). Free tier costs 0 TxL but still references the ATA.
  const createUserAtaIx = createAssociatedTokenAccountIdempotentInstruction(
    provider.wallet.publicKey,
    userTokenAccount,
    provider.wallet.publicKey,
    net.txlTokenMint,
    TOKEN_2022_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  );

  const txSig: string = await program.methods
    .subscribe(SERVICE_LEVEL_ID, DURATION_WEEKS)
    .accounts({
      user: provider.wallet.publicKey,
      pricingMatrix: pricingMatrixPda,
      tokenMint: net.txlTokenMint,
      userTokenAccount,
      tokenTreasuryVault,
      tokenTreasuryPda,
      tokenProgram: TOKEN_2022_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    })
    .preInstructions([createUserAtaIx])
    .rpc();

  console.log(`Subscribed on-chain (${config.txline.network}):`, txSig);

  // --- Step 2 + 3: guest JWT, sign activation message, activate ---
  const authResponse = await axios.post(`${net.apiOrigin}/auth/guest/start`);
  const jwt: string = authResponse.data.token;

  const messageString = `${txSig}:${SELECTED_LEAGUES.join(",")}:${jwt}`;
  const message = new TextEncoder().encode(messageString);
  const signatureBytes = nacl.sign.detached(message, keypair.secretKey);
  const walletSignature = Buffer.from(signatureBytes).toString("base64");

  const activationResponse = await axios.post(
    `${net.apiOrigin}/api/token/activate`,
    { txSig, walletSignature, leagues: SELECTED_LEAGUES },
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
