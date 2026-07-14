"use client";
import { useEffect } from "react";
import { useGoogleLogin } from "@react-oauth/google";
import { useDriveStore } from "@/store/useDriveStore";
import { Button } from "@/components/ui/Button";
import { FileText, Folder, LogOut, Loader2, Image as ImageIcon, File, ExternalLink, HardDrive } from "lucide-react";
import { cn } from "@/lib/utils";

interface DriveExplorerProps {
  folderOnly?: boolean;
}

export function DriveExplorer({ folderOnly }: DriveExplorerProps) {
  const { accessToken, setAccessToken, files, loading, logout, fetchFiles } = useDriveStore();

  const login = useGoogleLogin({
    onSuccess: (tokenResponse) => {
      setAccessToken(tokenResponse.access_token);
    },
    onError: (error) => console.log('Login Failed:', error),
    scope: "https://www.googleapis.com/auth/drive.readonly",
  });

  useEffect(() => {
    if (accessToken) {
      // Se folderOnly for true, você pode ajustar a query para buscar apenas dentro de uma pasta específica.
      // Exemplo: `trashed=false and 'PASTA_ID' in parents`
      fetchFiles(folderOnly ? "trashed=false" : "trashed=false");
    }
  }, [accessToken, fetchFiles, folderOnly]);

  if (!accessToken) {
    return (
      <div className="bg-white rounded-3xl p-8 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-lime/20 grid place-items-center mx-auto">
          <HardDrive size={24} className="text-lime-700" />
        </div>
        <div>
          <p className="font-bold text-base text-ink">Conectar Google Drive</p>
          <p className="text-xs text-muted mt-1.5 leading-relaxed max-w-xs mx-auto">
            Utilize o seu próprio armazenamento em nuvem para organizar e acessar seus arquivos diretamente no AIA OS.
          </p>
        </div>
        <Button onClick={() => login()} className="mx-auto flex items-center gap-2">
          <HardDrive size={16} /> Conectar Conta Google
        </Button>
      </div>
    );
  }

  function getIconForMime(mime: string) {
    if (mime === "application/vnd.google-apps.folder") return <Folder size={16} className="text-info" />;
    if (mime.includes("image")) return <ImageIcon size={16} className="text-purple-500" />;
    if (mime.includes("pdf")) return <FileText size={16} className="text-danger" />;
    if (mime.includes("document")) return <FileText size={16} className="text-info" />;
    if (mime.includes("spreadsheet")) return <FileText size={16} className="text-success" />;
    return <File size={16} className="text-muted" />;
  }

  return (
    <div className="bg-white rounded-3xl p-5 shadow-sm min-h-[400px] flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <HardDrive size={18} className="text-ink" />
          <h2 className="font-bold text-sm">Meu Google Drive</h2>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => fetchFiles()}
            disabled={loading}
            className="text-[10px] uppercase font-bold text-muted hover:text-ink transition"
          >
            {loading ? "Sincronizando..." : "Atualizar"}
          </button>
          <button 
            onClick={logout} 
            className="p-1.5 rounded-lg hover:bg-danger/10 text-muted hover:text-danger transition"
            title="Desconectar Drive"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>

      {loading && files.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-muted">
          <Loader2 size={24} className="animate-spin mb-2 opacity-50" />
          <span className="text-xs font-semibold">Carregando arquivos...</span>
        </div>
      ) : files.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-muted">
          <Folder size={32} className="opacity-20 mb-2" />
          <span className="text-xs font-semibold">Nenhum arquivo encontrado.</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 overflow-y-auto pr-1 flex-1">
          {files.map((f) => (
            <a 
              key={f.id} 
              href={f.webViewLink} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-start gap-3 p-3 rounded-2xl bg-surface-2 border border-transparent hover:border-ink/10 transition group"
            >
              <div className="w-8 h-8 rounded-xl bg-white grid place-items-center shrink-0 shadow-sm">
                {f.iconLink ? (
                  <img src={f.iconLink} alt="" className="w-4 h-4" />
                ) : (
                  getIconForMime(f.mimeType)
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-ink truncate group-hover:text-lime-700 transition">
                  {f.name}
                </p>
                <p className="text-[10px] text-muted truncate mt-0.5">
                  {f.modifiedTime ? new Date(f.modifiedTime).toLocaleDateString("pt-BR") : "Desconhecido"}
                </p>
              </div>
              <ExternalLink size={12} className="text-muted opacity-0 group-hover:opacity-100 transition shrink-0" />
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
