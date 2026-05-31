// RISEx — RISE chain, fully onchain orderbook
// api.rise.trade/v1/markets — public, no auth needed
// Backers: Galaxy Digital, Finality Capital, DACM, Vitalik Buterin

export interface RISExMarket {
  market_id: string;
  display_name: string;
  last_price: number;
  mark_price: number;
  index_price: number;
  current_funding_rate: number;
  funding_rate_8h: number;
  funding_interval_ns: number;
  quote_volume_24h: number;
  open_interest: number;
  change_24h: number;
  high_24h: number;
  low_24h: number;
}

const BASE_URL = 'https://api.rise.trade';

export async function fetchRISExFunding(): Promise<RISExMarket[]> {
  try {
    const res = await fetch(`${BASE_URL}/v1/markets`, { next: { revalidate: 60 } });
    if (!res.ok) throw new Error(`RISEx API ${res.status}`);
    const json = await res.json();
    const markets = json?.data?.markets || [];

    return markets
      .filter((m: any) => m.available && m.visible)
      .map((m: any) => ({
        market_id: m.market_id,
        display_name: m.display_name || m.base_asset_symbol,
        last_price: parseFloat(m.last_price || '0'),
        mark_price: parseFloat(m.mark_price || '0'),
        index_price: parseFloat(m.index_price || '0'),
        current_funding_rate: parseFloat(m.current_funding_rate || '0'),
        funding_rate_8h: parseFloat(m.funding_rate_8h || '0'),
        funding_interval_ns: parseInt(m.funding_interval || '3600000000000'),
        quote_volume_24h: parseFloat(m.quote_volume_24h || '0'),
        open_interest: parseFloat(m.open_interest || '0'),
        change_24h: parseFloat(m.change_24h || '0'),
        high_24h: parseFloat(m.high_24h || '0'),
        low_24h: parseFloat(m.low_24h || '0'),
      }));
  } catch (err) {
    console.error('[RISEx] fetch error:', err);
    return [];
  }
}

// RISEx funding_interval is in nanoseconds (typically 3600000000000 = 1 hour)
export function normalizeRISExFunding(rate: number, intervalNs: number): number {
  const intervalHours = intervalNs / 3600000000000;
  if (intervalHours <= 0) return rate;
  return rate / intervalHours;
}

// === RISEX POINTS SYSTEM ===
// No official points/token announced yet
// Testnet competition ended (7,000+ participants)
// Referral system: "Weighed Volume" = (Maker + Referred Maker) + 3×(Taker + Referred Taker)
// Early access phase — likely future airdrop for early traders
// Backers: Galaxy Digital, Finality Capital, DACM, Vitalik Buterin

export interface RISExPointsEstimate {
  weighedVolume: number;
  estimatedPoints: number;
  earlyAdopterBonus: boolean;
}

// Estimate RISEx engagement score based on Weighed Volume formula
export function estimateRISExPoints(params: {
  makerVolume: number;       // USD
  takerVolume: number;       // USD
  referredMakerVolume: number;
  referredTakerVolume: number;
}): RISExPointsEstimate {
  // Official formula from RISEx referral docs
  const weighedVolume =
    (params.makerVolume + params.referredMakerVolume) +
    3 * (params.takerVolume + params.referredTakerVolume);

  // No official points yet — estimate based on relative activity
  // Assume ~1 point per $10K weighed volume (rough estimate)
  const estimatedPoints = weighedVolume / 10_000;

  return {
    weighedVolume,
    estimatedPoints,
    earlyAdopterBonus: true, // pre-token traders likely get bonus
  };
}
