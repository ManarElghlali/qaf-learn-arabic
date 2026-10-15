import { useLanguage } from "@/lib/i18n";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Use — Qaf Learn Arabic" },
      { name: "description", content: "Terms of Use and subscription terms for Qaf Learn Arabic, including Qaf Premium billing, renewal and cancellation." },
      { property: "og:title", content: "Terms of Use — Qaf Learn Arabic" },
      { property: "og:description", content: "The licence, subscription and cancellation terms for Qaf." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://qaf-learn-arabic.lovable.app/terms" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "https://qaf-learn-arabic.lovable.app/terms" }],
  }),
  component: Terms,
});

function Terms() {
  const { t } = useLanguage();
  const h = "text-base font-semibold text-foreground";
  return (
    <AppShell title="Terms of Use">
      <Button asChild variant="ghost" className="mb-5 gap-2 px-0">
        <Link to="/profile"><ArrowLeft className="h-4 w-4" />{t("Back to Profile")}</Link>
      </Button>
      <article lang="en" dir="ltr" className="space-y-6 text-sm leading-7 text-muted-foreground">
        <header>
          <h2 className="text-xl font-bold text-primary">Terms of Use (EULA)</h2>
          <p className="mt-1 text-xs">Updated 15 October 2026</p>
          <p className="mt-3">By using Qaf Learn Arabic you agree to these terms. If you downloaded Qaf from the Apple App Store, Apple’s Standard Licensed Application End User License Agreement also applies; if these terms conflict with it, Apple’s terms prevail for that app.</p>
        </header>
        <section><h3 className={h}>Licence</h3><p>We grant you a personal, non-transferable, non-commercial licence to use Qaf on devices you own or control. You may not copy, resell, reverse engineer or redistribute the app, its lessons, illustrations or teacher recordings.</p></section>
        <section><h3 className={h}>Qaf Premium subscription</h3>
          <p>Qaf Premium is an auto-renewing subscription offered monthly ($5.99) or yearly ($39.99), or the local price shown by your store. Premium includes up to 100 AI pronunciation checks per billing month; unused checks do not roll over. Lessons, recordings and quizzes remain available without Premium. Free learners can try a limited number of pronunciation checks.</p>
          <p className="mt-2">Payment is charged to your Apple ID or Google Play account at confirmation of purchase. The subscription renews automatically at the same price unless auto-renew is turned off at least 24 hours before the end of the current period. You can manage or cancel it in your App Store or Google Play account settings. Refunds are handled by Apple or Google under their policies. Use Restore purchase in the app to reactivate Premium on a new device.</p>
        </section>
        <section><h3 className={h}>Pronunciation feedback</h3><p>AI pronunciation feedback is an educational aid and may sometimes be wrong. It does not replace a qualified teacher. Fair-use daily limits protect the service and may apply to all learners.</p></section>
        <section><h3 className={h}>Availability</h3><p>We may update, change or pause features, including the online checker. The app is provided “as is” to the extent permitted by law, and our liability is limited to the amount you paid for Premium in the previous 12 months.</p></section>
        <section><h3 className={h}>Privacy</h3><p>See our <Link to="/privacy" className="font-medium text-primary underline">Privacy Policy</Link>.</p></section>
        <section><h3 className={h}>Contact</h3><p>Email <a className="break-all font-medium text-primary underline" href="mailto:Manarelghlalii@gmail.com">Manarelghlalii@gmail.com</a>. Apple and Google are not responsible for supporting the app or for these terms.</p></section>
      </article>
    </AppShell>
  );
}
