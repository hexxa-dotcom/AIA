"use client";
import { useEffect } from "react";
import { ExternalLink, Edit2, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToolsStore } from "@/store/useToolsStore";
import { cn } from "@/lib/utils";

interface Props {
  onEdit: (id: string) => void;
}

export function ToolsList({ onEdit }: Props) {
  const tools = useToolsStore((s) => s.tools);
  const remove = useToolsStore((s) => s.remove);
  const hydrated = useToolsStore((s) => s.hydrated);

  if (!hydrated) return null;

  if (tools.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-8 text-center">
        <p className="text-muted text-sm mb-2">Nenhuma ferramenta adicionada</p>
        <p className="text-muted text-xs">Comece adicionando seus links favoritos</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      <AnimatePresence>
        {tools.map((tool) => (
          <motion.a
            key={tool.id}
            href={tool.url}
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-2xl p-4 hover:shadow-lg transition group"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {tool.icon && (
                  <span className="text-lg shrink-0">{tool.icon}</span>
                )}
                <h3 className="font-bold text-sm text-ink truncate group-hover:text-lime transition">
                  {tool.name}
                </h3>
              </div>
              <ExternalLink size={12} className="text-muted group-hover:text-lime opacity-0 group-hover:opacity-100 transition shrink-0 ml-2" />
            </div>

            <p className="text-xs text-muted truncate mb-3">{tool.url}</p>

            <div className="flex gap-2">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  onEdit(tool.id);
                }}
                className="flex-1 p-2 text-xs rounded-lg hover:bg-surface-2 transition flex items-center justify-center gap-1"
              >
                <Edit2 size={12} />
                Editar
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  remove(tool.id);
                }}
                className="flex-1 p-2 text-xs rounded-lg hover:bg-ink/8 text-muted hover:text-ink transition flex items-center justify-center gap-1"
              >
                <Trash2 size={12} />
                Deletar
              </button>
            </div>
          </motion.a>
        ))}
      </AnimatePresence>
    </div>
  );
}
