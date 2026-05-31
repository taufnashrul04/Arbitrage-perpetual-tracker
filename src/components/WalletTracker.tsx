'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, TrendingUp, Wallet, Activity, ExternalLink, Clock, Zap } from 'lucide-react';

interface Position {
  coin: string;
  direction: 'LONG' | 'SHORT';
  size: number;
  entry: number;
  current: number;
  pnl: number;
  roe: number;
  liq: number | null;
  notional: number;
  leverage: number;
  marginUsed: number;
  cumFunding: number;
}

interface Fill {
  coin: string;
  side: 'BUY' | 'SELL';
  size: number;
  price: number;
  time: number;
  value: number;
  closedPnl: number;
  fee: number;
}

interface Order {
  coin: string;
  side: string;
  sz: string;
  limitPx: string;
  orderType: string;
  timestamp: number;
}

interface FundingEvent {
  time: number;
  coin: string;
  usdc: string;
  type: string;
}

interface WalletData {
  wallet: string;
  accountValue: number;
  totalPnl: number;
  portfolioPnl: number;
  totalNotional: number;
  marginUsed: number;
  withdrawable: number;
  positions: Position[];
  fills: Fill[];
  orders: Order[];
  funding: FundingEvent[];
  realizedPnl: number;
  unrealizedPnl: number;
  accountValueHistory: [number, number][];
  pnlHistory: [number, number][];
  volume24h: string;
  timestamp: number;
}

function fmt(n: number, d = 2) {
  return n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
}
function fmtU(n: number) {
  return (n >= 0 ? '+' : '-') + '$' + fmt(Math.abs(n));
}
function fmtTime(ts: number) {
  return new Date(ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
}
function fmtDateTime(ts: number) {
  return new Date(ts).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false });
}

export function WalletTracker() {
  const [data, setData] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState('');
  const [activeTab, setActiveTab] = useState<'positions' | 'trades' | 'orders' | 'funding'>('positions');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/hl-wallet');
      const json = await res.json();
      setData(json);
      setLastUpdate(new Date().toLocaleTimeString());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [fetchData]);

  if (!data) return <div className="flex items-center justify-center py-20 text-[#848e9c]"><RefreshCw className="h-4 w-4 animate-spin mr-2" /> Loading wallet data...</div>;

  const liqPct = (entry: number, liq: number | null, cur: number) => {
    if (!liq) return 0;
    return Math.min(100, Math.max(0, Math.abs(cur - entry) / Math.abs(liq - entry) * 100));
  };

  const pnlColor = (v: number) => v >= 0 ? '#00e676' : '#ff3d71';

  return (
    <div>
      {/* Wallet Header */}
      <div className="mb-4 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Wallet className="h-4 w-4 text-[#f0b90b]" />
          <h2 className="text-sm font-bold text-[#eaecef]">Live Wallet Tracker</h2>
          <span className="border border-[#f0b90b]/30 px-1.5 py-0.5 text-[10px] text-[#f0b90b] font-mono">@onchainmonk</span>
          <span className="border border-[#6c5ce7]/30 px-1.5 py-0.5 text-[10px] text-[#a78bfa] font-mono">$1K→$10K</span>
          <span className="flex items-center gap-1 bg-[#00e676]/10 text-[#00e676] px-1.5 py-0.5 text-[9px] font-bold rounded">
            <span className="w-1.5 h-1.5 bg-[#00e676] rounded-full animate-pulse" /> LIVE
          </span>
        </div>
        <div className="flex items-center gap-2">
          {lastUpdate && <span className="text-[10px] font-mono text-[#848e9c]">{lastUpdate}</span>}
          <button onClick={fetchData} disabled={loading} className="flex items-center gap-1.5 border border-[#2b3139] bg-[#1e2329] px-3 py-1.5 text-xs text-[#eaecef] hover:bg-[#2b3139] disabled:opacity-40">
            <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <a href={`https://hyperliquid.explorer.alchemy.com/address/${data.wallet}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 border border-[#2b3139] bg-[#1e2329] px-3 py-1.5 text-xs text-[#848e9c] hover:text-[#eaecef]">
            Explorer <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {[
          { label: 'Account Value', value: '$' + fmt(data.accountValue), color: data.accountValue > 0 ? '#eaecef' : '#848e9c' },
          { label: 'Total PnL', value: fmtU(data.totalPnl), color: pnlColor(data.totalPnl), sub: 'All-time' },
          { label: 'Unrealized', value: fmtU(data.unrealizedPnl), color: pnlColor(data.unrealizedPnl) },
          { label: 'Realized', value: fmtU(data.realizedPnl), color: pnlColor(data.realizedPnl) },
          { label: '24h Volume', value: '$' + fmt(parseFloat(data.volume24h || '0')), color: '#eaecef' },
          { label: 'Positions', value: data.positions.length.toString(), color: data.positions.length > 0 ? '#f0b90b' : '#848e9c' },
        ].map((s) => (
          <div key={s.label} className="border border-[#2b3139] bg-[#1e2329] p-3">
            <div className="text-[9px] font-semibold uppercase tracking-wider text-[#848e9c] mb-1">{s.label}</div>
            <div className="font-mono text-base font-bold" style={{ color: s.color }}>{s.value}</div>
            {s.sub && <div className="text-[9px] text-[#848e9c] mt-0.5">{s.sub}</div>}
          </div>
        ))}
      </div>

      {/* Sub-tabs */}
      <div className="mb-3 flex border-b border-[#2b3139]">
        {[
          { id: 'positions' as const, label: 'Positions', icon: Activity, count: data.positions.length },
          { id: 'trades' as const, label: 'Trades', icon: TrendingUp, count: data.fills.length },
          { id: 'orders' as const, label: 'Orders', icon: Zap, count: data.orders.length },
          { id: 'funding' as const, label: 'Funding', icon: Clock, count: data.funding.length },
        ].map((t) => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} className={`flex items-center gap-1.5 border-b-2 px-4 py-2 text-xs font-medium ${activeTab === t.id ? 'border-[#f0b90b] text-[#eaecef]' : 'border-transparent text-[#848e9c] hover:text-[#eaecef]'}`}>
            <t.icon className="h-3 w-3" />
            {t.label}
            {t.count > 0 && <span className="font-mono text-[10px] text-[#848e9c]">({t.count})</span>}
          </button>
        ))}
      </div>

      {/* Positions Tab */}
      {activeTab === 'positions' && (
        <>
          {data.positions.length === 0 ? (
            <div className="border border-[#2b3139] bg-[#1e2329] p-8 text-center">
              <div className="text-2xl mb-2">📡</div>
              <div className="text-sm text-[#848e9c]">No open positions</div>
              <div className="text-[10px] text-[#848e9c]/60 mt-1">Account value: ${fmt(data.accountValue)} · Waiting for trades</div>
            </div>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {data.positions.map((p) => {
                const lp = liqPct(p.entry, p.liq, p.current);
                const lc = lp > 70 ? '#00e676' : lp > 40 ? '#ffd740' : '#ff3d71';
                return (
                  <motion.div key={p.coin} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="border border-[#2b3139] bg-[#1e2329] p-4 relative overflow-hidden">
                    <div className={`absolute top-0 left-0 right-0 h-0.5 ${p.direction === 'LONG' ? 'bg-gradient-to-r from-[#00e676] to-transparent' : 'bg-gradient-to-r from-[#ff3d71] to-transparent'}`} />
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-base font-bold">{p.coin}</span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${p.direction === 'LONG' ? 'bg-[#00e676]/10 text-[#00e676]' : 'bg-[#ff3d71]/10 text-[#ff3d71]'}`}>{p.direction}</span>
                        </div>
                        <div className="text-[10px] text-[#848e9c] mt-0.5">{p.leverage}x Cross · Funding: {fmtU(p.cumFunding)}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono text-sm font-bold" style={{ color: pnlColor(p.pnl) }}>{fmtU(p.pnl)}</div>
                        <div className="text-[10px] font-semibold" style={{ color: pnlColor(p.roe) }}>{(p.roe * 100).toFixed(1)}% ROE</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                      <div><div className="text-[#848e9c] uppercase tracking-wider">Entry</div><div className="font-mono font-semibold">${fmt(p.entry, 4)}</div></div>
                      <div><div className="text-[#848e9c] uppercase tracking-wider">Current</div><div className="font-mono font-semibold">${fmt(p.current, 4)}</div></div>
                      <div><div className="text-[#848e9c] uppercase tracking-wider">Size</div><div className="font-mono font-semibold">{fmt(p.size, 0)} {p.coin}</div></div>
                      <div><div className="text-[#848e9c] uppercase tracking-wider">Notional</div><div className="font-mono font-semibold">${fmt(p.notional)}</div></div>
                    </div>
                    {p.liq && (
                      <div className="mt-3">
                        <div className="h-1 bg-[#15152a] rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-500" style={{ width: lp + '%', background: lc }} />
                        </div>
                        <div className="flex justify-between mt-1 text-[8px] text-[#848e9c]">
                          <span>Entry ${fmt(p.entry, 4)}</span>
                          <span>Liq ${fmt(p.liq, 4)}</span>
                        </div>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Trades Tab */}
      {activeTab === 'trades' && (
        <div className="border border-[#2b3139] bg-[#1e2329] overflow-hidden">
          <div className="max-h-[500px] overflow-y-auto">
            <table className="w-full text-[10px]">
              <thead>
                <tr className="border-b border-[#2b3139] text-[#848e9c]">
                  <th className="px-3 py-2 text-left font-semibold uppercase tracking-wider">Time</th>
                  <th className="px-3 py-2 text-left font-semibold uppercase tracking-wider">Pair</th>
                  <th className="px-3 py-2 text-left font-semibold uppercase tracking-wider">Side</th>
                  <th className="px-3 py-2 text-right font-semibold uppercase tracking-wider">Size</th>
                  <th className="px-3 py-2 text-right font-semibold uppercase tracking-wider">Price</th>
                  <th className="px-3 py-2 text-right font-semibold uppercase tracking-wider">Value</th>
                  <th className="px-3 py-2 text-right font-semibold uppercase tracking-wider">Closed PnL</th>
                  <th className="px-3 py-2 text-right font-semibold uppercase tracking-wider">Fee</th>
                </tr>
              </thead>
              <tbody>
                {data.fills.map((f, i) => (
                  <tr key={i} className="border-b border-[#2b3139]/50 hover:bg-[#2b3139]/30 transition-colors">
                    <td className="px-3 py-1.5 font-mono text-[#848e9c]">{fmtTime(f.time)}</td>
                    <td className="px-3 py-1.5 font-mono font-semibold">{f.coin}-PERP</td>
                    <td className={`px-3 py-1.5 font-mono font-semibold ${f.side === 'BUY' ? 'text-[#00e676]' : 'text-[#ff3d71]'}`}>{f.side}</td>
                    <td className="px-3 py-1.5 font-mono text-right">{fmt(f.size, 0)}</td>
                    <td className="px-3 py-1.5 font-mono text-right">${fmt(f.price, 4)}</td>
                    <td className="px-3 py-1.5 font-mono text-right">${fmt(f.value)}</td>
                    <td className={`px-3 py-1.5 font-mono text-right font-semibold ${f.closedPnl > 0 ? 'text-[#00e676]' : f.closedPnl < 0 ? 'text-[#ff3d71]' : 'text-[#848e9c]'}`}>
                      {f.closedPnl !== 0 ? fmtU(f.closedPnl) : '-'}
                    </td>
                    <td className="px-3 py-1.5 font-mono text-right text-[#848e9c]">{f.fee ? '$' + fmt(f.fee, 4) : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Orders Tab */}
      {activeTab === 'orders' && (
        <>
          {data.orders.length === 0 ? (
            <div className="border border-[#2b3139] bg-[#1e2329] p-8 text-center">
              <div className="text-sm text-[#848e9c]">No open orders</div>
            </div>
          ) : (
            <div className="border border-[#2b3139] bg-[#1e2329] overflow-hidden">
              <table className="w-full text-[10px]">
                <thead>
                  <tr className="border-b border-[#2b3139] text-[#848e9c]">
                    <th className="px-3 py-2 text-left">Time</th>
                    <th className="px-3 py-2 text-left">Pair</th>
                    <th className="px-3 py-2 text-left">Side</th>
                    <th className="px-3 py-2 text-right">Size</th>
                    <th className="px-3 py-2 text-right">Limit Price</th>
                    <th className="px-3 py-2 text-left">Type</th>
                  </tr>
                </thead>
                <tbody>
                  {data.orders.map((o, i) => (
                    <tr key={i} className="border-b border-[#2b3139]/50">
                      <td className="px-3 py-1.5 font-mono text-[#848e9c]">{fmtDateTime(o.timestamp)}</td>
                      <td className="px-3 py-1.5 font-mono font-semibold">{o.coin}-PERP</td>
                      <td className={`px-3 py-1.5 font-mono font-semibold ${o.side === 'B' ? 'text-[#00e676]' : 'text-[#ff3d71]'}`}>{o.side === 'B' ? 'BUY' : 'SELL'}</td>
                      <td className="px-3 py-1.5 font-mono text-right">{o.sz}</td>
                      <td className="px-3 py-1.5 font-mono text-right">${o.limitPx}</td>
                      <td className="px-3 py-1.5 font-mono text-[#848e9c]">{JSON.stringify(o.orderType)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Funding Tab */}
      {activeTab === 'funding' && (
        <>
          {data.funding.length === 0 ? (
            <div className="border border-[#2b3139] bg-[#1e2329] p-8 text-center">
              <div className="text-sm text-[#848e9c]">No funding history</div>
            </div>
          ) : (
            <div className="border border-[#2b3139] bg-[#1e2329] overflow-hidden">
              <table className="w-full text-[10px]">
                <thead>
                  <tr className="border-b border-[#2b3139] text-[#848e9c]">
                    <th className="px-3 py-2 text-left">Time</th>
                    <th className="px-3 py-2 text-left">Coin</th>
                    <th className="px-3 py-2 text-right">USDC</th>
                    <th className="px-3 py-2 text-left">Type</th>
                  </tr>
                </thead>
                <tbody>
                  {data.funding.map((f, i) => (
                    <tr key={i} className="border-b border-[#2b3139]/50">
                      <td className="px-3 py-1.5 font-mono text-[#848e9c]">{fmtDateTime(f.time)}</td>
                      <td className="px-3 py-1.5 font-mono font-semibold">{f.coin}</td>
                      <td className={`px-3 py-1.5 font-mono text-right font-semibold ${parseFloat(f.usdc) >= 0 ? 'text-[#00e676]' : 'text-[#ff3d71]'}`}>${fmt(parseFloat(f.usdc), 4)}</td>
                      <td className="px-3 py-1.5 font-mono text-[#848e9c]">{f.type}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Footer */}
      <div className="mt-3 flex justify-between text-[9px] text-[#848e9c]/60">
        <span>Portfolio API · Real-time balance tracking</span>
        <span>Last: {lastUpdate} · Auto-refresh 5s</span>
      </div>
    </div>
  );
}
