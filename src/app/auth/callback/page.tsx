"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";

export default function AuthCallbackPage() {
  const router = useRouter();
  const init = useAuthStore((s) => s.init);

  useEffect(() => {
    (async () => {
      await init();
      setTimeout(() => router.replace("/"), 300);
    })();
  }, [init, router]);

  return (
    <div className="min-h-screen grid place-items-center">
      <div className="text-center">
        <Loader2 size={28} className="animate-spin mx-auto mb-3 text-ink" />
        <p className="text-sm text-muted">Entrando...</p>
      </div>
    </div>
  );
}
