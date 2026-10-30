import { useLanguage } from "@/lib/i18n";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Check, LoaderCircle, X } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { buy, FALLBACK_PRICE, restore, storeAvailable, storePrices, type Plan } from "@/lib/purchases";
import { Button } from "@/components/ui/button";
import { useAccess } from "@/lib/access";
import * as Dialog from "@radix-ui/react-dialog";

export function Paywall({ open, onClose, reason }: { open: boolean; onClose: () => void; reason?: string | undefined }) {
  const { t } = useLanguage();
  const translateText = t;
  const [plan, setPlan] = useState<Plan>("yearly");
  const [prices, setPrices] = useState<Partial<Record<Plan, string>>>({});
  const [store, setStore] = useState<boolean | null>(null);
  const [busy, setBusy] = useState<"buy" | "restore" | null>(null);
  const { canBuy } = useAccess();
  useEffect(() => {
    if (!open) return;
    let active = true;
    setStore(null);
    setPrices({});
    void storeAvailable().then((value) => { if (active) setStore(value); });
    void storePrices().then((value) => { if (active) setPrices(value); });
    return () => { active = false; };
  }, [open]);
  if (!open) return null;

  const run = async (kind: "buy" | "restore") => {
    setBusy(kind);
    try {
      const ok = kind === "buy" ? await buy(plan) : await restore();
      if (ok) { toast.success(t("Qaf Premium is active")); onClose(); }
      else toast(kind === "buy" ? t("Purchase not completed") : t("No active subscription found"));
    } catch (e) {
      const m = e instanceof Error ? e.message : "";
      if (!/cancel/i.test(m)) toast.error(m || t("Something went wrong. Please try again."));
    } finally { setBusy(null); }
  };

  return (
    <Dialog.Root open={open} onOpenChange={(value) => { if (!value && !busy) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm" />
        <Dialog.Content className="qaf-paywall fixed z-50 w-full max-w-md rounded-3xl border border-border bg-card text-foreground shadow-lg" aria-describedby={undefined} onEscapeKeyDown={(e) => { if (busy) e.preventDefault(); }}>
        <div className="mb-3 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
          <Dialog.Title className="min-w-0 text-xl font-bold">{t("Qaf Premium")}</Dialog.Title>
          <Button variant="ghost" size="icon" disabled={!!busy} aria-label={t("Close")} onClick={onClose}><X className="h-5 w-5" /></Button>
        </div>
        {reason && <p className="mb-4 rounded-2xl bg-accent p-3 text-sm text-muted-foreground">{t(reason)}</p>}
        <ul className="mb-4 space-y-2 text-sm text-muted-foreground">
          {["Every Reading unit, word, quiz and reading test", "Every Sound Practice set", "Learn offline with downloaded lessons and audio", "100 AI pronunciation checks every billing month", "Cancel anytime in your store settings"].map((t) => (
            <li key={t} className="flex gap-2"><Check className="h-4 w-4 shrink-0 text-primary" />{translateText(t)}</li>
          ))}
        </ul>
        {!canBuy ? <div className="rounded-2xl bg-accent p-4 text-center">
          <p className="font-semibold text-primary">{t("Premium is coming soon")}</p>
          <p className="mt-1 text-sm text-muted-foreground">{t("$5.99/month or $45.99/year. For now you can keep learning the 10 free Fatha words, their 3 quizzes and the free Fatha sounds.")}</p>
          <Button className="mt-4 w-full rounded-2xl bg-primary py-3 font-semibold text-primary-foreground" onClick={onClose}>{t("Got it")}</Button>
        </div> : <>
        {(["monthly", "yearly"] as const).map((k) => (
          <Button variant="outline" key={k} onClick={() => setPlan(k)}
            disabled={!!busy} aria-pressed={plan === k}
            className={`mb-3 grid h-auto min-h-20 w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 whitespace-normal rounded-2xl border-2 p-4 text-start ${plan === k ? "border-primary bg-accent" : "border-border"}`}>
            <span className="min-w-0"><span className="block font-semibold">{k === "monthly" ? t("Monthly") : t("Yearly")}</span><span className="text-sm text-muted-foreground">{prices[k] ?? FALLBACK_PRICE[k]}</span></span>
            {k === "yearly" && <span className="shrink-0 rounded-full bg-primary px-2 py-1 text-xs text-primary-foreground">{t("Save 36%")}</span>}
          </Button>
        ))}
        {store === false && <p className="mb-2 text-center text-xs text-muted-foreground">{t("Subscriptions are available in the Qaf app for iPhone and Android.")}</p>}
        <Button disabled={!store || !!busy} className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-4 font-semibold text-primary-foreground disabled:opacity-50"
          onClick={() => run("buy")}>{busy === "buy" && <LoaderCircle className="h-4 w-4 animate-spin" />}{t("Subscribe")}</Button>
        <Button variant="ghost" disabled={!store || !!busy} className="mt-3 flex w-full items-center justify-center gap-2 text-sm text-muted-foreground disabled:opacity-50"
          onClick={() => run("restore")}>{busy === "restore" && <LoaderCircle className="h-4 w-4 animate-spin" />}{t("Restore purchase")}</Button>
        </>}
        <p className="mt-4 text-center text-[11px] leading-relaxed text-muted-foreground">
          {t("Payment is charged to your Apple ID or Google Play account. Subscriptions renew automatically unless cancelled at least 24 hours before the period ends.")}{" "}
          <Link to="/terms" className="underline" onClick={onClose}>{t("Terms of Use")}</Link> · <Link to="/privacy" className="underline" onClick={onClose}>{t("Privacy")}</Link>
        </p>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
