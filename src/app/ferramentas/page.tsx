"use client";
import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Topbar } from "@/components/layout/Topbar";
import { ToolsList } from "@/components/tools/ToolsList";
import { ToolsEditor } from "@/components/tools/ToolsEditor";
import { Button } from "@/components/ui/Button";
import { Plus, Link2, FileText, FolderOpen, StickyNote } from "lucide-react";
import { cn } from "@/lib/utils";
import { NotesTabContent } from "@/app/notas/page";

type Tab = "links" | "arquivos" | "documentos" | "notas";

function DrivePlaceholder({ title, description }: { title: string, description: string }) {
  return (
    <div className="bg-white rounded-3xl p-8 text-center space-y-4">
      <div className="w-14 h-14 rounded-2xl bg-ink/5 grid place-items-center mx-auto">
        <FolderOpen size={24} className="text-ink/40" />
      </div>
      <div>
        <p className="font-bold text-base text-ink">{title}</p>
        <p className="text-xs text-muted mt-1.5 leading-relaxed max-w-xs mx-auto">
          {description}
        </p>
      </div>
      <button
        disabled
        className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-ink/5 text-ink/40 text-sm font-bold cursor-not-allowed"
      >
        Em breve: Integração com Google Drive
      </button>
    </div>
  );
}

export default function DocsPage() {
  const [tab, setTab] = useState<Tab>("links");
  const [editing, setEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const tabs: { id: Tab; label: string; Icon: React.FC<{ size?: number }> }[] = [
    { id: "links", label: "Links", Icon: Link2 },
    { id: "arquivos", label: "Arquivos", Icon: FolderOpen },
    { id: "documentos", label: "Documentos", Icon: FileText },
    { id: "notas", label: "Notas", Icon: StickyNote },
  ];

  return (
    <AppShell>
      <Topbar title="Docs" subtitle="Links, arquivos, documentos e notas rápidas do sistema" />

      <div className="flex gap-1 mb-4 bg-white rounded-full p-1.5 w-fit">
        {tabs.map(({ id, label, Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={cn("flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold transition",
              tab === id ? "bg-ink text-surface" : "text-muted hover:text-ink")}>
            <Icon size={12} /> {label}
          </button>
        ))}
      </div>

      {tab === "links" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="font-bold text-sm text-ink">Links Salvos</h2>
            <Button onClick={() => { setEditingId(null); setEditing(true); }} size="sm">
              <Plus size={14} /> Adicionar
            </Button>
          </div>
          <ToolsList onEdit={(id) => { setEditingId(id); setEditing(true); }} />
          {editing && <ToolsEditor id={editingId} onClose={() => { setEditing(false); setEditingId(null); }} />}
        </div>
      )}

      {tab === "arquivos" && (
        <DrivePlaceholder 
          title="Meus Arquivos" 
          description="Aqui você poderá visualizar e gerenciar todos os seus arquivos sincronizados diretamente com o seu Google Drive." 
        />
      )}

      {tab === "documentos" && (
        <DrivePlaceholder 
          title="Meus Documentos" 
          description="Acesse facilmente suas planilhas, apresentações e textos do Google Docs integrados no AIA OS." 
        />
      )}

      {tab === "notas" && (
        <div className="animate-fadeIn mt-2">
          <NotesTabContent />
        </div>
      )}
    </AppShell>
  );
}
