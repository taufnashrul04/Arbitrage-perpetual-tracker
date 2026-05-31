// Variational Protocol — Arbitrum perp DEX
// API: https://omni-client-api.prod.ap-northeast-1.variational.io/metadata/stats

export interface VariationalMarket {
  ticker: string;
  name: string;
  mark_price: number;
  volume_24h: number;
  open_interest: { long: number; short: number };
  funding_rate: number;       // decimal (e.g. 0.0001 = 0.01%)
  funding_interval_s: number; // seconds
  base_spread_bps: number;
}

export interface VariationalStats {
  total_volume_24h: number;
  cumulative_volume: number;
  tvl: number;
  open_interest: number;
  num_markets: number;
  listings: VariationalMarket[];
}

const BASE_URL = 'https://omni-client-api.prod.ap-northeast-1.variational.io';

export async function fetchVariationalFunding(): Promise<VariationalMarket[]> {
  try {
    const res = await fetch(`${BASE_URL}/metadata/stats`, {
      next: { revalidate: 60 }, // cache 60s
    });
    if (!res.ok) throw new Error(`Variational API ${res.status}`);
    const data: VariationalStats = await res.json();
    return data.listings || [];
  } catch (err) {
    console.error('[Variational] fetch error:', err);
    return [];
  }
}

// Normalize funding rate to 1h equivalent for comparison
export function normalizeFundingRate(rate: number, intervalSeconds: number): number {
  if (intervalSeconds <= 0) return 0;
  const intervalsPerHour = 3600 / intervalSeconds;
  return rate * intervalsPerHour;
}

// === VARIATIONAL POINTS SYSTEM ===
// $VAR token, 50% of supply for community, points program ends Q3 2026
// Points distributed every Friday at 0:00 UTC
// 3,000,000 points retroactively distributed at launch (Dec 17, 2025)
// Tier boost based on 30-day Total Volume (Personal + 0.2 × Referred)
// Pre-Dec 17 2025 traders get +10% retroactive boost
// Referral: 1 point per 10 points earned by referrals
// Referral USDC: flat 5% of spread paid by referrals

export const VARIATIONAL_TIERS = [
  { name: 'Iron',     volume30d: 0,          boost: 0 },
  { name: 'Bronze',   volume30d: 1_000_000,   boost: 0.005 },
  { name: 'Silver',   volume30d: 5_000_000,   boost: 0.01 },
  { name: 'Gold',     volume30d: 25_000_000,  boost: 0.02 },
  { name: 'Platinum', volume30d: 100_000_000, boost: 0.03 },
  { name: 'Diamond',  volume30d: 750_000_000, boost: 0.04 },
  { name: 'Infinity', volume30d: 2_500_000_000, boost: 0.05 },
];

export function getVariationalTier(volume30d: number): { name: string; boost: number; nextTier: string | null; progress: number } {
  let current = VARIATIONAL_TIERS[0];
  let nextTier: string | null = null;
  let progress = 0;

  for (let i = VARIATIONAL_TIERS.length - 1; i >= 0; i--) {
    if (volume30d >= VARIATIONAL_TIERS[i].volume30d) {
      current = VARIATIONAL_TIERS[i];
      nextTier = i < VARIATIONAL_TIERS.length - 1 ? VARIATIONAL_TIERS[i + 1].name : null;
      const nextVol = i < VARIATIONAL_TIERS.length - 1 ? VARIATIONAL_TIERS[i + 1].volume30d : current.volume30d * 2;
      const range = nextVol - current.volume30d;
      progress = range > 0 ? Math.min(((volume30d - current.volume30d) / range) * 100, 100) : 100;
      break;
    }
  }

  return { name: current.name, boost: current.boost, nextTier, progress };
}

export function estimateVariationalPoints(params: {
  weeklyVolume: number;       // USD traded this week
  tier30dVolume: number;      // 30-day rolling volume for tier
  isPreLaunchTrader: boolean; // traded before Dec 17, 2025
  referralPointsEarned: number; // points earned by referrals this week
}): { basePoints: number; tierBoost: number; retroBoost: number; referralPoints: number; totalPoints: number; tier: string } {
  // Base points: ~1 point per $10 volume (approximate, exact rate undisclosed)
  const basePoints = params.weeklyVolume / 10;

  // Tier boost
  const tier = getVariationalTier(params.tier30dVolume);
  const tierBoost = basePoints * tier.boost;

  // Retroactive boost (+10% for pre-launch traders)
  const retroBoost = params.isPreLaunchTrader ? basePoints * 0.10 : 0;

  // Referral points (1 per 10 earned by referrals)
  const referralPoints = params.referralPointsEarned / 10;

  const totalPoints = basePoints + tierBoost + retroBoost + referralPoints;

  return { basePoints, tierBoost, retroBoost, referralPoints, totalPoints, tier: tier.name };
}
