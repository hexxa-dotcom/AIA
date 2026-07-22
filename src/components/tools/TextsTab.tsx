"use client";
import { useState } from "react";
import { Plus, Edit3, Trash2, Calendar } from "lucide-react";
import { useTextsStore } from "@/store/useTextsStore";
import { TextEditorModal } from "./TextEditorModal";

export function TextsTab() {
  const texts = useTextsStore((s) => s.texts);
  const removeText = useTextsStore((s) => s.removeText);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  const handleOpenEditor = (id: string | null = null) => {
    setEditingId(id);
    setIsEditorOpen(true);
  };

  const handleCloseEditor = () => {
    setIsEditorOpen(false);
    setEditingId(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="font-bold text-sm text-ink">Meus Textos</h2>
        <button
          onClick={() => handleOpenEditor(null)}
          className="flex items-center gap-1.5 px-4 py-2 bg-ink text-surface rounded-full text-xs font-bold hover:opacity-90"
        >
          <Plus size={14} /> Novo Texto
        </button>
      </div>

      {texts.length === 0 ? (
        <div className="text-center py-12 px-4 border border-dashed border-ink/10 rounded-2xl">
          <p className="text-sm font-semibold text-ink mb-1">Nenhum texto ainda</p>
          <p className="text-xs text-muted">Crie um novo texto para começar a escrever com a IA.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {texts.map((t) => (
            <div
              key={t.id}
              className="p-4 bg-white border border-flat rounded-2xl flex flex-col hover:shadow-md transition cursor-pointer group"
              onClick={() => handleOpenEditor(t.id)}
            >
              <h3 className="font-bold text-sm text-ink line-clamp-1 mb-2">
                {t.title || "Sem Título"}
              </h3>
              <p className="text-xs text-muted line-clamp-3 mb-4 flex-1">
                {/* Strip HTML simple approach */}
                {t.content.replace(/<[^>]*>?/gm, '') || "Nenhum conteúdo..."}
              </p>
              <div className="flex justify-between items-center pt-3 border-t border-flat">
                <span className="text-[10px] text-muted font-medium flex items-center gap-1">
                  <Calendar size={12} />
                  {new Date(t.updatedAt).toLocaleDateString()}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm("Excluir este texto?")) removeText(t.id);
                  }}
                  className="p-1.5 text-muted hover:text-danger hover:bg-danger/10 rounded-lg transition opacity-0 group-hover:opacity-100"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {isEditorOpen && <TextEditorModal id={editingId} onClose={handleCloseEditor} />}
    </div>
  );
}
