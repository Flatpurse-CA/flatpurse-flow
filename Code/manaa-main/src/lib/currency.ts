// Nigerian Naira currency formatting utility

export const NIGERIAN_BANKS = [
  "Access Bank",
  "Citibank Nigeria",
  "Ecobank Nigeria",
  "Fidelity Bank",
  "First Bank of Nigeria",
  "First City Monument Bank (FCMB)",
  "Globus Bank",
  "Guaranty Trust Bank (GTBank)",
  "Heritage Bank",
  "Jaiz Bank",
  "Keystone Bank",
  "Kuda Bank",
  "Lotus Bank",
  "Moniepoint MFB",
  "OPay",
  "PalmPay",
  "Parallex Bank",
  "Polaris Bank",
  "Providus Bank",
  "Stanbic IBTC Bank",
  "Standard Chartered Bank",
  "Sterling Bank",
  "SunTrust Bank",
  "TAJBank",
  "Titan Trust Bank",
  "Union Bank of Nigeria",
  "United Bank for Africa (UBA)",
  "Unity Bank",
  "VFD Microfinance Bank",
  "Wema Bank",
  "Zenith Bank",
];

export const ACCOUNT_TYPES = [
  { value: "cash", label: "Cash" },
  { value: "bank", label: "Bank Account" },
  { value: "pos", label: "POS Terminal" },
  { value: "mobile_money", label: "Mobile Money (OPay, PalmPay, etc.)" },
  { value: "credit", label: "Credit" },
];

export const DEFAULT_NIGERIAN_CATEGORIES = {
  income: [
    "Sales Revenue",
    "Service Income",
    "POS Collections",
    "Bank Transfer Received",
    "Commission",
    "Interest Income",
    "Rental Income",
    "Other Income",
  ],
  expense: [
    "Cost of Goods",
    "Rent",
    "Salaries & Wages",
    "Diesel & Generator",
    "Data & Airtime",
    "Transportation & Logistics",
    "Import Duties & Clearing",
    "Utilities (PHCN/Electricity)",
    "Office Supplies",
    "Marketing & Advertising",
    "Bank Charges",
    "POS Charges",
    "Repairs & Maintenance",
    "Insurance",
    "Professional Fees",
    "Taxes & Levies",
    "Miscellaneous",
  ],
};

export const VAT_RATE = 7.5; // Nigeria's standard VAT rate

/**
 * Format a number as Nigerian Naira
 */
export function formatNaira(amount: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format a number in any currency
 */
export function formatCurrency(amount: number, currency: string = "NGN"): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

/**
 * Validate a Nigerian phone number (11 digits, starts with 0)
 */
export function isValidNigerianPhone(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, "");
  return /^0[789]\d{9}$/.test(cleaned) || /^234[789]\d{9}$/.test(cleaned);
}

/**
 * Validate NUBAN (10-digit bank account number)
 */
export function isValidNUBAN(accountNumber: string): boolean {
  return /^\d{10}$/.test(accountNumber.trim());
}
