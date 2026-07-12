"use client";
import { useState, useMemo } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Topbar } from "@/components/layout/Topbar";
import { Button } from "@/components/ui/Button";
import { 
  Plus, Trash2, ExternalLink, ShoppingBag, 
  TrendingDown, DollarSign, AlertCircle, Check, 
  Trash, ArrowRight, Tag, Info, ShoppingCart, ListChecks, X
} from "lucide-react";
import { useShoppingStore, type WishlistItem, type ShoppingItem } from "@/store/useShoppingStore";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export default function ComprasPage() {
  const {
    wishlist,
    shoppingList,
    addWishlistItem,
    toggleWishlistBought,
    removeWishlistItem,
    updateWishlistPrice,
    addShoppingItem,
    toggleShoppingItemBought,
    removeShoppingItem
  } = useShoppingStore();

  const [activeTab, setActiveTab] = useState<"lista" | "desejos">("lista");

  // State para a Lista de Compras Rápida
  const [newShopName, setNewShopName] = useState("");
  const [newShopQty, setNewShopQty] = useState<number>(1);
  const [newShopCat, setNewShopCat] = useState("Mercado");

  // State para o Wishlist / Rastreador de Preço
  const [showAddWish, setShowAddWish] = useState(false);
  const [wishName, setWishName] = useState("");
  const [wishUrl, setWishUrl] = useState("");
  const [wishCurrentPrice, setWishCurrentPrice] = useState("");
  const [wishTargetPrice, setWishTargetPrice] = useState("");
  const [wishPriority, setWishPriority] = useState<"baixa" | "media" | "alta">("media");
  const [wishCat, setWishCat] = useState("Eletrônicos");
  const [wishNotes, setWishNotes] = useState("");

  // Editores inline de preço atual
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [tempPrice, setTempPrice] = useState("");

  const handleAddShoppingItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newShopName.trim()) return;
    addShoppingItem(newShopName.trim(), newShopQty || 1, newShopCat);
    setNewShopName("");
    setNewShopQty(1);
  };

  const handleAddWishItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!wishName.trim()) return;

    let formattedUrl = wishUrl.trim();
    if (formattedUrl && !/^https?:\/\//i.test(formattedUrl)) {
      formattedUrl = "https://" + formattedUrl;
    }

    addWishlistItem({
      name: wishName.trim(),
      url: formattedUrl || undefined,
      currentPrice: wishCurrentPrice ? Number(wishCurrentPrice) : undefined,
      targetPrice: wishTargetPrice ? Number(wishTargetPrice) : undefined,
      priority: wishPriority,
      category: wishCat,
      notes: wishNotes.trim() || undefined,
    });

    setWishName("");
    setWishUrl("");
    setWishCurrentPrice("");
    setWishTargetPrice("");
    setWishPriority("media");
    setWishNotes("");
    setShowAddWish(false);
  };

  // Agrupa itens de compras por categoria
  const groupedShopping = useMemo(() => {
    const groups: Record<string, ShoppingItem[]> = {};
    shoppingList.forEach((item) => {
      if (!groups[item.category]) groups[item.category] = [];
      groups[item.category].push(item);
    });
    return groups;
  }, [shoppingList]);

  return (
    <AppShell>
      <Topbar 
        title="Wish List" 
        subtitle="Gerencie listas de compras domésticas e rastreie preços de itens que deseja adquirir."
      />

      <div className="max-w-6xl mx-auto w-full pb-12 px-4 md:px-0 flex flex-col gap-6">
        
        {/* Alternador de abas */}
        <div className="relative flex items-center bg-surface-2 p-1.5 border border-flat rounded-full w-fit select-none shadow-sm">
          {[
            { id: "lista", label: "Lista de Compras", Icon: ListChecks },
            { id: "desejos", label: "Rastreador de Desejos", Icon: ShoppingCart }
          ].map((t) => {
            const active = activeTab === t.id;
            const Icon = t.Icon;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as any)}
                className={cn(
                  "relative z-10 px-4 py-1.5 rounded-full text-xs font-bold transition-colors duration-300 flex items-center gap-1.5",
                  active ? "text-ink" : "text-muted hover:text-ink"
                )}
              >
                {active && (
                  <motion.div
                    layoutId="shoppingActiveTabPill"
                    className="absolute inset-0 bg-white rounded-full shadow-sm border border-flat"
                    style={{ zIndex: -1 }}
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <Icon size={13} />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Conteúdo da Aba 1: Lista de Compras */}
        {activeTab === "lista" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Esquerda: Adicionar Item (col-span-4) */}
            <div className="lg:col-span-4 glass rounded-3xl p-5 border border-flat flex flex-col gap-4 text-left">
              <h2 className="font-bold text-sm text-ink flex items-center gap-1.5">
                <Plus size={15} /> Adicionar Produto
              </h2>

              <form onSubmit={handleAddShoppingItem} className="space-y-3">
                <div>
                  <label className="text-[9px] uppercase font-bold text-muted block mb-1">Nome do Item</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Leite integral, Sabão em pó"
                    value={newShopName}
                    onChange={(e) => setNewShopName(e.target.value)}
                    className="w-full px-3 py-2 bg-surface-2 border border-flat rounded-xl text-xs outline-none focus:ring-2 focus:ring-ink/10 text-ink"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[9px] uppercase font-bold text-muted block mb-1">Quantidade</label>
                    <input
                      type="number"
                      min={1}
                      value={newShopQty}
                      onChange={(e) => setNewShopQty(Math.max(1, Number(e.target.value)))}
                      className="w-full px-3 py-2 bg-surface-2 border border-flat rounded-xl text-xs outline-none focus:ring-2 focus:ring-ink/10 text-ink"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] uppercase font-bold text-muted block mb-1">Categoria</label>
                    <select
                      value={newShopCat}
                      onChange={(e) => setNewShopCat(e.target.value)}
                      className="w-full px-3 py-2 bg-surface-2 border border-flat rounded-xl text-xs outline-none focus:ring-2 focus:ring-ink/10 text-ink"
                    >
                      <option value="Mercado">Mercado</option>
                      <option value="Hortifrúti">Hortifrúti</option>
                      <option value="Açougue">Açougue</option>
                      <option value="Limpeza">Limpeza</option>
                      <option value="Farmácia">Farmácia</option>
                      <option value="Outros">Outros</option>
                    </select>
                  </div>
                </div>

                <Button type="submit" variant="primary" size="sm" className="w-full font-bold">
                  Inserir na Lista
                </Button>
              </form>
            </div>

            {/* Direita: Exibir Itens (col-span-8) */}
            <div className="lg:col-span-8 flex flex-col gap-4 text-left">
              {shoppingList.length === 0 ? (
                <div className="glass rounded-3xl p-12 text-center text-muted border border-dashed border-flat">
                  <ShoppingBag size={32} className="mx-auto mb-3 opacity-25" />
                  <p className="font-bold text-sm text-ink">Lista vazia</p>
                  <p className="text-xs text-muted mt-1">Adicione itens que precisa comprar ao lado.</p>
                </div>
              ) : (
                Object.entries(groupedShopping).map(([cat, items]) => (
                  <div key={cat} className="glass rounded-3xl p-5 border border-flat space-y-3">
                    <h3 className="font-bold text-xs uppercase tracking-wider text-muted/80 border-b border-flat pb-1.5 flex items-center gap-1.5">
                      <Tag size={12} /> {cat}
                    </h3>

                    <div className="flex flex-col gap-2">
                      {items.map((item) => (
                        <div 
                          key={item.id}
                          className="flex items-center justify-between p-2.5 px-3 bg-surface-2/65 hover:bg-surface-2 border border-flat rounded-2xl transition-all"
                        >
                          <div className="flex items-center gap-2.5">
                            <button
                              onClick={() => toggleShoppingItemBought(item.id)}
                              className={cn(
                                "w-4 h-4 rounded-md border flex items-center justify-center transition-all",
                                item.bought ? "bg-lime border-lime text-ink" : "border-ink/20 hover:border-ink/40 bg-white"
                              )}
                            >
                              {item.bought && <Check size={10} strokeWidth={3} />}
                            </button>
                            <span className={cn(
                              "text-xs font-semibold text-ink transition-all",
                              item.bought && "line-through text-muted/65"
                            )}>
                              {item.name}
                              {item.quantity && item.quantity > 1 && (
                                <span className="text-[10px] text-muted ml-1.5 font-normal">
                                  ({item.quantity}x)
                                </span>
                              )}
                            </span>
                          </div>
                          
                          <button
                            onClick={() => removeShoppingItem(item.id)}
                            className="p-1 rounded-lg hover:bg-danger/10 text-muted hover:text-danger transition"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>

          </div>
        )}

        {/* Conteúdo da Aba 2: Wishlist & Preço */}
        {activeTab === "desejos" && (
          <div className="space-y-4 text-left">
            
            <div className="flex justify-between items-center">
              <h2 className="font-bold text-sm text-ink">Produtos Desejados</h2>
              <Button onClick={() => setShowAddWish(true)} size="sm">
                <Plus size={14} /> Novo Produto
              </Button>
            </div>

            {/* Listagem de Produtos Desejados */}
            {wishlist.length === 0 ? (
              <div className="glass rounded-3xl p-12 text-center text-muted border border-dashed border-flat">
                <ShoppingCart size={32} className="mx-auto mb-3 opacity-25" />
                <p className="font-bold text-sm text-ink">Nenhum produto cadastrado</p>
                <p className="text-xs text-muted mt-1">Clique em "Novo Produto" para adicionar itens que quer monitorar.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {wishlist.map((item) => {
                  const hasPrices = item.currentPrice && item.targetPrice;
                  const priceDiff = hasPrices ? item.currentPrice! - item.targetPrice! : 0;
                  const reachedTarget = priceDiff <= 0;

                  return (
                    <div 
                      key={item.id}
                      className={cn(
                        "glass rounded-3xl p-5 border flex flex-col justify-between gap-4 transition-all hover:shadow-md",
                        item.bought ? "opacity-60" : "border-flat"
                      )}
                    >
                      {/* Topo do Card */}
                      <div className="space-y-1.5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => toggleWishlistBought(item.id)}
                              className={cn(
                                "w-4 h-4 rounded-md border flex items-center justify-center transition-all mt-0.5",
                                item.bought ? "bg-lime border-lime text-ink" : "border-ink/20 hover:border-ink/40 bg-white"
                              )}
                            >
                              {item.bought && <Check size={10} strokeWidth={3} />}
                            </button>
                            <h3 className={cn("font-bold text-sm text-ink leading-tight", item.bought && "line-through text-muted")}>
                              {item.name}
                            </h3>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className={cn(
                              "text-[8px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded",
                              item.priority === "alta" ? "bg-danger/10 text-danger" : 
                              item.priority === "media" ? "bg-warning/15 text-ink" : "bg-success/10 text-success"
                            )}>
                              {item.priority}
                            </span>
                            <button
                              onClick={() => removeWishlistItem(item.id)}
                              className="p-1 rounded-lg hover:bg-danger/10 text-muted hover:text-danger transition"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2 text-[9px] font-bold text-muted/75">
                          <span className="bg-surface-2 border border-flat p-0.5 px-1.5 rounded-lg">{item.category}</span>
                          {item.url && (
                            <a 
                              href={item.url} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="flex items-center gap-0.5 text-ink hover:underline cursor-pointer"
                            >
                              Ver Loja <ExternalLink size={8} />
                            </a>
                          )}
                        </div>

                        {item.notes && (
                          <p className="text-[10px] text-muted italic leading-relaxed bg-surface-2/65 p-2 rounded-xl border border-flat mt-2">
                            "{item.notes}"
                          </p>
                        )}
                      </div>

                      {/* Seção de Preços e Progresso */}
                      {!item.bought && (
                        <div className="border-t border-flat pt-3 space-y-3">
                          <div className="grid grid-cols-2 gap-4 text-xs font-semibold">
                            <div>
                              <p className="text-[9px] uppercase tracking-wider text-muted font-bold">Preço Atual</p>
                              {editingPriceId === item.id ? (
                                <div className="flex items-center gap-1 mt-1.5">
                                  <span className="text-[10px] text-ink font-bold">R$</span>
                                  <input
                                    type="number"
                                    value={tempPrice}
                                    onChange={(e) => setTempPrice(e.target.value)}
                                    className="w-16 px-1.5 py-0.5 bg-surface-2 border border-flat rounded text-[10px] outline-none text-ink font-bold"
                                    autoFocus
                                    onBlur={() => {
                                      if (tempPrice.trim()) updateWishlistPrice(item.id, Number(tempPrice));
                                      setEditingPriceId(null);
                                    }}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") {
                                        if (tempPrice.trim()) updateWishlistPrice(item.id, Number(tempPrice));
                                        setEditingPriceId(null);
                                      }
                                    }}
                                  />
                                </div>
                              ) : (
                                <button 
                                  onClick={() => {
                                    setEditingPriceId(item.id);
                                    setTempPrice(item.currentPrice?.toString() || "");
                                  }}
                                  className="text-xs font-bold text-ink hover:underline block mt-1"
                                >
                                  {item.currentPrice ? `R$ ${item.currentPrice.toLocaleString("pt-BR")}` : "Definir R$"}
                                </button>
                              )}
                            </div>
                            <div>
                              <p className="text-[9px] uppercase tracking-wider text-muted font-bold">Preço Desejado</p>
                              <p className="text-xs font-bold text-ink block mt-1">
                                {item.targetPrice ? `R$ ${item.targetPrice.toLocaleString("pt-BR")}` : "Não definido"}
                              </p>
                            </div>
                          </div>

                          {/* Comparativo de Preço */}
                          {hasPrices && (
                            <div className="space-y-2 mt-2">
                              <div className="flex justify-between items-center text-[10px] font-bold">
                                {reachedTarget ? (
                                  <span className="text-success flex items-center gap-1">
                                    <Check size={11} strokeWidth={3} /> Meta atingida para compra!
                                  </span>
                                ) : (
                                  <span className="text-warning flex items-center gap-1">
                                    <TrendingDown size={11} /> Falta R$ {(priceDiff).toLocaleString("pt-BR")} para a meta
                                  </span>
                                )}
                              </div>
                              <div className="h-1.5 w-full bg-surface-2 rounded-full overflow-hidden border border-flat">
                                <div 
                                  className={cn(
                                    "h-full rounded-full transition-all duration-300",
                                    reachedTarget ? "bg-success" : "bg-ink"
                                  )}
                                  style={{ width: `${Math.min(100, Math.round((item.targetPrice! / item.currentPrice!) * 100))}%` }}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

      </div>

      {/* Modal para Adicionar Novo Wishlist Item */}
      <AnimatePresence>
        {showAddWish && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{
              background: "rgba(14,11,12,0.60)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
            }}
          >
            <div className="glass rounded-3xl shadow-xl w-full max-w-md p-6 text-left">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-bold text-lg text-ink">Novo Desejo de Compra</h2>
                <button onClick={() => setShowAddWish(false)} className="p-2 rounded-xl hover:bg-surface-2 transition">
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleAddWishItem} className="space-y-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-semibold text-muted mb-1.5">Produto</label>
                  <input
                    value={wishName}
                    onChange={(e) => setWishName(e.target.value)}
                    required
                    placeholder="Ex: Monitor UltraWide LG"
                    className="block w-full px-4 py-3 rounded-2xl bg-surface-2 text-sm outline-none focus:ring-2 focus:ring-ink/15 text-ink"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-semibold text-muted mb-1.5">Link / URL do Produto</label>
                  <input
                    value={wishUrl}
                    onChange={(e) => setWishUrl(e.target.value)}
                    placeholder="Ex: amazon.com.br/dp/..."
                    className="block w-full px-4 py-3 rounded-2xl bg-surface-2 text-sm font-mono outline-none focus:ring-2 focus:ring-ink/15 text-ink"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest font-semibold text-muted mb-1.5">Preço Atual (R$)</label>
                    <input
                      type="number"
                      value={wishCurrentPrice}
                      onChange={(e) => setWishCurrentPrice(e.target.value)}
                      placeholder="Ex: 1800"
                      className="block w-full px-4 py-3 rounded-2xl bg-surface-2 text-sm outline-none focus:ring-2 focus:ring-ink/15 text-ink"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest font-semibold text-muted mb-1.5">Preço Desejado (R$)</label>
                    <input
                      type="number"
                      value={wishTargetPrice}
                      onChange={(e) => setWishTargetPrice(e.target.value)}
                      placeholder="Ex: 1500"
                      className="block w-full px-4 py-3 rounded-2xl bg-surface-2 text-sm outline-none focus:ring-2 focus:ring-ink/15 text-ink"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest font-semibold text-muted mb-1.5">Prioridade</label>
                    <select
                      value={wishPriority}
                      onChange={(e) => setWishPriority(e.target.value as any)}
                      className="block w-full px-4 py-3 rounded-2xl bg-surface-2 text-sm outline-none text-ink"
                    >
                      <option value="baixa">Baixa</option>
                      <option value="media">Média</option>
                      <option value="alta">Alta</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest font-semibold text-muted mb-1.5">Categoria</label>
                    <select
                      value={wishCat}
                      onChange={(e) => setWishCat(e.target.value)}
                      className="block w-full px-4 py-3 rounded-2xl bg-surface-2 text-sm outline-none text-ink"
                    >
                      <option value="Eletrônicos">Eletrônicos</option>
                      <option value="Casa">Casa</option>
                      <option value="Livros">Livros</option>
                      <option value="Roupas">Roupas</option>
                      <option value="Higiene">Higiene</option>
                      <option value="Outros">Outros</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-semibold text-muted mb-1.5">Anotações / Descrição</label>
                  <input
                    value={wishNotes}
                    onChange={(e) => setWishNotes(e.target.value)}
                    placeholder="Observações extras..."
                    className="block w-full px-4 py-3 rounded-2xl bg-surface-2 text-sm outline-none focus:ring-2 focus:ring-ink/15 text-ink"
                  />
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowAddWish(false)}
                    className="flex-1 py-3 rounded-2xl border border-flat text-sm font-semibold hover:bg-surface-2 transition text-ink"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 rounded-2xl bg-ink text-lime text-sm font-semibold hover:opacity-90 transition flex items-center justify-center gap-2"
                  >
                    <Check size={14} /> Salvar Produto
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </AnimatePresence>
    </AppShell>
  );
}
