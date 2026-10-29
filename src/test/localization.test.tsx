import { afterEach, describe, expect, it } from "vitest";
import { fireEvent, render, screen, cleanup, waitFor } from "@testing-library/react";
import { LanguageProvider, useLanguage, translate, LANGUAGE_KEY } from "@/lib/i18n";
import { ONBOARDING_STEPS, QUIZ_STEP, RECOMMENDATION_STEP, onboardingSkipStep, readOnboarding, saveStep } from "@/lib/onboarding";
function Probe() { const { language, setLanguage, t } = useLanguage(); return <button onClick={() => setLanguage(language === "en" ? "ar" : "en")}>{t("Continue")}</button>; }
afterEach(() => { cleanup(); localStorage.clear(); document.documentElement.dir = "ltr"; });
describe("App localization", () => {
 it("translates interface text and interpolates without touching Arabic teaching text", () => {
  expect(translate("ar", "Word {current} of {total}", { current: 2, total: 10 })).toBe("الكلمة 2 من 10");
  expect(translate("ar", "أَكَلَ")).toBe("أَكَلَ");
  expect(translate("en", "Continue")).toBe("Continue");
  expect(translate("ar", "Reading")).toBe("القراءة");
  expect(translate("ar", "Sound Practice")).toBe("تدوين الاصوات");
 });
 it("persists a language and changes document direction without changing progress", async () => {
  localStorage.setItem("qaf-progress-v1", '{"learned":[1,2]}');
  render(<LanguageProvider><Probe /></LanguageProvider>);
  fireEvent.click(screen.getByRole("button", { name: "Continue" }));
  await waitFor(() => expect(document.documentElement.dir).toBe("rtl"));
  expect(screen.getByRole("button", { name: "متابعة" })).toBeInTheDocument();
  expect(localStorage.getItem(LANGUAGE_KEY)).toBe("ar");
  expect(localStorage.getItem("qaf-progress-v1")).toBe('{"learned":[1,2]}');
 });
 it("safely falls back from damaged language preferences", () => {
  localStorage.setItem(LANGUAGE_KEY, "not-a-language");
  render(<LanguageProvider><Probe /></LanguageProvider>);
  expect(screen.getByRole("button", { name: "Continue" })).toBeInTheDocument();
 });
});
describe("Onboarding language step migration", () => {
 it("preserves an interrupted old step and migrates exactly once", () => {
  localStorage.setItem("qaf-onboarding-v1", JSON.stringify({ completed: false, step: 5, goal: "sounds" }));
  expect(readOnboarding()).toMatchObject({ step: 7, goal: "sounds" });
  saveStep(7);
  expect(readOnboarding().step).toBe(7);
  expect(ONBOARDING_STEPS).toBe(8);
 });
 it("does not send existing learners back through onboarding", () => {
  localStorage.setItem("qaf-onboarding-v1", JSON.stringify({ completed: true, step: 0 }));
  expect(readOnboarding().completed).toBe(true);
 });
 it("places the quiz before recommendation and skips the quiz to recommendation", () => {
  expect(QUIZ_STEP).toBe(6);
  expect(RECOMMENDATION_STEP).toBe(7);
  expect(onboardingSkipStep(QUIZ_STEP)).toBe(7);
  expect(onboardingSkipStep(5)).toBe(6);
 });
 it("preserves interrupted version 2 quiz and recommendation positions without touching progress", () => {
  localStorage.setItem("qaf-progress-v1", '{"learned":[1,2]}');
  for (const [before, after] of [[6, 7], [7, 6]]) {
   localStorage.setItem("qaf-onboarding-v1", JSON.stringify({ version: 2, step: before, path: "sounds" }));
   expect(readOnboarding()).toMatchObject({ step: after, path: "sounds" });
   saveStep(after ?? 0);
   expect(readOnboarding().step).toBe(after);
  }
  expect(localStorage.getItem("qaf-progress-v1")).toBe('{"learned":[1,2]}');
 });
});
