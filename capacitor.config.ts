import type { CapacitorConfig } from "@capacitor/cli";

// Native shells load the static client build; pronunciation checks call the published site (VITE_API_BASE).
const config: CapacitorConfig = {
  appId: "app.qaf.learnarabic",
  appName: "Qaf Learn Arabic",
  webDir: ".output/public",
  ios: { contentInset: "never" },
  android: { allowMixedContent: false },
  plugins: {
    // iPhone: show reminders as a banner (no app-icon badge) even while Qaf is open.
    LocalNotifications: { iconColor: "#164C43", presentationOptions: ["banner", "list", "sound"] },
  },
};

export default config;
