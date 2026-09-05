import { renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useSidebarToggleHotkeys } from "./useSidebarToggleHotkeys";

function press(
  mods: Partial<Pick<KeyboardEvent, "metaKey" | "ctrlKey" | "altKey" | "shiftKey" | "repeat">> = {
    ctrlKey: true,
    altKey: true,
  },
  code = "BracketLeft",
): KeyboardEvent {
  const event = new KeyboardEvent("keydown", { code, bubbles: true, cancelable: true, ...mods });
  document.body.dispatchEvent(event);
  return event;
}

afterEach(() => vi.restoreAllMocks());

function setup(isMac = false) {
  const onToggleLeft = vi.fn();
  const onToggleRight = vi.fn();
  const utils = renderHook(() => useSidebarToggleHotkeys({ onToggleLeft, onToggleRight }, isMac));
  return { onToggleLeft, onToggleRight, ...utils };
}

describe("useSidebarToggleHotkeys", () => {
  it("Ctrl+Alt+[ toggles only the left sidebar (Win/Linux)", () => {
    const { onToggleLeft, onToggleRight } = setup(false);
    press({ ctrlKey: true, altKey: true }, "BracketLeft");
    expect(onToggleLeft).toHaveBeenCalledTimes(1);
    expect(onToggleRight).not.toHaveBeenCalled();
  });

  it("Ctrl+Alt+] toggles only the right sidebar (Win/Linux)", () => {
    const { onToggleLeft, onToggleRight } = setup(false);
    press({ ctrlKey: true, altKey: true }, "BracketRight");
    expect(onToggleRight).toHaveBeenCalledTimes(1);
    expect(onToggleLeft).not.toHaveBeenCalled();
  });

  it("Cmd+Alt+[ / ] fire on macOS", () => {
    const { onToggleLeft, onToggleRight } = setup(true);
    press({ metaKey: true, altKey: true }, "BracketLeft");
    press({ metaKey: true, altKey: true }, "BracketRight");
    expect(onToggleLeft).toHaveBeenCalledTimes(1);
    expect(onToggleRight).toHaveBeenCalledTimes(1);
  });

  it("Ctrl+B toggles the right sidebar on Win/Linux", () => {
    const { onToggleLeft, onToggleRight } = setup(false);
    const event = press({ ctrlKey: true }, "KeyB");
    expect(onToggleRight).toHaveBeenCalledTimes(1);
    expect(onToggleLeft).not.toHaveBeenCalled();
    expect(event.defaultPrevented).toBe(true);
  });

  it("Cmd+B toggles the right sidebar on macOS", () => {
    const { onToggleRight } = setup(true);
    press({ metaKey: true }, "KeyB");
    expect(onToggleRight).toHaveBeenCalledTimes(1);
  });

  it("ignores Alt and Shift variants of the B alias", () => {
    const { onToggleRight } = setup(false);
    press({ ctrlKey: true, altKey: true }, "KeyB");
    press({ ctrlKey: true, shiftKey: true }, "KeyB");
    expect(onToggleRight).not.toHaveBeenCalled();
  });

  it("ignores auto-repeat for the B alias", () => {
    const { onToggleRight } = setup(false);
    press({ ctrlKey: true, repeat: true }, "KeyB");
    expect(onToggleRight).not.toHaveBeenCalled();
  });

  it("ignores wrong platform command modifiers", () => {
    const mac = setup(true);
    press({ ctrlKey: true }, "KeyB");
    expect(mac.onToggleRight).not.toHaveBeenCalled();

    const other = setup(false);
    press({ metaKey: true }, "KeyB");
    expect(other.onToggleRight).not.toHaveBeenCalled();
  });

  it("ignores the bare bracket keys, missing-Alt, and Shift variants", () => {
    const { onToggleLeft, onToggleRight } = setup(false);
    press({}, "BracketLeft");
    press({ ctrlKey: true }, "BracketLeft");
    press({ ctrlKey: true, altKey: true, shiftKey: true }, "BracketRight");
    expect(onToggleLeft).not.toHaveBeenCalled();
    expect(onToggleRight).not.toHaveBeenCalled();
  });

  it("ignores AltGraph chords", () => {
    const { onToggleLeft, onToggleRight } = setup(false);
    vi.spyOn(KeyboardEvent.prototype, "getModifierState").mockImplementation((keyArg) => keyArg === "AltGraph");
    press({ ctrlKey: true, altKey: true }, "BracketLeft");
    press({ ctrlKey: true }, "KeyB");
    expect(onToggleLeft).not.toHaveBeenCalled();
    expect(onToggleRight).not.toHaveBeenCalled();
  });

  it("claims handled events", () => {
    setup(false);
    const event = new KeyboardEvent("keydown", {
      code: "KeyB",
      ctrlKey: true,
      bubbles: true,
      cancelable: true,
    });
    const stopSpy = vi.spyOn(event, "stopPropagation");
    document.body.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
    expect(stopSpy).toHaveBeenCalledTimes(1);
  });

  it("unbinds on unmount", () => {
    const { onToggleRight, unmount } = setup(false);
    unmount();
    press({ ctrlKey: true }, "KeyB");
    expect(onToggleRight).not.toHaveBeenCalled();
  });
});
