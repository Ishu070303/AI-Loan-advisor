// This file decides which loans someone can actually get.
// It checks a borrower's details against every product's rules and
// gives a plain-English reason for why each product passes or fails.
// It also uses emi.ts to work out the monthly payment for each product,
// so we can rank the loans the person qualifies for from cheapest to
// most expensive (by total interest paid).

import { LOAN_CATALOG, LoanProduct, EmploymentType } from './catalog';
import { calculateEmi, EmiResult } from './emi';

// The details we need about a borrower to check eligibility.
export type BorrowerProfile = {
  loanAmount: number;
  income: number; // monthly income
  existingEmi: number; // what they already pay each month for other loans
  tenureMonths: number; // how many months they want to repay over
  employmentType: EmploymentType;
  purpose: string; // free text, e.g. "wedding", "medical", "business expansion"
};

// The result of checking one single rule against one product.
export type EligibilityCheck = {
  rule: 'amountRange' | 'minIncome' | 'employmentType' | 'foir' | 'tenure';
  passed: boolean;
  reason: string;
};

// The full result for one product: did it pass overall, and why/why not
// for each individual rule. The emi field is filled in whenever we were
// able to run the numbers (so the UI can show "what if" figures even for
// a product the person didn't qualify for).
export type ProductEligibilityResult = {
  product: LoanProduct;
  eligible: boolean;
  checks: EligibilityCheck[];
  emi: EmiResult | null;
};

// Simple helper so money shows up the same way everywhere in our reasons.
function money(value: number): string {
  return `₹${value.toLocaleString('en-IN')}`;
}

// Checks one product against the borrower's profile and returns every
// rule's pass/fail result plus a human-readable reason for each.
function evaluateProduct(
  product: LoanProduct,
  profile: BorrowerProfile
): ProductEligibilityResult {
  const checks: EligibilityCheck[] = [];

  // Rule 1: the amount they want must fit inside this product's range.
  const amountOk =
    profile.loanAmount >= product.minAmount &&
    profile.loanAmount <= product.maxAmount;
  checks.push({
    rule: 'amountRange',
    passed: amountOk,
    reason: amountOk
      ? `Requested amount ${money(profile.loanAmount)} is within this product's range of ${money(product.minAmount)}–${money(product.maxAmount)}.`
      : `Requested amount ${money(profile.loanAmount)} is outside this product's range of ${money(product.minAmount)}–${money(product.maxAmount)}.`,
  });

  // Rule 2: their income must meet the product's minimum.
  const incomeOk = profile.income >= product.minMonthlyIncome;
  checks.push({
    rule: 'minIncome',
    passed: incomeOk,
    reason: incomeOk
      ? `Monthly income ${money(profile.income)} meets the minimum required ${money(product.minMonthlyIncome)}.`
      : `Monthly income ${money(profile.income)} is below the minimum required ${money(product.minMonthlyIncome)}.`,
  });

  // Rule 3: their job type must be one this product allows.
  const employmentOk = product.allowedEmploymentTypes.includes(
    profile.employmentType
  );
  checks.push({
    rule: 'employmentType',
    passed: employmentOk,
    reason: employmentOk
      ? `Employment type "${profile.employmentType}" is accepted for this product.`
      : `Employment type "${profile.employmentType}" is not accepted for this product.`,
  });

  // Rule 4: tenure they asked for can't be longer than the product allows.
  const tenureOk = profile.tenureMonths <= product.maxTenureMonths;
  checks.push({
    rule: 'tenure',
    passed: tenureOk,
    reason: tenureOk
      ? `Requested tenure of ${profile.tenureMonths} months is within the maximum of ${product.maxTenureMonths} months.`
      : `Requested tenure of ${profile.tenureMonths} months exceeds the maximum of ${product.maxTenureMonths} months.`,
  });

  // We need a valid tenure and amount to actually run the EMI numbers.
  // If either is missing/invalid we skip the math and the FOIR check.
  let emi: EmiResult | null = null;
  if (profile.loanAmount > 0 && profile.tenureMonths > 0) {
    emi = calculateEmi(
      profile.loanAmount,
      product.annualRatePct,
      profile.tenureMonths
    );
  }

  // Rule 5: FOIR (Fixed Obligation to Income Ratio) - all their monthly
  // loan payments together (old + new) can't be more than half their income.
  let foirOk = false;
  if (emi) {
    const totalMonthlyObligation = profile.existingEmi + emi.emi;
    const foirLimit = profile.income * 0.5;
    foirOk = totalMonthlyObligation <= foirLimit;
    checks.push({
      rule: 'foir',
      passed: foirOk,
      reason: foirOk
        ? `Total monthly payments (existing ${money(profile.existingEmi)} + new ${money(emi.emi)}) stay within 50% of income (limit ${money(foirLimit)}).`
        : `Total monthly payments (existing ${money(profile.existingEmi)} + new ${money(emi.emi)}) would exceed 50% of income (limit ${money(foirLimit)}).`,
    });
  } else {
    checks.push({
      rule: 'foir',
      passed: false,
      reason: 'Could not check affordability - loan amount or tenure is missing.',
    });
  }

  const eligible = checks.every((check) => check.passed);

  return { product, eligible, checks, emi };
}

// Checks every product in the catalog against the borrower's profile.
// Eligible products are sorted first, cheapest (lowest total interest)
// first. Ineligible products are listed after, in catalog order, so the
// UI can still explain to the user why those didn't work out.
export function evaluateEligibility(
  profile: BorrowerProfile
): ProductEligibilityResult[] {
  const results = LOAN_CATALOG.map((product) =>
    evaluateProduct(product, profile)
  );

  const eligible = results
    .filter((result) => result.eligible)
    .sort((a, b) => (a.emi?.totalInterest ?? 0) - (b.emi?.totalInterest ?? 0));

  const notEligible = results.filter((result) => !result.eligible);

  return [...eligible, ...notEligible];
}

// Convenience helper for when we only want the products someone
// actually qualifies for, already ranked cheapest first.
export function getEligibleProducts(
  profile: BorrowerProfile
): ProductEligibilityResult[] {
  return evaluateEligibility(profile).filter((result) => result.eligible);
}
