// One card showing a single loan option the user qualifies for.
// All the numbers on this card come straight from the server - nothing
// here is calculated in the browser.

import { Recommendation } from '@/lib/types';

function money(value: number): string {
  return `₹${value.toLocaleString('en-IN')}`;
}

export default function RecommendationCard({
  recommendation,
  rank,
}: {
  recommendation: Recommendation;
  rank: number;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-4 sm:p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            {rank === 1 && (
              <span className="text-[10px] font-semibold uppercase tracking-wide bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">
                Best match
              </span>
            )}
            <h3 className="font-semibold text-slate-900">{recommendation.productName}</h3>
          </div>
          <p className="text-xs text-slate-500 mt-1">{recommendation.whyItFits}</p>
        </div>
        {recommendation.requiresCollateral && (
          <span className="text-[10px] font-medium bg-slate-100 text-slate-600 px-2 py-1 rounded-full whitespace-nowrap">
            Collateral needed
          </span>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2 text-center border-t border-slate-100 pt-3">
        <div>
          <p className="text-[10px] uppercase tracking-wide text-slate-400">Monthly EMI</p>
          <p className="text-sm font-semibold text-slate-900">{money(recommendation.emi)}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wide text-slate-400">Total interest</p>
          <p className="text-sm font-semibold text-slate-900">
            {money(recommendation.totalInterest)}
          </p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wide text-slate-400">Total repayment</p>
          <p className="text-sm font-semibold text-slate-900">
            {money(recommendation.totalRepayment)}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 pt-3">
        <span>{recommendation.tenureMonths} months tenure</span>
        <span>{recommendation.annualRatePct}% p.a.</span>
      </div>
    </div>
  );
}
