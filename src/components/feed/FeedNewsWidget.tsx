"use client";
import { useState, useEffect } from "react";
import { Newspaper, Loader2, Edit3, Check, Rss, ExternalLink, ChevronDown, ChevronUp } from "lucide-react";
import { useNewsStore } from "@/store/useNewsStore";
import { cn } from "@/lib/utils";

interface NewsItem {
  title: string;
  link: string;
  pubDate: string;
  description?: string;
  source?: string;
}

export function FeedNewsWidget() {
  const { sources, refreshInterval } = useNewsStore();
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    async function fetchNews() {
      if (!sources || sources.length === 0) return;
      setLoading(true);
      try {
        const promises = sources.map(source => {
          const query = new URLSearchParams({
            topic: source.topic || "",
            subtopic: source.subtopic || "",
            sourceType: source.type,
            customRssUrl: source.url || "",
            refreshInterval: refreshInterval.toString()
          });
          return fetch(`/api/news?${query.toString()}`).then(res => res.json());
        });

        const results = await Promise.all(promises);
        
        // Merge and sort all items by date
        let mergedItems: NewsItem[] = [];
        results.forEach(data => {
          if (data.items) {
            mergedItems = [...mergedItems, ...data.items];
          }
        });

        mergedItems.sort((a, b) => {
          return new Date(b.pubDate || 0).getTime() - new Date(a.pubDate || 0).getTime();
        });

        setNews(mergedItems);
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    }
    fetchNews();
  }, [sources, refreshInterval]);

  const visibleNews = expanded ? news : news.slice(0, 3);

  return (
    <div className="glass rounded-3xl flex flex-col overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300 border" style={{ borderColor: "var(--flat-border)" }}>
      {/* Header */}
      <div className="flex flex-col p-5 border-b bg-gradient-to-b from-ink/5 to-transparent" style={{ borderColor: "var(--flat-border)" }}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-ink">
            <div className="w-8 h-8 rounded-lg bg-ink text-surface grid place-items-center">
              <Newspaper size={16} />
            </div>
            <div>
              <h2 className="font-bold text-lg tracking-tight leading-none text-ink">Meu Jornal</h2>
              <p className="text-[10px] text-muted font-medium mt-1 tracking-widest uppercase">
                {sources?.length || 1} Fonte(s) Ativa(s)
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap fade-in mt-2">
          {sources?.map(s => (
            <span key={s.id} className="px-2 py-1 rounded-md bg-surface-2 text-ink text-[10px] font-medium border shadow-sm" style={{ borderColor: "var(--flat-border)" }}>
              {s.type === 'google' ? s.topic || 'Google' : s.type === 'tabnews' ? 'TabNews' : 'RSS Customizado'}
            </span>
          ))}
        </div>
      </div>

      {/* Lista de Notícias */}
      <div className="flex flex-col p-4 bg-surface-2/30">
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 size={24} className="animate-spin text-muted" />
          </div>
        ) : news.length > 0 ? (
          <>
            <div className="grid grid-cols-1 gap-4">
              {visibleNews.map((item, i) => (
                <a 
                  key={i} 
                  href={item.link} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="group flex flex-col p-4 bg-surface-2 rounded-2xl hover:bg-white transition-all border shadow-sm hover:shadow-md fade-in relative"
                  style={{ borderColor: "var(--flat-border)", animationDelay: `${i * 0.05}s` }}
                >
                  <div className="flex justify-between items-start gap-4 mb-2">
                    <h3 className="text-sm font-bold leading-snug text-ink group-hover:text-info transition pr-6">
                      {item.title}
                    </h3>
                    <div className="absolute top-4 right-4 text-muted opacity-0 group-hover:opacity-100 transition-opacity">
                      <ExternalLink size={14} />
                    </div>
                  </div>
                  
                  {item.description && (
                    <p className="text-[11px] text-muted leading-relaxed line-clamp-2 mb-3">
                      {item.description}
                    </p>
                  )}

                  <div className="flex items-center gap-3 mt-auto pt-2 border-t border-ink/5">
                    {item.source && (
                      <span className="text-[9px] font-bold uppercase tracking-widest text-ink/70 bg-ink/5 px-2 py-0.5 rounded-md">
                        {item.source}
                      </span>
                    )}
                    {item.pubDate && (
                      <span className="text-[9px] text-muted font-medium tracking-wide uppercase">
                        {new Date(item.pubDate).toLocaleDateString("pt-BR", { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                </a>
              ))}
            </div>
            
            {news.length > 3 && (
              <button 
                onClick={() => setExpanded(!expanded)}
                className="mt-4 py-2 w-full flex items-center justify-center gap-2 text-xs font-bold text-muted hover:text-ink hover:bg-ink/5 rounded-xl transition-colors"
              >
                {expanded ? (
                  <>Ver menos <ChevronUp size={14} /></>
                ) : (
                  <>Ver mais notícias ({news.length - 3}) <ChevronDown size={14} /></>
                )}
              </button>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center px-4 bg-surface-2 rounded-2xl border border-dashed border-ink/10">
            <div className="w-12 h-12 rounded-full bg-ink/5 grid place-items-center mb-3">
              <Newspaper size={20} className="text-muted" />
            </div>
            <p className="text-sm font-bold text-ink">Nenhuma notícia encontrada.</p>
            <p className="text-xs text-muted mt-1 max-w-[200px]">Ajuste seus filtros ou verifique as URLs das fontes.</p>
          </div>
        )}
      </div>
    </div>
  );
}
