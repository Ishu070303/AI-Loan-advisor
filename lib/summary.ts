// Builds the plain-text file that the "Download Summary" button gives
// the user. Kept as its own small function so it's easy to test and easy
// to read, separate from the button's click-handling code.

import { ProfileFormValues, Recommendation } from './types';

function money(value: number): string {
  return `Rs. ${value.toLocaleString('en-IN')}`;
}

export function buildSummaryText(
  profile: ProfileFormValues,
  recommendations: Recommendation[]
): string {
  const lines: string[] = [];

  lines.push('AI Loan Advisor - Recommendation Summary');
  lines.push(`Generated: ${new Date().toLocaleString('en-IN')}`);
  lines.push('');
  lines.push('Your details');
  lines.push('------------');
  lines.push(`Loan amount requested: ${money(Number(profile.loanAmount) || 0)}`);
  lines.push(`Purpose: ${profile.purpose || 'not specified'}`);
  lines.push(`Monthly income: ${money(Number(profile.income) || 0)}`);
  lines.push(`Existing monthly EMI: ${money(Number(profile.existingEmi) || 0)}`);
  lines.push(`Preferred tenure: ${profile.tenureMonths} months`);
  lines.push(`Employment type: ${profile.employmentType}`);
  lines.push('');
  lines.push('Recommended loan options (cheapest total interest first)');
  lines.push('---------------------------------------------------------');

  if (recommendations.length === 0) {
    lines.push('No eligible products were found for this profile.');
  } else {
    recommendations.forEach((rec, index) => {
      lines.push('');
      lines.push(`${index + 1}. ${rec.productName}`);
      lines.push(`   Interest rate: ${rec.annualRatePct}% per year`);
      lines.push(`   Tenure: ${rec.tenureMonths} months`);
      lines.push(`   Monthly EMI: ${money(rec.emi)}`);
      lines.push(`   Total repayment: ${money(rec.totalRepayment)}`);
      lines.push(`   Total interest: ${money(rec.totalInterest)}`);
      lines.push(`   Collateral required: ${rec.requiresCollateral ? 'Yes' : 'No'}`);
      lines.push(`   Why this fits: ${rec.whyItFits}`);
    });
  }

  lines.push('');
  lines.push('---------------------------------------------------------');
  lines.push(
    'Disclaimer: These figures are indicative only. Final approval, the ' +
      'exact rate, and the final amount all depend on underwriting and ' +
      'verification by the lender.'
  );

  return lines.join('\n');
}

// Triggers a browser download of the summary as a .txt file.
// This runs in the browser only (it uses `document` and `URL`).
export function downloadSummaryFile(
  profile: ProfileFormValues,
  recommendations: Recommendation[]
): void {
  const text = buildSummaryText(profile, recommendations);
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = 'loan-recommendation-summary.txt';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}
