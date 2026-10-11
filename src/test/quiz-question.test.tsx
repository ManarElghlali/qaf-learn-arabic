import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { BuildQuestion, PickQuestion } from "@/components/QuizQuestion";
import { WORDS } from "@/lib/words";

vi.mock("@/lib/audio", () => ({ playUnit: vi.fn(), playWord: vi.fn() }));
afterEach(cleanup);

describe("Quiz selection feedback", () => {
  it("keeps chosen build sounds highlighted and prevents duplicate taps", () => {
    const w = WORDS[0];
    if (!w) throw new Error("Missing curriculum word");
    const done = vi.fn();
    render(<BuildQuestion w={w} words={WORDS} onDone={done} />);
    for (const [i, u] of w.units.entries()) {
      const tile = screen.getByRole("button", { name: `Choose sound ${u}` });
      fireEvent.click(tile);
      expect(tile).toHaveAttribute("aria-pressed", "true");
      expect(tile).toBeDisabled();
      expect(tile).toHaveClass("bg-primary", "text-primary-foreground");
      fireEvent.click(tile);
      expect(done).toHaveBeenCalledTimes(i === w.units.length - 1 ? 1 : 0);
    }
    expect(done).toHaveBeenCalledWith(true);
    expect(screen.getByRole("status")).toHaveTextContent("Correct!");
  });

  it("stacks answers and keeps correct feedback after answering", () => {
    const w = WORDS[0];
    if (!w) throw new Error("Missing curriculum word");
    const done = vi.fn();
    render(<PickQuestion w={w} opts={WORDS.slice(0, 4)} mode="picture" onDone={done} />);
    expect(screen.getByLabelText("Answer choices")).toHaveClass("grid-cols-1");
    const answer = screen.getByRole("button", { name: w.ar });
    fireEvent.click(answer);
    expect(answer).toHaveAttribute("aria-pressed", "true");
    expect(answer).toHaveClass("bg-primary");
    expect(done).toHaveBeenCalledWith(true);
    expect(screen.getAllByRole("button").every((button) => button.hasAttribute("disabled"))).toBe(true);
  });
});