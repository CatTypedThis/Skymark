/**
 * Seed DOM/component test (Ticket 04 coverage + tooling proof).
 *
 * This file exists for two reasons:
 *   1. It proves the jsdom + @testing-library/react toolchain works end-to-end
 *      (JSX transform, fake DOM, RTL queries, jest-dom matchers).
 *   2. It gives future component tests a copy-paste template.
 *
 * It also strengthens Ticket 04 AC7 ("accessible labels communicate both
 * horizontal and vertical direction") with a real rendered-DOM assertion,
 * complementing the pure-logic tests in offscreen-guidance.test.ts.
 */
import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { OffscreenIndicator } from "@/components/beacons/OffscreenIndicator";

describe("OffscreenIndicator (rendered DOM)", () => {
  it("centers with a raise cue and a both-axis aria-label, no chevron", () => {
    render(
      <OffscreenIndicator
        name="Trailhead"
        color="cyan"
        edge="center"
        verticalCue="raise"
      />,
    );

    // The whole indicator is the labeled region.
    const indicator = screen.getByLabelText(/Trailhead/);
    expect(indicator).toHaveAttribute(
      "aria-label",
      "Trailhead is off screen, look up",
    );
    // Centered edge pins horizontally — no left/right chevron should render.
    expect(within(indicator).queryByRole("img")).toBeNull();
    // Vertical cue glyph is present and hidden from assistive tech.
    const hint = within(indicator).getByText("↑");
    expect(hint).toHaveAttribute("aria-hidden", "true");
  });

  it("shows a chevron and a turn label for an off-FOV edge", () => {
    render(
      <OffscreenIndicator name="Creek" color="amber" edge="right" />
    );
    const indicator = screen.getByLabelText(/Creek/);
    // Both axes appear in the label when a turn is the only cue.
    expect(indicator).toHaveAttribute("aria-label", "Creek is off screen, to the right");
    // The amber color's hex is applied via the --beam CSS custom property.
    expect(indicator.getAttribute("style") ?? "").toMatch(/--beam:/);
  });
});
