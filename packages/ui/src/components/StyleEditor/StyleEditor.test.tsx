import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ThemeStyle } from "@atlas-tab/core";
import { StyleEditor } from "./StyleEditor";

const themeStyle: ThemeStyle = {
  boardColorHex: "#ffffff",
  boardOpacity: 5,
  boardBlur: 12,
  accentHex: "#ffffff",
  isDark: true,
  textScale: 1,
  textBold: false,
};

const layoutProps = {
  maxColumns: null,
  boardWidthPx: 220,
  onLayoutChange: vi.fn(),
};

const wallpaperProps = {
  wallpaperCurrentId: null,
  onWallpaperChange: vi.fn(),
};

describe("StyleEditor", () => {
  it("calls onChange with the new opacity when the slider moves", () => {
    const onChange = vi.fn();
    render(
      <StyleEditor
        themeStyle={themeStyle}
        onChange={onChange}
        onReset={vi.fn()}
        onClose={vi.fn()}
        {...layoutProps}
        {...wallpaperProps}
      />,
    );
    const [opacitySlider] = screen.getAllByRole("slider");
    fireEventChange(opacitySlider!, "30");
    expect(onChange).toHaveBeenCalledWith({ boardOpacity: 30 });
  });

  it("calls onChange with textBold: true when Bold is clicked", async () => {
    const onChange = vi.fn();
    render(
      <StyleEditor
        themeStyle={themeStyle}
        onChange={onChange}
        onReset={vi.fn()}
        onClose={vi.fn()}
        {...layoutProps}
        {...wallpaperProps}
      />,
    );
    await userEvent.click(screen.getByText("Bold"));
    expect(onChange).toHaveBeenCalledWith({ textBold: true });
  });

  it("calls onReset and onClose from the footer buttons", async () => {
    const onReset = vi.fn();
    const onClose = vi.fn();
    render(
      <StyleEditor
        themeStyle={themeStyle}
        onChange={vi.fn()}
        onReset={onReset}
        onClose={onClose}
        {...layoutProps}
        {...wallpaperProps}
      />,
    );
    await userEvent.click(screen.getByText("Reset"));
    await userEvent.click(screen.getByText("Close"));
    expect(onReset).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it("switches from Auto to a fixed column count via the select", async () => {
    const onLayoutChange = vi.fn();
    render(
      <StyleEditor
        themeStyle={themeStyle}
        onChange={vi.fn()}
        onReset={vi.fn()}
        onClose={vi.fn()}
        {...layoutProps}
        {...wallpaperProps}
        onLayoutChange={onLayoutChange}
      />,
    );
    await userEvent.selectOptions(screen.getByDisplayValue("Auto"), "6");
    expect(onLayoutChange).toHaveBeenCalledWith(
      expect.objectContaining({ maxBoardColumns: 6 }),
    );
  });

  it("clamps the board width slider to the column-count cap", () => {
    const onLayoutChange = vi.fn();
    render(
      <StyleEditor
        themeStyle={themeStyle}
        onChange={vi.fn()}
        onReset={vi.fn()}
        onClose={vi.fn()}
        maxColumns={9}
        boardWidthPx={220}
        onLayoutChange={onLayoutChange}
        {...wallpaperProps}
      />,
    );
    const sliders = screen.getAllByRole("slider");
    const widthSlider = sliders[sliders.length - 1]!;
    expect(Number(widthSlider.getAttribute("max"))).toBeLessThan(220 * 2); // sane cap, not runaway
  });

  it("renders a thumbnail for every bundled wallpaper and selects one on click", async () => {
    const onWallpaperChange = vi.fn();
    render(
      <StyleEditor
        themeStyle={themeStyle}
        onChange={vi.fn()}
        onReset={vi.fn()}
        onClose={vi.fn()}
        {...layoutProps}
        wallpaperCurrentId={null}
        onWallpaperChange={onWallpaperChange}
      />,
    );
    const thumbs = document.querySelectorAll('[class*="wallpaperThumb"]');
    expect(thumbs.length).toBeGreaterThanOrEqual(25);

    await userEvent.click(thumbs[6]!); // 07.jpg
    expect(onWallpaperChange).toHaveBeenCalledWith("07.jpg");
  });
});

// jsdom's userEvent doesn't reliably drive <input type="range">; dispatch the
// change event directly instead.
function fireEventChange(element: HTMLElement, value: string) {
  const input = element as HTMLInputElement;
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!;
  setter.call(input, value);
  input.dispatchEvent(new Event("change", { bubbles: true }));
}
