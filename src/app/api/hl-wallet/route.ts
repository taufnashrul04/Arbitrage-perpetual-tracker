import { NextResponse } from 'next/server';

const WALLET = '0x15001bf144586BDDdcfaa766F180e492CebDeAc2';

async function hlQuery(payload: Record<string, unknown>) {
  const res = await fetch('https://api.hyperliquid.xyz/info', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    next: { revalidate: 5 },
  });
  return res.json();
}

export async function GET() {
  try {
    const [state, fills, mids] = await Promise.all([
      hlQuery({ type: 'clearinghouseState', user: WALLET }),
      hlQuery({ type: 'userFills', user: WALLET }),
      hlQuery({ type: 'allMids' }),
    ]);

    const ms = state.marginSummary;
    const positions = (state.assetPositions || []).map((ap: { position: Record<string, unknown> }) => {
      const p = ap.position;
      const coin = p.coin as string;
      const sz = parseFloat(p.szi as string);
      const entry = parseFloat(p.entryPx as string);
      const current = parseFloat((mids[coin] as string) || '0');
      const pnl = parseFloat(p.unrealizedPnl as string);
      const roe = parseFloat(p.returnOnEquity as string);
      const liq = p.liquidationPx ? parseFloat(p.liquidationPx as string) : null;
      const direction = sz > 0 ? 'LONG' : 'SHORT';
      const notional = Math.abs(sz) * current;
      const leverage = (p.leverage as { value: number }).value;
      const cumFunding = p.cumFunding ? parseFloat((p.cumFunding as { allTime: string }).allTime) : 0;
      const marginUsed = parseFloat(p.marginUsed as string);

      return { coin, direction, size: Math.abs(sz), entry, current, pnl, roe, liq, notional, leverage, marginUsed, cumFunding };
    }).filter((p: { size: number }) => p.size > 0);

    const recentFills = (fills || [])
      .sort((a: { time: number }, b: { time: number }) => b.time - a.time)
      .slice(0, 100)
      .map((f: Record<string, unknown>) => ({
        coin: f.coin,
        side: f.side === 'A' ? 'SELL' : 'BUY',
        size: parseFloat(f.sz as string),
        price: parseFloat(f.px as string),
        time: f.time,
        value: parseFloat(f.sz as string) * parseFloat(f.px as string),
        closedPnl: f.closedPnl ? parseFloat(f.closedPnl as string) : 0,
        fee: f.fee ? parseFloat(f.fee as string) : 0,
      }));

    const unrealizedPnl = positions.reduce((s: number, p: { pnl: number }) => s + p.pnl, 0);

    // Calculate realized PnL from fills
    let realizedPnl = 0;
    for (const f of recentFills) {
      if (f.closedPnl !== 0) realizedPnl += f.closedPnl;
    }

    return NextResponse.json({
      wallet: WALLET,
      accountValue: parseFloat(ms.accountValue),
      totalNotional: parseFloat(ms.totalNtlPos),
      marginUsed: parseFloat(ms.totalMarginUsed),
      withdrawable: parseFloat(ms.withdrawable),
      positions,
      fills: recentFills,
      realizedPnl,
      unrealizedPnl,
      totalPnl: realizedPnl + unrealizedPnl,
      timestamp: Date.now(),
    });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
