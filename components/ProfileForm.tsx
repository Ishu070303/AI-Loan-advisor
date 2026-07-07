'use client';

// The form where the user tells us about themselves: how much they want
// to borrow, what for, how much they earn, and so on. We use this data
// to work out which loans they qualify for.

import { useMemo, useState } from 'react';
import { EmploymentType } from '@/lib/catalog';
import { calculateEmi } from '@/lib/emi';
import { ProfileFormValues } from '@/lib/types';

const PURPOSE_OPTIONS = [
  'Personal expenses',
  'Medical emergency',
  'Wedding',
  'Travel',
  'Education',
  'Home renovation',
  'Business expansion',
  'Debt consolidation',
  'Other',
];

// A representative interest rate used ONLY to illustrate the tenure
// trade-off in the form, before we know exactly which product the user
// will qualify for. The real, final rates and numbers always come from
// the server after eligibility is checked - this is just a helpful preview.
const ILLUSTRATIVE_RATE_PCT = 14;

const DEFAULT_VALUES: ProfileFormValues = {
  loanAmount: '300000',
  purpose: PURPOSE_OPTIONS[0],
  income: '60000',
  existingEmi: '0',
  tenureMonths: '36',
  employmentType: 'salaried',
};

type Props = {
  onSubmit: (profile: ProfileFormValues) => void;
  disabled: boolean;
  hasSubmittedOnce: boolean;
};

export default function ProfileForm({ onSubmit, disabled, hasSubmittedOnce }: Props) {
  const [values, setValues] = useState<ProfileFormValues>(DEFAULT_VALUES);

  function update<K extends keyof ProfileFormValues>(key: K, value: ProfileFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  // A quick, illustrative EMI preview so the user can see, right away,
  // how moving the tenure slider trades off monthly payment vs total
  // interest. This uses the same pure calculator the server uses, so the
  // math itself is correct - it's just using an example rate, not the
  // user's actual matched product (we don't know that yet).
  const tenurePreview = useMemo(() => {
    const amount = Number(values.loanAmount);
    const months = Number(values.tenureMonths);
    if (!Number.isFinite(amount) || amount <= 0 || !Number.isFinite(months) || months <= 0) {
      return null;
    }
    return calculateEmi(amount, ILLUSTRATIVE_RATE_PCT, months);
  }, [values.loanAmount, values.tenureMonths]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit(values);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-2xl shadow-card border border-slate-100 p-5 sm:p-6 space-y-4"
    >
      <div>
        <h2 className="text-base font-semibold text-slate-900">Your profile</h2>
        <p className="text-sm text-slate-500">
          Fill this in once - you can chat and update it any time.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 sm:col-span-1">
          <label className="block text-xs font-medium text-slate-600 mb-1">
            Loan amount (₹)
          </label>
          <input
            type="number"
            min={1000}
            step={1000}
            required
            value={values.loanAmount}
            onChange={(e) => update('loanAmount', e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
          />
        </div>

        <div className="col-span-2 sm:col-span-1">
          <label className="block text-xs font-medium text-slate-600 mb-1">Purpose</label>
          <select
            value={values.purpose}
            onChange={(e) => update('purpose', e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 bg-white"
          >
            {PURPOSE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div className="col-span-2 sm:col-span-1">
          <label className="block text-xs font-medium text-slate-600 mb-1">
            Monthly income (₹)
          </label>
          <input
            type="number"
            min={0}
            step={1000}
            required
            value={values.income}
            onChange={(e) => update('income', e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
          />
        </div>

        <div className="col-span-2 sm:col-span-1">
          <label className="block text-xs font-medium text-slate-600 mb-1">
            Existing monthly EMI (₹)
          </label>
          <input
            type="number"
            min={0}
            step={500}
            value={values.existingEmi}
            onChange={(e) => update('existingEmi', e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
          />
        </div>

        <div className="col-span-2">
          <label className="block text-xs font-medium text-slate-600 mb-1">
            Employment type
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(['salaried', 'self-employed', 'business'] as EmploymentType[]).map((type) => (
              <button
                type="button"
                key={type}
                onClick={() => update('employmentType', type)}
                className={`rounded-lg border px-2 py-2 text-xs capitalize transition-colors ${
                  values.employmentType === type
                    ? 'border-brand-500 bg-brand-50 text-brand-700 font-medium'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {type.replace('-', ' ')}
              </button>
            ))}
          </div>
        </div>

        <div className="col-span-2">
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-medium text-slate-600">Preferred tenure</label>
            <span className="text-xs font-semibold text-brand-700">
              {values.tenureMonths} months
            </span>
          </div>
          <input
            type="range"
            min={3}
            max={180}
            step={3}
            value={values.tenureMonths}
            onChange={(e) => update('tenureMonths', e.target.value)}
            className="w-full accent-brand-600"
          />

          {/* The tenure trade-off hint: shorter tenure means a bigger
              monthly payment but less interest overall; a longer tenure
              is the opposite. */}
          <p className="mt-2 text-xs text-slate-500 leading-relaxed">
            Shorter tenure = higher monthly EMI but less total interest.
            Longer tenure = lower EMI but more total interest.
            {tenurePreview && (
              <>
                {' '}
                Example at an illustrative {ILLUSTRATIVE_RATE_PCT}% p.a.: about{' '}
                <span className="font-medium text-slate-700">
                  ₹{tenurePreview.emi.toLocaleString('en-IN')}
                </span>{' '}
                per month, ₹{tenurePreview.totalInterest.toLocaleString('en-IN')} total interest.
                Your real matched rate may differ.
              </>
            )}
          </p>
        </div>
      </div>

      <button
        type="submit"
        disabled={disabled}
        className="w-full rounded-lg bg-brand-600 text-white text-sm font-medium py-2.5 hover:bg-brand-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {hasSubmittedOnce ? 'Update recommendations' : 'Get recommendations'}
      </button>
    </form>
  );
}
