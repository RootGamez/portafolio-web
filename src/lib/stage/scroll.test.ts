import { afterEach, describe, expect, it, vi } from "vitest";
import { jumpToElement } from "./scroll";

describe("jumpToElement", () => {
  afterEach(() => {
    document.documentElement.style.scrollBehavior = "";
    document.body.innerHTML = "";
  });

  function target() {
    const element = document.createElement("section");
    document.body.appendChild(element);
    element.scrollIntoView = vi.fn();
    return element;
  }

  it("lleva el elemento al borde superior de la ventana", () => {
    const element = target();

    jumpToElement(element);

    expect(element.scrollIntoView).toHaveBeenCalledWith({ block: "start" });
  });

  it("apaga el scroll suave solo durante el salto, para que sea instantaneo", () => {
    const element = target();
    let during = "";
    element.scrollIntoView = vi.fn(() => {
      during = document.documentElement.style.scrollBehavior;
    });

    jumpToElement(element);

    expect(during).toBe("auto");
  });

  it("restaura el scroll-behavior que hubiera antes", () => {
    document.documentElement.style.scrollBehavior = "smooth";
    const element = target();

    jumpToElement(element);

    expect(document.documentElement.style.scrollBehavior).toBe("smooth");
  });

  it("lo restaura tambien si scrollIntoView lanza", () => {
    document.documentElement.style.scrollBehavior = "smooth";
    const element = target();
    element.scrollIntoView = vi.fn(() => {
      throw new Error("boom");
    });

    expect(() => jumpToElement(element)).toThrow("boom");
    expect(document.documentElement.style.scrollBehavior).toBe("smooth");
  });
});
