import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { YieldSubscriptions } from "../target/types/yield_subscriptions";
import { 
  createMint, 
  getOrCreateAssociatedTokenAccount, 
  mintTo, 
  TOKEN_PROGRAM_ID 
} from "@solana/spl-token";
import { expect } from "chai";
import { PublicKey } from "@solana/web3.js";

describe("yield-subscriptions", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.YieldSubscriptions as Program<YieldSubscriptions>;
  const admin = provider.wallet.payer;
  const merchant = anchor.web3.Keypair.generate();
  const user = anchor.web3.Keypair.generate();

  let mint: PublicKey;
  let userAta: PublicKey;
  let merchantAta: PublicKey;

  // PDA seeds from constants.rs
  const SEEDS_CONFIG = Buffer.from("config");
  const SEEDS_PLAN = Buffer.from("plan");
  const SEEDS_SUB = Buffer.from("sub");
  const SEEDS_VAULT = Buffer.from("vault");

  const [globalConfigPda] = PublicKey.findProgramAddressSync(
    [SEEDS_CONFIG],
    program.programId
  );

  const [merchantPlanPda] = PublicKey.findProgramAddressSync(
    [SEEDS_PLAN, merchant.publicKey.toBuffer()],
    program.programId
  );

  const [vaultPda] = PublicKey.findProgramAddressSync(
    [SEEDS_VAULT, merchantPlanPda.toBuffer()],
    program.programId
  );

  const [userSubscriptionPda] = PublicKey.findProgramAddressSync(
    [SEEDS_SUB, merchantPlanPda.toBuffer(), user.publicKey.toBuffer()],
    program.programId
  );

  before(async () => {
    // Top up merchant and user
    const signature = await provider.connection.requestAirdrop(merchant.publicKey, 2 * anchor.web3.LAMPORTS_PER_SOL);
    await provider.connection.confirmTransaction(signature);
    
    const signatureUser = await provider.connection.requestAirdrop(user.publicKey, 2 * anchor.web3.LAMPORTS_PER_SOL);
    await provider.connection.confirmTransaction(signatureUser);

    // Create Mint
    mint = await createMint(
      provider.connection,
      admin,
      admin.publicKey,
      null,
      6
    );

    // Create ATAs
    merchantAta = (await getOrCreateAssociatedTokenAccount(
      provider.connection,
      admin,
      mint,
      merchant.publicKey
    )).address;

    userAta = (await getOrCreateAssociatedTokenAccount(
      provider.connection,
      admin,
      mint,
      user.publicKey
    )).address;

    // Mint tokens to user
    await mintTo(
      provider.connection,
      admin,
      mint,
      userAta,
      admin,
      1000 * 10 ** 6 // 1000 tokens
    );
  });

  it("Initializes Global Config", async () => {
    await program.methods
      .initializeConfig(admin.publicKey, 1000, 100) // 10% yield, 1% fee
      .accounts({
        // globalConfig is PDA, payer is admin
        payer: admin.publicKey,
      })
      .rpc();

    const config = await program.account.globalConfig.fetch(globalConfigPda);
    expect(config.annualYieldBps).to.equal(1000);
    expect(config.admin.toBase58()).to.equal(admin.publicKey.toBase58());
  });

  it("Creates a Merchant Plan", async () => {
    const pricePerPeriod = new anchor.BN(10 * 10 ** 6); // 10 tokens
    const periodSeconds = new anchor.BN(1); // 1 second for fast testing
    const minDeposit = new anchor.BN(50 * 10 ** 6); // 50 tokens

    await program.methods
      .createPlan(pricePerPeriod, periodSeconds, minDeposit)
      .accounts({
        merchant: merchant.publicKey,
        merchantTokenMint: mint,
        globalConfig: globalConfigPda,
      })
      .signers([merchant])
      .rpc();

    const plan = await program.account.merchantPlan.fetch(merchantPlanPda);
    expect(plan.merchant.toBase58()).to.equal(merchant.publicKey.toBase58());
    expect(plan.pricePerPeriod.toNumber()).to.equal(pricePerPeriod.toNumber());
  });

  it("User Subscribes", async () => {
    const depositAmount = new anchor.BN(100 * 10 ** 6); // 100 tokens

    await program.methods
      .subscribe(depositAmount)
      .accounts({
        user: user.publicKey,
        merchantPlan: merchantPlanPda,
        vault: vaultPda,
        userTokenAccount: userAta,
      })
      .signers([user])
      .rpc();

    const sub = await program.account.userSubscription.fetch(userSubscriptionPda);
    expect(sub.user.toBase58()).to.equal(user.publicKey.toBase58());
    expect(sub.principalDeposit.toNumber()).to.equal(depositAmount.toNumber());
    expect(sub.status).to.equal(0); // Active
  });

  it("Settles Subscription", async () => {
    // Wait for 2 seconds to ensure a period has passed
    await new Promise(resolve => setTimeout(resolve, 2000));

    await program.methods
      .settle()
      .accounts({
        globalConfig: globalConfigPda,
        merchantPlan: merchantPlanPda,
        userSubscription: userSubscriptionPda,
        planVault: vaultPda,
        merchantTokenAccount: merchantAta,
      })
      .rpc();

    const sub = await program.account.userSubscription.fetch(userSubscriptionPda);
    const merchantBalance = await provider.connection.getTokenAccountBalance(merchantAta);
    
    // Price was 10, waited 2 seconds -> should have settled at least 1 or 2 periods (20 tokens)
    expect(Number(merchantBalance.value.amount)).to.be.at.least(10 * 10 ** 6);
    expect(sub.principalRemaining.toNumber()).to.be.lessThan(100 * 10 ** 6);
  });

  it("Cancels Subscription", async () => {
    await program.methods
      .cancel()
      .accounts({
        user: user.publicKey,
        globalConfig: globalConfigPda,
        userSubscription: userSubscriptionPda,
        plan: merchantPlanPda,
        planVault: vaultPda,
        userTokenAccount: userAta,
        merchantTokenAccount: merchantAta,
      })
      .signers([user])
      .rpc();

    const sub = await program.account.userSubscription.fetch(userSubscriptionPda);
    expect(sub.status).to.equal(1); // Canceled
    expect(sub.principalRemaining.toNumber()).to.equal(0);
  });
});
