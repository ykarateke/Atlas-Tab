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

describe("StyleEditor", () => {
  it("calls onChange with the new opacity when the slider moves", () => {
    const onChange = vi.fn();
    render(
      <StyleEditor themeStyle={themeStyle} onChange={onChange} onReset={vi.fn()} onClose={vi.fn()} />,
    );
    const [opacitySlider] = screen.getAllByRole("slider");
    fireEventChange(opacitySlider!, "30");
    expect(onChange).toHaveBeenCalledWith({ boardOpacity: 30 });
  });

  it("calls onChange with textBold: true when Bold is clicked", async () => {
    const onChange = vi.fn();
    render(
      <StyleEditor themeStyle={themeStyle} onChange={onChange} onReset={vi.fn()} onClose={vi.fn()} />,
    );
    await userEvent.click(screen.getByText("Bold"));
    expect(onChange).toHaveBeenCalledWith({ textBold: true });
  });

  it("calls onReset and onClose from the footer buttons", async () => {
    const onReset = vi.fn();
    const onClose = vi.fn();
    render(
      <StyleEditor themeStyle={themeStyle} onChange={vi.fn()} onReset={onReset} onClose={onClose} />,
    );
    await userEvent.click(screen.getByText("Reset"));
    await userEvent.click(screen.getByText("Close"));
    expect(onReset).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
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
