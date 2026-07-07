// This file holds our list of loan products.
// Think of it like a menu of loans the bank can offer.
// Nothing here is calculated - it is just fixed data (a "mock" catalog).
// The rest of the app reads this list to check who can get which loan
// and to work out the EMI (monthly payment) for it.

// The kinds of jobs a borrower can have.
export type EmploymentType = 'salaried' | 'self-employed' | 'business';

// One loan product and all the rules that come with it.
export type LoanProduct = {
  id: string;
  name: string;
  // Smallest and biggest amount someone can borrow for this loan.
  minAmount: number;
  maxAmount: number;
  // Yearly interest rate, as a plain number like 14 (meaning 14%).
  annualRatePct: number;
  // The longest repayment period allowed, in months.
  maxTenureMonths: number;
  // The lowest monthly income someone needs to even be considered.
  minMonthlyIncome: number;
  // Which kinds of jobs are allowed to apply for this loan.
  allowedEmploymentTypes: EmploymentType[];
  // true if the borrower must pledge something (like property) to get this loan.
  requiresCollateral: boolean;
  // A short, plain-English line describing what the loan is for.
  shortDescription: string;
};

// The six loan products we offer. These numbers are realistic examples
// for a take-home project, not real bank rates.
export const LOAN_CATALOG: LoanProduct[] = [
  {
    id: 'personal-loan',
    name: 'Personal Loan',
    minAmount: 50_000,
    maxAmount: 1_500_000,
    annualRatePct: 14,
    maxTenureMonths: 60,
    minMonthlyIncome: 25_000,
    allowedEmploymentTypes: ['salaried', 'self-employed'],
    requiresCollateral: false,
    shortDescription:
      'An unsecured loan for personal needs like travel, medical bills, or a wedding.',
  },
  {
    id: 'salary-advance',
    name: 'Salary Advance',
    minAmount: 5_000,
    maxAmount: 200_000,
    annualRatePct: 18,
    maxTenureMonths: 12,
    minMonthlyIncome: 15_000,
    allowedEmploymentTypes: ['salaried'],
    requiresCollateral: false,
    shortDescription:
      'A quick short-term advance against your upcoming salary, paid back fast.',
  },
  {
    id: 'bnpl',
    name: 'BNPL (Buy Now Pay Later)',
    minAmount: 1_000,
    maxAmount: 100_000,
    annualRatePct: 24,
    maxTenureMonths: 6,
    minMonthlyIncome: 10_000,
    allowedEmploymentTypes: ['salaried', 'self-employed', 'business'],
    requiresCollateral: false,
    shortDescription:
      'Split a purchase into small, easy payments spread over a few months.',
  },
  {
    id: 'sme-loan',
    name: 'SME Loan',
    minAmount: 200_000,
    maxAmount: 5_000_000,
    annualRatePct: 13,
    maxTenureMonths: 84,
    minMonthlyIncome: 50_000,
    allowedEmploymentTypes: ['self-employed', 'business'],
    requiresCollateral: false,
    shortDescription:
      'Working capital to help a small or medium business run and grow.',
  },
  {
    id: 'top-up-loan',
    name: 'Top-up Loan',
    minAmount: 50_000,
    maxAmount: 1_000_000,
    annualRatePct: 12,
    maxTenureMonths: 60,
    minMonthlyIncome: 20_000,
    allowedEmploymentTypes: ['salaried', 'self-employed', 'business'],
    requiresCollateral: false,
    shortDescription:
      'Extra money added on top of a loan you already have with us.',
  },
  {
    id: 'secured-loan',
    name: 'Secured Loan',
    minAmount: 500_000,
    maxAmount: 10_000_000,
    annualRatePct: 9.5,
    maxTenureMonths: 180,
    minMonthlyIncome: 30_000,
    allowedEmploymentTypes: ['salaried', 'self-employed', 'business'],
    requiresCollateral: true,
    shortDescription:
      'A lower-rate loan backed by property or another asset you pledge.',
  },
];
