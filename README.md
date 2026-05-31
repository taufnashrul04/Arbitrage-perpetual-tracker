# Arbitrage Perpetual Tracker

Cross-DEX perpetual funding rate arbitrage dashboard with live wallet tracking.

## Features

- **Delta-Neutral Recommendations** — Cross-DEX funding arb opportunities
- **Funding Rates** — Real-time funding rates across Variational, Nado, RISEx, Decibel
- **Points Calculator** — Airdrop/points estimation for DeFi protocols
- **Live Wallet Tracker** — Real-time Hyperliquid wallet tracking (@onchainmonk $1K→$10K challenge)

## Supported DEXes

| DEX | Chain | Status |
|-----|-------|--------|
| Variational | Arbitrum | Live |
| Nado | Ink L2 | Live |
| RISEx | RISE Chain | Live |
| Decibel | Aptos | Live |

## Setup

```bash
npm install
npm run dev
```

## Environment Variables

```env
DECIBEL_BEARER=your_decibel_api_bearer_token
```

## Stack

- Next.js 16
- TypeScript
- Tailwind CSS
- Hyperliquid API
