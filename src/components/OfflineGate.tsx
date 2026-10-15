import { useLanguage } from "@/lib/i18n";
import { useEffect, useState, type ReactNode } from "react";
import { WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";

const OPEN_OFFLINE = ["/privacy", "/terms", "/profile"];

/** Free learners need a connection to learn; Premium learners can learn offline. */
export function OfflineGate({ premium, loaded, children }: { premium: boolean; loaded: boolean; children: ReactNode }) {
  const { t } = useLanguage();
  const [online, setOnline] = useState(true);
  useEffect(() => {
    const f = () => setOnline(navigator.onLine);
    f(); window.addEventListener("online", f); window.addEventListener("offline", f);
    return () => { window.removeEventListener("online", f); window.removeEventListener("offline", f); };
  }, []);
  if (online || !loaded || premium || (typeof window !== "undefined" && OPEN_OFFLINE.includes(window.location.pathname))) return <>{children}</>;
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-background p-8 text-center">
      <WifiOff className="h-10 w-10 text-muted-foreground" />
      <h1 className="text-xl font-bold">{t("You're offline")}</h1>
      <p className="max-w-xs text-sm text-muted-foreground">{t("Connect to the internet to continue, or go Premium to learn offline.")}</p>
      <Button className="mt-2" onClick={() => setOnline(navigator.onLine)}>{t("Try again")}</Button>
    </main>
  );
}
