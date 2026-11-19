// Fails the Codemagic build when a native plugin (reminders, purchases) is not linked into the phone project.
// Usage: node scripts/native/verify-plugins.mjs ios|android   (run after `npx cap sync <platform>`)
import { readFileSync } from "node:fs";

const platform = process.argv[2];
const fail = (msg) => { console.error(`✗ ${msg}`); process.exit(1); };
const read = (path) => { try { return readFileSync(path, "utf8"); } catch { fail(`${path} is missing — run \`npx cap sync ${platform}\` first`); } };

if (platform === "ios") {
  const config = JSON.parse(read("ios/App/App/capacitor.config.json"));
  const classes = config.packageClassList ?? [];
  for (const c of ["LocalNotificationsPlugin", "NativePurchasesPlugin"]) if (!classes.includes(c)) fail(`iOS packageClassList lacks ${c}`);
  const pkg = read("ios/App/CapApp-SPM/Package.swift");
  for (const p of ["CapacitorLocalNotifications", "CapgoNativePurchases"]) if (!pkg.includes(`.product(name: "${p}"`)) fail(`iOS Package.swift does not link ${p}`);
  const proj = read("ios/App/App.xcodeproj/project.pbxproj");
  if (!proj.includes("CapApp-SPM in Frameworks")) fail("Xcode project does not link the CapApp-SPM package");
} else if (platform === "android") {
  const plugins = JSON.parse(read("android/app/src/main/assets/capacitor.plugins.json")).map((p) => p.classpath);
  for (const c of ["com.capacitorjs.plugins.localnotifications.LocalNotificationsPlugin"]) if (!plugins.includes(c)) fail(`Android plugins lack ${c}`);
  if (!plugins.some((c) => /nativepurchases/i.test(c))) fail("Android plugins lack NativePurchases");
} else fail("Pass ios or android");
console.log(`✓ ${platform}: reminder and purchase plugins are linked`);
