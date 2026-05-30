import { z } from "zod";
import {
  ACCOUNT_TYPES,
  ASSET_TYPES,
  CATEGORY_TYPES,
  OBLIGATION_CATEGORIES,
  TRANSACTION_TYPES,
} from "@/lib/constants";

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid id");
const optionalObjectId = objectId.optional().or(z.literal("")).transform((v) => (v ? v : undefined));

const phoneRegex = /^\+?[0-9]{7,15}$/;

/* ----------------------------- Auth ----------------------------- */

export const registerSchema = z
  .object({
    name: z.string().min(2, "Name is too short").max(80),
    email: z.string().email("Invalid email").optional().or(z.literal("")),
    phone: z
      .string()
      .regex(phoneRegex, "Invalid phone number")
      .optional()
      .or(z.literal("")),
    password: z.string().min(6, "Password must be at least 6 characters"),
  })
  .refine((d) => !!d.email || !!d.phone, {
    message: "Provide either an email or a phone number",
    path: ["email"],
  });

export const loginSchema = z.object({
  identifier: z.string().min(1, "Email or phone is required"),
  password: z.string().min(1, "Password is required"),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(6),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const profileSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().regex(phoneRegex, "Invalid phone number").optional().or(z.literal("")),
});

/* ----------------------------- Account ----------------------------- */

export const accountSchema = z.object({
  name: z.string().min(1, "Name is required").max(60),
  type: z.enum(ACCOUNT_TYPES),
  currentBalance: z.coerce.number().default(0),
  notes: z.string().max(500).optional().default(""),
});

/* ----------------------------- Transaction ----------------------------- */

export const transactionSchema = z
  .object({
    type: z.enum(TRANSACTION_TYPES),
    amount: z.coerce.number().positive("Amount must be greater than 0"),
    accountId: optionalObjectId,
    fromAccountId: optionalObjectId,
    toAccountId: optionalObjectId,
    categoryId: optionalObjectId,
    tagIds: z.array(objectId).optional().default([]),
    description: z.string().max(300).optional().default(""),
    transactionDate: z.coerce.date().default(() => new Date()),
  })
  .superRefine((d, ctx) => {
    if (d.type === "TRANSFER") {
      if (!d.fromAccountId)
        ctx.addIssue({ code: "custom", message: "Source account required", path: ["fromAccountId"] });
      if (!d.toAccountId)
        ctx.addIssue({ code: "custom", message: "Destination account required", path: ["toAccountId"] });
      if (d.fromAccountId && d.toAccountId && d.fromAccountId === d.toAccountId)
        ctx.addIssue({ code: "custom", message: "Accounts must differ", path: ["toAccountId"] });
    } else {
      if (!d.accountId)
        ctx.addIssue({ code: "custom", message: "Account is required", path: ["accountId"] });
    }
  });

/* ----------------------------- Category / Tag ----------------------------- */

export const categorySchema = z.object({
  name: z.string().min(1).max(60),
  type: z.enum(CATEGORY_TYPES),
});

export const tagSchema = z.object({
  name: z.string().min(1).max(40),
});

/* ----------------------------- Receivable / Payable ----------------------------- */

export const receivableSchema = z.object({
  personName: z.string().min(1, "Name is required").max(80),
  amount: z.coerce.number().positive(),
  description: z.string().max(300).optional().default(""),
  expectedDate: z.coerce.date().optional(),
});

export const markReceivedSchema = z.object({
  accountId: objectId,
  receivedDate: z.coerce.date().default(() => new Date()),
});

export const payableSchema = z.object({
  personName: z.string().min(1, "Name is required").max(80),
  amount: z.coerce.number().positive(),
  description: z.string().max(300).optional().default(""),
  dueDate: z.coerce.date().optional(),
});

export const markPaidSchema = z.object({
  paidFromAccountId: objectId,
  paidDate: z.coerce.date().default(() => new Date()),
});

/* ----------------------------- Loan ----------------------------- */

export const loanSchema = z.object({
  lenderName: z.string().min(1).max(80),
  totalAmount: z.coerce.number().positive(),
  outstandingAmount: z.coerce.number().min(0),
  emiAmount: z.coerce.number().min(0).optional().default(0),
  interestRate: z.coerce.number().min(0).optional().default(0),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  nextDueDate: z.coerce.date().optional(),
  status: z.enum(["ACTIVE", "CLOSED"]).optional().default("ACTIVE"),
});

/* ----------------------------- Monthly Obligation ----------------------------- */

export const obligationSchema = z.object({
  name: z.string().min(1).max(80),
  amount: z.coerce.number().positive(),
  category: z.enum(OBLIGATION_CATEGORIES).default("OTHER"),
  dueDay: z.coerce.number().min(1).max(31).default(1),
  active: z.coerce.boolean().default(true),
});

/* ----------------------------- Asset ----------------------------- */

export const assetSchema = z.object({
  name: z.string().min(1).max(80),
  assetType: z.enum(ASSET_TYPES).default("OTHER"),
  currentValue: z.coerce.number().min(0),
  notes: z.string().max(500).optional().default(""),
});

/* ----------------------------- Split Expense / Settlement ----------------------------- */

export const splitParticipantSchema = z.object({
  name: z.string().min(1, "Name required").max(60),
  amount: z.coerce.number().min(0),
});

export const splitGroupSchema = z.object({
  name: z.string().min(1, "Group name is required").max(80),
  members: z.array(z.string().trim().min(1).max(60)).default([]),
  notes: z.string().max(300).optional().default(""),
});

export const splitExpenseSchema = z
  .object({
    description: z.string().min(1, "Description is required").max(120),
    totalAmount: z.coerce.number().positive("Amount must be greater than 0"),
    groupId: optionalObjectId,
    paidBy: z.string().min(1).max(60).default("Me"),
    splitMethod: z.enum(["EQUAL", "EXACT", "PERCENT", "SHARES"]).default("EQUAL"),
    participants: z.array(splitParticipantSchema).min(2, "Add at least two people"),
    date: z.coerce.date().default(() => new Date()),
    notes: z.string().max(300).optional().default(""),
  })
  .superRefine((d, ctx) => {
    const sum = d.participants.reduce((s, p) => s + p.amount, 0);
    if (Math.abs(sum - d.totalAmount) > 0.5) {
      ctx.addIssue({
        code: "custom",
        message: `Shares (${sum.toFixed(2)}) must add up to the total (${d.totalAmount.toFixed(2)}).`,
        path: ["participants"],
      });
    }
    const names = d.participants.map((p) => p.name.trim().toLowerCase());
    if (new Set(names).size !== names.length) {
      ctx.addIssue({ code: "custom", message: "Duplicate participant names.", path: ["participants"] });
    }
  });

export const settlementSchema = z.object({
  contactName: z.string().min(1, "Contact required").max(60),
  direction: z.enum(["I_RECEIVED", "I_PAID"]),
  amount: z.coerce.number().positive(),
  accountId: optionalObjectId,
  groupId: optionalObjectId,
  date: z.coerce.date().default(() => new Date()),
  note: z.string().max(200).optional().default(""),
});

export type SplitGroupInput = z.infer<typeof splitGroupSchema>;
export type SplitExpenseInput = z.infer<typeof splitExpenseSchema>;
export type SettlementInput = z.infer<typeof settlementSchema>;

export type RegisterInput = z.infer<typeof registerSchema>;
export type AccountInput = z.infer<typeof accountSchema>;
export type TransactionInput = z.infer<typeof transactionSchema>;
export type ReceivableInput = z.infer<typeof receivableSchema>;
export type PayableInput = z.infer<typeof payableSchema>;
export type LoanInput = z.infer<typeof loanSchema>;
export type ObligationInput = z.infer<typeof obligationSchema>;
export type AssetInput = z.infer<typeof assetSchema>;
export type CategoryInput = z.infer<typeof categorySchema>;
export type TagInput = z.infer<typeof tagSchema>;
