import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { DeckProvider } from "./DeckContext";
import { MotionToggle } from "./MotionToggle";
import { MOTION_OFF_VALUE, MOTION_STORAGE_KEY } from "@/lib/stage/config";
import { installMatchMedia, restoreCss, stubCssSupports } from "@/test/doubles";

const REDUCED = "(prefers-reduced-motion: reduce)";

function renderToggle(variant: "rail" | "menu" | "skip", onToggle?: () => void) {
  return render(
    <DeckProvider>
      <MotionToggle variant={variant} onToggle={onToggle} />
    </DeckProvider>,
  );
}

describe("MotionToggle", () => {
  beforeEach(() => {
    window.localStorage.clear();
    installMatchMedia();
    stubCssSupports(true);
  });

  afterEach(() => {
    restoreCss();
  });

  describe("variantes rail y menu (interruptor)", () => {
    it.each(["rail", "menu"] as const)("%s: es un boton con aria-pressed que arranca activado", (variant) => {
      renderToggle(variant);

      const button = screen.getByRole("button", { name: /animaciones de scroll/i });
      expect(button).toHaveAttribute("aria-pressed", "true");
    });

    it.each(["rail", "menu"] as const)("%s: al pulsarlo pasa a modo simple y lo recuerda", (variant) => {
      renderToggle(variant);
      const button = screen.getByRole("button", { name: /animaciones de scroll/i });

      fireEvent.click(button);

      expect(button).toHaveAttribute("aria-pressed", "false");
      expect(window.localStorage.getItem(MOTION_STORAGE_KEY)).toBe(MOTION_OFF_VALUE);
    });

    it.each(["rail", "menu"] as const)("%s: pulsarlo otra vez vuelve a activar los escenarios", (variant) => {
      renderToggle(variant);
      const button = screen.getByRole("button", { name: /animaciones de scroll/i });

      fireEvent.click(button);
      fireEvent.click(button);

      expect(button).toHaveAttribute("aria-pressed", "true");
      expect(window.localStorage.getItem(MOTION_STORAGE_KEY)).toBeNull();
    });

    it("el nombre accesible no cambia con el estado (para eso esta aria-pressed)", () => {
      renderToggle("rail");
      const button = screen.getByRole("button", { name: /animaciones de scroll/i });
      const before = button.textContent;

      fireEvent.click(button);

      expect(screen.getByRole("button", { name: /animaciones de scroll/i })).toBe(button);
      expect(button.textContent).toBe(before);
    });

    it("es un objetivo tactil de al menos 44x44", () => {
      renderToggle("rail");

      const button = screen.getByRole("button", { name: /animaciones de scroll/i });
      expect(button.className).toContain("min-h-11");
      expect(button.className).toContain("min-w-11");
    });

    it("avisa al padre al pulsar (el menu movil se cierra)", () => {
      const onToggle = vi.fn();
      renderToggle("menu", onToggle);

      fireEvent.click(screen.getByRole("button", { name: /animaciones de scroll/i }));

      expect(onToggle).toHaveBeenCalledTimes(1);
    });
  });

  describe("variante skip (enlace de salto)", () => {
    it("es un boton visible solo al recibir foco", () => {
      renderToggle("skip");

      const button = screen.getByRole("button", { name: "Desactivar animaciones de scroll" });
      expect(button.className).toContain("sr-only");
      expect(button.className).toContain("focus:not-sr-only");
    });

    it("al pulsarlo el foco pasa a #contenido: el boton desaparece y el foco no puede caer al body (WCAG 2.4.3)", () => {
      render(
        <DeckProvider>
          <main id="contenido" tabIndex={-1} />
          <MotionToggle variant="skip" />
        </DeckProvider>,
      );
      const button = screen.getByRole("button", { name: "Desactivar animaciones de scroll" });
      button.focus();

      fireEvent.click(button);

      expect(document.getElementById("contenido")).toHaveFocus();
    });

    it("al pulsarlo desactiva los escenarios y deja de mostrarse", () => {
      renderToggle("skip");

      fireEvent.click(screen.getByRole("button", { name: "Desactivar animaciones de scroll" }));

      expect(window.localStorage.getItem(MOTION_STORAGE_KEY)).toBe(MOTION_OFF_VALUE);
      expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });
  });

  describe("cuando el modo escenarios no es posible", () => {
    it.each(["rail", "menu", "skip"] as const)(
      "%s: con prefers-reduced-motion no se muestra (no cambiaria nada)",
      (variant) => {
        installMatchMedia({ [REDUCED]: true });
        renderToggle(variant);

        expect(screen.queryByRole("button")).not.toBeInTheDocument();
      },
    );

    it.each(["rail", "menu", "skip"] as const)("%s: sin position: sticky tampoco", (variant) => {
      stubCssSupports(false);
      renderToggle(variant);

      expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });
  });
});
