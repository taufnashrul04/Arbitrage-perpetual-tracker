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
import { Badge } from '@/components/ui/badge';
import { formatRate } from '@/lib/arb-engine';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const PAGE_SIZE = 20;

interface FundingRow {
  dex: string;
  ticker: string;
  mark_price: number;
  funding_rate_1h: number;
  volume_24h: number;
}

interface Props {
  data: FundingRow[];
  loading: boolean;
}

export function FundingTable({ data, loading }: Props) {
  const [page, setPage] = useState(0);

  const rows = useMemo(() => {
    return [...data].sort((a, b) => Math.abs(b.funding_rate_1h) - Math.abs(a.funding_rate_1h));
  }, [data]);

  const totalPages = Math.ceil(rows.length / PAGE_SIZE);
  const paged = rows.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  useMemo(() => { setPage(0); }, [data.length]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-6 w-6 animate-spin border-2 border-[#f0b90b] border-t-transparent" />
      </div>
    );
  }

  return (
    <div>
      <div className="overflow-x-auto border border-[#2b3139]">
        <Table>
          <TableHeader>
            <TableRow className="border-[#2b3139] bg-[#1e2329] hover:bg-[#1e2329]">
              <TableHead className="text-[#848e9c] w-12 text-[11px] font-medium">#</TableHead>
              <TableHead className="text-[#848e9c] text-[11px] font-medium">Pair</TableHead>
              <TableHead className="text-[#848e9c] text-[11px] font-medium">DEX</TableHead>
              <TableHead className="text-[#848e9c] text-[11px] font-medium text-right">Price</TableHead>
              <TableHead className="text-[#848e9c] text-[11px] font-medium text-right">Funding (1h)</TableHead>
              <TableHead className="text-[#848e9c] text-[11px] font-medium text-right">Annualized</TableHead>
              <TableHead className="text-[#848e9c] text-[11px] font-medium text-right">24h Volume</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paged.map((row, i) => {
              const globalIdx = page * PAGE_SIZE + i + 1;
              const annualized = row.funding_rate_1h * 8760;
              return (
                <TableRow
                  key={`${row.ticker}-${row.dex}-${globalIdx}`}
                  className="border-[#2b3139] hover:bg-[#2b3139]"
                >
                  <TableCell className="font-mono text-[11px] text-[#848e9c]">{globalIdx}</TableCell>
                  <TableCell className="font-mono font-bold text-[#eaecef] text-[12px]">
                    {row.ticker}
                  </TableCell>
                  <TableCell>
                    <span className={`inline-block border px-1.5 py-0.5 text-[10px] font-mono ${
                      row.dex === 'Variational' ? 'border-[#6b21a8]/30 text-[#a78bfa] bg-[#6b21a8]/10' :
                      row.dex === 'Nado' ? 'border-[#1d4ed8]/30 text-[#60a5fa] bg-[#1d4ed8]/10' :
                      row.dex === 'RISEx' ? 'border-[#059669]/30 text-[#34d399] bg-[#059669]/10' :
                      'border-[#c2410c]/30 text-[#fb923c] bg-[#c2410c]/10'
                    }`}>
                      {row.dex}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-mono text-[12px] text-[#eaecef]">
                    ${row.mark_price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                  </TableCell>
                  <TableCell className={`text-right font-mono text-[12px] font-medium ${row.funding_rate_1h > 0 ? 'text-[#f6465d]' : 'text-[#0ecb81]'}`}>
                    {formatRate(row.funding_rate_1h)}
                  </TableCell>
                  <TableCell className={`text-right font-mono text-[11px] ${annualized > 0 ? 'text-[#f6465d]/70' : 'text-[#0ecb81]/70'}`}>
                    {annualized > 100 ? `+${annualized.toFixed(0)}%` : annualized < -100 ? `${annualized.toFixed(0)}%` : `${(annualized).toFixed(2)}%`}
                  </TableCell>
                  <TableCell className="text-right font-mono text-[12px] text-[#848e9c]">
                    {row.volume_24h > 0 ? `$${(row.volume_24h / 1e6).toFixed(1)}M` : '--'}
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
            {page * PAGE_SIZE + 1}-{Math.min((page + 1) * PAGE_SIZE, rows.length)} of {rows.length}
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
