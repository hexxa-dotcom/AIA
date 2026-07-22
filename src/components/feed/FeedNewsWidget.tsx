"use client";
import { useState, useEffect } from "react";
import { Newspaper, Loader2, Sparkles, ExternalLink, ChevronDown, ChevronUp, Bot, AlertTriangle } from "lucide-react";
import { useNewsStore } from "@/store/useNewsStore";
import { useAiStore } from "@/store/useAiStore";
import { chatComplete } from "@/lib/ai/chat";
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

  // AI State
  const provider = useAiStore((s) => s.provider);
  const apiKey = useAiStore((s) => s.provider === "groq" ? s.groqKey : s.apiKey);
  const model = useAiStore((s) => s.models.system);
  
  const [summary, setSummary] = useState<string | null>(null);
  const [summarizing, setSummarizing] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [showNewsGrid, setShowNewsGrid] = useState(true);
  const [isWidgetExpanded, setIsWidgetExpanded] = useState(false);

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

  async function handleSummarize() {
    if (!apiKey?.trim()) {
      setSummaryError("Chave de API não configurada. Acesse as configurações.");
      return;
    }
    if (news.length === 0) return;

    setIsWidgetExpanded(true);
    setSummarizing(true);
    setSummaryError(null);
    setSummary(null);

    // Pegar as top 15 notícias para o resumo (evitar extrapolar tokens)
    const topNews = news.slice(0, 15);
    const newsText = topNews.map(n => `TÍTULO: ${n.title}\nDESCRIÇÃO: ${n.description || 'Sem descrição'}`).join('\n\n');

    const prompt = `Leia as seguintes notícias do dia e faça um resumo executivo dos acontecimentos mais importantes.\nAgrupe por temas se necessário e use TÓPICOS (bullet points) claros e diretos.\nNão invente informações e não use introduções genéricas.\n\nNotícias:\n${newsText}`;

    try {
      const result = await chatComplete({
        provider,
        apiKey,
        model,
        messages: [{ role: "user", content: prompt }],
        system: "Você é um assistente de jornalismo focado em resumir informações importantes de forma rápida e clara para leitura em dashboards.",
        maxTokens: 800,
        temperature: 0.3,
      });
      setSummary(result.trim());
      setShowNewsGrid(false); // Esconder a grade de notícias ao gerar o resumo para poupar espaço
    } catch (e: any) {
      setSummaryError(e.message || "Erro ao gerar resumo.");
    } finally {
      setSummarizing(false);
    }
  }

  const visibleNews = expanded ? news : news.slice(0, 6);

  return (
    <div className="glass rounded-3xl flex flex-col overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300 border" style={{ borderColor: "var(--flat-border)" }}>
      {/* Header */}
      <div 
        className={cn(
          "flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 bg-gradient-to-b from-ink/5 to-transparent gap-4 cursor-pointer transition-colors hover:bg-ink/5",
          isWidgetExpanded && "border-b"
        )} 
        style={{ borderColor: "var(--flat-border)" }}
        onClick={() => setIsWidgetExpanded(!isWidgetExpanded)}
      >
        <div className="flex items-center gap-3 text-ink">
          <div className="w-10 h-10 rounded-xl bg-ink text-surface grid place-items-center shrink-0">
            <Newspaper size={20} />
          </div>
          <div>
            <h2 className="font-bold text-lg tracking-tight leading-none text-ink flex items-center gap-2">
              Notícias do Dia
              {isWidgetExpanded ? <ChevronUp size={16} className="text-muted" /> : <ChevronDown size={16} className="text-muted" />}
            </h2>
            <p className="text-[10px] text-muted font-medium mt-1.5 tracking-widest uppercase">
              {sources?.length || 1} Fonte(s) Ativa(s)
            </p>
          </div>
        </div>

        {news.length > 0 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleSummarize();
            }}
            disabled={summarizing}
            className="shrink-0 flex items-center gap-2 px-4 py-2 rounded-full font-bold text-xs bg-lime text-ink shadow-sm hover:opacity-90 transition disabled:opacity-50"
          >
            {summarizing ? (
              <><Loader2 size={14} className="animate-spin" /> Lendo...</>
            ) : (
              <><Sparkles size={14} /> Resumir com IA</>
            )}
          </button>
        )}
      </div>

      {isWidgetExpanded && (
        <div className="flex flex-col p-4 bg-surface-2/30">
          {/* Painel de Resumo da IA */}
        {summaryError && (
          <div className="mb-4 p-4 rounded-2xl bg-danger/10 text-danger text-sm flex items-center gap-3">
            <AlertTriangle size={18} />
            {summaryError}
          </div>
        )}

        {summary && (
          <div className="mb-6 fade-in bg-white rounded-2xl p-5 border shadow-sm" style={{ borderColor: "var(--flat-border)" }}>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-ink/5">
              <div className="flex items-center gap-2 text-ink font-bold">
                <Bot size={18} className="text-lime" /> Resumo Inteligente
              </div>
              <button 
                onClick={() => setShowNewsGrid(!showNewsGrid)}
                className="text-[10px] font-bold uppercase tracking-wider text-muted hover:text-ink transition"
              >
                {showNewsGrid ? "Esconder Notícias" : "Ver Notícias"}
              </button>
            </div>
            
            <div className="text-sm text-ink/80 leading-relaxed space-y-2 whitespace-pre-wrap">
              {summary}
            </div>
          </div>
        )}

        {/* Lista de Notícias (Grid Horizontal) */}
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 size={24} className="animate-spin text-muted" />
          </div>
        ) : (showNewsGrid && news.length > 0) ? (
          <div className="fade-in">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {visibleNews.map((item, i) => (
                <a 
                  key={i} 
                  href={item.link} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="group flex flex-col p-5 bg-surface-2 rounded-2xl hover:bg-white transition-all border shadow-sm hover:shadow-md h-full relative"
                  style={{ borderColor: "var(--flat-border)", animationDelay: `${i * 0.05}s` }}
                >
                  <div className="flex justify-between items-start gap-4 mb-3">
                    <h3 className="text-sm font-bold leading-snug text-ink group-hover:text-info transition pr-6 line-clamp-3">
                      {item.title}
                    </h3>
                    <div className="absolute top-5 right-5 text-muted opacity-0 group-hover:opacity-100 transition-opacity">
                      <ExternalLink size={14} />
                    </div>
                  </div>
                  
                  {item.description && (
                    <p className="text-xs text-muted leading-relaxed line-clamp-3 mb-4">
                      {item.description}
                    </p>
                  )}

                  <div className="flex items-center gap-3 mt-auto pt-3 border-t border-ink/5">
                    {item.source && (
                      <span className="text-[10px] font-bold uppercase tracking-widest text-ink/70 bg-ink/5 px-2 py-0.5 rounded-md">
                        {item.source}
                      </span>
                    )}
                    {item.pubDate && (
                      <span className="text-[10px] text-muted font-medium tracking-wide uppercase">
                        {new Date(item.pubDate).toLocaleDateString("pt-BR", { day: '2-digit', month: 'short' })}
                      </span>
                    )}
                  </div>
                </a>
              ))}
            </div>
            
            {news.length > 6 && (
              <button 
                onClick={() => setExpanded(!expanded)}
                className="mt-6 py-2.5 w-full flex items-center justify-center gap-2 text-xs font-bold text-ink/60 hover:text-ink bg-surface-2 hover:bg-white border rounded-xl transition-all shadow-sm"
                style={{ borderColor: "var(--flat-border)" }}
              >
                {expanded ? (
                  <>Recolher grade de notícias <ChevronUp size={14} /></>
                ) : (
                  <>Ver mais notícias ({news.length - 6}) <ChevronDown size={14} /></>
                )}
              </button>
            )}
          </div>
        ) : !showNewsGrid ? null : (
          <div className="flex flex-col items-center justify-center py-12 text-center px-4 bg-surface-2 rounded-2xl border border-dashed border-ink/10">
            <div className="w-12 h-12 rounded-full bg-ink/5 grid place-items-center mb-3">
              <Newspaper size={20} className="text-muted" />
            </div>
            <p className="text-sm font-bold text-ink">Nenhuma notícia encontrada.</p>
            <p className="text-xs text-muted mt-1 max-w-[200px]">Ajuste seus filtros ou verifique as URLs das fontes.</p>
          </div>
        )}
      </div>
      )}
    </div>
  );
}
