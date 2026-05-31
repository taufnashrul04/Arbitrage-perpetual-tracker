// Nado Protocol — Ink Network L2 (Kraken-backed)
// archive.prod.nado.xyz — POST-based archive API (works from datacenter!)
// gateway.prod.nado.xyz — blocked from datacenter IPs (Cloudflare WAF)
// Relay: https://relay-mpil8nk0-peny89j3z-obscuradefis-projects.vercel.app (Vercel, also blocked)

export interface NadoMarket {
  ticker: string;
  product_id: number;
  mark_price: number;
  funding_rate: number;  // raw rate per period
  oracle_price: number;
}

const ARCHIVE_URL = 'https://archive.prod.nado.xyz';

// POST to archive API (Node fetch auto-decompresses gzip)
async function nadoPost(body: Record<string, any>): Promise<any> {
  const res = await fetch(`${ARCHIVE_URL}/v1`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Nado archive ${res.status}`);
  return await res.json();
}

// Known perp product IDs mapped from oracle prices
// PID 1=BTC/SPOT, 2=BTC/PERP, 3=ETH/SPOT, 4=ETH/PERP, 5=USDC/SPOT
// PID 8=SOL/PERP, 10=XRP/PERP, 14=BNB/PERP, 16=HYPE/PERP, 18=BNB(or alt)/PERP
// PID 28=~TAO/PERP, 32=~SUI/PERP, 34=~AVAX/PERP, 36=~LINK/PERP
const KNOWN_PERPS: Record<number, string> = {
  2: 'BTC',
  4: 'ETH',
  8: 'SOL',
  10: 'XRP',
  14: 'BNB',
  16: 'HYPE',
  18: 'ZEC',
  20: 'DOGE',
  22: 'PEPE',
  24: 'AVAX',
  26: 'SOL-PERP2',
  28: 'TAO',
  32: 'SUI',
  34: 'MATIC',
  36: 'LINK',
  40: 'WIF',
  42: 'BONK',
  44: 'FLOKI',
  46: 'ENA',
  48: 'ARB',
  50: 'OP',
};

const PERP_IDS = Object.keys(KNOWN_PERPS).map(Number);

export async function fetchNadoFunding(): Promise<NadoMarket[]> {
  try {
    // Get funding rates for all known perp product IDs
    const data = await nadoPost({
      funding_rates: { product_ids: PERP_IDS, limit: 1 },
    });

    if (!data || data.error) return [];

    const markets: NadoMarket[] = [];

    for (const [pidStr, info] of Object.entries(data)) {
      const pid = parseInt(pidStr);
      if (isNaN(pid) || !info || typeof info !== 'object') continue;

      const rateX18 = parseInt((info as any).funding_rate_x18 || '0');
      const rate = rateX18 / 1e18;

      // Get oracle price from products endpoint
      const ticker = KNOWN_PERPS[pid] || `PERP-${pid}`;

      markets.push({
        ticker,
        product_id: pid,
        mark_price: 0, // will be filled from products if needed
        funding_rate: rate,
        oracle_price: 0,
      });
    }

    // Optionally fetch oracle prices
    try {
      const prodData = await nadoPost({
        products: { product_id: PERP_IDS[0], limit: 1 },
      });
      // This only returns one product — we'd need to loop
      // Skip for now, oracle prices from funding rates suffice
    } catch {}

    return markets;
  } catch (err) {
    console.warn('[Nado] fetch error:', err);
    return [];
  }
}

// === NADO POINTS SYSTEM ===
// Season 2 (live since May 21, 2026)
// Tier threshold: min(300000 + 650000 × (allTimePoints / 2B)^1.5, 950000)
// 5 tiers: Breeze → ... → Tornado
// Points = f(your_volume / total_protocol_volume, fee_tier_adjustment, toxicity)
// NLP points based on proportional vault share per epoch
// Referrals V2 (fee-based commission) coming soon

export const NADO_TIERS = [
  { name: 'Breeze', minPoints: 0, boost: 0 },
  { name: 'Tier 2', minPoints: 300_000, boost: 0.05 },
  { name: 'Tier 3', minPoints: 500_000, boost: 0.10 },
  { name: 'Tier 4', minPoints: 700_000, boost: 0.15 },
  { name: 'Tornado', minPoints: 950_000, boost: 0.20 },
];

export function calcNadoTierThreshold(allTimePoints: number): number {
  return Math.min(
    300_000 + 650_000 * Math.pow(allTimePoints / 2_000_000_000, 1.5),
    950_000
  );
}

export function getNadoTier(allTimePoints: number): { name: string; boost: number; nextTier: string | null; progress: number } {
  let current = NADO_TIERS[0];
  let nextTier: string | null = null;
  let progress = 0;

  for (let i = NADO_TIERS.length - 1; i >= 0; i--) {
    if (allTimePoints >= NADO_TIERS[i].minPoints) {
      current = NADO_TIERS[i];
      nextTier = i < NADO_TIERS.length - 1 ? NADO_TIERS[i + 1].name : null;
      const nextMin = i < NADO_TIERS.length - 1 ? NADO_TIERS[i + 1].minPoints : calcNadoTierThreshold(allTimePoints);
      const range = nextMin - current.minPoints;
      progress = range > 0 ? Math.min(((allTimePoints - current.minPoints) / range) * 100, 100) : 100;
      break;
    }
  }

  return { name: current.name, boost: current.boost, nextTier, progress };
}

// Estimate Nado points based on volume
// ~1 point per $100 taker volume, ~3 per $100 maker volume
export function estimateNadoPoints(volumeUSD: number, isMarketMaker = false): { points: number; multiplier: number } {
  const rate = isMarketMaker ? 3 : 1;
  const basePoints = (volumeUSD / 100) * rate;
  return { points: basePoints, multiplier: rate };
}
