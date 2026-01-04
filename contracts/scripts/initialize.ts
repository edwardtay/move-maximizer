/**
 * Initialize MoveFlow contracts after deployment
 * Run with: npx tsx scripts/initialize.ts
 */

import { Aptos, AptosConfig, Network, Account, Ed25519PrivateKey } from "@aptos-labs/ts-sdk";

const MOVEMENT_RPC = "https://testnet.movementnetwork.xyz/v1";

// Update these after deployment
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || "0x...";
const PRIVATE_KEY = process.env.PRIVATE_KEY || "";

async function main() {
  const config = new AptosConfig({
    network: Network.CUSTOM,
    fullnode: MOVEMENT_RPC,
  });

  const client = new Aptos(config);

  // Create account from private key
  const privateKey = new Ed25519PrivateKey(PRIVATE_KEY);
  const account = Account.fromPrivateKey({ privateKey });

  console.log("Initializing MoveFlow contracts...");
  console.log("Account:", account.accountAddress.toString());

  // 1. Initialize Vault Registry
  console.log("\n1. Initializing Vault Registry...");
  const initRegistryTx = await client.transaction.build.simple({
    sender: account.accountAddress,
    data: {
      function: `${CONTRACT_ADDRESS}::vault::initialize_registry`,
      functionArguments: [],
    },
  });

  const registryResult = await client.signAndSubmitTransaction({
    signer: account,
    transaction: initRegistryTx,
  });
  console.log("Registry TX:", registryResult.hash);

  // 2. Create MOVE Vault
  console.log("\n2. Creating MOVE Vault...");
  const createVaultTx = await client.transaction.build.simple({
    sender: account.accountAddress,
    data: {
      function: `${CONTRACT_ADDRESS}::vault::create_vault`,
      typeArguments: ["0x1::aptos_coin::AptosCoin"],
      functionArguments: [
        100000000, // min_deposit: 1 MOVE (8 decimals)
      ],
    },
  });

  const vaultResult = await client.signAndSubmitTransaction({
    signer: account,
    transaction: createVaultTx,
  });
  console.log("Vault TX:", vaultResult.hash);

  // 3. Initialize Strategy Router
  console.log("\n3. Initializing Strategy Router...");
  const initRouterTx = await client.transaction.build.simple({
    sender: account.accountAddress,
    data: {
      function: `${CONTRACT_ADDRESS}::strategy_router::initialize`,
      typeArguments: ["0x1::aptos_coin::AptosCoin"],
      functionArguments: [
        500, // rebalance_threshold: 5%
      ],
    },
  });

  const routerResult = await client.signAndSubmitTransaction({
    signer: account,
    transaction: initRouterTx,
  });
  console.log("Router TX:", routerResult.hash);

  // 4. Add strategies to router
  console.log("\n4. Adding strategies...");

  const strategies = [
    { name: "Staking", type: 3, apy: 800, risk: 2 },
    { name: "LP Farming", type: 1, apy: 1200, risk: 4 },
    { name: "Lending", type: 2, apy: 600, risk: 3 },
  ];

  for (const strategy of strategies) {
    const addStrategyTx = await client.transaction.build.simple({
      sender: account.accountAddress,
      data: {
        function: `${CONTRACT_ADDRESS}::strategy_router::add_protocol`,
        typeArguments: ["0x1::aptos_coin::AptosCoin"],
        functionArguments: [
          account.accountAddress.toString(), // router_addr
          strategy.name,
          strategy.type,
          account.accountAddress.toString(), // protocol address (mock)
          strategy.apy, // APY in bps
          strategy.risk, // risk score
        ],
      },
    });

    const strategyResult = await client.signAndSubmitTransaction({
      signer: account,
      transaction: addStrategyTx,
    });
    console.log(`Added ${strategy.name}:`, strategyResult.hash);
  }

  // 5. Initialize Rewards
  console.log("\n5. Initializing Rewards...");
  const initRewardsTx = await client.transaction.build.simple({
    sender: account.accountAddress,
    data: {
      function: `${CONTRACT_ADDRESS}::rewards::initialize_flow_token`,
      functionArguments: [],
    },
  });

  const rewardsResult = await client.signAndSubmitTransaction({
    signer: account,
    transaction: initRewardsTx,
  });
  console.log("Rewards TX:", rewardsResult.hash);

  console.log("\n========================================");
  console.log("Initialization Complete!");
  console.log("========================================");
  console.log("\nContract Address:", CONTRACT_ADDRESS);
  console.log("Explorer: https://explorer.movementnetwork.xyz/account/" + CONTRACT_ADDRESS);
}

main().catch(console.error);
