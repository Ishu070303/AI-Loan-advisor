// Shows the list of recommended loans (as cards) plus a button to
// download everything as a text file the user can keep or print.

import { ProfileFormValues, Recommendation } from '@/lib/types';
import { downloadSummaryFile } from '@/lib/summary';
import RecommendationCard from './RecommendationCard';

type Props = {
  recommendations: Recommendation[];
  profile: ProfileFormValues | null;
};

export default function RecommendationsPanel({ recommendations, profile }: Props) {
  if (recommendations.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-700">
          Recommended for you ({recommendations.length})
        </h2>
        <button
          type="button"
          onClick={() => profile && downloadSummaryFile(profile, recommendations)}
          disabled={!profile}
          className="text-xs font-medium text-brand-700 border border-brand-200 bg-brand-50 rounded-lg px-3 py-1.5 hover:bg-brand-100 transition-colors disabled:opacity-50"
        >
          Download summary
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {recommendations.map((rec, index) => (
          <RecommendationCard key={rec.productId} recommendation={rec} rank={index + 1} />
        ))}
      </div>
    </div>
  );
}
