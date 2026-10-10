import { useState } from "react";
import { toast } from "sonner";
import { Check, X } from "lucide-react";
import { update } from "@/lib/progress";

export function Paywall({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [plan, setPlan] = useState<"m" | "y">("y");
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40" onClick={onClose}>
      <div className="w-full max-w-md rounded-t-3xl bg-card p-6 pb-10" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">Qaf Premium</h2>
          <button aria-label="Close" onClick={onClose}><X className="h-5 w-5" /></button>
        </div>
        <ul className="mb-5 space-y-2 text-sm text-muted-foreground">
          {["All four stages as they launch", "Unlimited reading tests", "Offline-ready lessons"].map((t) => (
            <li key={t} className="flex gap-2"><Check className="h-4 w-4 text-primary" />{t}</li>
          ))}
        </ul>
        {([["m", "Monthly", "$4.99 / month", ""], ["y", "Yearly", "$29.99 / year", "Save 50%"]] as const).map(([k, n, p, b]) => (
          <button key={k} onClick={() => setPlan(k)}
            className={`mb-3 flex w-full items-center justify-between rounded-2xl border-2 p-4 text-left ${plan === k ? "border-primary bg-accent" : "border-border"}`}>
            <span><span className="block font-semibold">{n}</span><span className="text-sm text-muted-foreground">{p}</span></span>
            {b && <span className="rounded-full bg-primary px-2 py-1 text-xs text-primary-foreground">{b}</span>}
          </button>
        ))}
        <button className="mt-2 w-full rounded-2xl bg-primary py-4 font-semibold text-primary-foreground"
          onClick={() => { update((p) => ({ ...p, premium: true })); toast.success("Premium unlocked (demo)"); onClose(); }}>
          Continue
        </button>
        <button className="mt-3 w-full text-sm text-muted-foreground"
          onClick={() => toast("No previous purchases found")}>Restore purchase</button>
      </div>
    </div>
  );
}
