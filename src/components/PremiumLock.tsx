import { useLanguage } from "@/lib/i18n";
import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Paywall } from "@/components/Paywall";

/** Shown in place of Premium content for free learners. Saved progress is kept untouched. */
export function PremiumLocked({ what }: { what: string }) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  return (
    <div className="premium-lock flex flex-1 flex-col items-center justify-center text-center">
      <LockKeyhole className="mx-auto h-8 w-8 text-gold" />
      <h2 className="mt-3 text-lg font-bold">{t("Part of Qaf Premium")}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{t("{what} is included with Premium. Your saved progress is kept.", { what: t(what) })}</p>
      <Button className="mt-5 h-auto min-h-12 w-full whitespace-normal" onClick={() => setOpen(true)}>{t("See Premium")}</Button>
      <Button asChild variant="outline" className="mt-3 h-auto min-h-12 w-full whitespace-normal"><Link to="/learn" search={{ lesson: "fatha" }}>{t("Continue the free Fatha lessons")}</Link></Button>
      <Paywall open={open} onClose={() => setOpen(false)} />
    </div>
  );
}
