"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { genId as nanoid } from "@/lib/id";
export type ExpenseCategory = "personal" | "casa" | "familia";
export type ExpenseTipo = "recorrente" | "parcela" | "unico";

export interface CreditCard {
  id: string;
  name: string;
  limit: number;
  closingDay: number;
  dueDay: number;
  color?: string;
}

export interface RecurringExpense {
  id: string;
  name: string;
  amount: number;
  dueDay: number;
  category: ExpenseCategory;
  group: string;
  notes?: string;
  isActive: boolean;
  createdAt: number;
  tipo: ExpenseTipo;
  totalParcelas?: number;
  parcelaInicio?: string;
  isCartao: boolean;
  cartaoNome?: string;
  payments: Record<string, boolean>;
  // multi-imovel (casa)
  imovel?: string;
  // family member tag (familia)
  familyMember?: string;
  // sharing
  sharedWith?: string[];
  sharedBy?: string;
  // novos campos
  isIncome?: boolean;
  isInvestimento?: boolean;
  formaPagamento?: "Dinheiro" | "Pix" | "Débito Automático" | "Cartão de Crédito";
}

// ─── Invite ──────────────────────────────────────────────────────────────────

export type InviteStatus = "pending" | "accepted" | "rejected";

export interface ExpenseInvite {
  id: string;
  fromEmail: string;
  fromName?: string;
  toEmail: string;
  expense: Omit<RecurringExpense, "id" | "createdAt" | "payments" | "sharedWith" | "sharedBy">;
  status: InviteStatus;
  createdAt: number;
}

// ─── State ───────────────────────────────────────────────────────────────────

interface State {
  expenses: RecurringExpense[];
  invites: ExpenseInvite[];
  sentInvites: ExpenseInvite[];
  properties: string[];
  familyMembers: string[];
  creditCards: CreditCard[];
  hydrated: boolean;
}

interface Actions {
  add: (input: Omit<RecurringExpense, "id" | "createdAt" | "payments">) => string;
  update: (id: string, patch: Partial<Omit<RecurringExpense, "id" | "createdAt" | "payments">>) => void;
  remove: (id: string) => void;
  togglePaid: (id: string, yearMonth: string) => void;
  // properties
  addProperty: (name: string) => void;
  removeProperty: (name: string) => void;
  // family members
  addFamilyMember: (name: string) => void;
  removeFamilyMember: (name: string) => void;
  // sharing
  sendInvite: (invite: Omit<ExpenseInvite, "id" | "createdAt" | "status">) => void;
  receiveInvite: (invite: ExpenseInvite) => void;
  acceptInvite: (inviteId: string) => void;
  rejectInvite: (inviteId: string) => void;
  // credit cards
  addCreditCard: (card: Omit<CreditCard, "id">) => void;
  updateCreditCard: (id: string, patch: Partial<CreditCard>) => void;
  removeCreditCard: (id: string) => void;
  payCreditCardInvoice: (cardName: string, yearMonth: string) => void;
  pendingCount: () => number;
  
  setHydrated: (h: boolean) => void;
}

export const useFinanceStore = create<State & Actions>()(
  persist(
    (set, get) => ({
      expenses: [],
      invites: [],
      sentInvites: [],
      properties: ["Casa Principal"],
      familyMembers: [],
      creditCards: [],
      hydrated: false,

      add: (input) => {
        const id = nanoid();
        set((s) => ({
          expenses: [...s.expenses, { ...input, id, createdAt: Date.now(), payments: {} }],
        }));
        return id;
      },

      update: (id, patch) =>
        set((s) => ({
          expenses: s.expenses.map((e) => (e.id === id ? { ...e, ...patch } : e)),
        })),

      remove: (id) =>
        set((s) => ({ expenses: s.expenses.filter((e) => e.id !== id) })),

      togglePaid: (id, yearMonth) =>
        set((s) => ({
          expenses: s.expenses.map((e) => {
            if (e.id !== id) return e;
            const current = e.payments[yearMonth] ?? false;
            return { ...e, payments: { ...e.payments, [yearMonth]: !current } };
          }),
        })),

      addProperty: (name) =>
        set((s) => ({
          properties: s.properties.includes(name) ? s.properties : [...s.properties, name],
        })),

      removeProperty: (name) =>
        set((s) => ({ properties: s.properties.filter((p) => p !== name) })),

      addFamilyMember: (name) =>
        set((s) => ({
          familyMembers: s.familyMembers.includes(name) ? s.familyMembers : [...s.familyMembers, name],
        })),

      removeFamilyMember: (name) =>
        set((s) => ({ familyMembers: s.familyMembers.filter((m) => m !== name) })),

      sendInvite: (invite) => {
        const newInvite: ExpenseInvite = {
          ...invite,
          id: nanoid(),
          status: "pending",
          createdAt: Date.now(),
        };
        set((s) => ({ sentInvites: [...s.sentInvites, newInvite] }));
        try {
          const key = `aia-invites-${invite.toEmail}`;
          const existing = JSON.parse(localStorage.getItem(key) ?? "[]") as ExpenseInvite[];
          localStorage.setItem(key, JSON.stringify([...existing, newInvite]));
        } catch { /* ignore */ }
      },

      receiveInvite: (invite) =>
        set((s) => {
          if (s.invites.some((i) => i.id === invite.id)) return s;
          return { invites: [...s.invites, invite] };
        }),

      acceptInvite: (inviteId) => {
        const invite = get().invites.find((i) => i.id === inviteId);
        if (!invite) return;
        const expenseId = nanoid();
        set((s) => ({
          invites: s.invites.map((i) =>
            i.id === inviteId ? { ...i, status: "accepted" } : i,
          ),
          expenses: [
            ...s.expenses,
            {
              ...invite.expense,
              id: expenseId,
              createdAt: Date.now(),
              payments: {},
              sharedBy: invite.fromEmail,
            },
          ],
        }));
      },

      rejectInvite: (inviteId) =>
        set((s) => ({
          invites: s.invites.map((i) =>
            i.id === inviteId ? { ...i, status: "rejected" } : i,
          ),
        })),

      pendingCount: () => get().invites.filter((i) => i.status === "pending").length,

      addCreditCard: (card) => 
        set((s) => ({ creditCards: [...s.creditCards, { ...card, id: nanoid() }] })),

      updateCreditCard: (id, patch) =>
        set((s) => ({ creditCards: s.creditCards.map(c => c.id === id ? { ...c, ...patch } : c) })),

      removeCreditCard: (id) =>
        set((s) => ({ creditCards: s.creditCards.filter(c => c.id !== id) })),

      payCreditCardInvoice: (cardName, yearMonth) =>
        set((s) => ({
          expenses: s.expenses.map((e) => {
            if (e.isCartao && e.cartaoNome === cardName && isExpenseActiveInMonth(e, yearMonth)) {
              return { ...e, payments: { ...e.payments, [yearMonth]: true } };
            }
            return e;
          }),
        })),

      setHydrated: (h) => set({ hydrated: h }),
    }),
    {
      name: "aia-finance",
      onRehydrateStorage: () => (state) => {
        if (state) state.setHydrated(true);
      },
    },
  ),
);

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function parcelaLabel(expense: RecurringExpense, yearMonth: string): string | null {
  if (expense.tipo !== "parcela" || !expense.totalParcelas || !expense.parcelaInicio) return null;
  const [sy, sm] = expense.parcelaInicio.split("-").map(Number);
  const [cy, cm] = yearMonth.split("-").map(Number);
  const diff = (cy - sy) * 12 + (cm - sm) + 1;
  if (diff < 1 || diff > expense.totalParcelas) return null;
  return `${diff}/${expense.totalParcelas}x`;
}

export function isExpenseActiveInMonth(expense: RecurringExpense, yearMonth: string): boolean {
  if (!expense.isActive) return false;
  if (expense.tipo === "recorrente") return true;
  if (expense.tipo === "unico") return expense.parcelaInicio === yearMonth;
  if (!expense.totalParcelas || !expense.parcelaInicio) return false;
  const [sy, sm] = expense.parcelaInicio.split("-").map(Number);
  const [cy, cm] = yearMonth.split("-").map(Number);
  const diff = (cy - sy) * 12 + (cm - sm) + 1;
  return diff >= 1 && diff <= expense.totalParcelas;
}
