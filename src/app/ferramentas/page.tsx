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
import { GoogleOAuthProvider } from "@react-oauth/google";
import { DriveExplorer } from "@/components/tools/DriveExplorer";

type Tab = "links" | "arquivos" | "documentos" | "notas";

const CLIENT_ID = "769838139065-v9qfodfu6aaipb8ghk32oppsicd27jtn.apps.googleusercontent.com";

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
    <GoogleOAuthProvider clientId={CLIENT_ID}>
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
        <DriveExplorer />
      )}

      {tab === "documentos" && (
        <DriveExplorer />
      )}

      {tab === "notas" && (
        <div className="animate-fadeIn mt-2">
          <NotesTabContent />
        </div>
      )}
      </AppShell>
    </GoogleOAuthProvider>
  );
}
