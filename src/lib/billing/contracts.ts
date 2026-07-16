import { z } from "zod";

import { calculateInvoiceTotals } from "./money.ts";
import { canTransitionContract } from "./transitions.ts";
import {
  BILLING_CYCLES,
  CONTRACT_STATUSES,
  type BillingCycle,
  type ContractStatus,
} from "./types.ts";

const codeSchema = z
  .string()
  .trim()
  .transform((value) => value.toUpperCase())
  .pipe(z.string().regex(/^[A-Z0-9][A-Z0-9_-]{1,31}$/));

const optionalEmailSchema = z
  .union([z.string(), z.null()])
  .transform((value) => {
    const normalized = value?.trim().toLowerCase() ?? "";
    return normalized || null;
  })
  .pipe(z.string().email().max(254).nullable());

const exactHttpsOriginSchema = z
  .string()
  .trim()
  .regex(/^https:\/\/[A-Za-z0-9.-]+(?::[0-9]{1,5})?$/)
  .transform((value, context) => {
    try {
      return new URL(value).origin;
    } catch {
      context.addIssue({
        code: "custom",
        message: "HTTPS origin 형식이 올바르지 않습니다.",
      });
      return z.NEVER;
    }
  });

const calendarDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => {
    const [year, month, day] = value.split("-").map(Number);
    if (year < 1 || month < 1 || month > 12 || day < 1) return false;
    const monthDays = new Date(Date.UTC(year, month, 0)).getUTCDate();
    return day <= monthDays;
  }, "날짜 형식이 올바르지 않습니다.");

export const customerInputSchema = z.object({
  code: codeSchema,
  name: z.string().trim().min(1).max(200),
  businessNumber: z
    .union([z.string(), z.null()])
    .transform((value) => value?.trim() || null)
    .pipe(z.string().regex(/^\d{3}-\d{2}-\d{5}$/).nullable()),
  representativeName: z.string().trim().max(100),
  taxEmail: optionalEmailSchema,
});

const siteInputSchema = z.object({
  code: codeSchema,
  name: z.string().trim().min(1).max(200),
  primaryOrigin: exactHttpsOriginSchema,
});

const contactInputSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email()
    .max(254),
  phone: z.string().trim().max(40),
  receivesBilling: z.boolean(),
});

export const customerWithSiteInputSchema = z.object({
  customer: customerInputSchema,
  site: siteInputSchema,
  contact: contactInputSchema.nullable(),
});

const contractItemInputSchema = z.object({
  productId: z.string().uuid(),
  description: z.string().trim().max(500),
  quantity: z.number().int().positive(),
  unitSupplyAmount: z.number().int().nonnegative().safe(),
  vatAmount: z.number().int().nonnegative().safe(),
});

export const contractInputSchema = z
  .object({
    id: z.string().uuid().optional(),
    customerId: z.string().uuid(),
    siteId: z.string().uuid(),
    status: z.enum(CONTRACT_STATUSES),
    cycle: z.enum(BILLING_CYCLES),
    startDate: calendarDateSchema,
    endDate: calendarDateSchema.nullable(),
    billingAnchorDay: z.number().int().min(1).max(31),
    nextInvoiceDate: calendarDateSchema.nullable(),
    dueDays: z.number().int().min(0).max(365),
    autoRenew: z.boolean(),
    items: z.array(contractItemInputSchema).max(100),
  })
  .superRefine((input, context) => {
    if (input.endDate && input.endDate < input.startDate) {
      context.addIssue({
        code: "custom",
        path: ["endDate"],
        message: "종료일은 시작일보다 빠를 수 없습니다.",
      });
    }

    const productIds = new Set<string>();
    for (const [index, item] of input.items.entries()) {
      if (productIds.has(item.productId)) {
        context.addIssue({
          code: "custom",
          path: ["items", index, "productId"],
          message: "같은 상품은 계약에 한 번만 추가할 수 있습니다.",
        });
      }
      productIds.add(item.productId);
    }

    if (input.status === "ACTIVE") {
      if (input.items.length === 0) {
        context.addIssue({
          code: "custom",
          path: ["items"],
          message: "활성 계약에는 항목이 필요합니다.",
        });
      }
      if (!input.nextInvoiceDate) {
        context.addIssue({
          code: "custom",
          path: ["nextInvoiceDate"],
          message: "활성 계약에는 다음 청구일이 필요합니다.",
        });
      }
    }

    if (
      (input.status === "ENDED" || input.status === "CANCELED") &&
      input.nextInvoiceDate
    ) {
      context.addIssue({
        code: "custom",
        path: ["nextInvoiceDate"],
        message: "종료된 계약에는 다음 청구일을 둘 수 없습니다.",
      });
    }
  });

export type CustomerInput = z.infer<typeof customerInputSchema>;
export type CustomerWithSiteInput = z.input<
  typeof customerWithSiteInputSchema
>;
export type PreparedCustomerWithSiteInput = z.output<
  typeof customerWithSiteInputSchema
>;
export type ContractInput = z.input<typeof contractInputSchema>;

export type PreparedContractItem = z.output<typeof contractItemInputSchema> & {
  supplyAmount: number;
  totalAmount: number;
  sortOrder: number;
};

export type PreparedContractInput = Omit<
  z.output<typeof contractInputSchema>,
  "items"
> & {
  items: PreparedContractItem[];
};

export type ContractState = {
  status: ContractStatus;
  nextInvoiceDate: string | null;
};

export type BillingContractRepository = {
  createCustomerWithSite(
    actorId: string,
    input: PreparedCustomerWithSiteInput,
  ): Promise<string>;
  saveContract(actorId: string, input: PreparedContractInput): Promise<string>;
  getContractState(id: string): Promise<ContractState | null>;
  changeContractStatus(
    actorId: string,
    id: string,
    from: ContractStatus,
    to: ContractStatus,
    nextInvoiceDate: string | null,
  ): Promise<boolean>;
};

export type CustomerFilter = {
  query?: string;
  status?: "ACTIVE" | "INACTIVE";
  limit?: number;
};

export type BillingCustomerSummary = {
  id: string;
  code: string;
  name: string;
  status: "ACTIVE" | "INACTIVE";
  siteCount: number;
  contactCount: number;
};

export type BillingContractDetail = PreparedContractInput & {
  id: string;
  customerName: string;
  siteName: string;
  items: Array<PreparedContractItem & { productName: string }>;
};

export function prepareContractInput(input: ContractInput): PreparedContractInput {
  const parsed = contractInputSchema.parse(input);
  return {
    ...parsed,
    items: parsed.items.map((item, sortOrder) => {
      const totals = calculateInvoiceTotals([item]);
      return {
        ...item,
        ...totals,
        sortOrder,
      };
    }),
  };
}

export function createBillingContractCommands(
  repository: BillingContractRepository,
) {
  return {
    async createCustomerWithSite(
      actorId: string,
      input: CustomerWithSiteInput,
    ): Promise<string> {
      const normalizedActorId = z.string().uuid().parse(actorId);
      const parsed = customerWithSiteInputSchema.parse(input);
      return repository.createCustomerWithSite(normalizedActorId, parsed);
    },

    async saveContract(
      actorId: string,
      input: ContractInput,
    ): Promise<string> {
      const normalizedActorId = z.string().uuid().parse(actorId);
      const prepared = prepareContractInput(input);
      if (!prepared.id && prepared.status !== "DRAFT") {
        throw new Error("새 계약은 초안으로 만든 뒤 활성화해 주세요.");
      }
      return repository.saveContract(normalizedActorId, prepared);
    },

    async changeContractStatus(
      actorId: string,
      id: string,
      status: ContractStatus,
    ): Promise<void> {
      const normalizedActorId = z.string().uuid().parse(actorId);
      const normalizedId = z.string().uuid().parse(id);
      const normalizedStatus = z.enum(CONTRACT_STATUSES).parse(status);
      const current = await repository.getContractState(normalizedId);
      if (!current) throw new Error("계약을 찾을 수 없습니다.");
      if (!canTransitionContract(current.status, normalizedStatus)) {
        throw new Error("변경할 수 없는 계약 상태입니다.");
      }
      if (normalizedStatus === "ACTIVE" && !current.nextInvoiceDate) {
        throw new Error("다음 청구일이 없는 계약은 활성화할 수 없습니다.");
      }

      const nextInvoiceDate =
        normalizedStatus === "ENDED" || normalizedStatus === "CANCELED"
          ? null
          : current.nextInvoiceDate;
      const changed = await repository.changeContractStatus(
        normalizedActorId,
        normalizedId,
        current.status,
        normalizedStatus,
        nextInvoiceDate,
      );
      if (!changed) throw new Error("계약 상태가 변경되어 다시 시도해 주세요.");
    },
  };
}

async function defaultRepository() {
  const { billingRepository } = await import("./repository");
  return billingRepository;
}

export async function createCustomerWithSite(
  actorId: string,
  input: CustomerWithSiteInput,
): Promise<string> {
  return createBillingContractCommands(
    await defaultRepository(),
  ).createCustomerWithSite(actorId, input);
}

export async function saveContract(
  actorId: string,
  input: ContractInput,
): Promise<string> {
  return createBillingContractCommands(await defaultRepository()).saveContract(
    actorId,
    input,
  );
}

export async function changeContractStatus(
  actorId: string,
  id: string,
  status: ContractStatus,
): Promise<void> {
  return createBillingContractCommands(
    await defaultRepository(),
  ).changeContractStatus(actorId, id, status);
}

export async function listBillingCustomers(
  filter: CustomerFilter = {},
): Promise<BillingCustomerSummary[]> {
  return (await defaultRepository()).listBillingCustomers(filter);
}

export async function getBillingContract(
  id: string,
): Promise<BillingContractDetail | null> {
  return (await defaultRepository()).getBillingContract(
    z.string().uuid().parse(id),
  );
}

export type { BillingCycle, ContractStatus };
