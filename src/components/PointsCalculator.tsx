'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Calculator, TrendingUp, ChevronDown, ChevronUp, Info, Zap, Layers, BarChart3, Target } from 'lucide-react';

// === PER-DEX CONFIG (averaged from 5 X accounts) ===
const DEX_CONFIG = {
  Variational: {
    color: 'purple',
    token: '$VAR',
    chain: 'Arbitrum',
    status: 'Live — Points Season active',
    supplyPct: 50,
    confirmed: true,
    raised: '$85M (Paradigm, Coinbase, Bain Capital)',
    tgeEstimate: 'Q3 2026',
    description: 'Tier-based points with volume multipliers. 50% of $VAR supply for community. ~15 weeks remaining.',
    estTotalPoints: 9_150_000,
    pointsBasis: 'Total pool ~9.15M pts (retroactive + weekly + future). OTC $10-$15/pt. Points calculated weekly Friday 00:00 UTC.',
    pricePerPoint: { bear: 10, base: 35, bull: 60 },
    xSources: '@mfardecrouz $40-60, @louisdives $30, @detefabulanar_ $10-30, @sharkcryptottm $30-40, @ox_ava_web3 $40-60',
    fdvBasis: 'OI-based $1.85B, volume-based $1.15B. $LIT (Lighter) pre-market ~$4B FDV.',
  },
  Nado: {
    color: 'blue',
    token: '$NADO',
    chain: 'Ink L2 (Kraken)',
    status: 'Season 2 live — no token yet',
    supplyPct: 30,
    confirmed: true,
    raised: 'Kraken ecosystem (Ink L2)',
    tgeEstimate: 'Q3-Q4 2026',
    description: 'Volume-linked pool, 5 tiers (Breeze->Tornado). 30% airdrop confirmed by @airdrops_io.',
    estTotalPoints: 40_000_000,
    pointsBasis: 'Weekly: 300K-950K pts (volume-linked). S1: $61.2B cumulative vol.',
    pricePerPoint: { bear: 0.5, base: 1.7, bull: 4 },
    xSources: '@mfardecrouz $0.8-1, @louisdives $4, @detefabulanar_ $1.5-3, @sharkcryptottm $0.5-0.7, @ox_ava_web3 $0.8-1',
    fdvBasis: 'INK TGE Q3-Q4 2026. Kraken Q1 2026 IPO narrative. Nado = clearest INK airdrop play.',
  },
  RISEx: {
    color: 'emerald',
    token: '$RISE',
    chain: 'RISE Chain',
    status: 'Live — invite-only, pre-token',
    supplyPct: 25,
    confirmed: false,
    raised: '$3.25M seed (Vitalik Buterin, Galaxy Digital, DACM)',
    tgeEstimate: 'TBD',
    description: 'No official points yet. Activity feeds into INK airdrop eligibility. VRTX holders eligible.',
    estTotalPoints: 10_000_000,
    pointsBasis: 'S1: 1M pts/week. No official points program yet.',
    pricePerPoint: { bear: 0.5, base: 2, bull: 5 },
    xSources: '@detefabulanar_ "the earliest". No price predictions yet. Vitalik backing.',
    fdvBasis: 'Only $3.25M seed raised. Small initial FDV expected.',
  },
  Decibel: {
    color: 'orange',
    token: '$DCBL',
    chain: 'Aptos',
    status: 'Amps Season 1 — pre-token',
    supplyPct: 30,
    confirmed: true,
    raised: '$5M seed (Kraken Ventures, Aptos Labs, Wintermute)',
    tgeEstimate: 'TBD',
    description: '"Amps" system: multi-dimensional scoring (vol, leverage, duration, exploration, streak). DLP vault + referrals.',
    estTotalPoints: 5_000_000,
    pointsBasis: '581,984 AMPs distributed so far. Daily rewards based on trading, LP, referrals.',
    pricePerPoint: { bear: 0.05, base: 0.3, bull: 0.5 },
    xSources: '@louisdives $0.15, @detefabulanar_ $0.25-0.5',
    fdvBasis: '$5M seed (Kraken Ventures, Aptos Labs, Wintermute). CLOB on Aptos.',
  },
};

type DexName = keyof typeof DEX_CONFIG;

// === BENCHMARKS (live CoinGecko) ===
const BENCHMARKS = [
  { name: 'Hyperliquid', token: '$HYPE', supply: '962M', fdv: '$56.6B', mcap: '$14B', price: '$58.70', airdropPct: '31%', airdropTokens: '310M', recipients: '~94K', note: 'ATH $62. Largest perp airdrop ever' },
  { name: 'Jupiter', token: '$JUP', supply: '6.86B', fdv: '$1.46B', mcap: '$707M', price: '$0.21', airdropPct: '40%', airdropTokens: '1.7B', recipients: '~2.9M', note: 'S1: 1.4B pts, S2: 700M tokens. ATH $2.0' },
  { name: 'dYdX', token: '$DYDX', supply: '958M', fdv: '$144M', mcap: '$126M', price: '$0.15', airdropPct: '7.5%', airdropTokens: '75M', recipients: '~65K', note: 'ATH $4.52. Down 97% from ATH' },
  { name: 'Aevo', token: '$AEVO', supply: '1B', fdv: '$25M', mcap: '$23M', price: '$0.025', airdropPct: '~4.6%', airdropTokens: '46M', recipients: '~20K', note: 'ATH $3.76. Down 99% from ATH' },
];

// === X PRICE PREDICTIONS (5 accounts averaged, May 2026) ===
const X_PREDICTIONS = [
  { handle: '@variational_io', range: '$10-60', avg: '$35', sources: 5 },
  { handle: '@grvt_io', range: '$3-25', avg: '$8', sources: 4 },
  { handle: '@01Exchange', range: '$0.1-4', avg: '$1.3', sources: 5 },
  { handle: '@extendedapp', range: '$0.3-3', avg: '$1.3', sources: 5 },
  { handle: '@nadoHQ', range: '$0.5-4', avg: '$1.7', sources: 5 },
  { handle: '@tread_fi', range: '$0.4-3', avg: '$0.9', sources: 4 },
  { handle: '@ostium', range: '$0.1-1', avg: '$0.4', sources: 5 },
  { handle: '@dango', range: '$0.1-2', avg: '$0.4', sources: 5 },
  { handle: '@CarbonTerminal', range: '$0.3-0.6', avg: '$0.45', sources: 1 },
  { handle: '@DecibelTrade', range: '$0.15-0.5', avg: '$0.3', sources: 2 },
  { handle: '@pacifica_fi', range: '$0.1-0.6', avg: '$0.3', sources: 5 },
  { handle: '@hibachi_xyz', range: '$0.1-0.4', avg: '$0.18', sources: 5 },
  { handle: '@StandX_Official', range: '$0.2', avg: '$0.2', sources: 1 },
  { handle: '@etherealdex', range: '$0.0025-0.01', avg: '$0.006', sources: 3 },
  { handle: '@reya_xyz', range: '$0.001-6', avg: '$0.002', sources: 4 },
  { handle: '@tradehotstuff', range: '$0.01-1.5', avg: '$0.01', sources: 5 },
];

// === CALCULATOR ===
const CALC_TABS: { key: DexName; label: string; icon: React.ReactNode }[] = [
  { key: 'Variational', label: 'Variational', icon: <Zap className="h-3.5 w-3.5" /> },
  { key: 'Nado', label: 'Nado', icon: <Layers className="h-3.5 w-3.5" /> },
  { key: 'RISEx', label: 'RISEx', icon: <BarChart3 className="h-3.5 w-3.5" /> },
  { key: 'Decibel', label: 'Decibel', icon: <Target className="h-3.5 w-3.5" /> },
];

export function PointsCalculator() {
  const switchDex = (dex: DexName) => {
    setActiveDex(dex);
    setScenario(1);
  };
  const [activeDex, setActiveDex] = useState<DexName>('Variational');
  const [myPoints, setMyPoints] = useState('1000');
  const [scenario, setScenario] = useState(1);
  const [showBenchmarks, setShowBenchmarks] = useState(false);
  const [showXpred, setShowXpred] = useState(false);

  const config = DEX_CONFIG[activeDex];
  const pts = parseFloat(myPoints) || 0;

  const scenarios = [
    { label: 'Bear', textLabel: 'BEAR', price: config.pricePerPoint.bear, desc: 'Bear market TGE' },
    { label: 'Base', textLabel: 'BASE', price: config.pricePerPoint.base, desc: 'Avg of 5 X accounts' },
    { label: 'Bull', textLabel: 'BULL', price: config.pricePerPoint.bull, desc: 'Bull market TGE' },
  ];

  const activeScenario = scenarios[scenario];
  const estUSD = pts * activeScenario.price;
  const bearUSD = pts * config.pricePerPoint.bear;
  const bullUSD = pts * config.pricePerPoint.bull;

  return (
    <div className="space-y-3">
      {/* Main Calculator Card */}
      <div className="border border-[#2b3139] bg-[#1e2329] p-5">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calculator className="h-4 w-4 text-[#f0b90b]" />
            <h2 className="text-sm font-bold text-[#eaecef]">Airdrop Value Calculator</h2>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowXpred(!showXpred)} className="flex items-center gap-1 text-[11px] text-[#848e9c] hover:text-[#eaecef]">
              X Predictions {showXpred ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>
            <button onClick={() => setShowBenchmarks(!showBenchmarks)} className="flex items-center gap-1 text-[11px] text-[#848e9c] hover:text-[#eaecef]">
              Benchmarks {showBenchmarks ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>
          </div>
        </div>

        {/* DEX Tabs */}
        <div className="mb-4 flex gap-0.5 border border-[#2b3139] bg-[#0b0e11] p-0.5">
          {CALC_TABS.map((tab) => {
            return (
              <button
                key={tab.key}
                onClick={() => switchDex(tab.key)}
                className={`flex flex-1 items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium ${
                  activeDex === tab.key
                    ? 'bg-[#2b3139] text-[#eaecef]'
                    : 'text-[#848e9c] hover:text-[#eaecef]'
                }`}
              >
                {tab.icon}
                {config.token}
              </button>
            );
          })}
        </div>

        {/* DEX Info */}
        <div className="mb-3 flex flex-wrap items-center gap-2 text-[11px] text-[#848e9c]">
          <span className="border border-[#2b3139] px-1.5 py-0.5 font-mono text-[#eaecef]">{config.token}</span>
          <span>{config.chain}</span>
          <span className="text-[#2b3139]">|</span>
          <span>{config.status}</span>
          {config.confirmed && <span className="border border-[#0ecb81]/30 px-1.5 py-0.5 text-[10px] text-[#0ecb81] font-mono">CONFIRMED</span>}
        </div>

        <div className="mb-4 border border-[#2b3139] bg-[#0b0e11] px-3 py-2 text-[11px] text-[#848e9c] font-mono">
          {config.pointsBasis}
        </div>

        {/* Input + Scenario */}
        <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-[11px] text-[#848e9c]">Your Points</label>
            <input
              type="number"
              value={myPoints}
              onChange={(e) => setMyPoints(e.target.value)}
              className="w-full border border-[#2b3139] bg-[#0b0e11] px-3 py-2.5 font-mono text-sm text-[#eaecef] placeholder-[#848e9c] outline-none focus:border-[#f0b90b]/50"
              placeholder="1000"
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] text-[#848e9c]">Market Scenario</label>
            <div className="flex gap-0.5 border border-[#2b3139] bg-[#0b0e11] p-0.5">
              {scenarios.map((s, i) => (
                <button
                  key={i}
                  onClick={() => setScenario(i)}
                  className={`flex-1 px-2 py-2 text-xs font-medium font-mono ${
                    scenario === i
                      ? 'bg-[#2b3139] text-[#eaecef]'
                      : 'text-[#848e9c] hover:text-[#eaecef]'
                  }`}
                >
                  {s.textLabel} ${s.price}/pt
                </button>
              ))}
            </div>
            <div className="mt-1 text-[10px] text-[#848e9c] text-center">{activeScenario.desc}</div>
          </div>
        </div>

        {/* Tokenomics */}
        <div className="mb-4 border border-[#2b3139] bg-[#0b0e11] p-3 text-xs">
          <p className="mb-1 text-[#848e9c]">{config.description}</p>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-[#848e9c]">
            <span>Raised: {config.raised}</span>
            <span>TGE: {config.tgeEstimate}</span>
            <span>Airdrop: {config.supplyPct}% supply</span>
          </div>
          <p className="mt-1 text-[#848e9c] text-[10px] font-mono">X {config.xSources}</p>
        </div>

        {/* Result */}
        <div className="border border-[#0ecb81]/20 bg-[#0ecb81]/5 p-4">
          <div className="mb-1.5 text-[11px] text-[#0ecb81] font-mono">
            {activeScenario.label} · {pts.toLocaleString()} pts x ${activeScenario.price}/pt
          </div>
          <div className="text-3xl font-bold text-[#0ecb81] font-mono">
            ${estUSD.toLocaleString('en-US', { maximumFractionDigits: 0 })}
          </div>

          {/* Range */}
          <div className="mt-3 flex items-center gap-2">
            <div className="flex-1 border border-[#2b3139] bg-[#0b0e11] p-2 text-center">
              <div className="text-[10px] text-[#f6465d] font-mono">BEAR</div>
              <div className="font-mono text-sm text-[#f6465d]">${bearUSD.toLocaleString('en-US', { maximumFractionDigits: 0 })}</div>
            </div>
            <div className="text-[#848e9c] font-mono text-xs">/</div>
            <div className="flex-1 border border-[#2b3139] bg-[#0b0e11] p-2 text-center">
              <div className="text-[10px] text-[#0ecb81] font-mono">BASE</div>
              <div className="font-mono text-sm text-[#0ecb81]">${(pts * config.pricePerPoint.base).toLocaleString('en-US', { maximumFractionDigits: 0 })}</div>
            </div>
            <div className="text-[#848e9c] font-mono text-xs">/</div>
            <div className="flex-1 border border-[#2b3139] bg-[#0b0e11] p-2 text-center">
              <div className="text-[10px] text-[#f0b90b] font-mono">BULL</div>
              <div className="font-mono text-sm text-[#f0b90b]">${bullUSD.toLocaleString('en-US', { maximumFractionDigits: 0 })}</div>
            </div>
          </div>

          <div className="mt-2 text-[10px] text-[#848e9c] font-mono">
            Pool: {(config.estTotalPoints / 1e6).toFixed(1)}M pts · {config.supplyPct}% supply · {config.fdvBasis}
          </div>
        </div>
      </div>

      {/* X Predictions Panel */}
      {showXpred && (
        <div className="border border-[#2b3139] bg-[#1e2329] p-5">
          <div className="mb-3 flex items-center gap-2">
            <span className="text-sm font-mono text-[#eaecef]">X</span>
            <h3 className="text-sm font-bold text-[#eaecef]">Price Per Point Predictions</h3>
          </div>
          <p className="mb-3 text-[10px] text-[#848e9c]">Sources: @mfardecrouz (19.2K views), @louisdives, @detefabulanar_ (31K views), @sharkcryptottm, @ox_ava_web3 · Apr-May 2026</p>
          <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
            {X_PREDICTIONS.map((p) => (
              <div key={p.handle} className="flex items-center justify-between border border-[#2b3139] bg-[#0b0e11] px-3 py-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#eaecef] font-mono">{p.handle}</span>
                  <span className="text-[10px] text-[#848e9c] font-mono">{p.range}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm text-[#0ecb81]">{p.avg}/pt</span>
                  <span className="text-[10px] text-[#848e9c] font-mono">{p.sources}x</span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-2 text-[10px] text-[#848e9c] font-mono">
            NOTE: Bear market TGE would be significantly lower. Avg = arithmetic mean of available predictions.
          </div>
        </div>
      )}

      {/* Benchmarks Panel */}
      {showBenchmarks && (
        <div className="border border-[#2b3139] bg-[#1e2329] p-5">
          <div className="mb-3 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-[#f0b90b]" />
            <h3 className="text-sm font-bold text-[#eaecef]">Perp DEX Token Benchmarks</h3>
            <span className="text-[10px] text-[#848e9c] font-mono">CoinGecko</span>
          </div>
          <div className="mb-3 overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[#2b3139]">
                  <th className="pb-2 text-left text-[#848e9c] font-medium text-[11px]">Project</th>
                  <th className="pb-2 text-left text-[#848e9c] font-medium text-[11px]">Token</th>
                  <th className="pb-2 text-right text-[#848e9c] font-medium text-[11px]">Supply</th>
                  <th className="pb-2 text-right text-[#848e9c] font-medium text-[11px]">Price</th>
                  <th className="pb-2 text-right text-[#848e9c] font-medium text-[11px]">FDV</th>
                  <th className="pb-2 text-right text-[#848e9c] font-medium text-[11px]">MCap</th>
                  <th className="pb-2 text-right text-[#848e9c] font-medium text-[11px]">Airdrop %</th>
                  <th className="pb-2 text-right text-[#848e9c] font-medium text-[11px]">Tokens</th>
                  <th className="pb-2 text-right text-[#848e9c] font-medium text-[11px]">Recipients</th>
                  <th className="pb-2 text-left text-[#848e9c] font-medium text-[11px]">Note</th>
                </tr>
              </thead>
              <tbody>
                {BENCHMARKS.map((b) => (
                  <tr key={b.name} className="border-b border-[#2b3139] hover:bg-[#2b3139]">
                    <td className="py-2 text-[#eaecef] font-medium">{b.name}</td>
                    <td className="py-2 text-[#848e9c] font-mono">{b.token}</td>
                    <td className="py-2 text-right text-[#848e9c] font-mono">{b.supply}</td>
                    <td className="py-2 text-right text-[#eaecef] font-mono">{b.price}</td>
                    <td className="py-2 text-right text-[#eaecef] font-mono">{b.fdv}</td>
                    <td className="py-2 text-right text-[#848e9c] font-mono">{b.mcap}</td>
                    <td className="py-2 text-right text-[#0ecb81] font-mono">{b.airdropPct}</td>
                    <td className="py-2 text-right text-[#848e9c] font-mono">{b.airdropTokens}</td>
                    <td className="py-2 text-right text-[#848e9c] font-mono">{b.recipients}</td>
                    <td className="py-2 text-[#848e9c]">{b.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border border-[#2b3139] bg-[#0b0e11] p-3">
            <p className="text-xs text-[#848e9c]">
              Perp DEX tokens tend to dump post-TGE. dYdX -97%, Aevo -99%. HYPE is the outlier.
              Strategy: farm points, sell early at TGE. Don&apos;t hold through the dump.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
