// A small banner that stays visible all the time, reminding the user
// that this is guidance, not a final loan offer. Real lending apps show
// something like this everywhere for legal/trust reasons.

export default function DisclaimerBanner() {
  return (
    <div className="w-full bg-amber-50 border-b border-amber-200 text-amber-900 text-xs sm:text-sm px-4 py-2 text-center">
      This tool gives indicative estimates only. Final loan approval, rate,
      and amount always depend on underwriting and verification.
    </div>
  );
}
