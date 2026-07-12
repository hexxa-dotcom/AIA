"use client";
import { useState, useMemo } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Topbar } from "@/components/layout/Topbar";
import { Button } from "@/components/ui/Button";
import { 
  Plus, Trash2, ExternalLink, Bookmark, Layers, 
  Music, Video, FileText, Globe, Clipboard
} from "lucide-react";
import { useSpaceStore, type SpaceLink, type SpaceEmbed } from "@/store/useSpaceStore";
import { usePerfilStore } from "@/store/usePerfilStore";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

function toEmbedUrl(url: string, type: SpaceEmbed["type"]): string {
  let clean = url.trim();
  if (type === "youtube") {
    const reg = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/;
    const match = clean.match(reg);
    if (match && match[1]) {
      return `https://www.youtube.com/embed/${match[1]}`;
    }
  }
  if (type === "spotify") {
    if (clean.includes("spotify.com") && !clean.includes("/embed")) {
      return clean.replace("spotify.com/", "spotify.com/embed/");
    }
  }
  return clean;
}

export default function SpacePage() {
  const { links: allLinks, embeds: allEmbeds, addLink, removeLink, addEmbed, removeEmbed } = useSpaceStore();
  const activePerfil = usePerfilStore((s) => s.perfil);

  // Filtra links e embeds de acordo com o escopo/perfil ativo (Workspace vs Lifespace)
  const links = useMemo(() => {
    return allLinks.filter((l) => (l.scope || "pessoal") === activePerfil);
  }, [allLinks, activePerfil]);

  const embeds = useMemo(() => {
    return allEmbeds.filter((e) => (e.scope || "pessoal") === activePerfil);
  }, [allEmbeds, activePerfil]);

  // Tab ou visualização ativa
  const [activeCategory, setActiveCategory] = useState<string>("Tudo");

  // Forms
  const [showAddLink, setShowAddLink] = useState(false);
  const [linkTitle, setLinkTitle] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [linkCategory, setLinkCategory] = useState("Trabalho");
  const [linkNotes, setLinkNotes] = useState("");

  const [showAddEmbed, setShowAddEmbed] = useState(false);
  const [embedTitle, setEmbedTitle] = useState("");
  const [embedUrl, setEmbedUrl] = useState("");
  const [embedType, setEmbedType] = useState<SpaceEmbed["type"]>("spotify");

  const categories = useMemo(() => {
    const cats = new Set<string>();
    links.forEach((l) => cats.add(l.category));
    return ["Tudo", ...Array.from(cats)];
  }, [links]);

  const filteredLinks = useMemo(() => {
    if (activeCategory === "Tudo") return links;
    return links.filter((l) => l.category === activeCategory);
  }, [links, activeCategory]);

  const handleCreateLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkTitle.trim() || !linkUrl.trim()) return;
    
    let formattedUrl = linkUrl.trim();
    if (!/^https?:\/\//i.test(formattedUrl)) {
      formattedUrl = "https://" + formattedUrl;
    }

    addLink(linkTitle.trim(), formattedUrl, linkCategory, activePerfil, linkNotes.trim());
    setLinkTitle("");
    setLinkUrl("");
    setLinkNotes("");
    setShowAddLink(false);
  };

  const handleCreateEmbed = (e: React.FormEvent) => {
    e.preventDefault();
    if (!embedTitle.trim() || !embedUrl.trim()) return;

    let formattedUrl = toEmbedUrl(embedUrl, embedType);
    if (!/^https?:\/\//i.test(formattedUrl)) {
      formattedUrl = "https://" + formattedUrl;
    }

    addEmbed(embedTitle.trim(), formattedUrl, embedType, activePerfil);
    setEmbedTitle("");
    setEmbedUrl("");
    setShowAddEmbed(false);
  };

  const embedIcons = {
    spotify: <Music size={14} className="text-lime" />,
    youtube: <Video size={14} className="text-danger" />,
    notion: <FileText size={14} className="text-ink" />,
    figma: <Layers size={14} className="text-purple-500" />,
    generic: <Globe size={14} className="text-muted" />,
  };

  return (
    <AppShell>
      <Topbar 
        title="AIA Space" 
        subtitle={
          activePerfil === "profissional" 
            ? "Organize seus links corporativos, Figma, Notion e documentações de ferramentas externas do seu Workspace."
            : "Centralize seus links pessoais, playlists do Spotify, hobbies e recursos externos no seu Lifespace."
        }
      />

      <div className="max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-6 pb-12 px-4 md:px-0">
        
        {/* Coluna Esquerda: Links Rápidos (col-span-5) */}
        <div className="lg:col-span-5 flex flex-col gap-5">
          
          <div className="glass rounded-3xl p-5 border border-ink/5 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bookmark size={16} className="text-muted" />
                <h2 className="font-bold text-sm text-ink">Links e Recursos</h2>
              </div>
              <button 
                onClick={() => setShowAddLink(!showAddLink)}
                className="text-xs font-bold text-ink hover:underline flex items-center gap-1"
              >
                <Plus size={14} /> Novo Link
              </button>
            </div>

            {/* Form de adicionar Link */}
            <AnimatePresence>
              {showAddLink && (
                <motion.form 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  onSubmit={handleCreateLink} 
                  className="bg-surface-2 border border-ink/5 p-4 rounded-2xl space-y-3 overflow-hidden text-left"
                >
                  <div>
                    <label className="text-[9px] uppercase font-bold text-muted block mb-1">Título</label>
                    <input
                      type="text"
                      placeholder="Ex: Notion de Finanças"
                      value={linkTitle}
                      onChange={(e) => setLinkTitle(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-ink/5 rounded-xl text-xs outline-none focus:ring-2 focus:ring-ink/10 text-ink"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] uppercase font-bold text-muted block mb-1">URL (Endereço)</label>
                    <input
                      type="text"
                      placeholder="exemplo.com/pagina"
                      value={linkUrl}
                      onChange={(e) => setLinkUrl(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-ink/5 rounded-xl text-xs font-mono outline-none focus:ring-2 focus:ring-ink/10 text-ink"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[9px] uppercase font-bold text-muted block mb-1">Categoria</label>
                      <select
                        value={linkCategory}
                        onChange={(e) => setLinkCategory(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-ink/5 rounded-xl text-xs outline-none focus:ring-2 focus:ring-ink/10 text-ink"
                      >
                        <option value="Trabalho">Trabalho</option>
                        <option value="Estudos">Estudos</option>
                        <option value="Lazer">Lazer</option>
                        <option value="Outros">Outros</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[9px] uppercase font-bold text-muted block mb-1">Nova Categoria</label>
                      <input
                        type="text"
                        placeholder="Outro grupo"
                        onChange={(e) => {
                          if (e.target.value.trim()) setLinkCategory(e.target.value.trim());
                        }}
                        className="w-full px-3 py-1.5 bg-white border border-ink/5 rounded-xl text-xs outline-none focus:ring-2 focus:ring-ink/10 text-ink"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[9px] uppercase font-bold text-muted block mb-1">Observações</label>
                    <input
                      type="text"
                      placeholder="Breve nota sobre o link"
                      value={linkNotes}
                      onChange={(e) => setLinkNotes(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-ink/5 rounded-xl text-xs outline-none focus:ring-2 focus:ring-ink/10 text-ink"
                    />
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Button type="submit" variant="primary" size="sm" className="flex-1" disabled={!linkTitle.trim() || !linkUrl.trim()}>
                      Adicionar
                    </Button>
                    <Button type="button" variant="ghost" size="sm" onClick={() => setShowAddLink(false)}>
                      Cancelar
                    </Button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>

            {/* Categorias Tabs */}
            <div className="flex flex-wrap gap-1 border-b border-ink/5 pb-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={cn(
                    "px-3 py-1 rounded-xl text-[10px] font-bold transition-all",
                    activeCategory === cat 
                      ? "bg-ink text-surface scale-105" 
                      : "bg-surface-2 hover:bg-ink/5 text-muted"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Lista de Links */}
            <div className="flex flex-col gap-2.5 max-h-[420px] overflow-y-auto pr-1">
              {filteredLinks.length === 0 ? (
                <p className="text-xs text-muted text-center py-4">Nenhum link salvo nesta categoria.</p>
              ) : (
                filteredLinks.map((link) => (
                  <div 
                    key={link.id}
                    className="p-3.5 bg-surface-2 border border-ink/5 rounded-2xl flex items-start justify-between gap-3 hover:scale-[1.01] hover:shadow-sm transition-all text-left"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-ink truncate">{link.title}</span>
                        <span className="text-[8px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded bg-ink/5 text-ink/75">
                          {link.category}
                        </span>
                      </div>
                      <p className="text-[10px] text-muted font-mono truncate mt-0.5">{link.url}</p>
                      {link.notes && (
                        <p className="text-[10px] text-ink/65 italic mt-1.5 leading-relaxed bg-white/40 p-1.5 px-2 rounded-xl">
                          {link.notes}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <a 
                        href={link.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg hover:bg-ink/5 text-muted hover:text-ink transition"
                      >
                        <ExternalLink size={13} />
                      </a>
                      <button 
                        onClick={() => removeLink(link.id)}
                        className="p-1.5 rounded-lg hover:bg-danger/10 text-muted hover:text-danger transition"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Coluna Direita: Widgets Embeds Acoplados (col-span-7) */}
        <div className="lg:col-span-7 flex flex-col gap-5">
          
          <div className="glass rounded-3xl p-5 border border-ink/5 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers size={16} className="text-muted" />
                <h2 className="font-bold text-sm text-ink">Mídia & Widgets Integrados</h2>
              </div>
              <button 
                onClick={() => setShowAddEmbed(!showAddEmbed)}
                className="text-xs font-bold text-ink hover:underline flex items-center gap-1"
              >
                <Plus size={14} /> Incorporar Widget
              </button>
            </div>

            {/* Form de adicionar Embed */}
            <AnimatePresence>
              {showAddEmbed && (
                <motion.form 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  onSubmit={handleCreateEmbed} 
                  className="bg-surface-2 border border-ink/5 p-4 rounded-2xl space-y-3 overflow-hidden text-left"
                >
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[9px] uppercase font-bold text-muted block mb-1">Título do Widget</label>
                      <input
                        type="text"
                        placeholder="Ex: Minhas Músicas"
                        value={embedTitle}
                        onChange={(e) => setEmbedTitle(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-ink/5 rounded-xl text-xs outline-none focus:ring-2 focus:ring-ink/10 text-ink"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] uppercase font-bold text-muted block mb-1">Tipo de Widget</label>
                      <select
                        value={embedType}
                        onChange={(e) => setEmbedType(e.target.value as any)}
                        className="w-full px-3 py-1.5 bg-white border border-ink/5 rounded-xl text-xs outline-none focus:ring-2 focus:ring-ink/10 text-ink"
                      >
                        <option value="spotify">Spotify Player</option>
                        <option value="youtube">YouTube Vídeo</option>
                        <option value="notion">Notion Documento</option>
                        <option value="figma">Figma Projeto</option>
                        <option value="generic">Página Web Genérica</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-[9px] uppercase font-bold text-muted block mb-1">Link ou URL de Incorporação</label>
                    <input
                      type="text"
                      placeholder="Cole a URL ou o link do iframe de compartilhamento"
                      value={embedUrl}
                      onChange={(e) => setEmbedUrl(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-ink/5 rounded-xl text-xs outline-none focus:ring-2 focus:ring-ink/10 text-ink"
                    />
                    <p className="text-[8px] text-muted mt-1 leading-relaxed">
                      💡 Copie o link da playlist do Spotify ou vídeo do YouTube e nós convertemos para o formato embed automaticamente.
                    </p>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Button type="submit" variant="primary" size="sm" className="flex-1" disabled={!embedTitle.trim() || !embedUrl.trim()}>
                      Incorporar
                    </Button>
                    <Button type="button" variant="ghost" size="sm" onClick={() => setShowAddEmbed(false)}>
                      Cancelar
                    </Button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>

            {/* Grid de Embeds */}
            <div className="flex flex-col gap-5 max-h-[580px] overflow-y-auto pr-1">
              {embeds.length === 0 ? (
                <div className="text-center py-12 bg-surface-2 border border-ink/5 border-dashed rounded-2xl text-muted text-xs">
                  Nenhum widget incorporado. Adicione Spotify, YouTube ou Notion acima!
                </div>
              ) : (
                embeds.map((emb) => (
                  <div 
                    key={emb.id}
                    className="p-4 bg-surface-2 border border-ink/5 rounded-2xl flex flex-col gap-3 shadow-inner relative text-left"
                  >
                    <div className="flex items-center justify-between border-b border-ink/5 pb-2">
                      <div className="flex items-center gap-2">
                        {embedIcons[emb.type]}
                        <span className="font-bold text-xs text-ink truncate">{emb.title}</span>
                      </div>
                      <button 
                        onClick={() => removeEmbed(emb.id)}
                        className="p-1 rounded hover:bg-danger/10 text-muted hover:text-danger transition shrink-0"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>

                    <div className="w-full overflow-hidden rounded-xl bg-white border border-ink/5 shadow-inner">
                      {emb.type === "spotify" ? (
                        <iframe 
                          src={emb.embedUrl} 
                          width="100%" 
                          height="152" 
                          allowFullScreen={false} 
                          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
                          loading="lazy"
                          className="border-0"
                        />
                      ) : (
                        <iframe 
                          src={emb.embedUrl} 
                          width="100%" 
                          height={emb.type === "youtube" ? "280" : "320"}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                          allowFullScreen
                          loading="lazy"
                          className="border-0"
                        />
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
