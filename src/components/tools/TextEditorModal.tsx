"use client";
import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, Loader2, Save } from "lucide-react";
import { useTextsStore, type TextDocument } from "@/store/useTextsStore";
import { useAiStore } from "@/store/useAiStore";
import "react-quill-new/dist/quill.snow.css";

// ReactQuill must be loaded dynamically without SSR
const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });

export function TextEditorModal({ id, onClose }: { id: string | null; onClose: () => void }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [aiPrompt, setAiPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const quillRef = useRef<any>(null);

  const texts = useTextsStore((s) => s.texts);
  const addText = useTextsStore((s) => s.addText);
  const updateText = useTextsStore((s) => s.updateText);
  const aiStore = useAiStore();

  useEffect(() => {
    if (id) {
      const doc = texts.find((t) => t.id === id);
      if (doc) {
        setTitle(doc.title);
        setContent(doc.content);
      }
    }
  }, [id, texts]);

  const handleSave = () => {
    if (!title.trim() && !content.trim()) return;
    if (id) {
      updateText(id, title, content);
    } else {
      addText(title, content);
    }
    onClose();
  };

  const handleAiAction = async () => {
    if (!aiPrompt.trim()) return;
    setIsGenerating(true);

    try {
      const selectedText = quillRef.current?.getEditor()?.getSelection();
      let promptText = aiPrompt;
      let textToImprove = "";

      if (selectedText && selectedText.length > 0) {
        textToImprove = quillRef.current?.getEditor()?.getText(selectedText.index, selectedText.length);
        promptText = `Baseado no seguinte texto: "${textToImprove}"\n\nInstrução: ${aiPrompt}`;
      } else {
        promptText = `Contexto geral: ${content.substring(0, 500)}...\n\nInstrução: ${aiPrompt}`;
      }

      const res = await fetch("/api/aia/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: aiStore.provider,
          model: aiStore.models.chat,
          apiKey: aiStore.provider === "groq" ? aiStore.groqKey : aiStore.apiKey,
          messages: [{ role: "user", content: promptText }],
        }),
      });

      if (!res.ok) throw new Error("Erro na IA");

      const data = await res.json();
      const generatedText = data.text || "";

      // Insert or replace in Quill
      const editor = quillRef.current?.getEditor();
      if (editor) {
        if (selectedText && selectedText.length > 0) {
          editor.deleteText(selectedText.index, selectedText.length);
          editor.insertText(selectedText.index, generatedText + " ");
        } else {
          const length = editor.getLength();
          editor.insertText(length, "\n" + generatedText + "\n");
        }
      }
      setAiPrompt("");
    } catch (error) {
      console.error(error);
      alert("Falha ao gerar texto com IA. Verifique sua chave no menu de Ajustes.");
    } finally {
      setIsGenerating(false);
    }
  };

  const modules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ["bold", "italic", "underline", "strike"],
      [{ list: "ordered" }, { list: "bullet" }],
      ["blockquote", "code-block"],
      ["link"],
      ["clean"],
    ],
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-surface overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-flat shrink-0">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Título do Documento..."
          className="text-2xl font-bold bg-transparent outline-none flex-1 text-ink placeholder:text-muted/50"
        />
        <div className="flex gap-2 shrink-0">
          <button onClick={handleSave} className="flex items-center gap-1.5 px-4 py-2 bg-ink text-surface rounded-full text-xs font-bold hover:opacity-90">
            <Save size={14} /> Salvar
          </button>
          <button onClick={onClose} className="p-2 text-muted hover:text-ink hover:bg-surface-2 rounded-full transition">
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
          <ReactQuill
            {...({ ref: quillRef } as any)}
            theme="snow"
            value={content}
            onChange={setContent}
            modules={modules}
            className="h-full min-h-[500px]"
            placeholder="Comece a escrever..."
          />
        </div>
      </div>

      {/* AI Copilot Bar */}
      <div className="p-4 border-t border-flat bg-surface-2/50 shrink-0 flex gap-2 items-center">
        <Sparkles size={18} className="text-lime shrink-0" />
        <input
          value={aiPrompt}
          onChange={(e) => setAiPrompt(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAiAction()}
          placeholder="Peça para a IA (selecione texto no editor para foco)..."
          className="flex-1 bg-white border border-flat px-4 py-2 rounded-xl text-sm outline-none"
        />
        <button
          onClick={handleAiAction}
          disabled={isGenerating || !aiPrompt.trim()}
          className="bg-lime text-ink px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 hover:opacity-90 disabled:opacity-50"
        >
          {isGenerating ? <Loader2 size={14} className="animate-spin" /> : "Gerar"}
        </button>
      </div>
    </div>
  );
}
