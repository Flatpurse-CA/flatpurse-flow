// Nigeria Tax Reform Act 2025 — Signed into law June 26, 2025
// Sources: Nigeria Tax Act 2025, SMB Law Practice, PwC Nigeria, VATAbout

export interface TaxBracket {
  label: string;
  rate: number;
  description: string;
}

/**
 * VAT Rate — The House of Representatives rejected the proposed phased
 * increase. VAT remains at 7.5% under the Nigeria Tax Act 2025.
 */
export const CURRENT_VAT_RATE = 7.5;

/**
 * Small Company Threshold — Companies with annual revenue (turnover) ≤₦100M
 * AND fixed assets < ₦250M are classified as "small" and exempt from CIT,
 * CGT, and the Development Levy.
 */
export const SMALL_COMPANY_REVENUE_THRESHOLD = 100_000_000; // ₦100M
export const SMALL_COMPANY_ASSET_THRESHOLD = 250_000_000; // ₦250M

/**
 * Development Levy — 4% on assessable profits, replacing the old overlapping
 * sectoral levies (TET 3%, NITDA 1%, NASENI 0.25%, Police Trust Fund 0.005%).
 */
export const DEVELOPMENT_LEVY_RATE = 4;

/**
 * Capital Gains Tax — increased from 10% to 30% for companies.
 * Exemptions: gains < ₦150M in 12 months (₦10M cap per disposal),
 * principal residences, reinvested gains.
 */
export const CGT_RATE = 30;
export const CGT_EXEMPTION_THRESHOLD = 150_000_000; // ₦150M in 12 months
export const CGT_PER_DISPOSAL_CAP = 10_000_000; // ₦10M per disposal

/**
 * Personal Income Tax brackets (Nigeria Tax Act 2025)
 * Individuals earning < ₦800,000/year are exempt.
 */
export const PIT_EXEMPTION_THRESHOLD = 800_000; // ₦800K
export const PIT_MAX_RATE = 25;

/**
 * Rent deduction: 20% of rent, capped at ₦500,000
 */
export const RENT_DEDUCTION_RATE = 20;
export const RENT_DEDUCTION_CAP = 500_000;

/**
 * VAT-exempt (zero-rated) categories under the Act
 */
export const VAT_ZERO_RATED_CATEGORIES = [
  "Basic foodstuffs",
  "Medical & pharmaceutical supplies",
  "Educational materials & services",
  "Residential rent",
  "Public transportation",
  "Renewable energy products",
  "Exports (non-oil & gas)",
];

/**
 * Key tax reform highlights for display
 */
export const TAX_REFORM_HIGHLIGHTS: TaxBracket[] = [
  { label: "VAT", rate: 7.5, description: "Retained at 7.5% — phased increase was rejected" },
  { label: "Dev. Levy", rate: 4, description: "Replaces TET, NITDA, NASENI & Police levies" },
  { label: "CGT", rate: 30, description: "Increased from 10% for companies" },
  { label: "PIT Max", rate: 25, description: "Top bracket; exempt below ₦800K/yr" },
];

/**
 * Check if a company qualifies as "small" under the NTA 2025
 */
export function isSmallCompany(annualRevenue: number, fixedAssets?: number): boolean {
  const revenueOk = annualRevenue <= SMALL_COMPANY_REVENUE_THRESHOLD;
  if (fixedAssets !== undefined) {
    return revenueOk && fixedAssets < SMALL_COMPANY_ASSET_THRESHOLD;
  }
  return revenueOk;
}

/**
 * Calculate VAT liability for a period
 */
/**
 * Calculate VAT liability for a period.
 * Amounts are assumed VAT-inclusive (as recorded in cashbooks).
 * VAT is extracted: VAT = amount × rate / (100 + rate)
 */
export function calculateVATLiability(
  totalSales: number,
  totalPurchases: number,
): {
  rate: number;
  salesExVAT: number;
  purchasesExVAT: number;
  outputVAT: number;
  inputVAT: number;
  netVAT: number;
} {
  const rate = CURRENT_VAT_RATE;
  const vatFraction = rate / (100 + rate); // 7.5/107.5
  const outputVAT = totalSales * vatFraction;
  const inputVAT = totalPurchases * vatFraction;
  const netVAT = outputVAT - inputVAT;
  const salesExVAT = totalSales - outputVAT;
  const purchasesExVAT = totalPurchases - inputVAT;
  return { rate, salesExVAT, purchasesExVAT, outputVAT, inputVAT, netVAT };
}

/**
 * Calculate Development Levy
 */
export function calculateDevelopmentLevy(assessableProfit: number, isSmall: boolean): number {
  if (isSmall) return 0;
  return assessableProfit * (DEVELOPMENT_LEVY_RATE / 100);
}

/**
 * Get FIRS/NRS filing period label
 */
export function getFIRSPeriod(date: Date): string {
  const month = date.toLocaleString("en-NG", { month: "long" });
  const year = date.getFullYear();
  return `${month} ${year}`;
}
