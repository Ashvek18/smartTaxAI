import { SalaryStructure, TaxDeductions, TaxCalculationResult, ComparisonResult } from '../types';

export const DEFAULT_SLABS = {
  oldSlabs: [
    { min: 0, max: 250000, rate: 0 },
    { min: 250000, max: 500000, rate: 0.05 },
    { min: 500000, max: 1000000, rate: 0.20 },
    { min: 1000000, max: null, rate: 0.30 },
  ],
  newSlabs: [
    { min: 0, max: 300000, rate: 0 },
    { min: 300000, max: 700000, rate: 0.05 },
    { min: 700000, max: 1000000, rate: 0.10 },
    { min: 1000000, max: 1200000, rate: 0.15 },
    { min: 1200000, max: 1500000, rate: 0.20 },
    { min: 1500000, max: null, rate: 0.30 },
  ],
  standardDeductionOld: 50000,
  standardDeductionNew: 75000,
};

/**
 * Calculates the HRA Exemption under Section 10(13A)
 * Least of:
 * 1. Actual HRA received
 * 2. Rent Paid - 10% of Basic
 * 3. 50% of Basic (Metro) or 40% (Non-Metro)
 */
export function calculateHraExemption(
  basic: number,
  hra: number,
  rentPaid: number,
  isMetro: boolean
): number {
  if (rentPaid <= 0 || basic <= 0 || hra <= 0) return 0;
  
  const option1 = hra;
  const option2 = Math.max(0, rentPaid - 0.1 * basic);
  const option3 = isMetro ? 0.5 * basic : 0.4 * basic;
  
  return Math.min(option1, option2, option3);
}

/**
 * Calculate tax under a specific regime configuration
 */
export function calculateTaxForRegime(
  regime: 'old' | 'new',
  grossSalary: number,
  hraExemption: number,
  salary: SalaryStructure,
  deductions: TaxDeductions,
  config = DEFAULT_SLABS
): TaxCalculationResult {
  const isOld = regime === 'old';
  
  // 1. Calculate Gross Income components included in tax computation
  // Professional Tax is subtracted from Gross under Old regime
  const profTaxDeduction = isOld ? salary.professionalTax : 0;
  
  // Standard Deduction
  const stdDeduction = isOld ? config.standardDeductionOld : config.standardDeductionNew;
  const actualStdDeduction = Math.min(grossSalary, stdDeduction);
  
  // Exemptions
  const actualHraExemption = isOld ? hraExemption : 0;
  
  // Section deductions under Old Regime
  let otherDeductions = 0;
  if (isOld) {
    const capped80C = Math.min(15000) || Math.min(deductions.sec80C, 150000); // capped at 1.5L
    const capped80D = Math.min(deductions.sec80D, 50000); // health insurance max 50k
    const cappedNps = Math.min(deductions.nps80CCD1B, 50000); // extra NPS max 50k
    const cappedHomeLoanInterest = Math.min(deductions.homeLoanInterest, 200000); // section 24 home loan max 2L
    const eduLoan = deductions.educationLoan; // no limit
    const donations80G = deductions.donations; // simplified to full amount
    
    otherDeductions = capped80C + capped80D + cappedNps + cappedHomeLoanInterest + eduLoan + donations80G;
  }
  
  const totalDeductionsAndExemptions = actualStdDeduction + actualHraExemption + profTaxDeduction + otherDeductions;
  
  // Taxable Income (cannot be negative)
  const taxableIncome = Math.max(0, grossSalary - totalDeductionsAndExemptions);
  
  // 2. Compute base tax based on slabs
  const slabs = isOld ? config.oldSlabs : config.newSlabs;
  let remainingIncome = taxableIncome;
  let baseTax = 0;
  const slabsBreakdown: TaxCalculationResult['slabsBreakdown'] = [];
  
  for (const slab of slabs) {
    if (remainingIncome <= 0) {
      slabsBreakdown.push({
        slab: `${slab.min}${slab.max ? ` - ${slab.max}` : ' and above'}`,
        taxableInSlab: 0,
        taxInSlab: 0,
      });
      continue;
    }
    
    const slabRange = slab.max !== null ? slab.max - slab.min : Infinity;
    const taxableInSlab = Math.min(remainingIncome, slabRange);
    const taxInSlab = taxableInSlab * slab.rate;
    
    baseTax += taxInSlab;
    remainingIncome -= taxableInSlab;
    
    slabsBreakdown.push({
      slab: `${slab.min / 100000}L ${slab.max ? ` - ${slab.max / 100000}L` : ' and above'}`,
      taxableInSlab,
      taxInSlab,
    });
  }
  
  // 3. Apply Rebate Section 87A
  let rebate = 0;
  if (isOld && taxableIncome <= 500000) {
    // Under Old Regime, if taxable income <= 5L, tax is rebated up to 12,500
    rebate = Math.min(baseTax, 12500);
  } else if (!isOld && taxableIncome <= 700000) {
    // Under New Regime (FY 2025-26), if taxable income <= 7L, tax is rebated in full
    rebate = baseTax;
  }
  
  const baseTaxAfterRebate = Math.max(0, baseTax - rebate);
  
  // 4. Calculate Cess (4% Health & Education Cess)
  const cess = baseTaxAfterRebate * 0.04;
  const totalTax = baseTaxAfterRebate + cess;
  
  return {
    regime,
    grossSalary,
    exemptionsAndDeductions: totalDeductionsAndExemptions,
    taxableIncome,
    baseTax: baseTaxAfterRebate,
    cess,
    totalTax,
    slabsBreakdown,
  };
}

/**
 * Compare Old and New Tax Regimes for a Salary and Deductions Setup
 */
export function compareRegimes(
  salary: SalaryStructure,
  deductions: TaxDeductions,
  config = DEFAULT_SLABS
): ComparisonResult {
  // Gross Salary calculation
  const grossSalary =
    salary.basic +
    salary.hra +
    salary.specialAllowance +
    salary.lta +
    salary.bonus +
    salary.employerPf +
    salary.otherComponents;
    
  // Rent and HRA exemption
  const hraExemption = calculateHraExemption(
    salary.basic,
    salary.hra,
    deductions.rentPaid,
    deductions.metroCity
  );
  
  const oldRegime = calculateTaxForRegime('old', grossSalary, hraExemption, salary, deductions, config);
  const newRegime = calculateTaxForRegime('new', grossSalary, hraExemption, salary, deductions, config);
  
  const recommendedRegime = oldRegime.totalTax < newRegime.totalTax ? 'old' : 'new';
  const netSavings = Math.abs(oldRegime.totalTax - newRegime.totalTax);
  
  return {
    grossSalary,
    oldRegime,
    newRegime,
    recommendedRegime,
    netSavings,
    hraExemption,
  };
}
