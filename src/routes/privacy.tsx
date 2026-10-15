import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — Qaf Learn Arabic" },
      { name: "description", content: "How Qaf handles microphone recordings, local learning progress and third-party pronunciation assessment." },
      { property: "og:title", content: "Privacy Policy — Qaf Learn Arabic" },
      { property: "og:description", content: "Your recordings, learning data and privacy choices in Qaf." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://qaf-learn-arabic.lovable.app/privacy" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "https://qaf-learn-arabic.lovable.app/privacy" }],
  }),
  component: Privacy,
});

function Privacy() {
  return (
    <AppShell title="Privacy">
      <Button asChild variant="ghost" className="mb-5 gap-2 px-0">
        <Link to="/profile"><ArrowLeft className="h-4 w-4" />Back to Profile</Link>
      </Button>
      <article className="space-y-6 text-sm leading-7 text-muted-foreground">
        <header>
          <h2 className="text-xl font-bold text-primary">Privacy Policy</h2>
          <p className="mt-1 text-xs">Updated 15 October 2026</p>
          <p className="mt-3">This policy describes the current Qaf Learn Arabic experience. You can learn as a guest without creating an account.</p>
        </header>
        <section aria-labelledby="privacy-microphone">
          <h3 id="privacy-microphone" className="text-base font-semibold text-foreground">Microphone and recordings</h3>
          <p>Qaf requests microphone permission when you choose to take a pronunciation assessment. A short recording of your reading and the target Arabic word are sent for immediate grading. Qaf does not permanently save these recordings in its own database or file storage, and does not sell them. Recording is not required to use lessons, teacher audio or non-speaking quizzes.</p>
          <p className="mt-2">You can deny or revoke microphone permission in your browser or device settings.</p>
        </section>
        <section aria-labelledby="privacy-processing">
          <h3 id="privacy-processing" className="text-base font-semibold text-foreground">Third-party AI assessment</h3>
          <p>Speech samples are transmitted over HTTPS to Qaf’s pronunciation service, which forwards them through the Lovable AI Gateway to Google Gemini for grading. Assessment requires an internet connection. These services may also receive technical request information needed to operate and protect their systems.</p>
          <p className="mt-2">Provider-side retention, processing locations and any use for service improvement are governed by the providers’ terms. Those details have not yet been independently confirmed for Qaf; we cannot promise zero retention by third parties. Contact us before using speech assessment if you need more information. Do not include sensitive personal information in recordings.</p>
        </section>
        <section aria-labelledby="privacy-local">
          <h3 id="privacy-local" className="text-base font-semibold text-foreground">Learning data on your device</h3>
          <p>Learning progress, completed words, quiz and test results, streaks, Sound Practice progress and onboarding preferences are stored locally using localStorage. Qaf does not currently sync this learning data to a user account or database. Assessment results returned to your device may be saved as part of your progress.</p>
          <p className="mt-2">Clearing Qaf’s site data in your browser or device settings removes local progress and preferences. This cannot be recovered through Qaf. Profile’s Reset progress button clears the reading totals it controls, not all local data.</p>
        </section>
        <section aria-labelledby="privacy-offline">
          <h3 id="privacy-offline" className="text-base font-semibold text-foreground">Offline files and online requests</h3>
          <p>Qaf caches lessons and teacher recordings on your device for offline use after downloads complete. Clearing site data can also remove these files. Loading the app, fonts, recordings or speech assessment contacts hosting and processing services; ordinary technical information such as IP addresses and request details may be processed under their policies. Cached lessons and audio do not require the AI checker.</p>
        </section>
        <section aria-labelledby="privacy-children">
          <h3 id="privacy-children" className="text-base font-semibold text-foreground">Younger learners</h3>
          <p>A parent or guardian should review this policy and supervise microphone use by children. Qaf does not request a child’s name or email to begin learning. Where consent is required, a parent or guardian should provide it before a child uses speech assessment.</p>
        </section>
        <section aria-labelledby="privacy-contact">
          <h3 id="privacy-contact" className="text-base font-semibold text-foreground">Contact and privacy requests</h3>
          <p>For support, privacy questions or concerns, email <a className="break-all font-medium text-primary underline underline-offset-4" href="mailto:Manarelghlalii@gmail.com">Manarelghlalii@gmail.com</a>. Please do not send voice recordings or sensitive information unless requested for a specific support issue.</p>
          <p className="mt-2">This policy will be updated if Qaf’s data handling changes. The date above identifies the latest revision.</p>
        </section>
      </article>
    </AppShell>
  );
}