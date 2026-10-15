import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — Qaf" },
      { name: "description", content: "Privacy and data handling for Qaf Arabic Reading." },
    ],
  }),
  component: Privacy,
});

function Privacy() {
  return (
    <AppShell title="Privacy">
      <div className="prose prose-sm dark:prose-invert">
        <h2 className="text-base font-semibold">Privacy Policy</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Qaf is designed to be a private-first learning experience.
        </p>
        
        <h3 className="mt-6 text-sm font-semibold">Data Storage</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Your progress, streak, and preferences are stored locally on your device. We do not use accounts and do not store your personal identity on our servers.
        </p>

        <h3 className="mt-6 text-sm font-semibold">Audio Processing</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          When you use the microphone to check your reading, a short audio recording is sent to our processing provider (Google Gemini) to evaluate your pronunciation. This audio is processed temporarily and is not retained by Qaf beyond the duration of the check. Please note that provider-side retention policies are subject to their own terms.
        </p>

        <h3 className="mt-6 text-sm font-semibold">Offline Access</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Qaf uses service workers to cache lesson content and audio files on your device so you can learn without an internet connection.
        </p>

        <h3 className="mt-6 text-sm font-semibold">Contact</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          If you have questions about your privacy, please contact us through the platform where you accessed this app.
        </p>
      </div>
    </AppShell>
  );
}
