'use client';

import { useState, useEffect } from 'react';
import { ExternalLink, TrendingUp, TrendingDown, Zap, Gift } from 'lucide-react';

interface Position {
  coin: string;
  side: 'Long' | 'Short';
  size: number;
  entryPrice: number;
  currentPrice: number;
  unrealizedPnl: number;
  leverage: number;
}

interface TickerData {
  positions: Position[];
  accountValue: number;
}

const REFERRALS = [
  {
    name: 'Variational',
    url: 'https://omni.variational.io/?ref=OMNISKYPOTS',
    color: '#a78bfa',
    benefit: '12% pts booster + Bronze tier',
  },
  {
    name: 'Nado',
    url: 'https://app.nado.xyz/?join=lLVqxQ0',
    color: '#60a5fa',
    benefit: 'Join with ref',
  },
];

export function LiveBanner() {
  const [data, setData] = useState<TickerData | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const fetchPositions = async () => {
      try {
        const res = await fetch('/api/hl-wallet');
        if (!res.ok) return;
        const json = await res.json();
        if (cancelled) return;
        if (json.error) { setError(true); return; }
        const positions = (json.positions || []).map((p: any) => ({
          coin: p.coin || '',
          side: p.side === 'long' ? 'Long' : 'Short',
          size: Number(p.size) || 0,
          entryPrice: Number(p.entryPrice) || 0,
          currentPrice: Number(p.currentPrice) || 0,
          unrealizedPnl: Number(p.unrealizedPnl) || 0,
          leverage: Number(p.leverage) || 1,
        }));
        setData({ positions, accountValue: Number(json.accountValue) || 0 });
        setError(false);
      } catch {
        if (!cancelled) setError(true);
      }
    };
    fetchPositions();
    const interval = setInterval(fetchPositions, 10000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  const hasPosition = data && data.positions.length > 0;

  return (
    <div className="relative overflow-hidden border-b border-[#2b3139] bg-[#1e2329]">
      <div className="flex py-2" style={{ animation: 'scroll 30s linear infinite' }}>
        {[0, 1].map((copy) => (
          <div key={copy} className="flex items-center gap-6 px-3 shrink-0">
            {/* Live Position */}
            {hasPosition ? (
              data.positions.map((p, i) => (
                <div key={`${copy}-pos-${i}`} className="flex items-center gap-2">
                  <span className="flex items-center gap-1 text-[11px] font-mono">
                    <span className={`inline-flex items-center gap-0.5 ${p.side === 'Long' ? 'text-[#0ecb81]' : 'text-[#f6465d]'}`}>
                      {p.side === 'Long' ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      {p.side}
                    </span>
                    <span className="text-[#eaecef] font-bold">{p.size.toFixed(0)} {p.coin}</span>
                    <span className="text-[#848e9c]">@ ${p.entryPrice.toFixed(p.entryPrice > 100 ? 2 : 4)}</span>
                    <span className="text-[#848e9c]">|</span>
                    <span className={p.unrealizedPnl >= 0 ? 'text-[#0ecb81]' : 'text-[#f6465d]'}>
                      {p.unrealizedPnl >= 0 ? '+' : ''}${p.unrealizedPnl.toFixed(2)}
                    </span>
                    <span className="text-[#848e9c]">{p.leverage}x</span>
                  </span>
                </div>
              ))
            ) : (
              <div className="flex items-center gap-1.5 text-[11px] text-[#848e9c]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#848e9c] animate-pulse" />
                {error ? 'Wallet offline' : data ? `Wallet FLAT · $${data.accountValue.toFixed(2)}` : 'Loading...'}
              </div>
            )}

            <span className="text-[#2b3139]">|</span>

            {REFERRALS.map((r) => (
              <a
                key={`${copy}-ref-${r.name}`}
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-[11px] font-mono hover:opacity-80"
                style={{ color: r.color }}
              >
                <Gift className="h-3 w-3" />
                <span className="font-bold">{r.name}</span>
                <span className="text-[#848e9c]">{r.benefit}</span>
                <ExternalLink className="h-2.5 w-2.5 opacity-50" />
              </a>
            ))}

            <span className="text-[#2b3139]">|</span>

            <span className="flex items-center gap-1 text-[11px] text-[#f0b90b]">
              <Zap className="h-3 w-3" />
              Built by @0xskypots
            </span>

            <span className="text-[#2b3139]">|</span>
          </div>
        ))}
      </div>
      <style>{`
        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
