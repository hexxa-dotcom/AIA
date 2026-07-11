"use client";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, PinOff, StickyNote, ArrowRight, ChevronDown, CheckSquare } from "lucide-react";
import Link from "next/link";
import { useNotesStore, type QuickNote, MAX_PINNED } from "@/store/useNotesStore";
import { useCollapse } from "@/hooks/useCollapse";
import { cn } from "@/lib/utils";
import TextareaAutosize from "react-textarea-autosize";

export function FeedQuickNotes() {
  const notes = useNotesStore((s) => s.notes);
  const add = useNotesStore((s) => s.add);
  const update = useNotesStore((s) => s.update);
  const remove = useNotesStore((s) => s.remove);
  const togglePin = useNotesStore((s) => s.togglePin);

  const pinnedNotes = notes.filter((n) => n.pinned);

  // Usa o hook de colapso para essa seção ("feed-quicknotes")
  const { collapsed: isCollapsed, toggle: toggleCollapse } = useCollapse("feed-quicknotes");

  function handleItemToggle(noteId: string, itemId: string) {
    const note = notes.find(n => n.id === noteId);
    if (!note) return;
    const newItems = note.items.map(i => i.id === itemId ? { ...i, checked: !i.checked } : i);
    update(note.id, { items: newItems });
  }

  function handleItemText(noteId: string, itemId: string, val: string) {
    const note = notes.find(n => n.id === noteId);
    if (!note) return;
    const newItems = note.items.map(i => i.id === itemId ? { ...i, text: val } : i);
    update(note.id, { items: newItems });
  }

  return (
    <div className="bg-white rounded-3xl p-5 shadow-sm border border-flat-border">
      {/* Header colapsável */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={toggleCollapse}
          className="flex items-center gap-2 group hover:opacity-80 transition"
        >
          <div className="w-8 h-8 rounded-xl bg-ink grid place-items-center">
            <StickyNote size={14} className="text-lime" />
          </div>
          <div className="text-left">
            <h2 className="font-bold text-sm text-ink flex items-center gap-1.5">
              Notas Rápidas
              <ChevronDown
                size={14}
                className={`text-muted transition-transform duration-300 ${isCollapsed ? "rotate-180" : ""}`}
              />
            </h2>
            <p className="text-[10px] text-muted">
              {pinnedNotes.length} fixada{pinnedNotes.length !== 1 ? "s" : ""}
            </p>
          </div>
        </button>

        <div className="flex items-center gap-1.5">
          <Link
            href="/notas"
            className="w-8 h-8 rounded-xl bg-surface-2 grid place-items-center text-muted hover:bg-ink hover:text-surface transition"
            title="Adicionar nota"
          >
            <Plus size={14} />
          </Link>
          <Link
            href="/notas"
            className="w-8 h-8 rounded-xl bg-surface-2 grid place-items-center text-muted hover:bg-ink hover:text-surface transition"
            title="Ver todas as notas"
          >
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {!isCollapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            {pinnedNotes.length === 0 ? (
              <div className="bg-surface-2/50 rounded-2xl p-6 text-center border border-dashed border-ink/10">
                <p className="text-xs text-muted mb-2 font-medium">Nenhuma nota fixada</p>
                <Link
                  href="/notas"
                  className="text-[11px] font-bold text-ink underline underline-offset-2 hover:opacity-70 transition"
                >
                  Ir para Notas
                </Link>
              </div>
            ) : (
              <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))" }}>
                <AnimatePresence>
                  {pinnedNotes.map((note) => (
                    <motion.div
                      key={note.id}
                      layout
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.9, opacity: 0 }}
                      className="relative flex flex-col group rounded-2xl border bg-white shadow-sm transition-all hover:shadow-md h-[180px]"
                      style={{ borderColor: "var(--flat-border)" }}
                    >
                      <div className="absolute top-1.5 right-1.5 flex items-center gap-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 rounded-md p-0.5 backdrop-blur-sm">
                        <button
                          onClick={() => togglePin(note.id)}
                          title="Desafixar do Feed"
                          className="p-1 rounded hover:bg-surface-2 text-muted hover:text-ink transition"
                        >
                          <PinOff size={11} />
                        </button>
                        <button
                          onClick={() => remove(note.id)}
                          title="Excluir nota"
                          className="p-1 rounded hover:bg-surface-2 text-muted hover:text-danger transition"
                        >
                          <X size={11} />
                        </button>
                      </div>

                      <div className="flex-1 p-3 overflow-y-auto custom-scrollbar">
                        <TextareaAutosize
                          value={note.title || ""}
                          onChange={(e) => update(note.id, { title: e.target.value })}
                          placeholder="Título"
                          className="w-full resize-none bg-transparent outline-none font-bold text-xs text-ink placeholder:text-muted/60 mb-1.5"
                        />

                        {note.type === "text" ? (
                          <TextareaAutosize
                            value={note.text || ""}
                            onChange={(e) => update(note.id, { text: e.target.value })}
                            placeholder="Nota..."
                            className="w-full resize-none bg-transparent outline-none text-[11px] leading-relaxed text-ink/80 placeholder:text-muted/60"
                          />
                        ) : (
                          <div className="flex flex-col gap-1 mt-1">
                            {note.items.map((item) => (
                              <div key={item.id} className="flex items-start gap-1.5">
                                <button
                                  onClick={() => handleItemToggle(note.id, item.id)}
                                  className="mt-[3px] shrink-0 w-3 h-3 rounded-[3px] border border-ink/20 flex items-center justify-center hover:border-ink/50 transition-colors"
                                >
                                  {item.checked && <CheckSquare size={10} className="text-ink" />}
                                </button>
                                <TextareaAutosize
                                  value={item.text}
                                  onChange={(e) => handleItemText(note.id, item.id, e.target.value)}
                                  className={cn(
                                    "w-full resize-none bg-transparent outline-none text-[11px] leading-snug transition-all",
                                    item.checked ? "text-muted line-through" : "text-ink/80"
                                  )}
                                />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
