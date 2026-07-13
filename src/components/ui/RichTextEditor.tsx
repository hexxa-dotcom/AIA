"use client";
import dynamic from "next/dynamic";
import "react-quill-new/dist/quill.snow.css";

const ReactQuill = dynamic(() => import("react-quill-new"), {
  ssr: false,
  loading: () => <div className="h-[200px] flex items-center justify-center bg-surface-2 animate-pulse rounded-2xl border" style={{ borderColor: "var(--flat-border)" }}>Carregando editor...</div>,
});

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function RichTextEditor({ value, onChange, placeholder, className }: RichTextEditorProps) {
  const modules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ["bold", "italic", "underline", "strike"],
      [{ color: [] }, { background: [] }],
      [{ list: "ordered" }, { list: "bullet" }],
      ["link", "clean"],
    ],
  };

  return (
    <div className={`rich-text-editor ${className || ""}`}>
      <style>{`
        .rich-text-editor .ql-container {
          font-family: inherit;
          font-size: 14px;
          border-bottom-left-radius: 1rem;
          border-bottom-right-radius: 1rem;
          border: 1px solid var(--flat-border);
          border-top: none;
          background-color: var(--surface-2);
          transition: background-color 0.2s;
        }
        .rich-text-editor .ql-editor {
          min-height: 250px;
          padding: 1rem;
        }
        .rich-text-editor .ql-toolbar {
          border-top-left-radius: 1rem;
          border-top-right-radius: 1rem;
          border: 1px solid var(--flat-border);
          background-color: var(--surface-2);
          font-family: inherit;
        }
        .rich-text-editor:focus-within .ql-container,
        .rich-text-editor:focus-within .ql-toolbar {
          background-color: white;
        }
      `}</style>
      <ReactQuill
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        placeholder={placeholder}
      />
    </div>
  );
}
