// Decibel — fully on-chain perpetuals exchange on Aptos (Kraken-backed)
// API: api.mainnet.aptoslabs.com/decibel/api/v1/
// Auth: Geomi Bearer token + Origin header
// Points: "Amps" — multi-dimensional system (trading, streak, referral, vault)

export interface DecibelMarket {
  ticker: string;        // e.g. "BTC/USD"
  market_id: string;     // Aptos address
  mark_price: number;
  oracle_price: number;
  funding_rate: number;  // normalized to hourly
  funding_rate_bps: number; // raw bps
  volume_24h: number;
  open_interest: number;
  funding_period_s: number;
}

const API_BASE = 'https://api.mainnet.aptoslabs.com/decibel/api/v1';
const BEARER_TOKEN = process.env.DECIBEL_BEARER || '';

const headers = {
  'Origin': 'https://app.decibel.trade',
  'Authorization': `Bearer ${BEARER_TOKEN}`,
};

export async function fetchDecibelFunding(): Promise<DecibelMarket[]> {
  try {
    // Fetch both endpoints in parallel
    const [pricesRes, contextsRes] = await Promise.all([
      fetch(`${API_BASE}/prices`, { headers }),
      fetch(`${API_BASE}/asset_contexts`, { headers }),
    ]);

    if (!pricesRes.ok || !contextsRes.ok) {
      console.warn('[Decibel] API error:', pricesRes.status, contextsRes.status);
      return [];
    }

    const prices = await pricesRes.json();
    const contexts = await contextsRes.json();

    // Build market_id → ticker mapping from contexts
    // contexts has market as "TICKER/USD", prices has market as Aptos address
    // We need to match them by oracle price or index
    const contextByTicker: Record<string, any> = {};
    for (const c of contexts) {
      contextByTicker[c.market] = c;
    }

    // Build market list — prices data has funding info, contexts has tickers
    // Both are in the same order (API returns in consistent order)
    const markets: DecibelMarket[] = [];

    for (let i = 0; i < prices.length && i < contexts.length; i++) {
      const p = prices[i];
      const c = contexts[i];

      const fundingBps = p.funding_rate_bps || 0;
      const periodHours = (p.funding_period_s || 3600) / 3600;
      // funding_rate_bps is the rate per period in basis points
      // Convert to decimal per hour
      const sign = p.is_funding_positive ? 1 : -1;
      const fundingRate = sign * (fundingBps / 10000) / periodHours;

      markets.push({
        ticker: c.market,             // "BTC/USD"
        market_id: p.market,          // Aptos address
        mark_price: p.mark_px || 0,
        oracle_price: p.oracle_px || 0,
        funding_rate: fundingRate,    // per hour decimal
        funding_rate_bps: fundingBps, // raw bps
        volume_24h: c.volume_24h || 0,
        open_interest: p.open_interest || 0,
        funding_period_s: p.funding_period_s || 3600,
      });
    }

    return markets;
  } catch (err) {
    console.warn('[Decibel] fetch error:', err);
    return [];
  }
}

// === DECIBEL POINTS SYSTEM ===
// "Amps" — multi-dimensional: trading, streak, referral, vault
// $DCBL token confirmed, pre-TGE
// Points leaderboard: trading volume × streak multiplier × referral bonus
// Vault depositors earn amps proportional to vault share
// "Hz" = trading frequency metric

export interface DecibelPoints {
  total_amps: number;
  trading_amps: number;
  streak_amps: number;
  referral_amps: number;
  vault_amps: number;
}

// Estimate Decibel amps based on volume
// ~1 amp per $100 taker volume, streak multiplier up to 2x
export function estimateDecibelAmps(
  volumeUSD: number,
  streakDays: number,
  isTaker = true
): { amps: number; streakMultiplier: number } {
  const baseRate = isTaker ? 1 : 3; // maker gets 3x
  const baseAmps = (volumeUSD / 100) * baseRate;
  // Streak: 7 days = 1.5x, 30 days = 2x
  const streakMultiplier = Math.min(1 + streakDays * 0.02, 2.0);
  return {
    amps: baseAmps * streakMultiplier,
    streakMultiplier,
  };
}
