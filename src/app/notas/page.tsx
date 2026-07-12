"use client";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Pin, PinOff, StickyNote, CheckSquare, AlignLeft, GripVertical } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Topbar } from "@/components/layout/Topbar";
import { useNotesStore, type QuickNote, type NoteItem, MAX_PINNED } from "@/store/useNotesStore";
import { genId } from "@/lib/id";
import { cn } from "@/lib/utils";
import TextareaAutosize from "react-textarea-autosize";

function NoteCard({ note, pinnedCount }: { note: QuickNote; pinnedCount: number }) {
  const update    = useNotesStore((s) => s.update);
  const remove    = useNotesStore((s) => s.remove);
  const togglePin = useNotesStore((s) => s.togglePin);

  const canPin = note.pinned || pinnedCount < MAX_PINNED;

  function handleItemToggle(itemId: string) {
    const newItems = note.items.map(i => i.id === itemId ? { ...i, checked: !i.checked } : i);
    update(note.id, { items: newItems });
  }

  function handleItemText(itemId: string, val: string) {
    const newItems = note.items.map(i => i.id === itemId ? { ...i, text: val } : i);
    update(note.id, { items: newItems });
  }

  function handleItemAdd() {
    update(note.id, { items: [...note.items, { id: genId(), text: "", checked: false }] });
  }

  function handleItemRemove(itemId: string) {
    update(note.id, { items: note.items.filter(i => i.id !== itemId) });
  }

  return (
    <motion.div
      layout
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1,   opacity: 1 }}
      exit={{    scale: 0.9, opacity: 0 }}
      className="relative flex flex-col group rounded-2xl border bg-white shadow-sm transition-all hover:shadow-md"
      style={{ borderColor: "var(--flat-border)" }}
    >
      {/* ações (visíveis no hover) */}
      <div className="absolute top-2 right-2 flex items-center gap-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => togglePin(note.id)}
          title={note.pinned ? "Desafixar do Feed" : canPin ? "Fixar no Feed" : `Máximo ${MAX_PINNED} fixadas`}
          className="p-1.5 rounded-lg hover:bg-surface-2 transition text-muted hover:text-ink"
        >
          {note.pinned ? <PinOff size={14} /> : <Pin size={14} />}
        </button>
        <button
          onClick={() => remove(note.id)}
          title="Excluir nota"
          className="p-1.5 rounded-lg hover:bg-surface-2 transition text-muted hover:text-danger"
        >
          <X size={15} />
        </button>
      </div>

      <div className="p-4 flex flex-col flex-1">
        {note.pinned && (
          <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-surface-2 text-ink flex items-center justify-center shadow-sm z-0 transition-opacity group-hover:opacity-0" title="Fixada no Feed">
            <Pin size={12} fill="currentColor" />
          </div>
        )}

        <TextareaAutosize
          value={note.title || ""}
          onChange={(e) => update(note.id, { title: e.target.value })}
          placeholder="Título"
          className="w-full resize-none bg-transparent outline-none font-bold text-sm text-ink placeholder:text-muted/60 mb-2"
        />

        {note.type === "text" ? (
          <TextareaAutosize
            value={note.text || ""}
            onChange={(e) => update(note.id, { text: e.target.value })}
            placeholder="Criar uma nota..."
            className="w-full resize-none bg-transparent outline-none text-xs leading-relaxed text-ink/80 placeholder:text-muted/60"
            minRows={2}
          />
        ) : (
          <div className="flex flex-col gap-1.5 mt-1">
            {note.items.map((item, i) => (
              <div key={item.id} className="flex items-start gap-2 group/item">
                <button
                  onClick={() => handleItemToggle(item.id)}
                  className="mt-0.5 shrink-0 w-4 h-4 rounded-[4px] border border-ink/20 flex items-center justify-center hover:border-ink/50 transition-colors"
                >
                  {item.checked && <CheckSquare size={14} className="text-ink" />}
                </button>
                <TextareaAutosize
                  value={item.text}
                  onChange={(e) => handleItemText(item.id, e.target.value)}
                  placeholder="Item da lista"
                  className={cn(
                    "w-full resize-none bg-transparent outline-none text-xs leading-relaxed transition-all",
                    item.checked ? "text-muted line-through" : "text-ink/80"
                  )}
                />
                <button
                  onClick={() => handleItemRemove(item.id)}
                  className="opacity-0 group-hover/item:opacity-100 p-0.5 text-muted hover:text-danger transition"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
            <button
              onClick={handleItemAdd}
              className="flex items-center gap-2 mt-1 text-xs text-muted hover:text-ink font-medium transition"
            >
              <Plus size={14} /> Adicionar item
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// O Criador de Notas rápido (Estilo Keep)
function QuickNoteCreator() {
  const add = useNotesStore((s) => s.add);
  const update = useNotesStore((s) => s.update);

  const [expanded, setExpanded] = useState(false);
  const [type, setType] = useState<"text" | "list">("text");
  
  // States temporários para a nota antes de ser salva (se tiver conteúdo)
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [items, setItems] = useState<NoteItem[]>([{ id: genId(), text: "", checked: false }]);
  
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        closeAndSave();
      }
    }
    if (expanded) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [expanded, title, text, items, type]);

  function closeAndSave() {
    const hasContent = title.trim() || text.trim() || (type === "list" && items.some(i => i.text.trim()));
    
    if (hasContent) {
      const id = add(type);
      update(id, {
        title: title.trim(),
        text: type === "text" ? text.trim() : "",
        items: type === "list" ? items.filter(i => i.text.trim()) : []
      });
    }

    setExpanded(false);
    setTitle("");
    setText("");
    setItems([{ id: genId(), text: "", checked: false }]);
    setType("text");
  }

  function handleItemText(id: string, val: string) {
    setItems(items.map(i => i.id === id ? { ...i, text: val } : i));
  }

  function handleItemToggle(id: string) {
    setItems(items.map(i => i.id === id ? { ...i, checked: !i.checked } : i));
  }

  function handleItemRemove(id: string) {
    setItems(items.filter(i => i.id !== id));
  }

  function handleItemAdd() {
    setItems([...items, { id: genId(), text: "", checked: false }]);
  }

  return (
    <div ref={containerRef} className="max-w-2xl mx-auto mb-8 relative z-30">
      <div 
        className={cn(
          "bg-white rounded-3xl border shadow-sm transition-all duration-300 overflow-hidden",
          expanded ? "shadow-lg" : "hover:shadow-md cursor-text"
        )}
        style={{ borderColor: "var(--flat-border)" }}
        onClick={() => !expanded && setExpanded(true)}
      >
        {expanded && (
          <div className="px-5 pt-4 pb-2">
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Título"
              className="w-full bg-transparent outline-none font-bold text-sm text-ink placeholder:text-muted"
            />
          </div>
        )}

        <div className={cn("px-5", expanded ? "pb-2" : "py-3")}>
          {!expanded && (
            <div className="flex items-center justify-between text-muted font-medium text-sm">
              <span>Criar uma nota...</span>
              <div className="flex gap-2">
                <button onClick={(e) => { e.stopPropagation(); setType("list"); setExpanded(true); }} className="p-1.5 hover:bg-surface-2 rounded-lg transition" title="Nova lista">
                  <CheckSquare size={18} />
                </button>
              </div>
            </div>
          )}

          {expanded && type === "text" && (
            <TextareaAutosize
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Criar uma nota..."
              className="w-full resize-none bg-transparent outline-none text-sm text-ink/80 placeholder:text-muted/60"
              minRows={2}
            />
          )}

          {expanded && type === "list" && (
            <div className="flex flex-col gap-2">
              {items.map((item, i) => (
                <div key={item.id} className="flex items-center gap-3 group/item">
                  <button
                    onClick={() => handleItemToggle(item.id)}
                    className="shrink-0 w-4 h-4 rounded-[4px] border border-ink/20 flex items-center justify-center hover:border-ink/50 transition-colors"
                  >
                    {item.checked && <CheckSquare size={14} className="text-ink" />}
                  </button>
                  <input
                    value={item.text}
                    onChange={(e) => handleItemText(item.id, e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleItemAdd(); }}
                    placeholder="Item da lista"
                    className={cn(
                      "w-full bg-transparent outline-none text-sm transition-all",
                      item.checked ? "text-muted line-through" : "text-ink/80"
                    )}
                  />
                  <button
                    onClick={() => handleItemRemove(item.id)}
                    className="opacity-0 group-hover/item:opacity-100 p-1 text-muted hover:text-danger transition"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
              <button
                onClick={handleItemAdd}
                className="flex items-center gap-2 mt-1 text-sm text-muted hover:text-ink font-medium transition w-fit"
              >
                <Plus size={16} /> Adicionar item
              </button>
            </div>
          )}
        </div>

        {expanded && (
          <div className="flex items-center justify-between px-3 py-2 bg-surface-2/30 border-t" style={{ borderColor: "var(--flat-border)" }}>
            <div className="flex gap-1">
              <button 
                onClick={() => setType(type === "text" ? "list" : "text")}
                className="p-2 rounded-xl text-muted hover:text-ink hover:bg-surface-2 transition flex items-center gap-2 text-xs font-semibold"
              >
                {type === "text" ? <CheckSquare size={14} /> : <AlignLeft size={14} />}
                {type === "text" ? "Transformar em Lista" : "Transformar em Texto"}
              </button>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => setExpanded(false)}
                className="px-4 py-1.5 rounded-xl text-muted text-xs font-semibold hover:bg-white transition"
              >
                Cancelar
              </button>
              <button 
                onClick={closeAndSave}
                className="px-4 py-1.5 rounded-xl bg-ink text-surface text-xs font-semibold hover:opacity-90 transition"
              >
                Adicionar nota
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function NotesTabContent() {
  const notes       = useNotesStore((s) => s.notes);
  const pinnedCount = notes.filter((n) => n.pinned).length;
  const [filter, setFilter] = useState<"todas" | "fixadas">("todas");

  const shown = filter === "fixadas" ? notes.filter((n) => n.pinned) : notes;

  return (
    <div className="max-w-[1200px] mx-auto w-full">
      {/* Tabs de Filtro Padrão do Sistema */}
      <div className="flex gap-1 mb-6 bg-white rounded-full p-1 w-fit border shadow-sm" style={{ borderColor: "var(--flat-border)" }}>
        {(["todas", "fixadas"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold transition",
              filter === f ? "bg-ink text-surface shadow-sm" : "text-muted hover:text-ink hover:bg-surface-2"
            )}
          >
            {f === "todas" ? "Todas as notas" : "Fixadas no Feed"}
          </button>
        ))}
      </div>

      {/* Input Rápido estilo Keep */}
      <QuickNoteCreator />

      {/* Grid / Masonry de Notas */}
      {shown.length === 0 ? (
        <div
          className="rounded-3xl p-12 text-center mt-8 border border-dashed"
          style={{ borderColor: "var(--flat-border)" }}
        >
          <StickyNote size={36} className="mx-auto mb-3 text-muted/30" />
          <p className="text-sm font-semibold text-muted">
            {filter === "fixadas" ? "Nenhuma nota fixada no Feed." : "Suas notas aparecerão aqui."}
          </p>
        </div>
      ) : (
        <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
          <AnimatePresence>
            {shown.map((note) => (
              <div key={note.id} className="break-inside-avoid">
                <NoteCard note={note} pinnedCount={pinnedCount} />
              </div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

export default function NotasPage() {
  const notes       = useNotesStore((s) => s.notes);
  const pinnedCount = notes.filter((n) => n.pinned).length;

  return (
    <AppShell>
      <Topbar 
        title="Notas Rápidas" 
        subtitle={`${notes.length} nota${notes.length !== 1 ? "s" : ""} · ${pinnedCount}/${MAX_PINNED} fixadas`}
      />
      <NotesTabContent />
    </AppShell>
  );
}
