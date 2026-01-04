# Move Maximizer

Intelligent yield aggregator for Movement Network. Auto-rebalancing vault that optimizes risk-adjusted returns across integrated DeFi protocols.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Move Maximizer                           │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │   Meridian  │  │   Echelon   │  │ Liquidswap  │  Protocols  │
│  │   Staking   │  │   Lending   │  │     LP      │             │
│  │    40%      │  │    35%      │  │    25%      │             │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘             │
│         │                │                │                     │
│         └────────────────┼────────────────┘                     │
│                          │                                      │
│                 ┌────────▼────────┐                             │
│                 │  Strategy Router │  Allocation Logic          │
│                 └────────┬────────┘                             │
│                          │                                      │
│                 ┌────────▼────────┐                             │
│                 │   Vault Core    │  Share Accounting           │
│                 └────────┬────────┘                             │
│                          │                                      │
│         ┌────────────────┼────────────────┐                     │
│         │                │                │                     │
│    ┌────▼────┐     ┌─────▼─────┐    ┌────▼────┐                │
│    │ Deposit │     │  Harvest  │    │Withdraw │  User Actions  │
│    └─────────┘     └───────────┘    └─────────┘                │
└─────────────────────────────────────────────────────────────────┘
```

## Deployed Contract

| Property | Value |
|----------|-------|
| Address | `0xc227292511a7df4b728b91a03077b5556583fcc979c36e1043bbe7b102273857` |
| Network | Movement Testnet (Chain ID: 250) |
| Modules | `vault`, `strategy_router`, `rewards` |

## Strategy Allocation

| Strategy | Protocol | Allocation | Target APY | Risk |
|----------|----------|------------|------------|------|
| MOVE Staking | Meridian | 40% | 12.0% | Low |
| MOVE Supply | Echelon | 35% | 8.5% | Low |
| MOVE/USDC LP | Liquidswap | 25% | 15.0% | Medium |

**Weighted APY**: ~11.2%  
**Risk Score**: 2.9/10

## Protocol Integrations

| Protocol | Type | Integration |
|----------|------|-------------|
| [Meridian](https://app.meridian.money) | Liquid Staking | Network validation rewards |
| [Echelon](https://app.echelon.market) | Money Market | Isolated lending pools |
| [Liquidswap](https://liquidswap.com) | AMM DEX | Concentrated liquidity LP |
| [MovePosition](https://testnet.moveposition.xyz) | Lending | Adaptive rate lending |
| [Canopy](https://canopyhub.xyz) | Yield Aggregator | Meta-yield strategies |

## Contract Interface

### Entry Functions

```move
// Deposit assets, receive shares
public entry fun deposit<CoinType>(
    user: &signer,
    vault_addr: address,
    amount: u64
)

// Burn shares, receive assets (minus 0.1% fee)
public entry fun withdraw<CoinType>(
    user: &signer,
    vault_addr: address,
    shares: u64
)

// Compound accrued yield (10% performance fee)
public entry fun harvest<CoinType>(
    caller: &signer,
    vault_addr: address
)
```

### View Functions

```move
// Returns: (total_assets, total_shares, total_yield, is_paused, strategy_count)
public fun get_vault_info<CoinType>(vault_addr: address): (u64, u64, u64, bool, u64)

// Returns: (shares, deposit_time, total_deposited, total_withdrawn)
public fun get_user_position<CoinType>(user_addr: address): (u64, u64, u64, u64)

// Returns: asset value of shares
public fun get_share_value<CoinType>(vault_addr: address, shares: u64): u64
```

## Fee Structure

| Fee Type | Rate | Description |
|----------|------|-------------|
| Deposit | 0% | No entry fee |
| Withdrawal | 0.1% | Prevents MEV/arbitrage |
| Performance | 10% | On harvested yield only |

## Technical Stack

| Layer | Technology |
|-------|------------|
| Smart Contracts | Move (Aptos-compatible) |
| Frontend | Next.js 14, TypeScript |
| Styling | TailwindCSS, Framer Motion |
| Chain SDK | @aptos-labs/ts-sdk |
| Wallet | Nightly (Movement-compatible) |

## Local Development

```bash
# Install dependencies
cd frontend && npm install

# Run development server
npm run dev

# Build for production
npm run build
```

## Network Configuration

```typescript
const config = {
  rpc: "https://testnet.movementnetwork.xyz/v1",
  chainId: 250,
  explorer: "https://explorer.movementnetwork.xyz",
  faucet: "https://faucet.movementnetwork.xyz"
};
```

## Security Model

- **Non-custodial**: Users retain ownership via share tokens
- **Isolated strategies**: Protocol failures don't cascade
- **Admin controls**: Limited to pause/unpause, no fund access
- **Withdrawal fee**: Prevents flash loan attacks

## Rebalancing Logic

The vault implements APY-weighted rebalancing:

1. Monitor APY across integrated protocols
2. Calculate optimal allocation based on risk-adjusted returns
3. Shift allocation when APY differential exceeds threshold
4. Execute rebalance via strategy router

Current implementation uses static allocation with manual rebalance triggers. Future versions will implement automated rebalancing via keeper network.

## License

MIT
