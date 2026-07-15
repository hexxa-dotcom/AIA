"use client";
import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { motion } from "framer-motion";
import { useToolsStore } from "@/store/useToolsStore";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

interface Props {
  id: string | null;
  onClose: () => void;
}

export function ToolsEditor({ id, onClose }: Props) {
  const tools = useToolsStore((s) => s.tools);
  const add = useToolsStore((s) => s.add);
  const update = useToolsStore((s) => s.update);

  const tool = id ? tools.find((t) => t.id === id) : null;

  const [name, setName] = useState(tool?.name ?? "");
  const [url, setUrl] = useState(tool?.url ?? "");
  const [description, setDescription] = useState(tool?.description ?? "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (tool) {
      setName(tool.name);
      setUrl(tool.url);
      setDescription(tool.description ?? "");
    }
  }, [tool]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !url.trim()) return;

    setSaving(true);
    try {
      if (id) {
        update(id, name.trim(), url.trim(), description.trim() || undefined);
      } else {
        add(name.trim(), url.trim(), description.trim() || undefined);
      }
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/40 grid place-items-center z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl p-6 w-full max-w-md"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-ink">
            {id ? "Editar" : "Adicionar"} Ferramenta
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-surface-2 rounded-lg"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-ink mb-1 block">
              Nome
            </label>
            <Input
              type="text"
              placeholder="ex: GitHub"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-ink mb-1 block">
              URL
            </label>
            <Input
              type="url"
              placeholder="https://..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-ink mb-1 block">
              Descrição (Opcional)
            </label>
            <Input
              type="text"
              placeholder="Sobre o que é este link?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={saving} className="flex-1">
              {id ? "Atualizar" : "Adicionar"}
            </Button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
