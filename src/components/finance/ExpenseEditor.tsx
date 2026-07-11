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

const CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  personal: "Pessoal",
  casa: "Casa",
  familia: "Compartilhadas",
};

const CATEGORY_ICONS: Record<ExpenseCategory, string> = {
  personal: "",
  casa: "",
  familia: "",
};

const LBL =
  "block text-[10px] uppercase tracking-widest font-semibold text-muted mb-2";
const INP =
  "block w-full px-4 py-3 rounded-2xl bg-surface-2 text-sm outline-none focus:ring-2 focus:ring-ink/15";

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
  const [amount, setAmount] = useState(existing ? String(existing.amount) : "");
  const [dueDay, setDueDay] = useState(existing ? String(existing.dueDay) : "");
  const [category, setCategory] = useState<ExpenseCategory>(
    existing?.category ?? "personal",
  );
  const [group, setGroup] = useState(existing?.group ?? "");
  const [notes, setNotes] = useState(existing?.notes ?? "");
  const [isActive, setIsActive] = useState(existing?.isActive ?? true);
  const [tipo, setTipo] = useState<ExpenseTipo>(existing?.tipo ?? "recorrente");
  const [totalParcelas, setTotalParcelas] = useState(
    existing?.totalParcelas ? String(existing.totalParcelas) : "",
  );
  const [parcelaInicio, setParcelaInicio] = useState(
    existing?.parcelaInicio ?? new Date().toISOString().slice(0, 7),
  );
  const [isCartao, setIsCartao] = useState(existing?.isCartao ?? false);
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
    if (!group || !groups.includes(group)) setGroup(groups[0]);
  }, [category]);

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
      category,
      group: group || groups[0],
      notes: notes.trim() || undefined,
      isActive,
      tipo,
      totalParcelas: tipo === "parcela" ? parseInt(totalParcelas) : undefined,
      parcelaInicio:
        tipo === "parcela" || tipo === "unico" ? parcelaInicio : undefined,
      isCartao,
      cartaoNome: isCartao ? cartaoNome.trim() || undefined : undefined,
      imovel: category === "casa" && imovel ? imovel : undefined,
      familyMember:
        category === "familia" && familyMember ? familyMember : undefined,
      sharedWith: shareEmails.length > 0 ? shareEmails : undefined,
    };

    if (id) {
      update(id, payload);
    } else {
      add(payload);
      if (shareEmails.length > 0 && user?.email) {
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
        };
        shareEmails.forEach((toEmail) => {
          sendInvite({ fromEmail: user.email, toEmail, expense: inviteData });
        });
      }
    }
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end"
      style={{
        background: "rgba(14,11,12,0.40)",
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
      }}
    >
      <motion.div 
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "tween", ease: [0.16, 1, 0.3, 1], duration: 0.45 }}
        className="w-full sm:w-[440px] h-full sm:rounded-l-[32px] shadow-[0_0_40px_rgba(0,0,0,0.1)] flex flex-col overflow-hidden"
        style={{
          background: "rgba(255, 255, 255, 0.45)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          borderLeft: "1px solid rgba(255,255,255,0.4)"
        }}
      >
        {/* mobile drag handle */}
        <div className="sm:hidden flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-ink/15" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-ink/5 shrink-0">
          <h2 className="font-bold text-lg">
            {id ? "Editar Lançamento" : "Novo Lançamento"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-surface-2 transition"
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 p-5 space-y-5">
          {/* Categoria */}
          <div>
            <span className={LBL}>Categoria</span>
            <div className="grid grid-cols-3 gap-2">
              {(["personal", "casa", "familia"] as ExpenseCategory[]).map(
                (c) => (
                  <button
                    key={c}
                    onClick={() => setCategory(c)}
                    className={`flex flex-col items-center gap-1 py-3 rounded-2xl text-sm font-semibold transition ${
                      category === c
                        ? "bg-ink text-lime"
                        : "bg-surface-2 text-ink hover:bg-ink/10"
                    }`}
                  >
                    <span className="text-base">{CATEGORY_ICONS[c]}</span>
                    {CATEGORY_LABELS[c]}
                  </button>
                ),
              )}
            </div>
          </div>

          {/* Imóvel (casa only) */}
          {category === "casa" && (
            <div>
              <span className={LBL}>Imóvel</span>
              {!addingImovel ? (
                <div className="flex gap-2">
                  <select
                    value={imovel}
                    onChange={(e) => setImovel(e.target.value)}
                    className={INP + "flex-1"}
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
                    className="px-3 py-2.5 rounded-2xl bg-surface-2 hover:bg-ink/10 transition text-sm font-semibold flex items-center gap-1 shrink-0"
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
                    className={INP + "flex-1"}
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
                    className="px-3 py-2.5 rounded-2xl bg-surface-2 hover:bg-ink/10 transition shrink-0"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Membro da família (familia only) */}
          {category === "familia" && (
            <div>
              <span className={LBL}>Membro</span>
              {!addingMember ? (
                <div className="flex gap-2">
                  <select
                    value={familyMember}
                    onChange={(e) => setFamilyMember(e.target.value)}
                    className={INP + "flex-1"}
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
                    className="px-3 py-2.5 rounded-2xl bg-surface-2 hover:bg-ink/10 transition text-sm font-semibold flex items-center gap-1 shrink-0"
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
                    className={INP + "flex-1"}
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
                    className="px-3 py-2.5 rounded-2xl bg-surface-2 hover:bg-ink/10 transition shrink-0"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Nome */}
          <div>
            <span className={LBL}>Nome da despesa</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ex: Netflix, Aluguel, IPTU…"
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
                className={INP + "font-mono"}
              />
            </div>
            <div>
              <span className={LBL}>Dia de venc.</span>
              <input
                type="number"
                min="1"
                max="31"
                value={dueDay}
                onChange={(e) => setDueDay(e.target.value)}
                placeholder="ex: 10"
                className={INP + "font-mono"}
              />
            </div>
          </div>

          {/* Tipo */}
          <div>
            <span className={LBL}>Tipo de cobrança</span>
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
                  className={`flex flex-col items-center gap-1 py-3 rounded-2xl text-xs font-semibold transition ${
                    tipo === tid
                      ? "bg-ink text-lime"
                      : "bg-surface-2 text-ink hover:bg-ink/10"
                  }`}
                >
                  <Icon size={14} />
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
                  className={INP + "font-mono"}
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

          {tipo === "unico" && (
            <div>
              <span className={LBL}>Mês do pagamento</span>
              <input
                type="month"
                value={parcelaInicio}
                onChange={(e) => setParcelaInicio(e.target.value)}
                className={INP}
              />
            </div>
          )}

          {/* Grupo */}
          <div>
            <span className={LBL}>Grupo</span>
            <select
              value={group}
              onChange={(e) => setGroup(e.target.value)}
              className={INP}
            >
              {groups.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>

          {/* Cartão */}
          <div className="rounded-2xl border border-ink/10 p-4 space-y-3">
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isCartao}
                onChange={(e) => setIsCartao(e.target.checked)}
                className="w-4 h-4 accent-lime shrink-0"
              />
              <CreditCard size={14} className="shrink-0 text-muted" />
              <span className="text-sm font-semibold">Cobrado no cartão</span>
            </label>
            {isCartao && (
              <input
                value={cartaoNome}
                onChange={(e) => setCartaoNome(e.target.value)}
                placeholder="Nome do cartão (ex: Nubank, Inter…)"
                className={INP}
              />
            )}
          </div>

          {/* Observações */}
          <div>
            <span className={LBL}>Observações (opcional)</span>
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="ex: débito automático, vence após fds…"
              className={INP}
            />
          </div>

          {/* Compartilhar */}
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              border: shareSection
                ? "1px solid rgba(0,0,0,0.14)"
                : "1px solid rgba(0,0,0,0.08)",
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
              <div className="flex-1">
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
              <div className="px-4 pb-4 space-y-3 border-t border-ink/5">
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
                    className="flex-1 px-3 py-2.5 rounded-xl bg-surface-2 text-sm outline-none focus:ring-2 focus:ring-ink/15"
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

          {id && (
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 accent-lime"
              />
              <span className="text-sm font-medium">Despesa ativa</span>
            </label>
          )}

          {error && !shareSection && (
            <p className="flex items-center gap-1.5 text-[12px] text-danger">
              <AlertCircle size={12} /> {error}
            </p>
          )}
        </div>

        {/* footer */}
        <div className="flex gap-3 px-5 py-4 border-t border-ink/5 shrink-0">
          <Button
            variant="ghost"
            size="md"
            onClick={onClose}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button size="md" onClick={save} className="flex-1">
            {shareEmails.length > 0 && !id
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
