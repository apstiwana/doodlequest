import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { LevelComplete } from "@/components/LevelComplete";

/**
 * Guards S0.1: no payment solicitation may appear on the reward screen, which is
 * exactly where a child is looking and tapping after finishing a level. Asserted on
 * rendered output rather than on source text, so it still holds if the screen is
 * restyled.
 */

function outboundLinksIn(container: HTMLElement): HTMLAnchorElement[] {
  return Array.from(container.querySelectorAll("a"));
}

describe("S0.1 — reward screen carries no payment solicitation", () => {
  it("RendersNoPaymentLink_OnLevelComplete", () => {
    const { container } = render(
      <LevelComplete scene="forest" playerName="Ada" score={70} onContinue={() => {}} />,
    );

    const stripeLinks = outboundLinksIn(container).filter((a) =>
      a.getAttribute("href")?.includes("buy.stripe.com"),
    );

    expect(stripeLinks).toHaveLength(0);
    // Nothing on the reward screen should link off-site at all.
    expect(outboundLinksIn(container)).toHaveLength(0);
  });

  it("KeepsPlayAgainAndScore_AfterPaymentLinkRemoval", () => {
    render(
      <LevelComplete scene="forest" playerName="Ada" score={70} onContinue={() => {}} />,
    );

    expect(screen.getByRole("button", { name: /play again/i })).toBeInTheDocument();
    // score / 10 is the star count shown to the child
    expect(screen.getByText("7")).toBeInTheDocument();
    expect(screen.getByText(/Ada/)).toBeInTheDocument();
  });

  it("CallsOnContinue_WhenPlayAgainPressed", () => {
    const onContinue = vi.fn();
    render(
      <LevelComplete scene="moon" playerName="Ada" score={0} onContinue={onContinue} />,
    );

    screen.getByRole("button", { name: /play again/i }).click();

    expect(onContinue).toHaveBeenCalledTimes(1);
  });

  it("RendersZeroStars_WhenScoreIsZero", () => {
    render(
      <LevelComplete scene="space" playerName="Ada" score={0} onContinue={() => {}} />,
    );

    expect(screen.getByText("0")).toBeInTheDocument();
  });
});
