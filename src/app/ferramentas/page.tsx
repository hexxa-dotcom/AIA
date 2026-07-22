"use client";
import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Topbar } from "@/components/layout/Topbar";
import { TextsTab } from "@/components/tools/TextsTab";
import { Button } from "@/components/ui/Button";
import { Plus, FileText, FolderOpen, StickyNote, FileEdit } from "lucide-react";
import { cn } from "@/lib/utils";
import { NotesTabContent } from "@/app/notas/page";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { DriveExplorer } from "@/components/tools/DriveExplorer";

type Tab = "textos" | "arquivos" | "documentos" | "notas";

const CLIENT_ID = "769838139065-v9qfodfu6aaipb8ghk32oppsicd27jtn.apps.googleusercontent.com";

export default function DocsPage() {
  const [tab, setTab] = useState<Tab>("textos");
  const [editing, setEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const tabs: { id: Tab; label: string; Icon: React.FC<{ size?: number }> }[] = [
    { id: "textos", label: "Textos", Icon: FileEdit },
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


      {tab === "textos" && (
        <TextsTab />
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
