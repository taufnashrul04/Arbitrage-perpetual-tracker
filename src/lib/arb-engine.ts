// Core arbitrage engine — compares funding rates across DEXes
// Finds delta-neutral opportunities (long on one, short on another)

export interface FundingData {
  dex: string;
  ticker: string;           // normalized ticker (e.g. "XAU", "BTC", "ETH")
  mark_price: number;
  funding_rate_1h: number;  // normalized to 1h rate
  volume_24h: number;
  raw_rate: number;         // original rate before normalization
  interval_seconds: number;
}

export interface ArbOpportunity {
  pair: string;
  longDex: string;          // dex to go long (negative funding = earn)
  shortDex: string;         // dex to go short (positive funding = earn)
  longRate: number;         // 1h rate on long side
  shortRate: number;        // 1h rate on short side
  netRate: number;          // combined earn per hour (short_rate - long_rate)
  netRateAnnualized: number; // annualized %
  estimatedDaily: number;   // per $1000 position
  confidence: 'high' | 'medium' | 'low';
  longPrice: number;
  shortPrice: number;
}

// Normalize ticker names across DEXes
const TICKER_ALIASES: Record<string, string> = {
    'BTC-PERP': 'BTC', 'ETH-PERP': 'ETH', 'SOL-PERP': 'SOL',
    'BTC/USD': 'BTC', 'ETH/USD': 'ETH', 'SOL/USD': 'SOL',
    'BTC/USDC': 'BTC', 'ETH/USDC': 'ETH', 'SOL/USDC': 'SOL',
    'BNB/USDC': 'BNB', 'HYPE/USDC': 'HYPE', 'XRP/USDC': 'XRP',
    'TAO/USDC': 'TAO', 'ZEC/USDC': 'ZEC', 'DOGE/USDC': 'DOGE',
    'SUI/USDC': 'SUI', 'AVAX/USDC': 'AVAX', 'TON/USDC': 'TON',
    'XAU/USD': 'XAU', 'XAUUSD': 'XAU',
  'XAG/USD': 'XAG', 'XAGUSD': 'XAG',
  'CL': 'CRUDE', 'WTI': 'CRUDE', 'CRUDE': 'CRUDE',
  'COPPER': 'COPPER',
  'SPCX': 'SPCX', 'SPACEX': 'SPCX',
};

export function normalizeTicker(ticker: string): string {
  const upper = ticker.toUpperCase().trim();
  if (TICKER_ALIASES[upper]) return TICKER_ALIASES[upper];
  // Strip /USDC, /USD, -PERP suffixes
  return upper
    .replace(/\/USDC$/i, '')
    .replace(/\/USD$/i, '')
    .replace(/[-_/]PERP$/i, '')
    .replace(/^1000/, ''); // 1000BONK → BONK
}

// Main arb finder
export function findArbOpportunities(data: FundingData[]): ArbOpportunity[] {
  // Group by normalized ticker
  const byTicker = new Map<string, FundingData[]>();
  for (const item of data) {
    const key = normalizeTicker(item.ticker);
    if (!byTicker.has(key)) byTicker.set(key, []);
    byTicker.get(key)!.push(item);
  }

  const opps: ArbOpportunity[] = [];

  for (const [ticker, markets] of byTicker) {
    if (markets.length < 2) continue;

    // Sort by funding rate (lowest first)
    markets.sort((a, b) => a.funding_rate_1h - b.funding_rate_1h);

    // Best arb: long on lowest funding (or most negative), short on highest
    const lowest = markets[0];
    const highest = markets[markets.length - 1];

    if (lowest.dex === highest.dex) continue;

    const netRate = highest.funding_rate_1h - lowest.funding_rate_1h;
    if (netRate <= 0) continue; // no arb

    const netRateAnnualized = netRate * 24 * 365 * 100; // % per year
    const estimatedDaily = (netRate * 24) * 1000; // per $1000

    // Confidence based on rate spread
    let confidence: 'high' | 'medium' | 'low' = 'low';
    if (netRateAnnualized > 50) confidence = 'high';
    else if (netRateAnnualized > 15) confidence = 'medium';

    opps.push({
      pair: ticker,
      longDex: lowest.dex,
      shortDex: highest.dex,
      longRate: lowest.funding_rate_1h,
      shortRate: highest.funding_rate_1h,
      netRate,
      netRateAnnualized,
      estimatedDaily,
      confidence,
      longPrice: lowest.mark_price,
      shortPrice: highest.mark_price,
    });
  }

  // Sort by annualized rate (best first)
  opps.sort((a, b) => b.netRateAnnualized - a.netRateAnnualized);
  return opps;
}

// Format helpers
export function formatRate(rate: number): string {
  const pct = rate * 100;
  if (Math.abs(pct) < 0.001) return '0.000%';
  return `${pct >= 0 ? '+' : ''}${pct.toFixed(4)}%`;
}

export function formatAnnualized(rate: number): string {
  return `${rate >= 0 ? '+' : ''}${rate.toFixed(1)}%`;
}

export function formatUSD(n: number): string {
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
