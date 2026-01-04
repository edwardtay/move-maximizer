"use client";

import { motion } from "framer-motion";
import { Bot, Send, Zap, Shield, TrendingUp, MessageCircle } from "lucide-react";
import { useState, useRef, useEffect } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const INITIAL_MESSAGES: Message[] = [
  {
    role: "assistant",
    content:
      "Hello! I'm your MoveFlow AI assistant. I can help you:\n\n" +
      "- Check vault APYs and TVL\n" +
      "- Deposit/withdraw from vaults\n" +
      "- Get portfolio recommendations\n" +
      "- Explain DeFi strategies\n\n" +
      "What would you like to do today?",
    timestamp: new Date(),
  },
];

const QUICK_ACTIONS = [
  { label: "Best APY vaults", query: "What are the best APY vaults right now?" },
  { label: "My portfolio", query: "Show me my portfolio summary" },
  { label: "Deposit MOVE", query: "I want to deposit MOVE tokens" },
  { label: "Risk analysis", query: "Analyze the risk of my current positions" },
];

export default function BotPage() {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const generateResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();

    if (lowerMessage.includes("apy") || lowerMessage.includes("best")) {
      return (
        "Here are the current best APY vaults:\n\n" +
        "1. **DeFi Index** - 22.5% APY (High Risk)\n" +
        "2. **ETH Optimizer** - 15.8% APY (Medium Risk)\n" +
        "3. **MOVE Maximizer** - 12.5% APY (Low Risk)\n\n" +
        "Would you like me to explain any of these strategies in detail?"
      );
    }

    if (lowerMessage.includes("portfolio") || lowerMessage.includes("summary")) {
      return (
        "**Your Portfolio Summary**\n\n" +
        "Total Value: **$16,445**\n" +
        "Total P&L: **+$1,445** (+9.6%)\n\n" +
        "**Positions:**\n" +
        "- MOVE Maximizer: $5,625 (+12.5%)\n" +
        "- Stable Yield: $10,820 (+8.2%)\n\n" +
        "Your portfolio is performing well! Would you like recommendations to optimize further?"
      );
    }

    if (lowerMessage.includes("deposit")) {
      return (
        "I can help you deposit into a vault. Here's how:\n\n" +
        "1. Choose a vault from our options\n" +
        "2. Enter the amount you want to deposit\n" +
        "3. Approve the transaction in your wallet\n\n" +
        "Which vault would you like to deposit into?\n" +
        "- MOVE Maximizer (12.5% APY)\n" +
        "- Stable Yield (8.2% APY)\n" +
        "- ETH Optimizer (15.8% APY)"
      );
    }

    if (lowerMessage.includes("risk") || lowerMessage.includes("analyze")) {
      return (
        "**Risk Analysis of Your Portfolio**\n\n" +
        "Overall Risk Score: **3.2/10** (Low-Medium)\n\n" +
        "**Breakdown:**\n" +
        "- MOVE Maximizer: Low Risk (2/10)\n" +
        "  - Uses staking + LP farming\n" +
        "  - Audited protocols only\n\n" +
        "- Stable Yield: Very Low Risk (1/10)\n" +
        "  - Stablecoin lending\n" +
        "  - Over-collateralized positions\n\n" +
        "**Recommendation:** Your portfolio is well-diversified. Consider adding a small allocation to higher APY vaults for better returns."
      );
    }

    if (lowerMessage.includes("withdraw")) {
      return (
        "To withdraw from a vault:\n\n" +
        "1. Go to the Portfolio page\n" +
        "2. Click 'Withdraw' on the position you want to exit\n" +
        "3. Enter the amount of shares to withdraw\n" +
        "4. Confirm the transaction\n\n" +
        "Note: A 0.1% withdrawal fee applies. Would you like me to guide you through a specific withdrawal?"
      );
    }

    return (
      "I understand you're asking about: " +
      userMessage +
      "\n\n" +
      "I can help you with:\n" +
      "- Vault information and APYs\n" +
      "- Portfolio management\n" +
      "- Deposits and withdrawals\n" +
      "- Risk analysis\n" +
      "- DeFi strategy explanations\n\n" +
      "Could you be more specific about what you'd like to know?"
    );
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    // Simulate AI response delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const assistantMessage: Message = {
      role: "assistant",
      content: generateResponse(input),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, assistantMessage]);
    setIsLoading(false);
  };

  const handleQuickAction = (query: string) => {
    setInput(query);
  };

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/20 mb-4">
            <Bot className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold mb-2">MoveFlow AI Agent</h1>
          <p className="text-gray-400">
            Your intelligent DeFi assistant on Movement Network
          </p>
        </motion.div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-3 gap-4 mb-8"
        >
          <div className="glass-card p-4 text-center">
            <Zap className="w-6 h-6 text-primary mx-auto mb-2" />
            <p className="text-sm text-gray-300">Instant Insights</p>
          </div>
          <div className="glass-card p-4 text-center">
            <Shield className="w-6 h-6 text-primary mx-auto mb-2" />
            <p className="text-sm text-gray-300">Risk Analysis</p>
          </div>
          <div className="glass-card p-4 text-center">
            <TrendingUp className="w-6 h-6 text-primary mx-auto mb-2" />
            <p className="text-sm text-gray-300">Yield Optimization</p>
          </div>
        </motion.div>

        {/* Chat Container */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card overflow-hidden"
        >
          {/* Messages */}
          <div className="h-[400px] overflow-y-auto p-6 space-y-4">
            {messages.map((message, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    message.role === "user"
                      ? "bg-primary text-black"
                      : "bg-accent text-gray-100"
                  }`}
                >
                  <p className="whitespace-pre-wrap text-sm">{message.content}</p>
                </div>
              </motion.div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-accent rounded-2xl px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:0.2s]" />
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Actions */}
          <div className="border-t border-gray-700 p-4">
            <div className="flex flex-wrap gap-2 mb-4">
              {QUICK_ACTIONS.map((action) => (
                <button
                  key={action.label}
                  onClick={() => handleQuickAction(action.query)}
                  className="px-3 py-1.5 bg-accent hover:bg-accent/80 rounded-full text-sm text-gray-300 transition-colors"
                >
                  {action.label}
                </button>
              ))}
            </div>

            {/* Input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSend()}
                placeholder="Ask me anything about DeFi..."
                className="flex-1 bg-accent border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-primary"
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                className="bg-primary text-black rounded-lg px-4 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-5 h-5" />
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Telegram CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8 text-center"
        >
          <p className="text-gray-400 mb-4">
            Want to manage your yields on the go?
          </p>
          <a
            href="https://t.me/MoveFlowBot"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-[#0088cc] text-white font-semibold px-6 py-3 rounded-lg hover:bg-[#0077b5] transition-colors"
          >
            <MessageCircle className="w-5 h-5" />
            Open in Telegram
          </a>
        </motion.div>
      </div>
    </div>
  );
}
