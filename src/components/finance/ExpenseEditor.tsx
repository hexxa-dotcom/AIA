"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  X,
  RefreshCw,
  Layers,
  CreditCard,
  Zap,
  Share2,
  Plus,
  UserPlus,
  AlertCircle,
} from "lucide-react";
import {
  useFinanceStore,
  type ExpenseCategory,
  type ExpenseTipo,
} from "@/store/useFinanceStore";
import { useAuthStore } from "@/store/useAuthStore";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

const GROUPS: Record<ExpenseCategory, string[]> = {
  personal: [
    "Assinaturas",
    "Saúde",
    "Lazer",
    "Educação",
    "Transporte",
    "Vestuário",
    "Outros",
  ],
  casa: ["Moradia", "Contas da Casa", "Manutenção", "Outros"],
  familia: ["Alimentação", "Escola", "Saúde", "Lazer", "Outros"],
};

const INCOMING_GROUPS = [
  "Salário",
  "Dividendos / Proventos",
  "Pix / Transferência",
  "Reembolso",
  "Venda",
  "Prestação de Serviços",
  "Outros",
];

const INVESTMENT_GROUPS = [
  "Ações",
  "Renda Fixa",
  "FIIs (Fundos Imobiliários)",
  "Cripto",
  "Tesouro Direto",
  "Previdência Privada",
  "Outros",
];

const CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  personal: "Pessoal",
  casa: "Casa",
  familia: "Compartilhadas",
};

const CATEGORY_ICONS: Record<ExpenseCategory, string> = {
  personal: "👤",
  casa: "🏠",
  familia: "👥",
};

const LBL =
  "block text-[10px] uppercase tracking-widest font-semibold text-muted mb-2";
const INP =
  "block w-full px-4 py-3 rounded-2xl bg-surface-2 text-sm outline-none focus:ring-2 focus:ring-ink/15 text-ink";

export function ExpenseEditor({
  id,
  onClose,
}: {
  id: string | null;
  onClose: () => void;
}) {
  const expenses = useFinanceStore((s) => s.expenses);
  const add = useFinanceStore((s) => s.add);
  const update = useFinanceStore((s) => s.update);
  const sendInvite = useFinanceStore((s) => s.sendInvite);
  const properties = useFinanceStore((s) => s.properties);
  const familyMembers = useFinanceStore((s) => s.familyMembers);
  const addProperty = useFinanceStore((s) => s.addProperty);
  const addFamilyMember = useFinanceStore((s) => s.addFamilyMember);
  const user = useAuthStore((s) => s.user);

  const existing = id ? expenses.find((e) => e.id === id) : null;

  const [name, setName] = useState(existing?.name ?? "");
  const [tipoLancamento, setTipoLancamento] = useState<"despesa" | "receita" | "investimento">(
    existing?.isIncome ? "receita" : existing?.isInvestimento ? "investimento" : "despesa"
  );
  const [amount, setAmount] = useState(existing ? String(existing.amount) : "");
  const [dueDay, setDueDay] = useState(existing ? String(existing.dueDay) : "");
  const [category, setCategory] = useState<ExpenseCategory>(
    existing?.category ?? "personal",
  );
  const [group, setGroup] = useState(existing?.group ?? "");
  const [notes, setNotes] = useState(existing?.notes ?? "");
  const [formaPagamento, setFormaPagamento] = useState<"Dinheiro" | "Pix" | "Débito Automático" | "Cartão de Crédito" | "">(existing?.formaPagamento ?? "");
  const [isActive, setIsActive] = useState(existing?.isActive ?? true);
  const [tipo, setTipo] = useState<ExpenseTipo>(existing?.tipo ?? "recorrente");
  const [totalParcelas, setTotalParcelas] = useState(
    existing?.totalParcelas ? String(existing.totalParcelas) : "",
  );
  const [parcelaInicio, setParcelaInicio] = useState(
    existing?.parcelaInicio ?? new Date().toISOString().slice(0, 7),
  );
  const [cartaoNome, setCartaoNome] = useState(existing?.cartaoNome ?? "");
  const [imovel, setImovel] = useState(existing?.imovel ?? "");
  const [familyMember, setFamilyMember] = useState(
    existing?.familyMember ?? "",
  );
  const [newImovel, setNewImovel] = useState("");
  const [addingImovel, setAddingImovel] = useState(false);
  const [newMember, setNewMember] = useState("");
  const [addingMember, setAddingMember] = useState(false);
  // sharing
  const [shareEmails, setShareEmails] = useState<string[]>(
    existing?.sharedWith ?? [],
  );
  const [emailInput, setEmailInput] = useState("");
  const [shareSection, setShareSection] = useState(false);
  const [error, setError] = useState("");

  const groups = GROUPS[category];

  useEffect(() => {
    if (tipoLancamento === "receita") {
      if (!INCOMING_GROUPS.includes(group)) {
        setGroup(INCOMING_GROUPS[0]);
      }
    } else if (tipoLancamento === "investimento") {
      if (!INVESTMENT_GROUPS.includes(group)) {
        setGroup(INVESTMENT_GROUPS[0]);
      }
    } else {
      if (!group || !groups.includes(group)) setGroup(groups[0]);
    }
  }, [tipoLancamento, category]);

  useEffect(() => {
    if (category === "casa" && !imovel && properties.length > 0) {
      setImovel(properties[0]);
    }
  }, [category]);

  function addEmail() {
    const em = emailInput.trim().toLowerCase();
    if (!em || !em.includes("@")) {
      setError("E-mail inválido");
      return;
    }
    if (em === user?.email) {
      setError("Não pode compartilhar consigo mesmo");
      return;
    }
    if (shareEmails.includes(em)) {
      setError("E-mail já adicionado");
      return;
    }
    setShareEmails((prev) => [...prev, em]);
    setEmailInput("");
    setError("");
  }

  function removeEmail(em: string) {
    setShareEmails((prev) => prev.filter((x) => x !== em));
  }

  function confirmNewImovel() {
    const t = newImovel.trim();
    if (!t) return;
    addProperty(t);
    setImovel(t);
    setNewImovel("");
    setAddingImovel(false);
  }

  function confirmNewMember() {
    const t = newMember.trim();
    if (!t) return;
    addFamilyMember(t);
    setFamilyMember(t);
    setNewMember("");
    setAddingMember(false);
  }

  function save() {
    const parsed = parseFloat(amount.replace(",", "."));
    if (!name.trim() || isNaN(parsed) || parsed <= 0) {
      setError("Preencha nome e valor");
      return;
    }
    if (tipo === "parcela" && (!totalParcelas || parseInt(totalParcelas) < 1)) {
      setError("Informe o número de parcelas");
      return;
    }

    const payload = {
      name: name.trim(),
      amount: parsed,
      dueDay: Math.min(31, Math.max(1, parseInt(dueDay) || 1)),
      category: tipoLancamento === "despesa" ? category : "personal",
      group: tipoLancamento === "despesa"
        ? (group || groups[0])
        : (group || (tipoLancamento === "receita" ? INCOMING_GROUPS[0] : INVESTMENT_GROUPS[0])),
      notes: notes.trim() || undefined,
      isActive,
      tipo,
      totalParcelas: tipo === "parcela" ? parseInt(totalParcelas) : undefined,
      parcelaInicio:
        tipo === "parcela" || tipo === "unico" ? parcelaInicio : undefined,
      isCartao: tipoLancamento === "despesa" ? formaPagamento === "Cartão de Crédito" : false,
      cartaoNome: tipoLancamento === "despesa" && formaPagamento === "Cartão de Crédito" ? cartaoNome.trim() || undefined : undefined,
      isIncome: tipoLancamento === "receita",
      isInvestimento: tipoLancamento === "investimento",
      imovel: tipoLancamento === "despesa" && category === "casa" && imovel ? imovel : undefined,
      familyMember: tipoLancamento === "despesa" && category === "familia" && familyMember ? familyMember : undefined,
      sharedWith: tipoLancamento === "despesa" && shareEmails.length > 0 ? shareEmails : undefined,
      formaPagamento: (formaPagamento as "Dinheiro" | "Pix" | "Débito Automático" | "Cartão de Crédito") || undefined,
    };

    if (id) {
      update(id, payload);
    } else {
      add(payload);
      if (tipoLancamento === "despesa" && shareEmails.length > 0 && user?.email) {
        const inviteData = {
          name: payload.name,
          amount: payload.amount,
          dueDay: payload.dueDay,
          category: payload.category,
          group: payload.group,
          notes: payload.notes,
          isActive: true,
          tipo: payload.tipo,
          totalParcelas: payload.totalParcelas,
          parcelaInicio: payload.parcelaInicio,
          isCartao: payload.isCartao,
          cartaoNome: payload.cartaoNome,
          imovel: payload.imovel,
          familyMember: payload.familyMember,
          isIncome: payload.isIncome,
          isInvestimento: payload.isInvestimento,
          formaPagamento: payload.formaPagamento,
        };
        shareEmails.forEach((toEmail) => {
          sendInvite({
            fromEmail: user.email!,
            fromName: user.email!.split("@")[0],
            toEmail,
            expense: inviteData,
          });
        });
      }
    }
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex justify-end">
      {/* Click outside to close */}
      <div className="absolute inset-0" onClick={onClose} />

      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="relative w-full max-w-md bg-surface h-full shadow-2xl flex flex-col z-10"
      >
        {/* mobile drag handle */}
        <div className="sm:hidden flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-ink/15" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-ink/5 shrink-0">
          <h2 className="font-bold text-lg text-ink">
            {id ? "Editar Lançamento" : "Novo Lançamento"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-surface-2 transition text-ink"
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 p-5 space-y-5">
          {/* Tipo de Lançamento */}
          <div>
            <span className={LBL}>Tipo de Lançamento</span>
            <div className="flex gap-1 bg-surface-2 rounded-full p-1 w-full border border-ink/5 shadow-sm">
              {(["despesa", "receita", "investimento"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTipoLancamento(t)}
                  className={cn(
                    "flex-1 py-2 rounded-full text-xs font-bold transition-all duration-200 capitalize",
                    tipoLancamento === t 
                      ? "bg-ink text-surface shadow-sm" 
                      : "text-muted hover:text-ink hover:bg-black/5"
                  )}
                >
                  {t === "receita" ? "Entrada" : t === "despesa" ? "Despesa" : "Investimento"}
                </button>
              ))}
            </div>
          </div>

          {/* Categoria (Apenas para Despesas) */}
          {tipoLancamento === "despesa" && (
            <div>
              <span className={LBL}>Categoria</span>
              <div className="grid grid-cols-3 gap-2">
                {(["personal", "casa", "familia"] as ExpenseCategory[]).map(
                  (c) => (
                    <button
                      key={c}
                      onClick={() => setCategory(c)}
                      className={`flex flex-col items-center gap-1 py-3 rounded-2xl text-xs font-bold transition border border-flat ${
                        category === c
                          ? "bg-ink text-lime"
                          : "bg-surface-2 text-ink hover:bg-ink/10"
                      }`}
                    >
                      <span className="text-sm">{CATEGORY_ICONS[c]}</span>
                      {CATEGORY_LABELS[c]}
                    </button>
                  ),
                )}
              </div>
            </div>
          )}

          {/* Imóvel (Apenas despesa e casa) */}
          {tipoLancamento === "despesa" && category === "casa" && (
            <div>
              <span className={LBL}>Imóvel</span>
              {!addingImovel ? (
                <div className="flex gap-2">
                  <select
                    value={imovel}
                    onChange={(e) => setImovel(e.target.value)}
                    className={INP + " flex-1"}
                  >
                    {properties.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setAddingImovel(true)}
                    className="px-3 py-2.5 rounded-2xl bg-surface-2 hover:bg-ink/10 transition text-sm font-semibold flex items-center gap-1 shrink-0 text-ink border border-flat"
                  >
                    <Plus size={13} /> Novo
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    autoFocus
                    value={newImovel}
                    onChange={(e) => setNewImovel(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") confirmNewImovel();
                      if (e.key === "Escape") setAddingImovel(false);
                    }}
                    placeholder="ex: Apartamento, Sítio…"
                    className={INP + " flex-1"}
                  />
                  <button
                    type="button"
                    onClick={confirmNewImovel}
                    className="px-3 py-2.5 rounded-2xl bg-ink text-lime hover:opacity-90 transition text-sm font-semibold shrink-0"
                  >
                    OK
                  </button>
                  <button
                    type="button"
                    onClick={() => setAddingImovel(false)}
                    className="px-3 py-2.5 rounded-2xl bg-surface-2 hover:bg-ink/10 transition shrink-0 text-ink"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Membro da família (Apenas despesa e compartilhada) */}
          {tipoLancamento === "despesa" && category === "familia" && (
            <div>
              <span className={LBL}>Membro</span>
              {!addingMember ? (
                <div className="flex gap-2">
                  <select
                    value={familyMember}
                    onChange={(e) => setFamilyMember(e.target.value)}
                    className={INP + " flex-1"}
                  >
                    <option value="">Sem membro específico</option>
                    {familyMembers.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setAddingMember(true)}
                    className="px-3 py-2.5 rounded-2xl bg-surface-2 hover:bg-ink/10 transition text-sm font-semibold flex items-center gap-1 shrink-0 text-ink border border-flat"
                  >
                    <Plus size={13} /> Novo
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    autoFocus
                    value={newMember}
                    onChange={(e) => setNewMember(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") confirmNewMember();
                      if (e.key === "Escape") setAddingMember(false);
                    }}
                    placeholder="ex: Esposa, Filho, Maria…"
                    className={INP + " flex-1"}
                  />
                  <button
                    type="button"
                    onClick={confirmNewMember}
                    className="px-3 py-2.5 rounded-2xl bg-ink text-lime hover:opacity-90 transition text-sm font-semibold shrink-0"
                  >
                    OK
                  </button>
                  <button
                    type="button"
                    onClick={() => setAddingMember(false)}
                    className="px-3 py-2.5 rounded-2xl bg-surface-2 hover:bg-ink/10 transition shrink-0 text-ink"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Nome */}
          <div>
            <span className={LBL}>
              {tipoLancamento === "despesa" 
                ? "Nome da despesa" 
                : tipoLancamento === "receita" 
                  ? "Nome da entrada (Origem)" 
                  : "Nome do ativo / investimento"}
            </span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={
                tipoLancamento === "despesa"
                  ? "ex: Netflix, Aluguel, IPTU…"
                  : tipoLancamento === "receita"
                    ? "ex: Salário, Freelance, Dividendos…"
                    : "ex: Aporte Tesouro, Compra de FIIs…"
              }
              className={INP}
            />
          </div>

          {/* Valor + Dia */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className={LBL}>Valor (R$)</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0,00"
                className={INP + " font-mono"}
              />
            </div>
            <div>
              <span className={LBL}>
                {tipoLancamento === "despesa" 
                  ? "Dia de venc." 
                  : tipoLancamento === "receita" 
                    ? "Dia de recebimento" 
                    : "Dia do aporte"}
              </span>
              <input
                type="number"
                min="1"
                max="31"
                value={dueDay}
                onChange={(e) => setDueDay(e.target.value)}
                placeholder="ex: 10"
                className={INP + " font-mono"}
              />
            </div>
          </div>

          {/* Tipo de cobrança/recebimento */}
          <div>
            <span className={LBL}>
              {tipoLancamento === "despesa" 
                ? "Tipo de cobrança" 
                : tipoLancamento === "receita" 
                  ? "Tipo de recebimento" 
                  : "Tipo de aporte"}
            </span>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { id: "recorrente", Icon: RefreshCw, label: "Recorrente" },
                  { id: "parcela", Icon: Layers, label: "Parcelado" },
                  { id: "unico", Icon: Zap, label: "Único" },
                ] as {
                  id: ExpenseTipo;
                  Icon: React.ElementType;
                  label: string;
                }[]
              ).map(({ id: tid, Icon, label }) => (
                <button
                  key={tid}
                  onClick={() => setTipo(tid)}
                  className={`flex flex-col items-center gap-1 py-3 rounded-2xl text-[10px] font-bold transition border border-flat ${
                    tipo === tid
                      ? "bg-ink text-lime"
                      : "bg-surface-2 text-ink hover:bg-ink/10"
                  }`}
                >
                  <Icon size={13} />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Parcela extras */}
          {tipo === "parcela" && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className={LBL}>Nº de parcelas</span>
                <input
                  type="number"
                  min="1"
                  value={totalParcelas}
                  onChange={(e) => setTotalParcelas(e.target.value)}
                  placeholder="ex: 12"
                  className={INP + " font-mono"}
                />
              </div>
              <div>
                <span className={LBL}>Mês inicial</span>
                <input
                  type="month"
                  value={parcelaInicio}
                  onChange={(e) => setParcelaInicio(e.target.value)}
                  className={INP}
                />
              </div>
            </div>
          )}

          {/* Mês Único */}
          {tipo === "unico" && (
            <div>
              <span className={LBL}>Mês do pagamento / lançamento</span>
              <input
                type="month"
                value={parcelaInicio}
                onChange={(e) => setParcelaInicio(e.target.value)}
                className={INP}
              />
            </div>
          )}

          {/* Subcategoria / Grupo (Condicional ao Tipo de Lançamento) */}
          <div>
            <span className={LBL}>
              {tipoLancamento === "despesa" 
                ? "Grupo / Subcategoria" 
                : tipoLancamento === "receita" 
                  ? "Categoria da Entrada" 
                  : "Tipo de Investimento"}
            </span>
            <select
              value={group}
              onChange={(e) => setGroup(e.target.value)}
              className={INP}
            >
              {tipoLancamento === "despesa" && groups.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
              {tipoLancamento === "receita" && INCOMING_GROUPS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
              {tipoLancamento === "investimento" && INVESTMENT_GROUPS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>

          {/* Forma de Pagamento */}
          <div>
            <span className={LBL}>
              {tipoLancamento === "despesa" 
                ? "Forma de Pagamento" 
                : tipoLancamento === "receita" 
                  ? "Forma de Recebimento" 
                  : "Forma de Aporte"}
            </span>
            <select
              value={formaPagamento}
              onChange={(e) => {
                const val = e.target.value as any;
                setFormaPagamento(val);
              }}
              className={INP}
            >
              <option value="">Selecione...</option>
              <option value="Dinheiro">Dinheiro</option>
              <option value="Pix">Pix</option>
              <option value="Débito Automático">Débito Automático</option>
              <option value="Cartão de Crédito">Cartão de Crédito</option>
            </select>
          </div>

          {/* Cartão Nome (Apenas Despesas c/ Cartão de Crédito) */}
          {tipoLancamento === "despesa" && formaPagamento === "Cartão de Crédito" && (
            <div>
              <span className={LBL}>Qual Cartão? (Opcional)</span>
              <input
                value={cartaoNome}
                onChange={(e) => setCartaoNome(e.target.value)}
                placeholder="Nome do cartão (ex: Nubank, Inter…)"
                className={INP}
              />
            </div>
          )}

          {/* Observações */}
          <div>
            <span className={LBL}>Observações (opcional)</span>
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="ex: rendimento da poupança, venc. após fds…"
              className={INP}
            />
          </div>

          {/* Compartilhar (Apenas Despesas) */}
          {tipoLancamento === "despesa" && (
            <div
              className="rounded-2xl overflow-hidden bg-surface-2/30"
              style={{
                border: shareSection
                  ? "1px solid rgba(0,0,0,0.14)"
                  : "1px solid var(--flat-border)",
              }}
            >
              <button
                type="button"
                onClick={() => setShareSection((v) => !v)}
                className="w-full flex items-center gap-3 px-4 py-3.5 text-left transition hover:bg-surface-2"
              >
                <div
                  className={`w-8 h-8 rounded-xl grid place-items-center shrink-0 transition-colors ${
                    shareSection ? "bg-ink" : "bg-surface-2"
                  }`}
                >
                  <Share2
                    size={14}
                    className={shareSection ? "text-lime" : "text-muted"}
                  />
                </div>
                <div className="flex-1 text-ink">
                  <p className="text-sm font-semibold">Compartilhar despesa</p>
                  <p className="text-[11px] text-muted">
                    {shareEmails.length > 0
                      ? `${shareEmails.length} pessoa${shareEmails.length > 1 ? "s" : ""} adicionada${shareEmails.length > 1 ? "s" : ""}`
                      : "Enviar para outros usuários AIA OS"}
                  </p>
                </div>
                {shareEmails.length > 0 && (
                  <span className="w-5 h-5 rounded-full bg-ink text-lime text-[10px] font-bold grid place-items-center">
                    {shareEmails.length}
                  </span>
                )}
              </button>

              {shareSection && (
                <div className="px-4 pb-4 space-y-3 border-t border-ink/5 text-ink">
                  <p className="text-[11px] text-muted pt-3">
                    A despesa aparecerá na caixa de entrada do usuário. Após
                    aceitar, será adicionada automaticamente às finanças na
                    categoria <strong>{CATEGORY_LABELS[category]}</strong>.
                  </p>

                  {shareEmails.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {shareEmails.map((em) => (
                        <span
                          key={em}
                          className="flex items-center gap-1.5 bg-ink text-lime text-[11px] font-medium px-2.5 py-1 rounded-full"
                        >
                          <UserPlus size={10} />
                          {em}
                          <button
                            type="button"
                            onClick={() => removeEmail(em)}
                            className="ml-0.5 opacity-60 hover:opacity-100"
                          >
                            <X size={10} />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <input
                      type="email"
                      value={emailInput}
                      onChange={(e) => {
                        setEmailInput(e.target.value);
                        setError("");
                      }}
                      onKeyDown={(e) =>
                        e.key === "Enter" && (e.preventDefault(), addEmail())
                      }
                      placeholder="email@exemplo.com"
                      className="flex-1 px-3 py-2.5 rounded-xl bg-surface-2 text-sm outline-none focus:ring-2 focus:ring-ink/15 text-ink border border-flat"
                    />
                    <button
                      type="button"
                      onClick={addEmail}
                      className="px-3 py-2.5 rounded-xl bg-ink text-lime hover:opacity-90 transition"
                    >
                      <Plus size={15} />
                    </button>
                  </div>

                  {error && (
                    <p className="flex items-center gap-1.5 text-[11px] text-danger">
                      <AlertCircle size={11} /> {error}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {id && (
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 accent-lime"
              />
              <span className="text-sm font-medium text-ink">Lançamento ativo</span>
            </label>
          )}

          {error && !shareSection && (
            <p className="flex items-center gap-1.5 text-[12px] text-danger">
              <AlertCircle size={12} /> {error}
            </p>
          )}
        </div>

        {/* footer */}
        <div className="flex gap-3 px-5 py-4 border-t border-ink/5 shrink-0 bg-surface-2/20">
          <Button
            variant="ghost"
            size="md"
            onClick={onClose}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button size="md" onClick={save} className="flex-1">
            {tipoLancamento === "despesa" && shareEmails.length > 0 && !id
              ? `Adicionar e compartilhar`
              : id
                ? "Salvar"
                : "Adicionar"}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
