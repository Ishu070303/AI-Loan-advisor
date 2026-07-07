// This file does the loan math.
// EMI means "Equated Monthly Installment" - the fixed amount someone
// pays back every month until the loan is fully paid off.
//
// IMPORTANT: this is the ONLY place in the app that should do this math.
// The chatbot (LLM) is never allowed to calculate numbers itself - it only
// gets told the numbers we work out here. This keeps the numbers correct
// and stops the chatbot from making up wrong figures.

// The three numbers we hand back for every loan calculation.
export type EmiResult = {
  emi: number; // what you pay every month
  totalRepayment: number; // emi x number of months
  totalInterest: number; // totalRepayment minus the original loan amount
};

// Rounds a number to 2 decimal places, the way money is normally shown.
function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

// Turns a yearly interest rate (like 14, meaning 14%) into the monthly
// rate used in the EMI formula (as a plain decimal, not a percentage).
export function monthlyRateFromAnnualPct(annualRatePct: number): number {
  return annualRatePct / 12 / 100;
}

// Works out the EMI, total repayment, and total interest for a loan.
//
// principal      - how much money is being borrowed
// annualRatePct  - the yearly interest rate, e.g. 14 for 14%
// tenureMonths   - how many months the borrower has to pay it back
//
// Formula used (the standard EMI formula):
//   EMI = P * r * (1 + r)^n / ((1 + r)^n - 1)
// where r is the monthly rate and n is the number of months.
//
// If the rate is 0% (no interest), the formula above breaks (division by
// zero), so in that case we just split the loan evenly: EMI = P / n.
export function calculateEmi(
  principal: number,
  annualRatePct: number,
  tenureMonths: number
): EmiResult {
  if (principal <= 0 || tenureMonths <= 0) {
    throw new Error('principal and tenureMonths must be greater than 0');
  }

  const r = monthlyRateFromAnnualPct(annualRatePct);
  const n = tenureMonths;

  let emi: number;
  if (r === 0) {
    // No interest at all - just split the loan evenly across the months.
    emi = principal / n;
  } else {
    const growth = Math.pow(1 + r, n);
    emi = (principal * r * growth) / (growth - 1);
  }

  const totalRepayment = emi * n;
  const totalInterest = totalRepayment - principal;

  return {
    emi: round2(emi),
    totalRepayment: round2(totalRepayment),
    totalInterest: round2(totalInterest),
  };
}
