'use client';

import { useEffect, useState } from 'react';
import { EarningEstimationResponse, CompetitionResult } from '@/lib/estimator';

const INITIAL_SHOW = 3;

interface Props {
  result: EarningEstimationResponse;
}

function CompetitionCard({ comp, index }: { comp: CompetitionResult; index: number }) {
  return (
    <div
      className="bg-white border-l-4 border-blue-dark rounded-xl shadow-md p-6 hover:shadow-xl transition-shadow"
      style={{ animationDelay: `${index * 0.08}s` }}
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <h4 className="font-heading font-bold text-lg text-blue-dark">{comp.name}</h4>
          <p className="font-sans text-sm text-body-text mt-1">{comp.date}</p>
        </div>
        <span
          className={`px-4 py-1 rounded-full font-heading text-xs font-bold text-white ${
            comp.direction === 'UP' ? 'bg-green-light' : 'bg-blue-dark'
          }`}
        >
          {comp.direction}
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
        {[
          { label: 'REWARD RATE',   value: `£${comp.reward_rate.toFixed(2)}/MWh` },
          { label: 'YOUR CAPACITY', value: `${comp.eligible_capacity_kw.toFixed(2)} kW` },
          { label: 'DURATION',      value: `${comp.duration_h.toFixed(2)}h` },
        ].map(({ label, value }) => (
          <div key={label} className="bg-sand-50 rounded-lg p-3">
            <p className="font-heading text-xs text-body-text mb-1">{label}</p>
            <p className="font-sans font-bold text-blue-dark">{value}</p>
          </div>
        ))}
        <div className="bg-green-light/15 rounded-lg p-3">
          <p className="font-heading text-xs text-green-dark mb-1">EARNINGS</p>
          <p className="font-sans font-bold text-green-dark">£{comp.earnings_gbp.toFixed(4)}</p>
        </div>
      </div>
    </div>
  );
}

export default function ResultsDisplay({ result }: Props) {
  const [animatedTotal, setAnimatedTotal] = useState(0);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    setAnimatedTotal(0);
    setShowAll(false);
    const target = result.grand_total_earnings;
    const steps  = 60;
    const inc    = target / steps;
    let current  = 0;
    const timer  = setInterval(() => {
      current += inc;
      if (current >= target) { setAnimatedTotal(target); clearInterval(timer); }
      else setAnimatedTotal(current);
    }, 1000 / steps);
    return () => clearInterval(timer);
  }, [result.grand_total_earnings]);

  const allComps = [...result.up_competitions, ...result.down_competitions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const visible   = showAll ? allComps : allComps.slice(0, INITIAL_SHOW);
  const remaining = allComps.length - INITIAL_SHOW;

  return (
    <div className="space-y-10 mt-10">

      {/* Section heading */}
      <div>
        <h2 className="font-heading text-5xl font-extrabold text-green-light mb-2">YOUR RESULTS</h2>
        <div className="w-20 h-1 bg-blue-dark rounded" />
      </div>

      

      {/* Capacity summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border-t-4 border-green-light rounded-xl shadow-lg p-8">
          <p className="font-heading text-xs text-body-text mb-2">TOTAL UP CAPACITY</p>
          <p className="text-5xl font-extrabold text-green-light">
            {result.up_assets.total_capacity_kw.toFixed(2)}
          </p>
          <p className="font-sans text-sm text-body-text mt-1">kW</p>
        </div>
        <div className="bg-white border-t-4 border-blue-dark rounded-xl shadow-lg p-8">
          <p className="font-heading text-xs text-body-text mb-2">TOTAL DOWN CAPACITY</p>
          <p className="text-5xl font-extrabold text-blue-dark">
            {result.down_assets.total_capacity_kw.toFixed(2)}
          </p>
          <p className="font-sans text-sm text-body-text mt-1">kW</p>
        </div>
      </div>

      

      {/* Earnings split */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border-t-4 border-green-light rounded-xl shadow-lg p-6">
          <p className="font-heading text-xs text-body-text mb-1">UP EARNINGS</p>
          <p className="text-3xl font-extrabold text-green-light">£{result.up_total_earnings.toFixed(2)}</p>
          <p className="font-sans text-xs text-body-text mt-1">{result.up_competitions.length} competitions</p>
        </div>
        <div className="bg-white border-t-4 border-blue-dark rounded-xl shadow-lg p-6">
          <p className="font-heading text-xs text-body-text mb-1">DOWN EARNINGS</p>
          <p className="text-3xl font-extrabold text-blue-dark">£{result.down_total_earnings.toFixed(2)}</p>
          <p className="font-sans text-xs text-body-text mt-1">{result.down_competitions.length} competitions</p>
        </div>
      </div>

            {/* Grand total */}
      <div className="bg-blue-dark rounded-2xl shadow-2xl p-10 text-center">
        <p className="font-heading text-sm text-sand-300 mb-3">
          TOTAL PROJECTED EARNINGS (12 MONTHS)
        </p>
        <p className="font-heading text-7xl font-extrabold text-gold">
          £{animatedTotal.toFixed(2)}
        </p>
        <p className="font-sans text-sand-300 mt-3 text-sm">
          Top 2 slots per day · Last 12 months of competition data
        </p>
      </div>

      {/* Competition list */}
      <div>
        <h3 className="font-heading text-2xl font-bold text-body-text mb-6">
          ELIGIBLE COMPETITIONS ({allComps.length})
        </h3>

        {allComps.length === 0 ? (
          <div className="border-l-4 border-gold bg-gold/10 text-body-text px-6 py-4 rounded-md font-sans">
            No eligible competitions found. Try adjusting your asset capacities.
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {visible.map((comp, i) => (
                <CompetitionCard key={`${comp.opportunity_id}-${i}`} comp={comp} index={i} />
              ))}
            </div>

            {allComps.length > INITIAL_SHOW && (
              <button
                onClick={() => setShowAll(v => !v)}
                className="mt-6 w-full py-3 px-6 border-2 border-blue-dark text-blue-dark font-heading font-bold rounded-lg hover:bg-blue-dark hover:text-white transition-all"
              >
                {showAll
                  ? 'SHOW LESS'
                  : `LOAD MORE — ${remaining} MORE COMPETITION${remaining !== 1 ? 'S' : ''}`}
              </button>
            )}
          </>
        )}
      </div>



    </div>
  );
}
