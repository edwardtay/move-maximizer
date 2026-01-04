import Anthropic from "@anthropic-ai/sdk";

const SYSTEM_PROMPT = `You are MoveFlow AI, an expert DeFi assistant for the Movement Network. You help users:
- Understand yield farming strategies
- Compare vault APYs and risks
- Make informed investment decisions
- Explain DeFi concepts in simple terms

Current vault information:
- MOVE Maximizer: 12.5% APY, Low Risk, TVL $2.5M, Strategies: Staking + LP Farming
- Stable Yield (USDC): 8.2% APY, Low Risk, TVL $1.8M, Strategies: Lending + LP
- ETH Optimizer: 15.8% APY, Medium Risk, TVL $3.2M, Strategies: LP Farming + Lending
- DeFi Index: 22.5% APY, High Risk, TVL $890K, Strategies: Multi-protocol farming

Movement Network Info:
- Chain ID: 250 (Testnet)
- Native token: MOVE
- Built on Move language (Aptos-compatible)

Be concise, helpful, and always consider user's risk tolerance. Format responses with markdown.`;

export class AIService {
  private client: Anthropic;

  constructor() {
    this.client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }

  async chat(userMessage: string, walletAddress?: string): Promise<string> {
    try {
      let contextMessage = userMessage;
      if (walletAddress) {
        contextMessage = `[User wallet: ${walletAddress}]\n\n${userMessage}`;
      }

      const response = await this.client.messages.create({
        model: "claude-3-haiku-20240307",
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: contextMessage,
          },
        ],
      });

      const textContent = response.content.find((c) => c.type === "text");
      return textContent?.text || "I couldn't process that request. Please try again.";
    } catch (error) {
      console.error("AI Service error:", error);
      return "I'm having trouble processing your request. Please try again later.";
    }
  }

  async getRiskAnalysis(walletAddress?: string): Promise<string> {
    if (!walletAddress) {
      return `*Risk Analysis*

Connect your wallet to get a personalized risk analysis.

*General DeFi Risk Factors:*
- Smart contract risk
- Impermanent loss (for LP positions)
- Market volatility
- Protocol security

Use /connect <address> to link your wallet.`;
    }

    const prompt = `Provide a risk analysis for a DeFi portfolio. The user has positions in MOVE Maximizer and Stable Yield vaults. Include:
1. Overall risk score (1-10)
2. Position-by-position analysis
3. Diversification assessment
4. Recommendations for risk management`;

    return this.chat(prompt, walletAddress);
  }

  async getRecommendation(
    riskTolerance: "low" | "medium" | "high",
    amount: number
  ): Promise<string> {
    const prompt = `A user wants to invest $${amount} with ${riskTolerance} risk tolerance. Recommend an allocation across our vaults:
- MOVE Maximizer: 12.5% APY, Low Risk
- Stable Yield: 8.2% APY, Low Risk
- ETH Optimizer: 15.8% APY, Medium Risk
- DeFi Index: 22.5% APY, High Risk

Provide specific allocation percentages and reasoning.`;

    return this.chat(prompt);
  }
}
