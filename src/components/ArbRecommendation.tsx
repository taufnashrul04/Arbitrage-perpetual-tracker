'use client';

import { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Zap, ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { type ArbOpportunity, formatRate, formatUSD } from '@/lib/arb-engine';

const PAGE_SIZE = 20;

interface Props {
  opportunities: ArbOpportunity[];
  loading: boolean;
}

export function ArbRecommendation({ opportunities, loading }: Props) {
  const [page, setPage] = useState(0);

  const totalPages = Math.ceil(opportunities.length / PAGE_SIZE);
  const paged = opportunities.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  useMemo(() => { setPage(0); }, [opportunities.length]);

  if (loading) {
    return (
      <div className="flex h-32 items-center justify-center">
        <div className="h-6 w-6 animate-spin border-2 border-[#f0b90b] border-t-transparent" />
      </div>
    );
  }

  if (opportunities.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center text-[#848e9c] text-sm">
        No arbitrage opportunities found across available DEXes
      </div>
    );
  }

  const dexColor = (dex: string) =>
    dex === 'Variational' ? 'text-[#a78bfa]' :
    dex === 'Nado' ? 'text-[#60a5fa]' :
    dex === 'RISEx' ? 'text-[#34d399]' :
    'text-[#fb923c]';

  return (
    <div>
      <div className="overflow-x-auto border border-[#2b3139]">
        <Table>
          <TableHeader>
            <TableRow className="border-[#2b3139] bg-[#1e2329] hover:bg-[#1e2329]">
              <TableHead className="text-[#848e9c] w-12 text-[11px] font-medium">#</TableHead>
              <TableHead className="text-[#848e9c] text-[11px] font-medium">Pair</TableHead>
              <TableHead className="text-[#848e9c] text-[11px] font-medium">Confidence</TableHead>
              <TableHead className="text-[#848e9c] text-[11px] font-medium">Long DEX</TableHead>
              <TableHead className="text-[#848e9c] text-[11px] font-medium text-right">Long Rate</TableHead>
              <TableHead className="text-[#848e9c] text-[11px] font-medium">Short DEX</TableHead>
              <TableHead className="text-[#848e9c] text-[11px] font-medium text-right">Short Rate</TableHead>
              <TableHead className="text-[#848e9c] text-[11px] font-medium text-right">Net (1h)</TableHead>
              <TableHead className="text-[#848e9c] text-[11px] font-medium text-right">Annualized</TableHead>
              <TableHead className="text-[#848e9c] text-[11px] font-medium text-right">Daily/$1k</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paged.map((opp, i) => {
              const globalIdx = page * PAGE_SIZE + i + 1;
              return (
                <TableRow
                  key={`${opp.pair}-${opp.longDex}-${opp.shortDex}`}
                  className="border-[#2b3139] hover:bg-[#2b3139]"
                >
                  <TableCell className="font-mono text-[11px] text-[#848e9c]">{globalIdx}</TableCell>
                  <TableCell className="font-mono font-bold text-[#eaecef] text-[12px]">
                    {opp.pair}
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center gap-1 border px-1.5 py-0.5 text-[10px] font-mono ${
                      opp.confidence === 'high' ? 'border-[#0ecb81]/30 text-[#0ecb81]' :
                      opp.confidence === 'medium' ? 'border-[#f0b90b]/30 text-[#f0b90b]' :
                      'border-[#2b3139] text-[#848e9c]'
                    }`}>
                      <Zap className="h-2.5 w-2.5" />
                      {opp.confidence}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={`font-mono text-[12px] font-medium ${dexColor(opp.longDex)}`}>
                      {opp.longDex}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-mono text-[12px] text-[#0ecb81]">
                    {formatRate(opp.longRate)}
                  </TableCell>
                  <TableCell>
                    <span className={`font-mono text-[12px] font-medium ${dexColor(opp.shortDex)}`}>
                      {opp.shortDex}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-mono text-[12px] text-[#f6465d]">
                    {formatRate(opp.shortRate)}
                  </TableCell>
                  <TableCell className={`text-right font-mono text-[12px] font-bold ${opp.netRate > 0 ? 'text-[#0ecb81]' : 'text-[#f6465d]'}`}>
                    {formatRate(opp.netRate)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-[11px] text-[#848e9c]">
                    {opp.netRateAnnualized > 1000
                      ? `${(opp.netRateAnnualized / 1000).toFixed(1)}K%`
                      : `${opp.netRateAnnualized.toFixed(1)}%`
                    }
                  </TableCell>
                  <TableCell className="text-right font-mono text-[12px] text-[#eaecef]">
                    {formatUSD(opp.estimatedDaily)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="mt-3 flex items-center justify-between">
          <span className="text-[11px] font-mono text-[#848e9c]">
            {page * PAGE_SIZE + 1}-{Math.min((page + 1) * PAGE_SIZE, opportunities.length)} of {opportunities.length}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="flex items-center gap-1 border border-[#2b3139] bg-[#1e2329] px-2.5 py-1 text-[11px] text-[#848e9c] hover:bg-[#2b3139] disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-3 w-3" /> Prev
            </button>
            <span className="text-[11px] text-[#848e9c] font-mono px-2">
              {page + 1}/{totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="flex items-center gap-1 border border-[#2b3139] bg-[#1e2329] px-2.5 py-1 text-[11px] text-[#848e9c] hover:bg-[#2b3139] disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Next <ChevronRight className="h-3 w-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
