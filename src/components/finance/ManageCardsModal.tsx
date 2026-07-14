import { useState } from "react";
import { X, Plus, Trash2, CreditCard } from "lucide-react";
import { useFinanceStore, type CreditCard as CreditCardType } from "@/store/useFinanceStore";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

const CARD_COLORS = ["bg-ink", "bg-lime", "bg-info", "bg-purple-500", "bg-danger", "bg-warning"];

export function ManageCardsModal({ onClose }: { onClose: () => void }) {
  const creditCards = useFinanceStore(s => s.creditCards);
  const addCreditCard = useFinanceStore(s => s.addCreditCard);
  const updateCreditCard = useFinanceStore(s => s.updateCreditCard);
  const removeCreditCard = useFinanceStore(s => s.removeCreditCard);

  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form State
  const [name, setName] = useState("");
  const [limit, setLimit] = useState("");
  const [closingDay, setClosingDay] = useState("1");
  const [dueDay, setDueDay] = useState("10");
  const [color, setColor] = useState("bg-ink");

  function handleEdit(c: CreditCardType) {
    setEditingId(c.id);
    setName(c.name);
    setLimit(c.limit.toString());
    setClosingDay(c.closingDay.toString());
    setDueDay(c.dueDay.toString());
    setColor(c.color || "bg-ink");
  }

  function resetForm() {
    setEditingId(null);
    setName("");
    setLimit("");
    setClosingDay("1");
    setDueDay("10");
    setColor("bg-ink");
  }

  function handleSave() {
    if (!name.trim() || !limit) return;
    
    const c: Omit<CreditCardType, "id"> = {
      name: name.trim(),
      limit: Number(limit) || 0,
      closingDay: Number(closingDay) || 1,
      dueDay: Number(dueDay) || 10,
      color
    };

    if (editingId) {
      updateCreditCard(editingId, c);
    } else {
      addCreditCard(c);
    }
    resetForm();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-ink/5 shrink-0">
          <h2 className="font-bold text-base flex items-center gap-2">
            <CreditCard size={18} />
            Gerenciar Cartões
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-surface-2 transition text-muted">
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          
          {/* Formulário */}
          <div className="bg-surface-2 p-4 rounded-2xl space-y-4">
            <h3 className="text-xs uppercase font-bold tracking-wider text-muted">
              {editingId ? "Editar Cartão" : "Novo Cartão"}
            </h3>
            
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-semibold text-muted ml-1 mb-1 block uppercase tracking-wide">Nome do Cartão</label>
                <input 
                  value={name} onChange={e => setName(e.target.value)}
                  placeholder="Ex: Nubank, Itaú..."
                  className="w-full px-3 py-2 text-sm bg-white rounded-xl outline-none focus:ring-2 focus:ring-ink/10"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-semibold text-muted ml-1 mb-1 block uppercase tracking-wide">Limite Total (R$)</label>
                  <input 
                    type="number" value={limit} onChange={e => setLimit(e.target.value)}
                    placeholder="5000"
                    className="w-full px-3 py-2 text-sm bg-white rounded-xl outline-none focus:ring-2 focus:ring-ink/10"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-muted ml-1 mb-1 block uppercase tracking-wide">Dia Fechamento</label>
                  <input 
                    type="number" min={1} max={31} value={closingDay} onChange={e => setClosingDay(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white rounded-xl outline-none focus:ring-2 focus:ring-ink/10"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-semibold text-muted ml-1 mb-1 block uppercase tracking-wide">Dia Vencimento</label>
                  <input 
                    type="number" min={1} max={31} value={dueDay} onChange={e => setDueDay(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white rounded-xl outline-none focus:ring-2 focus:ring-ink/10"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-muted ml-1 mb-1 block uppercase tracking-wide">Cor de Identificação</label>
                  <div className="flex items-center gap-1.5 h-[36px] bg-white px-2 rounded-xl border border-transparent">
                    {CARD_COLORS.map(c => (
                      <button 
                        key={c}
                        onClick={() => setColor(c)}
                        className={cn(
                          "w-5 h-5 rounded-full shrink-0 transition-transform", 
                          c, 
                          color === c ? "ring-2 ring-offset-1 ring-ink scale-110" : "opacity-70 hover:opacity-100"
                        )}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                {editingId && (
                  <Button variant="light" size="sm" onClick={resetForm} className="flex-1">
                    Cancelar
                  </Button>
                )}
                <Button size="sm" onClick={handleSave} disabled={!name.trim() || !limit} className={cn("flex-1", !editingId && "w-full")}>
                  {editingId ? "Salvar" : "Adicionar"}
                </Button>
              </div>
            </div>
          </div>

          {/* Lista de Cartões */}
          <div>
            <h3 className="text-xs uppercase font-bold tracking-wider text-muted mb-3 px-1">Meus Cartões</h3>
            {creditCards.length === 0 ? (
              <p className="text-xs text-muted text-center py-4 italic">Nenhum cartão cadastrado.</p>
            ) : (
              <div className="space-y-2">
                {creditCards.map(c => (
                  <div key={c.id} className="flex items-center justify-between bg-surface-2 p-3 rounded-2xl border border-transparent hover:border-ink/5 transition">
                    <div className="flex items-center gap-3">
                      <div className={cn("w-3 h-3 rounded-full shrink-0", c.color || "bg-ink")} />
                      <div>
                        <p className="font-bold text-sm text-ink">{c.name}</p>
                        <p className="text-[10px] text-muted font-medium">Limite: R$ {c.limit.toLocaleString('pt-BR')} · Fecha dia {c.closingDay}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => handleEdit(c)} className="text-xs font-semibold px-3 py-1.5 rounded-lg text-ink hover:bg-black/5 transition">
                        Editar
                      </button>
                      <button onClick={() => removeCreditCard(c.id)} className="p-1.5 rounded-lg text-muted hover:text-danger hover:bg-danger/10 transition">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
