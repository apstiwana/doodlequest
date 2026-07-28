import { describe, it, expect } from "vitest";
import { act, render, screen } from "@testing-library/react";
import { WelcomeScreen } from "@/components/WelcomeScreen";
import { LanguageProvider } from "@/context/LanguageContext";

/**
 * Guards S9.1: the tip link belongs on the home page, top right, addressed to a
 * parent, and visually subordinate to "Start Adventure". Positioning is asserted via
 * the utility classes that produce it — a regression there is precisely what would
 * put the link back into a child's tap path.
 */

const TIP_URL = "https://buy.stripe.com/bJecN61zY4Bw6wddRC0RG00";

function renderHome() {
  return render(
    <LanguageProvider>
      <WelcomeScreen onStart={() => {}} />
    </LanguageProvider>,
  );
}

function tipLinksIn(container: HTMLElement): HTMLAnchorElement[] {
  return Array.from(container.querySelectorAll("a")).filter((a) =>
    a.getAttribute("href")?.includes("buy.stripe.com"),
  );
}

describe("S9.1 — tip link on the home page", () => {
  it("RendersExactlyOneTipLink_WithTheExpectedUrl", () => {
    const { container } = renderHome();
    const links = tipLinksIn(container);

    expect(links).toHaveLength(1);
    expect(links[0].getAttribute("href")).toBe(TIP_URL);
  });

  it("OpensTipLinkSafely_InNewTab", () => {
    const { container } = renderHome();
    const link = tipLinksIn(container)[0];

    expect(link.getAttribute("target")).toBe("_blank");
    // rel is what stops the payment page getting a handle on window.opener
    expect(link.getAttribute("rel")).toBe("noopener noreferrer");
  });

  it("AddressesTheAdult_NotTheChild", () => {
    const { container } = renderHome();

    expect(tipLinksIn(container)[0].textContent?.toLowerCase()).toContain("grown-ups");
  });

  it("SitsTopRight_ClearOfTheLanguageToggle", () => {
    const { container } = renderHome();
    const link = tipLinksIn(container)[0];
    const toggle = screen.getByRole("button", { name: /EN|NL/ });

    expect(link.className).toContain("fixed");
    expect(link.className).toContain("right-4");
    expect(link.className).toContain("top-[4.5rem]");
    // The language toggle stays pinned at the very top; the two must not share a
    // vertical offset, or they become one mis-tappable target.
    expect(toggle.className).toContain("top-4");
    expect(toggle.className).not.toContain("top-[4.5rem]");
  });

  it("IsNotStyledAsAPrimaryCallToAction", () => {
    const { container } = renderHome();
    const link = tipLinksIn(container)[0];

    expect(link.className).toContain("text-xs");
    expect(link.className).toContain("text-muted-foreground/70");
    expect(link.className).not.toContain("bg-primary");
  });

  it("KeepsStartAdventureAsTheOnlyPrimaryAction", () => {
    renderHome();

    expect(screen.getByRole("button", { name: /start adventure/i }).className).toContain(
      "bg-primary",
    );
  });

  it("KeepsTipLinkIntact_AfterLanguageSwitch", () => {
    const { container } = renderHome();

    // Switching language must not drop the link or blank out its copy.
    act(() => screen.getByRole("button", { name: /NL/ }).click());
    const link = tipLinksIn(container)[0];

    expect(link.getAttribute("href")).toBe(TIP_URL);
    expect(link.textContent?.trim().length).toBeGreaterThan(0);
  });
});
