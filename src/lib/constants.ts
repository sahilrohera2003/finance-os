export const ACCOUNT_TYPES = ["CASH", "BANK", "WALLET"] as const;
export type AccountType = (typeof ACCOUNT_TYPES)[number];

export const TRANSACTION_TYPES = ["INCOME", "EXPENSE", "TRANSFER"] as const;
export type TransactionType = (typeof TRANSACTION_TYPES)[number];

export const CATEGORY_TYPES = ["INCOME", "EXPENSE"] as const;
export type CategoryType = (typeof CATEGORY_TYPES)[number];

export const RECEIVABLE_STATUS = ["PENDING", "RECEIVED"] as const;
export type ReceivableStatus = (typeof RECEIVABLE_STATUS)[number];

export const PAYABLE_STATUS = ["PENDING", "PAID"] as const;
export type PayableStatus = (typeof PAYABLE_STATUS)[number];

export const LOAN_STATUS = ["ACTIVE", "CLOSED"] as const;
export type LoanStatus = (typeof LOAN_STATUS)[number];

export const OBLIGATION_CATEGORIES = [
  "RENT",
  "EMI",
  "SUBSCRIPTION",
  "INSURANCE",
  "UTILITIES",
  "SIP",
  "OTHER",
] as const;
export type ObligationCategory = (typeof OBLIGATION_CATEGORIES)[number];

export const ASSET_TYPES = [
  "LAND",
  "GOLD",
  "VEHICLE",
  "LAPTOP",
  "OTHER",
] as const;
export type AssetType = (typeof ASSET_TYPES)[number];

export const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: "LayoutDashboard" },
  { href: "/accounts", label: "Accounts", icon: "Wallet" },
  { href: "/transactions", label: "Transactions", icon: "ArrowLeftRight" },
  { href: "/receivables", label: "Receivables", icon: "HandCoins" },
  { href: "/payables", label: "Payables", icon: "ReceiptText" },
  { href: "/loans", label: "Loans", icon: "Landmark" },
  { href: "/obligations", label: "Obligations", icon: "CalendarClock" },
  { href: "/assets", label: "Assets", icon: "Gem" },
  { href: "/reports", label: "Reports", icon: "BarChart3" },
  { href: "/settings", label: "Settings", icon: "Settings" },
] as const;
