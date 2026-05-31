// API route: /api/funding
// Aggregates funding rates from all DEXes

import { NextResponse } from 'next/server';
import { fetchVariationalFunding, normalizeFundingRate } from '@/lib/dex-adapters/variational';
import { fetchNadoFunding } from '@/lib/dex-adapters/nado';
import { fetchRISExFunding, normalizeRISExFunding } from '@/lib/dex-adapters/risex';
import { fetchDecibelFunding } from '@/lib/dex-adapters/decibel';
import { findArbOpportunities, type FundingData } from '@/lib/arb-engine';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

export async function GET() {
  try {
    // Fetch all DEXes in parallel
    const [variational, nado, risex, decibel] = await Promise.all([
      fetchVariationalFunding(),
      fetchNadoFunding(),
      fetchRISExFunding(),
      fetchDecibelFunding(), // no API key yet
    ]);

    // Normalize to common format
    const fundingData: FundingData[] = [];

    for (const m of variational) {
      fundingData.push({
        dex: 'Variational',
        ticker: m.ticker,
        mark_price: m.mark_price,
        funding_rate_1h: normalizeFundingRate(m.funding_rate, m.funding_interval_s),
        volume_24h: m.volume_24h,
        raw_rate: m.funding_rate,
        interval_seconds: m.funding_interval_s,
      });
    }

    for (const m of nado) {
      fundingData.push({
        dex: 'Nado',
        ticker: m.ticker,
        mark_price: m.mark_price,
        funding_rate_1h: m.funding_rate, // already per 1h interval from Nado
        volume_24h: 0,
        raw_rate: m.funding_rate,
        interval_seconds: 3600,
      });
    }

    for (const m of risex) {
      fundingData.push({
        dex: 'RISEx',
        ticker: m.display_name,
        mark_price: m.mark_price,
        funding_rate_1h: normalizeRISExFunding(m.current_funding_rate, m.funding_interval_ns),
        volume_24h: m.quote_volume_24h,
        raw_rate: m.current_funding_rate,
        interval_seconds: m.funding_interval_ns / 1e9, // ns → seconds
      });
    }

    for (const m of decibel) {
      fundingData.push({
        dex: 'Decibel',
        ticker: m.ticker,
        mark_price: m.mark_price,
        funding_rate_1h: m.funding_rate,  // already per-hour from adapter
        volume_24h: 0,
        raw_rate: m.funding_rate,
        interval_seconds: m.funding_period_s,
      });
    }

    // Find arbitrage opportunities
    const opportunities = findArbOpportunities(fundingData);

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      dexes: {
        variational: variational.length,
        nado: nado.length,
        risex: risex.length,
        decibel: decibel.length,
      },
      funding: fundingData,
      opportunities,
    });
  } catch (err: any) {
    console.error('[API] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
