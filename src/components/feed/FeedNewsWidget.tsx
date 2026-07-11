"use client";
import { useState, useEffect } from "react";
import { Newspaper, ChevronRight, Loader2, Edit3, Check, Globe } from "lucide-react";
import { useNewsStore } from "@/store/useNewsStore";

interface NewsItem {
  title: string;
  link: string;
  pubDate: string;
}

export function FeedNewsWidget() {
  const { topic, setTopic, subtopic, setSubtopic } = useNewsStore();
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  
  const [tempTopic, setTempTopic] = useState(topic);
  const [tempSubtopic, setTempSubtopic] = useState(subtopic);

  useEffect(() => {
    async function fetchNews() {
      setLoading(true);
      try {
        const query = `/api/news?topic=${encodeURIComponent(topic)}&subtopic=${encodeURIComponent(subtopic)}`;
        const res = await fetch(query);
        const data = await res.json();
        if (data.items) setNews(data.items);
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    }
    fetchNews();
  }, [topic, subtopic]);

  const handleSaveTopic = () => {
    if (tempTopic.trim()) {
      setTopic(tempTopic.trim());
    } else {
      setTempTopic(topic);
    }
    setSubtopic(tempSubtopic.trim());
    setEditing(false);
  };

  return (
    <div className="glass rounded-3xl flex flex-col overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300">
      {/* Header Estilo Revista */}
      <div className="flex flex-col p-5 border-b border-ink/5 bg-gradient-to-b from-ink/5 to-transparent">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-ink">
            <Globe size={18} />
            <h2 className="font-bold text-lg tracking-tight">Giro de Notícias</h2>
          </div>
          <button 
            onClick={() => setEditing(!editing)}
            className="w-8 h-8 rounded-full bg-ink/5 hover:bg-ink/10 grid place-items-center transition text-ink"
            title="Editar Tópicos"
          >
            {editing ? <Check size={14} /> : <Edit3 size={14} />}
          </button>
        </div>

        {editing ? (
          <div className="flex flex-col gap-3 fade-in">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-bold text-muted tracking-wider">Tema Principal</label>
              <input 
                type="text" 
                value={tempTopic}
                onChange={(e) => setTempTopic(e.target.value)}
                placeholder="Ex: Tecnologia"
                className="bg-surface text-ink px-3 py-2 rounded-xl text-sm outline-none font-medium transition border border-ink/5 focus:border-ink/20 w-full"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-bold text-muted tracking-wider">Sub-Nicho (Opcional)</label>
              <input 
                type="text" 
                value={tempSubtopic}
                onChange={(e) => setTempSubtopic(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveTopic()}
                placeholder="Ex: Inteligência Artificial"
                className="bg-surface text-ink px-3 py-2 rounded-xl text-sm outline-none font-medium transition border border-ink/5 focus:border-ink/20 w-full"
              />
            </div>
            <button 
              onClick={handleSaveTopic} 
              className="mt-1 bg-ink text-white py-2 rounded-xl text-xs font-bold hover:opacity-90 transition"
            >
              Buscar Notícias
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 flex-wrap fade-in">
            <span className="px-3 py-1 rounded-full bg-ink text-white text-xs font-bold shadow-sm">
              {topic}
            </span>
            {subtopic && (
              <span className="px-3 py-1 rounded-full bg-surface-2 text-ink text-xs font-medium border border-ink/5">
                {subtopic}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Lista de Notícias */}
      <div className="flex flex-col p-2">
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 size={24} className="animate-spin text-muted" />
          </div>
        ) : news.length > 0 ? (
          <div className="flex flex-col gap-1">
            {news.map((item, i) => (
              <a 
                key={i} 
                href={item.link} 
                target="_blank" 
                rel="noopener noreferrer"
                className="group flex gap-4 p-4 rounded-2xl hover:bg-ink/5 transition-colors items-center fade-in"
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                <div className="w-10 h-10 rounded-xl bg-surface-2 group-hover:bg-white border border-ink/5 grid place-items-center text-muted group-hover:text-ink transition-colors shrink-0 shadow-sm">
                  <Newspaper size={16} />
                </div>
                <div className="flex-1 flex flex-col min-w-0">
                  <h3 className="text-sm font-semibold leading-snug text-ink/90 group-hover:text-ink transition line-clamp-2">
                    {item.title}
                  </h3>
                  <span className="text-[11px] text-muted mt-1.5 font-medium tracking-wide uppercase">
                    {new Date(item.pubDate).toLocaleDateString("pt-BR", { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </a>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center px-4">
            <div className="w-12 h-12 rounded-full bg-surface-2 grid place-items-center mb-3">
              <Newspaper size={20} className="text-muted" />
            </div>
            <p className="text-sm font-medium text-ink">Nenhuma notícia encontrada.</p>
            <p className="text-xs text-muted mt-1">Tente ajustar o tema ou o sub-nicho.</p>
          </div>
        )}
      </div>
    </div>
  );
}
