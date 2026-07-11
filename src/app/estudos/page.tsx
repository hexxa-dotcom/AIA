"use client";
import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Topbar } from "@/components/layout/Topbar";
import { BookOpen, GraduationCap, BrainCircuit, CalendarDays, Plus, Library, X, Check, Pencil } from "lucide-react";
import { useStudiesStore } from "@/store/useStudiesStore";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogTitle, DialogClose } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";

type Tab = "estudos" | "biblioteca";

function EstudosTab() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Cursos e Trilhas */}
      <div className="glass rounded-3xl p-5 border" style={{ borderColor: "var(--flat-border)" }}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-ink text-surface flex items-center justify-center">
            <GraduationCap size={20} />
          </div>
          <div>
            <h2 className="font-bold text-base">Cursos em Andamento</h2>
            <p className="text-[11px] text-muted">Acompanhe seu progresso</p>
          </div>
        </div>
        
        <div className="space-y-3">
          <div className="bg-surface-2 p-3 rounded-2xl flex flex-col gap-2 border" style={{ borderColor: "var(--flat-border)" }}>
            <div className="flex justify-between text-sm font-semibold">
              <span>Inglês Avançado</span>
              <span className="text-muted text-xs">65%</span>
            </div>
            <div className="h-1.5 rounded-full bg-ink/10 overflow-hidden">
              <div className="h-full bg-ink rounded-full w-[65%]" />
            </div>
          </div>
          <div className="bg-surface-2 p-3 rounded-2xl flex flex-col gap-2 border" style={{ borderColor: "var(--flat-border)" }}>
            <div className="flex justify-between text-sm font-semibold">
              <span>Programação Funcional</span>
              <span className="text-muted text-xs">20%</span>
            </div>
            <div className="h-1.5 rounded-full bg-ink/10 overflow-hidden">
              <div className="h-full bg-ink rounded-full w-[20%]" />
            </div>
          </div>
        </div>
      </div>

      {/* Revisão Espaçada */}
      <div className="glass rounded-3xl p-5 border" style={{ borderColor: "var(--flat-border)" }}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-success/20 text-success flex items-center justify-center">
            <BrainCircuit size={20} />
          </div>
          <div>
            <h2 className="font-bold text-base">Revisão Espaçada</h2>
            <p className="text-[11px] text-muted">Flashcards pendentes para hoje</p>
          </div>
        </div>
        
        <div className="h-[120px] bg-surface-2 rounded-2xl flex flex-col items-center justify-center gap-2 border border-dashed" style={{ borderColor: "var(--flat-border)" }}>
          <p className="text-sm font-medium text-muted">Nenhum card para revisar hoje!</p>
          <button className="px-4 py-2 bg-white rounded-xl text-xs font-bold text-ink hover:bg-surface-2 transition">
            Adicionar Baralho
          </button>
        </div>
      </div>

      {/* Calendário de Provas */}
      <div className="glass rounded-3xl p-5 border md:col-span-2" style={{ borderColor: "var(--flat-border)" }}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-info/20 text-info flex items-center justify-center">
            <CalendarDays size={20} />
          </div>
          <div>
            <h2 className="font-bold text-base">Cronograma de Entregas</h2>
            <p className="text-[11px] text-muted">Provas e trabalhos futuros</p>
          </div>
        </div>
        
        <div className="overflow-x-auto pb-2">
          <div className="flex gap-3 min-w-max">
            <div className="w-[180px] bg-surface-2 p-3 rounded-2xl border" style={{ borderColor: "var(--flat-border)" }}>
              <p className="text-[10px] text-danger font-bold uppercase tracking-wider mb-1">Amanhã</p>
              <p className="text-sm font-bold leading-tight mb-1">Entrega TCC 1</p>
              <p className="text-[11px] text-muted">Pós-graduação</p>
            </div>
            <div className="w-[180px] bg-surface-2 p-3 rounded-2xl border" style={{ borderColor: "var(--flat-border)" }}>
              <p className="text-[10px] text-warning font-bold uppercase tracking-wider mb-1">Dia 15</p>
              <p className="text-sm font-bold leading-tight mb-1">Prova de Speaking</p>
              <p className="text-[11px] text-muted">Inglês</p>
            </div>
            <div className="w-[180px] bg-surface-2 border border-dashed border-ink/20 flex items-center justify-center rounded-2xl hover:bg-surface-2 cursor-pointer transition">
              <span className="text-xs font-bold text-muted">Adicionar +</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function BibliotecaTab() {
  const items = useStudiesStore((s) => s.items).filter(i => i.type === "book");
  const addItem = useStudiesStore((s) => s.addItem);
  const updateItem = useStudiesStore((s) => s.updateItem);
  const deleteItem = useStudiesStore((s) => s.deleteItem);

  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [status, setStatus] = useState<"to_do" | "doing" | "done">("to_do");
  const [total, setTotal] = useState(0);
  const [current, setCurrent] = useState(0);

  function openNew() {
    setEditingId(null);
    setTitle("");
    setAuthor("");
    setStatus("to_do");
    setTotal(0);
    setCurrent(0);
    setEditorOpen(true);
  }

  function openEdit(id: string) {
    const it = items.find(i => i.id === id);
    if (!it) return;
    setEditingId(id);
    setTitle(it.title);
    setAuthor(it.authorOrProvider || "");
    setStatus(it.status);
    setTotal(it.totalProgress);
    setCurrent(it.currentProgress);
    setEditorOpen(true);
  }

  function handleSave() {
    if (!title) return;
    if (editingId) {
      updateItem(editingId, {
        title,
        authorOrProvider: author,
        status,
        totalProgress: total,
        currentProgress: current
      });
    } else {
      addItem({
        type: "book",
        title,
        authorOrProvider: author,
        status,
        totalProgress: total,
        currentProgress: current
      });
    }
    setEditorOpen(false);
  }

  const todo = items.filter(i => i.status === "to_do");
  const doing = items.filter(i => i.status === "doing");
  const done = items.filter(i => i.status === "done");

  const Section = ({ title, data, showProgress }: { title: string, data: typeof items, showProgress?: boolean }) => {
    if (data.length === 0) return null;
    return (
      <div className="mb-6">
        <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
          {title} <span className="bg-ink/10 text-ink/70 px-2 py-0.5 rounded-full text-[10px]">{data.length}</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {data.map((book) => (
            <div key={book.id} className="p-3 bg-surface-2 rounded-2xl group relative border border-ink/5">
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                <button onClick={() => openEdit(book.id)} className="p-1.5 bg-white rounded-lg hover:text-ink text-muted shadow-sm">
                  <Pencil size={12} />
                </button>
                <button onClick={() => deleteItem(book.id)} className="p-1.5 bg-white rounded-lg hover:text-danger text-muted shadow-sm">
                  <X size={12} />
                </button>
              </div>

              <div className="w-10 h-10 rounded-xl bg-surface mb-3 grid place-items-center text-muted border border-ink/5 shadow-sm">
                <BookOpen size={16} />
              </div>
              <h4 className="font-bold text-sm leading-tight pr-12">{book.title}</h4>
              {book.authorOrProvider && <p className="text-[11px] text-muted mt-0.5">{book.authorOrProvider}</p>}
              
              {showProgress && book.totalProgress > 0 && (
                <div className="mt-3">
                  <div className="flex justify-between text-[10px] font-semibold text-muted mb-1">
                    <span>{book.currentProgress} / {book.totalProgress} pág</span>
                    <span>{Math.round((book.currentProgress / book.totalProgress) * 100)}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-ink/10 overflow-hidden">
                    <div className="h-full bg-ink rounded-full transition-all" style={{ width: `${Math.min(100, (book.currentProgress / book.totalProgress) * 100)}%` }} />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-3xl p-5 border" style={{ borderColor: "var(--flat-border)" }}>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="font-bold text-lg">Biblioteca</h2>
          <p className="text-xs text-muted">Controle de leitura de livros</p>
        </div>
        <Button onClick={openNew}>
          <Plus size={14} /> Novo Livro
        </Button>
      </div>

      {items.length === 0 ? (
        <div className="py-12 text-center">
          <BookOpen size={32} className="mx-auto text-ink/20 mb-3" />
          <p className="text-sm font-semibold text-muted">Sua biblioteca está vazia</p>
          <p className="text-xs text-ink/40 mt-1">Adicione o primeiro livro que deseja ler.</p>
        </div>
      ) : (
        <>
          <Section title="Lendo Agora" data={doing} showProgress />
          <Section title="Para Ler" data={todo} />
          <Section title="Concluídos" data={done} />
        </>
      )}

      <Dialog open={editorOpen} onOpenChange={(v) => !v && setEditorOpen(false)}>
        <DialogContent size="sm">
          <div className="p-6">
            <DialogTitle>{editingId ? "Editar Livro" : "Adicionar Livro"}</DialogTitle>
            <div className="space-y-4 mt-4">
              <div>
                <label className="text-[10px] uppercase tracking-wider font-semibold text-muted block mb-1">Título</label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Hábitos Atômicos" />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider font-semibold text-muted block mb-1">Autor</label>
                <Input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="Ex: James Clear" />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider font-semibold text-muted block mb-1">Status</label>
                <select 
                  className="w-full bg-surface-2 border border-ink/5 rounded-xl px-3 py-2 text-sm outline-none"
                  value={status} onChange={(e) => setStatus(e.target.value as any)}
                >
                  <option value="to_do">Para Ler</option>
                  <option value="doing">Lendo</option>
                  <option value="done">Concluído</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase tracking-wider font-semibold text-muted block mb-1">Página Atual</label>
                  <Input type="number" min="0" value={current} onChange={(e) => setCurrent(parseInt(e.target.value) || 0)} />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider font-semibold text-muted block mb-1">Total de Páginas</label>
                  <Input type="number" min="0" value={total} onChange={(e) => setTotal(parseInt(e.target.value) || 0)} />
                </div>
              </div>
              
              <div className="flex gap-2 pt-2">
                <DialogClose asChild><Button variant="light" className="flex-1">Cancelar</Button></DialogClose>
                <Button variant="primary" className="flex-1" onClick={handleSave}>Salvar</Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function EstudosPage() {
  const [tab, setTab] = useState<Tab>("estudos");

  const tabs: { id: Tab; label: string; Icon: React.FC<{ size?: number }> }[] = [
    { id: "estudos", label: "Estudos", Icon: GraduationCap },
    { id: "biblioteca", label: "Biblioteca", Icon: Library },
  ];

  return (
    <AppShell>
      <Topbar title="Estudos" subtitle="Gerenciamento de aprendizado e revisões" variant="full" />
      
      <div className="flex gap-1 mb-4 bg-white rounded-full p-1.5 w-fit shadow-sm mt-2">
        {tabs.map(({ id, label, Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={cn("flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold transition",
              tab === id ? "bg-ink text-surface" : "text-muted hover:text-ink")}
          >
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {tab === "estudos" && <EstudosTab />}
      {tab === "biblioteca" && <BibliotecaTab />}
    </AppShell>
  );
}
