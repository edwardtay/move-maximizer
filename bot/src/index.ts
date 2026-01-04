import { Telegraf, Context, Markup } from "telegraf";
import { message } from "telegraf/filters";
import dotenv from "dotenv";
import { AIService } from "./services/ai.js";
import { MovementService } from "./services/movement.js";
import { UserStore } from "./services/userStore.js";

dotenv.config();

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!);
const aiService = new AIService();
const movementService = new MovementService();
const userStore = new UserStore();

// Welcome message
bot.start(async (ctx) => {
  const welcomeMessage = `
Welcome to MoveFlow! Your AI-powered yield aggregator on Movement Network.

I can help you:
- View vault APYs and TVL
- Deposit and withdraw from vaults
- Check your portfolio performance
- Get AI-powered investment recommendations
- Explain DeFi strategies

Use the buttons below or just type your question!
`;

  await ctx.reply(welcomeMessage, {
    ...Markup.keyboard([
      ["Vaults", "My Portfolio"],
      ["Best APY", "Risk Analysis"],
      ["Help"],
    ]).resize(),
  });
});

// Main menu buttons
bot.hears("Vaults", async (ctx) => {
  const vaultsInfo = await movementService.getVaultsInfo();
  await ctx.reply(vaultsInfo, {
    parse_mode: "Markdown",
    ...Markup.inlineKeyboard([
      [Markup.button.callback("MOVE Maximizer", "vault_move")],
      [Markup.button.callback("Stable Yield", "vault_usdc")],
      [Markup.button.callback("ETH Optimizer", "vault_eth")],
    ]),
  });
});

bot.hears("My Portfolio", async (ctx) => {
  const userId = ctx.from?.id.toString();
  if (!userId) return;

  const wallet = userStore.getWallet(userId);
  if (!wallet) {
    await ctx.reply(
      "You haven't connected a wallet yet. Use /connect <wallet_address> to link your wallet.",
      { parse_mode: "Markdown" }
    );
    return;
  }

  const portfolio = await movementService.getPortfolio(wallet);
  await ctx.reply(portfolio, { parse_mode: "Markdown" });
});

bot.hears("Best APY", async (ctx) => {
  const bestApy = await movementService.getBestAPY();
  await ctx.reply(bestApy, { parse_mode: "Markdown" });
});

bot.hears("Risk Analysis", async (ctx) => {
  const userId = ctx.from?.id.toString();
  if (!userId) return;

  const wallet = userStore.getWallet(userId);
  const analysis = await aiService.getRiskAnalysis(wallet);
  await ctx.reply(analysis, { parse_mode: "Markdown" });
});

bot.hears("Help", async (ctx) => {
  const helpMessage = `
*MoveFlow Bot Commands*

*Wallet*
/connect <address> - Link your wallet
/disconnect - Unlink wallet

*Vaults*
/vaults - View all vaults
/vault <name> - View specific vault
/deposit <vault> <amount> - Deposit to vault
/withdraw <vault> <amount> - Withdraw from vault

*Portfolio*
/portfolio - View your positions
/pnl - Check profit/loss
/rewards - Check pending rewards

*AI Assistant*
Just type any question and I'll help you!

*Examples:*
- "What's the best vault for low risk?"
- "How does auto-compounding work?"
- "Should I deposit more into MOVE vault?"
`;

  await ctx.reply(helpMessage, { parse_mode: "Markdown" });
});

// Vault callbacks
bot.action("vault_move", async (ctx) => {
  const vaultInfo = await movementService.getVaultDetails("move");
  await ctx.editMessageText(vaultInfo, {
    parse_mode: "Markdown",
    ...Markup.inlineKeyboard([
      [
        Markup.button.callback("Deposit", "deposit_move"),
        Markup.button.callback("Withdraw", "withdraw_move"),
      ],
      [Markup.button.callback("Back to Vaults", "back_vaults")],
    ]),
  });
});

bot.action("vault_usdc", async (ctx) => {
  const vaultInfo = await movementService.getVaultDetails("usdc");
  await ctx.editMessageText(vaultInfo, {
    parse_mode: "Markdown",
    ...Markup.inlineKeyboard([
      [
        Markup.button.callback("Deposit", "deposit_usdc"),
        Markup.button.callback("Withdraw", "withdraw_usdc"),
      ],
      [Markup.button.callback("Back to Vaults", "back_vaults")],
    ]),
  });
});

bot.action("vault_eth", async (ctx) => {
  const vaultInfo = await movementService.getVaultDetails("eth");
  await ctx.editMessageText(vaultInfo, {
    parse_mode: "Markdown",
    ...Markup.inlineKeyboard([
      [
        Markup.button.callback("Deposit", "deposit_eth"),
        Markup.button.callback("Withdraw", "withdraw_eth"),
      ],
      [Markup.button.callback("Back to Vaults", "back_vaults")],
    ]),
  });
});

bot.action("back_vaults", async (ctx) => {
  const vaultsInfo = await movementService.getVaultsInfo();
  await ctx.editMessageText(vaultsInfo, {
    parse_mode: "Markdown",
    ...Markup.inlineKeyboard([
      [Markup.button.callback("MOVE Maximizer", "vault_move")],
      [Markup.button.callback("Stable Yield", "vault_usdc")],
      [Markup.button.callback("ETH Optimizer", "vault_eth")],
    ]),
  });
});

// Deposit/Withdraw actions
bot.action(/^deposit_(.+)$/, async (ctx) => {
  const vault = ctx.match[1];
  userStore.setContext(ctx.from!.id.toString(), { action: "deposit", vault });
  await ctx.reply(
    `Enter the amount to deposit into ${vault.toUpperCase()} vault:`,
    Markup.forceReply()
  );
});

bot.action(/^withdraw_(.+)$/, async (ctx) => {
  const vault = ctx.match[1];
  userStore.setContext(ctx.from!.id.toString(), { action: "withdraw", vault });
  await ctx.reply(
    `Enter the amount of shares to withdraw from ${vault.toUpperCase()} vault:`,
    Markup.forceReply()
  );
});

// Connect wallet command
bot.command("connect", async (ctx) => {
  const address = ctx.message.text.split(" ")[1];
  if (!address || !address.startsWith("0x")) {
    await ctx.reply("Please provide a valid wallet address: /connect 0x...");
    return;
  }

  const userId = ctx.from?.id.toString();
  if (!userId) return;

  userStore.setWallet(userId, address);
  await ctx.reply(
    `Wallet connected: \`${address.slice(0, 8)}...${address.slice(-6)}\`\n\nYou can now view your portfolio and interact with vaults!`,
    { parse_mode: "Markdown" }
  );
});

// Disconnect wallet command
bot.command("disconnect", async (ctx) => {
  const userId = ctx.from?.id.toString();
  if (!userId) return;

  userStore.removeWallet(userId);
  await ctx.reply("Wallet disconnected successfully.");
});

// AI-powered message handler for natural language
bot.on(message("text"), async (ctx) => {
  const userId = ctx.from?.id.toString();
  if (!userId) return;

  const text = ctx.message.text;

  // Check if user is in a context (deposit/withdraw flow)
  const context = userStore.getContext(userId);
  if (context) {
    const amount = parseFloat(text);
    if (isNaN(amount) || amount <= 0) {
      await ctx.reply("Please enter a valid amount.");
      return;
    }

    const wallet = userStore.getWallet(userId);
    if (!wallet) {
      await ctx.reply("Please connect your wallet first: /connect <address>");
      userStore.clearContext(userId);
      return;
    }

    if (context.action === "deposit") {
      const result = await movementService.prepareDeposit(
        wallet,
        context.vault,
        amount
      );
      await ctx.reply(result, { parse_mode: "Markdown" });
    } else if (context.action === "withdraw") {
      const result = await movementService.prepareWithdraw(
        wallet,
        context.vault,
        amount
      );
      await ctx.reply(result, { parse_mode: "Markdown" });
    }

    userStore.clearContext(userId);
    return;
  }

  // AI response for natural language queries
  await ctx.sendChatAction("typing");

  const wallet = userStore.getWallet(userId);
  const response = await aiService.chat(text, wallet);

  await ctx.reply(response, { parse_mode: "Markdown" });
});

// Error handling
bot.catch((err, ctx) => {
  console.error(`Error for ${ctx.updateType}:`, err);
  ctx.reply("Sorry, something went wrong. Please try again later.");
});

// Start bot
bot.launch().then(() => {
  console.log("MoveFlow Telegram Bot is running!");
});

// Enable graceful stop
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
