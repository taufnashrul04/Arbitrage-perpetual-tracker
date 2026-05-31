// Hyperliquid — L1 perp DEX
// API: POST https://api.hyperliquid.xyz/info

export interface HyperliquidMarket {
  name: string;
  mark_price: number;
  funding_rate: number;  // per 1h
  volume_24h: number;
  open_interest: number;
}

export async function fetchHyperliquidFunding(): Promise<HyperliquidMarket[]> {
  try {
    const res = await fetch('https://api.hyperliquid.xyz/info', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'metaAndAssetCtxs' }),
      next: { revalidate: 60 },
    });
    if (!res.ok) throw new Error(`Hyperliquid API ${res.status}`);
    const data = await res.json();
    const meta = data[0]?.universe || [];
    const ctxs = data[1] || [];

    return meta.map((m: any, i: number) => {
      const ctx = ctxs[i] || {};
      return {
        name: m.name,
        mark_price: parseFloat(ctx.markPx || '0'),
        funding_rate: parseFloat(ctx.funding || '0'), // already per 1h
        volume_24h: parseFloat(ctx.dayNtlVlm || '0'),
        open_interest: parseFloat(ctx.openInterest || '0'),
      };
    }).filter((m: HyperliquidMarket) => m.mark_price > 0);
  } catch (err) {
    console.error('[Hyperliquid] fetch error:', err);
    return [];
  }
}
