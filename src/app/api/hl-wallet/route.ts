import { NextResponse } from 'next/server';

const WALLET = '0x15001bf144586BDDdcfaa766F180e492CebDeAc2';

async function hlQuery(payload: Record<string, unknown>) {
  const res = await fetch('https://api.hyperliquid.xyz/info', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    next: { revalidate: 3 },
  });
  return res.json();
}

export async function GET() {
  try {
    const [state, fills, mids, portfolio, openOrders, userFunding] = await Promise.all([
      hlQuery({ type: 'clearinghouseState', user: WALLET }),
      hlQuery({ type: 'userFills', user: WALLET }),
      hlQuery({ type: 'allMids' }),
      hlQuery({ type: 'portfolio', user: WALLET }),
      hlQuery({ type: 'openOrders', user: WALLET }),
      hlQuery({ type: 'userFunding', user: WALLET }),
    ]);

    // ── Portfolio (reliable account value + PnL) ──
    let accountValue = 0;
    let portfolioPnl = 0;
    let volume24h = '0';
    const accountValueHistory: [number, number][] = [];
    const pnlHistory: [number, number][] = [];

    if (Array.isArray(portfolio)) {
      for (const [period, data] of portfolio) {
        if (period === 'day') {
          const av = data.accountValueHistory || [];
          const pl = data.pnlHistory || [];
          volume24h = data.vlm || '0';
          if (av.length > 0) accountValue = parseFloat(av[av.length - 1][1]);
          if (pl.length > 0) portfolioPnl = parseFloat(pl[pl.length - 1][1]);
          for (const [t, v] of av) accountValueHistory.push([t, parseFloat(v)]);
          for (const [t, v] of pl) pnlHistory.push([t, parseFloat(v)]);
        }
      }
    }

    // ── Positions from clearinghouseState ──
    const ms = state.marginSummary || {};
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

    // ── Fills ──
    const recentFills = (fills || [])
      .sort((a: { time: number }, b: { time: number }) => b.time - a.time)
      .slice(0, 200)
      .map((f: Record<string, unknown>) => ({
        coin: f.coin,
        side: f.side === 'A' ? 'SELL' : 'BUY',
        size: parseFloat(f.sz as string),
        price: parseFloat(f.px as string),
        time: f.time,
        value: parseFloat(f.sz as string) * parseFloat(f.px as string),
        closedPnl: f.closedPnl ? parseFloat(f.closedPnl as string) : 0,
        fee: f.fee ? parseFloat(f.fee as string) : 0,
        startPosition: f.startPosition ? parseFloat(f.startPosition as string) : 0,
      }));

    // ── Open Orders ──
    const orders = (openOrders || []).map((o: Record<string, unknown>) => ({
      coin: o.coin,
      side: o.side,
      sz: o.sz,
      limitPx: o.limitPx,
      orderType: o.orderType,
      timestamp: o.timestamp,
    }));

    // ── Funding History ──
    const funding = (userFunding || []).slice(0, 50).map((f: Record<string, unknown>) => ({
      time: f.time,
      coin: f.coin,
      usdc: f.usdc,
      type: f.type,
    }));

    // ── Unrealized PnL from positions ──
    const unrealizedPnl = positions.reduce((s: number, p: { pnl: number }) => s + p.pnl, 0);

    // ── Realized PnL from fills ──
    let realizedPnl = 0;
    for (const f of recentFills) {
      if (f.closedPnl !== 0) realizedPnl += f.closedPnl;
    }

    // ── Use portfolio PnL as source of truth if available ──
    const finalAccountValue = accountValue > 0 ? accountValue : parseFloat(ms.accountValue || '0');
    const finalTotalPnl = portfolioPnl !== 0 ? portfolioPnl : realizedPnl + unrealizedPnl;

    return NextResponse.json({
      wallet: WALLET,
      // Account value from portfolio (reliable)
      accountValue: finalAccountValue,
      // PnL from portfolio (reliable)
      totalPnl: finalTotalPnl,
      portfolioPnl,
      // Positions from clearinghouseState
      totalNotional: parseFloat(ms.totalNtlPos || '0'),
      marginUsed: parseFloat(ms.totalMarginUsed || '0'),
      withdrawable: parseFloat(state.withdrawable || '0'),
      positions,
      // Fills
      fills: recentFills,
      realizedPnl,
      unrealizedPnl,
      // Open orders
      orders,
      // Funding
      funding,
      // History for charts
      accountValueHistory,
      pnlHistory,
      volume24h,
      // Meta
      timestamp: Date.now(),
    });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
