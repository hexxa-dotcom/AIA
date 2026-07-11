"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { useCanvasStore, type CanvasNode } from "@/store/useCanvasStore";
import { useTaskStore } from "@/store/useTaskStore";
import {
  MousePointer2, StickyNote, Pen, Trash2,
  ZoomIn, ZoomOut, Home, X,
} from "lucide-react";

// ── constants ─────────────────────────────────────────────────────────────────

const NOTE_COLORS = ["#ffffff", "#f0f0ee", "#e0e0de", "#c8c8c6", "#a8a8a6", "#4a4a48"];
const PEN_COLORS  = ["#141414", "#4a4a4a", "#7a7a7a", "#a8a8a8", "#d4d4d4", "#ffffff"];
const DARK_NOTES  = new Set(["#a8a8a6", "#4a4a48"]);
const noteTextColor = (bg: string) => (DARK_NOTES.has(bg) ? "#f5f5f3" : "#1a1a1a");
type Tool = "select" | "note" | "pen";

interface View { panX: number; panY: number; zoom: number; }

// ── helpers ───────────────────────────────────────────────────────────────────

function ptPath(pts: number[]): string {
  if (pts.length < 4) return "";
  let d = `M ${pts[0]} ${pts[1]}`;
  for (let i = 2; i < pts.length; i += 2) d += ` L ${pts[i]} ${pts[i + 1]}`;
  return d;
}

// ── NoteCard ──────────────────────────────────────────────────────────────────

function NoteCard({
  node, selected, zoom,
  onSelect, onDelete, onConvert, onUpdate,
}: {
  node: CanvasNode;
  selected: boolean;
  zoom: number;
  onSelect: () => void;
  onDelete: () => void;
  onConvert: () => void;
  onUpdate: (patch: Partial<CanvasNode>) => void;
}) {
  function handleMouseDown(e: React.MouseEvent) {
    e.stopPropagation();
    onSelect();
    if ((e.target as HTMLElement).tagName === "TEXTAREA") return;

    const startX = e.clientX;
    const startY = e.clientY;
    const ox = node.x;
    const oy = node.y;

    function onMove(me: MouseEvent) {
      onUpdate({ x: ox + (me.clientX - startX) / zoom, y: oy + (me.clientY - startY) / zoom });
    }
    function onUp() {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }

  return (
    <div
      data-node="1"
      onMouseDown={handleMouseDown}
      style={{
        position: "absolute",
        left: node.x,
        top: node.y,
        width: node.w,
        height: node.h,
        background: node.color,
        borderRadius: 16,
        boxShadow: selected
          ? "0 0 0 2.5px #1a1a1a, 0 8px 28px rgba(0,0,0,0.20)"
          : "0 4px 18px rgba(0,0,0,0.13)",
        display: "flex",
        flexDirection: "column",
        cursor: "grab",
        userSelect: "none",
        transition: "box-shadow 0.12s",
        overflow: "hidden",
      }}
    >
      {/* header strip */}
      <div style={{
        height: 30, padding: "0 10px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        borderBottom: "1px solid rgba(0,0,0,0.07)",
        flexShrink: 0, cursor: "grab",
      }}>
        <div style={{ display: "flex", gap: 5 }}>
          {["#d4d4d2", "#a8a8a6", "#7a7a78"].map((c) => (
            <div key={c} style={{ width: 8, height: 8, borderRadius: "50%", background: c, opacity: 0.45 }} />
          ))}
        </div>
        {selected && (
          <div
            style={{ display: "flex", gap: 4, pointerEvents: "auto" }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <button
              title="Converter em tarefa"
              onClick={(e) => { e.stopPropagation(); onConvert(); }}
              style={{
                padding: "2px 8px", borderRadius: 8,
                background: DARK_NOTES.has(node.color) ? "rgba(255,255,255,0.14)" : "rgba(0,0,0,0.10)",
                border: "none",
                cursor: "pointer", fontSize: 10, fontWeight: 600,
                display: "flex", alignItems: "center", gap: 3,
                color: noteTextColor(node.color),
              }}
            >
              ＋ Tarefa
            </button>
            <button
              title="Deletar"
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              style={{
                padding: 3, borderRadius: 8, background: "transparent",
                border: "none", cursor: "pointer", opacity: 0.45,
                display: "flex", alignItems: "center",
              }}
            >
              <X size={10} />
            </button>
          </div>
        )}
      </div>

      {/* text area */}
      <textarea
        value={node.text}
        onChange={(e) => onUpdate({ text: e.target.value })}
        onMouseDown={(e) => e.stopPropagation()}
        placeholder="Escreva aqui…"
        style={{
          flex: 1,
          background: "transparent",
          border: "none", outline: "none",
          resize: "none",
          padding: "8px 12px",
          fontSize: 13,
          fontFamily: "inherit",
          color: noteTextColor(node.color),
          cursor: "text",
          lineHeight: 1.5,
        }}
      />
    </div>
  );
}

// ── main page ─────────────────────────────────────────────────────────────────

export default function QuadroPage() {
  const { nodes, strokes, addNode, updateNode, deleteNode, addStroke, clearAll } = useCanvasStore();

  // view (pan + zoom)
  const viewLive = useRef<View>({ panX: 0, panY: 0, zoom: 1 });
  const [view, setViewState] = useState<View>({ panX: 0, panY: 0, zoom: 1 });

  function setView(v: View) { viewLive.current = v; setViewState(v); }
  function updateView(fn: (v: View) => View) {
    const next = fn(viewLive.current);
    viewLive.current = next;
    setViewState(next);
  }

  // tools
  const [tool, setToolState] = useState<Tool>("select");
  const toolRef = useRef<Tool>("select");
  function setTool(t: Tool) { setToolState(t); toolRef.current = t; }

  // colors
  const [noteColor, setNoteColor] = useState(NOTE_COLORS[0]);
  const noteColorRef = useRef(NOTE_COLORS[0]);
  const [penColor, setPenColorState] = useState(PEN_COLORS[0]);
  const penColorRef = useRef(PEN_COLORS[0]);
  function setPenColor(c: string) { setPenColorState(c); penColorRef.current = c; }

  // selection
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // drag / draw state
  const viewportRef = useRef<HTMLDivElement>(null);
  const isPanning = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });
  const isDrawing = useRef(false);
  const strokePts = useRef<number[]>([]);
  const [drawStroke, setDrawStroke] = useState<number[] | null>(null);

  // confirm clear
  const [confirmClear, setConfirmClear] = useState(false);

  function screenToCanvas(clientX: number, clientY: number) {
    const rect = viewportRef.current!.getBoundingClientRect();
    return {
      x: (clientX - rect.left - viewLive.current.panX) / viewLive.current.zoom,
      y: (clientY - rect.top  - viewLive.current.panY) / viewLive.current.zoom,
    };
  }

  // wheel zoom
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    function onWheel(e: WheelEvent) {
      e.preventDefault();
      const rect = el!.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1;
      const newZoom = Math.max(0.15, Math.min(4, viewLive.current.zoom * factor));
      const newPanX = mx - (mx - viewLive.current.panX) * (newZoom / viewLive.current.zoom);
      const newPanY = my - (my - viewLive.current.panY) * (newZoom / viewLive.current.zoom);
      setView({ panX: newPanX, panY: newPanY, zoom: newZoom });
    }
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  // keyboard shortcuts
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.target as HTMLElement).tagName === "TEXTAREA") return;
      if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedId) { deleteNode(selectedId); setSelectedId(null); }
      }
      if (e.key === "Escape") setTool("select");
      if (e.key === "n") setTool("note");
      if (e.key === "p") setTool("pen");
      if (e.key === "s") setTool("select");
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedId, deleteNode]);

  // mouse handlers
  function handleMouseDown(e: React.MouseEvent) {
    const target = e.target as HTMLElement;
    if (target.closest("[data-node]")) return;

    if (toolRef.current === "pen") {
      isDrawing.current = true;
      const pt = screenToCanvas(e.clientX, e.clientY);
      strokePts.current = [pt.x, pt.y];
      setDrawStroke([pt.x, pt.y]);
      return;
    }

    setSelectedId(null);
    isPanning.current = true;
    lastMouse.current = { x: e.clientX, y: e.clientY };
  }

  function handleMouseMove(e: React.MouseEvent) {
    if (isPanning.current) {
      const dx = e.clientX - lastMouse.current.x;
      const dy = e.clientY - lastMouse.current.y;
      lastMouse.current = { x: e.clientX, y: e.clientY };
      updateView((v) => ({ ...v, panX: v.panX + dx, panY: v.panY + dy }));
      return;
    }
    if (isDrawing.current) {
      const pt = screenToCanvas(e.clientX, e.clientY);
      strokePts.current.push(pt.x, pt.y);
      setDrawStroke([...strokePts.current]);
    }
  }

  function handleMouseUp() {
    isPanning.current = false;
    if (isDrawing.current && strokePts.current.length >= 4) {
      addStroke({ pts: strokePts.current, color: penColorRef.current, w: 2 });
    }
    isDrawing.current = false;
    strokePts.current = [];
    setDrawStroke(null);
  }

  function handleDoubleClick(e: React.MouseEvent) {
    const target = e.target as HTMLElement;
    if (target.closest("[data-node]")) return;
    if (toolRef.current === "pen") return;

    const pt = screenToCanvas(e.clientX, e.clientY);
    const id = addNode({ x: pt.x - 100, y: pt.y - 75, w: 200, h: 150, text: "", color: noteColorRef.current });
    setSelectedId(id);
    setTool("select");
  }

  function convertToTask(node: CanvasNode) {
    useTaskStore.getState().createTask({
      title: node.text.trim() || "Nota do Quadro",
      column: "backlog",
      priority: "medium",
    });
  }

  const { panX, panY, zoom } = view;
  const cursor = tool === "pen" ? "crosshair" : tool === "note" ? "cell" : isPanning.current ? "grabbing" : "default";

  return (
    <AppShell>
      <div
        ref={viewportRef}
        style={{
          position: "relative",
          overflow: "hidden",
          height: "calc(100vh - 7rem)",
          borderRadius: 24,
          background: "#f4f4f2",
          cursor,
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onDoubleClick={handleDoubleClick}
      >
        {/* grid background */}
        <div
          style={{
            position: "absolute", inset: 0, pointerEvents: "none",
            backgroundImage: "radial-gradient(circle, rgba(0,0,0,0.13) 1.2px, transparent 1.2px)",
            backgroundSize: `${22 * zoom}px ${22 * zoom}px`,
            backgroundPosition: `${panX % (22 * zoom)}px ${panY % (22 * zoom)}px`,
          }}
        />

        {/* canvas transform layer */}
        <div style={{
          position: "absolute", left: 0, top: 0,
          transform: `translate(${panX}px, ${panY}px) scale(${zoom})`,
          transformOrigin: "0 0",
        }}>
          {/* SVG overlay for strokes */}
          <svg
            style={{ position: "absolute", overflow: "visible", left: 0, top: 0, pointerEvents: "none" }}
            width="1" height="1"
          >
            {strokes.map((s) => (
              <path
                key={s.id}
                d={ptPath(s.pts)}
                stroke={s.color}
                strokeWidth={s.w}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ))}
            {drawStroke && (
              <path
                d={ptPath(drawStroke)}
                stroke={penColorRef.current}
                strokeWidth={2}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
          </svg>

          {/* notes */}
          {nodes.map((node) => (
            <NoteCard
              key={node.id}
              node={node}
              selected={selectedId === node.id}
              zoom={zoom}
              onSelect={() => setSelectedId(node.id)}
              onDelete={() => { deleteNode(node.id); setSelectedId(null); }}
              onConvert={() => convertToTask(node)}
              onUpdate={(patch) => updateNode(node.id, patch)}
            />
          ))}
        </div>

        {/* hint */}
        <p style={{
          position: "absolute", top: 14, left: "50%", transform: "translateX(-50%)",
          color: "rgba(14,11,12,0.30)", fontSize: 11, pointerEvents: "none", whiteSpace: "nowrap",
        }}>
          Duplo clique para criar nota · Arraste para mover · Scroll para zoom
        </p>

        {/* toolbar */}
        <div style={{
          position: "absolute", bottom: 20, left: "50%", transform: "translateX(-50%)",
          background: "rgba(14,11,12,0.88)",
          backdropFilter: "blur(14px)",
          borderRadius: 20, padding: "8px 12px",
          display: "flex", alignItems: "center", gap: 4,
          border: "0.5px solid rgba(255,255,255,0.10)",
          boxShadow: "0 10px 36px rgba(0,0,0,0.28)",
          userSelect: "none",
        }}>
          {/* tool buttons */}
          {([
            { t: "select" as Tool, Icon: MousePointer2, title: "Selecionar (S)" },
            { t: "note"   as Tool, Icon: StickyNote,    title: "Nota (N)" },
            { t: "pen"    as Tool, Icon: Pen,            title: "Caneta (P)" },
          ]).map(({ t, Icon, title: ttl }) => (
            <button
              key={t}
              title={ttl}
              onClick={() => setTool(t)}
              style={{
                width: 36, height: 36, borderRadius: 12,
                background: tool === t ? "#f5f5f3" : "rgba(255,255,255,0.08)",
                border: "none", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: tool === t ? "#141414" : "rgba(255,255,255,0.60)",
                transition: "all 0.12s",
              }}
            >
              <Icon size={15} />
            </button>
          ))}

          <div style={{ width: 1, height: 24, background: "rgba(255,255,255,0.12)", margin: "0 4px" }} />

          {/* note colors — shown when tool=note or a note is selected */}
          {(tool === "note" || (selectedId && nodes.find((n) => n.id === selectedId))) && (
            <>
              {NOTE_COLORS.map((c) => (
                <button
                  key={c}
                  title={c}
                  onClick={() => {
                    setNoteColor(c);
                    noteColorRef.current = c;
                    if (selectedId) updateNode(selectedId, { color: c });
                  }}
                  style={{
                    width: 17, height: 17, borderRadius: "50%", background: c,
                    border: noteColor === c ? "2.5px solid #f5f5f3" : "2px solid rgba(255,255,255,0.18)",
                    cursor: "pointer", boxSizing: "border-box", flexShrink: 0,
                  }}
                />
              ))}
              <div style={{ width: 1, height: 24, background: "rgba(255,255,255,0.12)", margin: "0 4px" }} />
            </>
          )}

          {/* pen colors — shown when tool=pen */}
          {tool === "pen" && (
            <>
              {PEN_COLORS.map((c) => (
                <button
                  key={c}
                  title={c}
                  onClick={() => setPenColor(c)}
                  style={{
                    width: 17, height: 17, borderRadius: "50%", background: c,
                    border: penColor === c ? "2.5px solid #f5f5f3" : "2px solid rgba(255,255,255,0.18)",
                    cursor: "pointer", boxSizing: "border-box", flexShrink: 0,
                  }}
                />
              ))}
              <div style={{ width: 1, height: 24, background: "rgba(255,255,255,0.12)", margin: "0 4px" }} />
            </>
          )}

          {/* zoom / reset */}
          <button
            title="Reduzir zoom"
            onClick={() => updateView((v) => ({ ...v, zoom: Math.max(0.15, v.zoom / 1.2) }))}
            style={toolBtn}
          >
            <ZoomOut size={14} />
          </button>
          <button
            title="Ampliar zoom"
            onClick={() => updateView((v) => ({ ...v, zoom: Math.min(4, v.zoom * 1.2) }))}
            style={toolBtn}
          >
            <ZoomIn size={14} />
          </button>
          <button
            title="Centralizar"
            onClick={() => setView({ panX: 0, panY: 0, zoom: 1 })}
            style={toolBtn}
          >
            <Home size={14} />
          </button>

          <div style={{ width: 1, height: 24, background: "rgba(255,255,255,0.12)", margin: "0 4px" }} />

          {/* clear */}
          {confirmClear ? (
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.55)" }}>Apagar tudo?</span>
              <button
                onClick={() => { clearAll(); setConfirmClear(false); setSelectedId(null); }}
                style={{ ...toolBtn, background: "rgba(255,255,255,0.10)", color: "rgba(255,255,255,0.75)" }}
              >
                Sim
              </button>
              <button onClick={() => setConfirmClear(false)} style={toolBtn}>Não</button>
            </div>
          ) : (
            <button title="Limpar quadro" onClick={() => setConfirmClear(true)} style={toolBtn}>
              <Trash2 size={14} />
            </button>
          )}
        </div>

        {/* selected node quick-delete (top-right corner) */}
        {selectedId && (
          <button
            onClick={() => { deleteNode(selectedId); setSelectedId(null); }}
            style={{
              position: "absolute", top: 14, right: 14,
              display: "flex", alignItems: "center", gap: 6,
              padding: "5px 12px", borderRadius: 12,
              background: "rgba(40,40,40,0.12)", border: "1px solid rgba(40,40,40,0.25)",
              cursor: "pointer", color: "#6e6e6a", fontSize: 12, fontWeight: 600,
            }}
          >
            <Trash2 size={12} /> Deletar nota
          </button>
        )}
      </div>
    </AppShell>
  );
}

const toolBtn: React.CSSProperties = {
  width: 36, height: 36, borderRadius: 12,
  background: "rgba(255,255,255,0.08)", border: "none",
  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
  color: "rgba(255,255,255,0.60)", transition: "all 0.12s",
};
