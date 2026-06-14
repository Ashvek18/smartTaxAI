export interface SalaryStructure {
  basic: number;
  hra: number;
  specialAllowance: number;
  lta: number;
  bonus: number;
  employerPf: number;
  professionalTax: number;
  otherComponents: number;
}

export interface TaxDeductions {
  sec80C: number; // Max 1,50,000 (PPF, ELSS, EPF, etc.)
  sec80D: number; // Health Insurance (Max 25k/50k)
  nps80CCD1B: number; // NPS Extra (Max 50,000)
  homeLoanInterest: number; // Max 2,00,000 under Section 24
  educationLoan: number; // Section 80E interest (No upper limit)
  donations: number; // Section 80G
  rentPaid: number; // For HRA exemption calculation
  metroCity: boolean; // For HRA exemption calculation
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
  profile: {
    age: number;
    riskAppetite: 'low' | 'medium' | 'high';
    salary: SalaryStructure;
    deductions: TaxDeductions;
  };
  createdAt: string;
}

export interface FinancialGoal {
  id: string;
  userId: string;
  name: string;
  type: 'home' | 'retirement' | 'emergency' | 'car' | 'vacation';
  targetAmount: number;
  targetYears: number;
  monthlyInvestment: number;
  currentSaved: number;
  timelineProgress: number; // Percentage
  suggestedInvestments: string[];
}

export interface InvestmentProduct {
  id: string;
  name: string;
  category: 'ELSS' | 'PPF' | 'NPS' | 'EPF' | 'FD' | 'SIP' | 'Health Insurance';
  expectedReturns: number; // percentage
  lockInValue: string; // e.g. "3 Years", "15 Years", "Up to Retirement"
  riskLevel: 'Low' | 'Medium' | 'High';
  taxBenefits: string; // e.g. "Exempt under 80C", "Exempt under 80D"
  description: string;
}

export interface TaxSlab {
  min: number;
  max: number | null; // null for no upper limit
  rate: number; // e.g. 0.05 for 5%
}

export interface TaxRegimeConfig {
  standardDeductionOld: number;
  standardDeductionNew: number;
  oldSlabs: TaxSlab[];
  newSlabs: TaxSlab[];
}

export interface AuditLog {
  id: string;
  userId: string;
  userEmail: string;
  action: string;
  details: string;
  timestamp: string;
}

export interface TaxCalculationResult {
  regime: 'old' | 'new';
  grossSalary: number;
  exemptionsAndDeductions: number;
  taxableIncome: number;
  baseTax: number;
  cess: number; // 4% Health & Education Cess
  totalTax: number;
  slabsBreakdown: {
    slab: string;
    taxableInSlab: number;
    taxInSlab: number;
  }[];
}

export interface ComparisonResult {
  grossSalary: number;
  oldRegime: TaxCalculationResult;
  newRegime: TaxCalculationResult;
  recommendedRegime: 'old' | 'new';
  netSavings: number;
  hraExemption: number;
}
