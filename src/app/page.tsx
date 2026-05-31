'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { RefreshCw, Activity, ArrowUpDown, Zap, TrendingUp, ExternalLink } from 'lucide-react';
import { FundingTable } from '@/components/FundingTable';
import { ArbRecommendation } from '@/components/ArbRecommendation';
import { PointsCalculator } from '@/components/PointsCalculator';
import { WalletTracker } from '@/components/WalletTracker';
import { LiveBanner } from '@/components/LiveBanner';
import { type ArbOpportunity } from '@/lib/arb-engine';

interface FundingData {
  dex: string;
  ticker: string;
  mark_price: number;
  funding_rate_1h: number;
  volume_24h: number;
}

interface ApiResponse {
  timestamp: string;
  dexes: Record<string, number>;
  funding: FundingData[];
  opportunities: ArbOpportunity[];
}

const DEX_COLORS: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  Variational: { bg: 'bg-[#6b21a8]/10', text: 'text-[#a78bfa]', border: 'border-[#6b21a8]/30', dot: 'bg-[#a78bfa]' },
  Nado: { bg: 'bg-[#1d4ed8]/10', text: 'text-[#60a5fa]', border: 'border-[#1d4ed8]/30', dot: 'bg-[#60a5fa]' },
  RISEx: { bg: 'bg-[#059669]/10', text: 'text-[#34d399]', border: 'border-[#059669]/30', dot: 'bg-[#34d399]' },
  Decibel: { bg: 'bg-[#c2410c]/10', text: 'text-[#fb923c]', border: 'border-[#c2410c]/30', dot: 'bg-[#fb923c]' },
  Hyperliquid: { bg: 'bg-[#0ea5e9]/10', text: 'text-[#38bdf8]', border: 'border-[#0ea5e9]/30', dot: 'bg-[#38bdf8]' },
};

const DEX_INFO: Record<string, { chain: string; status: string }> = {
  Variational: { chain: 'Arbitrum', status: 'Live' },
  Nado: { chain: 'Ink L2', status: 'Live' },
  RISEx: { chain: 'RISE Chain', status: 'Live' },
  Decibel: { chain: 'Aptos', status: 'Live' },
  Hyperliquid: { chain: 'Hyperliquid L1', status: 'Live' },
};

const REFERRALS = [
  { name: 'Variational', url: 'https://omni.variational.io/?ref=OMNISKYPOTS', color: '#a78bfa', benefit: '12% pts booster + Bronze tier' },
  { name: 'Nado', url: 'https://app.nado.xyz/?join=lLVqxQ0', color: '#60a5fa', benefit: 'Join with ref' },
];

export default function Home() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'arb' | 'funding' | 'points' | 'wallet'>('arb');
  const [lastUpdate, setLastUpdate] = useState('');
  const [selectedDexes, setSelectedDexes] = useState<Set<string>>(
    new Set(['Variational', 'Nado', 'RISEx', 'Decibel', 'Hyperliquid'])
  );
  const [searchPair, setSearchPair] = useState('');
  const [sortBy, setSortBy] = useState<'rate' | 'volume' | 'ticker'>('rate');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/funding');
      const json = await res.json();
      setData(json);
      setLastUpdate(new Date().toLocaleTimeString());
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60_000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const availableDexes = useMemo(() => {
    if (!data?.dexes) return [];
    return Object.entries(data.dexes)
      .filter(([_, count]) => count > 0)
      .map(([name]) => name.charAt(0).toUpperCase() + name.slice(1));
  }, [data?.dexes]);

  const filteredFunding = useMemo(() => {
    if (!data?.funding) return [];
    let filtered = data.funding.filter((f) => selectedDexes.has(f.dex));
    if (searchPair) {
      const q = searchPair.toUpperCase();
      filtered = filtered.filter((f) => f.ticker.toUpperCase().includes(q));
    }
    if (sortBy === 'rate') {
      filtered.sort((a, b) => Math.abs(b.funding_rate_1h) - Math.abs(a.funding_rate_1h));
    } else if (sortBy === 'volume') {
      filtered.sort((a, b) => b.volume_24h - a.volume_24h);
    } else {
      filtered.sort((a, b) => a.ticker.localeCompare(b.ticker));
    }
    return filtered;
  }, [data?.funding, selectedDexes, searchPair, sortBy]);

  const filteredOpps = useMemo(() => {
    if (!data?.opportunities) return [];
    return data.opportunities.filter(
      (o) => selectedDexes.has(o.longDex) && selectedDexes.has(o.shortDex)
    );
  }, [data?.opportunities, selectedDexes]);

  const toggleDex = (dex: string) => {
    setSelectedDexes((prev) => {
      const next = new Set(prev);
      if (next.has(dex)) next.delete(dex);
      else next.add(dex);
      return next;
    });
  };

  const tabs = [
    { id: 'arb' as const, label: 'Delta-Neutral', icon: Zap },
    { id: 'funding' as const, label: 'Funding Rates', icon: ArrowUpDown },
    { id: 'points' as const, label: 'Points Calculator', icon: Activity },
    { id: 'wallet' as const, label: 'Live Wallet', icon: TrendingUp },
  ];

  return (
    <main className="min-h-screen bg-[#0b0e11] text-[#eaecef]">
      {/* Live Ticker Banner */}
      <LiveBanner />

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-[#eaecef]">
                Funding Rate Arb
              </h1>
              <p className="text-xs text-[#848e9c]">
                Cross-DEX perpetual funding rate arbitrage · Built by{' '}
                <a
                  href="https://x.com/0xskypots"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#f0b90b] hover:underline"
                >
                  @0xskypots
                </a>
              </p>
            </div>
            <div className="flex items-center gap-3">
              {lastUpdate && <span className="text-xs font-mono text-[#848e9c]">{lastUpdate}</span>}
              <button
                onClick={fetchData}
                disabled={loading}
                className="flex items-center gap-1.5 border border-[#2b3139] bg-[#1e2329] px-3 py-1.5 text-xs text-[#eaecef] hover:bg-[#2b3139] disabled:opacity-40"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>

          {/* Referral Links */}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-[10px] text-[#848e9c]">Join with my ref:</span>
            {REFERRALS.map((r) => (
              <a
                key={r.name}
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 border px-2 py-1 text-[10px] font-mono hover:bg-[#1e2329]"
                style={{ borderColor: r.color + '40', color: r.color }}
              >
                {r.name} <span className="text-[#848e9c]">· {r.benefit}</span> <ExternalLink className="h-2.5 w-2.5" />
              </a>
            ))}
          </div>

          {/* DEX Status Cards */}
          <div className="mt-3 grid grid-cols-2 gap-1.5 sm:grid-cols-5">
            {Object.entries(DEX_INFO).map(([dex, info]) => {
              const count = data?.dexes?.[dex.toLowerCase()] || 0;
              const colors = DEX_COLORS[dex];
              const isActive = selectedDexes.has(dex);
              return (
                <button
                  key={dex}
                  onClick={() => toggleDex(dex)}
                  className={`flex items-center gap-2.5 border p-2.5 ${
                    isActive
                      ? 'border-[#2b3139] bg-[#1e2329]'
                      : 'border-[#2b3139]/50 bg-[#1e2329]/50 opacity-40'
                  }`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${isActive ? colors.dot : 'bg-[#848e9c]'}`} />
                  <div className="text-left">
                    <div className="text-xs font-medium text-[#eaecef]">{dex}</div>
                    <div className="text-[10px] text-[#848e9c] font-mono">
                      {info.chain} {count > 0 ? `· ${count} mkts` : ''}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-4 flex border-b border-[#2b3139]">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-sm font-medium ${
                tab === t.id
                  ? 'border-[#f0b90b] text-[#eaecef]'
                  : 'border-transparent text-[#848e9c] hover:text-[#eaecef]'
              }`}
            >
              <t.icon className="h-3.5 w-3.5" />
              {t.label}
              {t.id === 'arb' && filteredOpps.length > 0 && (
                <span className="ml-1 border border-[#f0b90b]/30 px-1 py-0 text-[10px] text-[#f0b90b] font-mono">
                  {filteredOpps.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {tab === 'arb' && (
            <motion.section key="arb" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-[#f0b90b]" />
                  <h2 className="text-sm font-bold text-[#eaecef]">Delta-Neutral Recommendations</h2>
                  <span className="font-mono text-[10px] text-[#848e9c]">{filteredOpps.length} opps</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {Array.from(selectedDexes).map((d) => (
                    <span key={d} className={`border px-1.5 py-0.5 text-[10px] font-mono ${DEX_COLORS[d]?.border} ${DEX_COLORS[d]?.text}`}>
                      {d}
                    </span>
                  ))}
                </div>
              </div>
              <p className="mb-3 text-xs text-[#848e9c]">
                Long on DEX with negative/low funding, short on DEX with high funding.
                Earn the funding rate differential while remaining market-neutral.
              </p>
              <ArbRecommendation opportunities={filteredOpps} loading={loading} />
            </motion.section>
          )}

          {tab === 'funding' && (
            <motion.section key="funding" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
              <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <ArrowUpDown className="h-4 w-4 text-[#f0b90b]" />
                  <h2 className="text-sm font-bold text-[#eaecef]">Funding Rates</h2>
                  <span className="font-mono text-[10px] text-[#848e9c]">{filteredFunding.length} entries</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={searchPair}
                    onChange={(e) => setSearchPair(e.target.value)}
                    placeholder="Search pair..."
                    className="w-32 border border-[#2b3139] bg-[#1e2329] px-2.5 py-1.5 text-xs text-[#eaecef] placeholder-[#848e9c] outline-none focus:border-[#f0b90b]/50 font-mono"
                  />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                    className="border border-[#2b3139] bg-[#1e2329] px-2.5 py-1.5 text-xs text-[#eaecef] outline-none font-mono"
                  >
                    <option value="rate">|Rate| desc</option>
                    <option value="volume">Volume desc</option>
                    <option value="ticker">Pair A-Z</option>
                  </select>
                </div>
              </div>
              <FundingTable data={filteredFunding} loading={loading} />
            </motion.section>
          )}

          {tab === 'points' && (
            <motion.section key="points" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
              <PointsCalculator />
            </motion.section>
          )}

          {tab === 'wallet' && (
            <motion.section key="wallet" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
              <WalletTracker />
            </motion.section>
          )}
        </AnimatePresence>

        {/* Footer */}
        <footer className="mt-12 border-t border-[#2b3139] pt-6 pb-4">
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
            <div className="text-center sm:text-left">
              <p className="text-[10px] text-[#848e9c]">
                Funding Rate Arb Dashboard · Data refreshed every 60s
              </p>
              <p className="mt-0.5 font-mono text-[10px] text-[#848e9c]">
                Variational · Nado · RISEx · Decibel · Hyperliquid
              </p>
            </div>
            <div className="flex items-center gap-3">
              <a
                href="https://x.com/0xskypots"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 border border-[#2b3139] bg-[#1e2329] px-3 py-1.5 text-[10px] text-[#eaecef] hover:bg-[#2b3139]"
              >
                <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                @0xskypots
              </a>
              <span className="text-[10px] text-[#848e9c]">Built by Skypots</span>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}
