import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { DeckContext, type DeckContextValue } from "@/components/stage/DeckContext";
import { InkRail } from "./InkRail";

function deck(patch: Partial<DeckContextValue> = {}): DeckContextValue {
  return {
    mode: "deck",
    eligible: true,
    optedOut: false,
    setOptedOut: () => {},
    activeIndex: 0,
    setActiveIndex: () => {},
    ...patch,
  };
}

function renderRail(patch: Partial<DeckContextValue> = {}) {
  return render(
    <DeckContext value={deck(patch)}>
      <InkRail />
    </DeckContext>,
  );
}

const menuButton = () => screen.getByRole("button", { name: /abrir menu|cerrar menu/i });

describe("InkRail: menu movil", () => {
  it("el boton abre y cierra el menu y lo declara con aria-expanded", () => {
    renderRail();
    expect(menuButton()).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(menuButton());
    expect(menuButton()).toHaveAttribute("aria-expanded", "true");

    fireEvent.click(menuButton());
    expect(menuButton()).toHaveAttribute("aria-expanded", "false");
  });

  it("Escape cierra el menu y devuelve el foco al boton que lo abrio (no al body)", () => {
    renderRail();
    fireEvent.click(menuButton());
    const link = screen.getAllByRole("link", { name: /trayectoria/i }).at(-1) as HTMLElement;
    link.focus();

    fireEvent.keyDown(link, { key: "Escape" });

    expect(menuButton()).toHaveAttribute("aria-expanded", "false");
    expect(menuButton()).toHaveFocus();
  });

  it("Escape con el menu cerrado no mueve el foco", () => {
    renderRail();
    const home = screen.getByRole("link", { name: "A. Gámez" });
    home.focus();

    fireEvent.keyDown(home, { key: "Escape" });

    expect(home).toHaveFocus();
  });

  it("otra tecla no cierra el menu", () => {
    renderRail();
    fireEvent.click(menuButton());

    fireEvent.keyDown(screen.getByRole("button", { name: /cerrar menu/i }), { key: "Enter" });

    expect(menuButton()).toHaveAttribute("aria-expanded", "true");
  });

  it("cambiar las animaciones desde el menu lo cierra y devuelve el foco al boton", () => {
    const setOptedOut = vi.fn();
    renderRail({ setOptedOut });
    fireEvent.click(menuButton());
    const toggles = screen.getAllByRole("button", { name: /animaciones de scroll/i });
    const inMenu = toggles.at(-1) as HTMLElement; // el del riel de escritorio va antes
    inMenu.focus();

    fireEvent.click(inMenu);

    expect(setOptedOut).toHaveBeenCalledWith(true);
    expect(menuButton()).toHaveAttribute("aria-expanded", "false");
    expect(menuButton()).toHaveFocus();
  });

  it("sin modo escenarios posible no hay interruptor en ninguno de los dos riles", () => {
    renderRail({ eligible: false });

    expect(screen.queryByRole("button", { name: /animaciones de scroll/i })).toBeNull();
  });
});

describe("InkRail: seccion activa", () => {
  it("marca con aria-current=location la seccion del escenario activo, y solo esa", () => {
    renderRail({ activeIndex: 2 });

    // `hidden: true`: el menu movil cerrado va con el atributo `hidden`.
    const current = screen
      .getAllByRole("link", { hidden: true })
      .filter((link) => link.getAttribute("aria-current") === "location");

    // Una por cada navegacion (escritorio y movil), ambas apuntando a la misma seccion.
    expect(current.length).toBe(2);
    expect(new Set(current.map((link) => link.getAttribute("href"))).size).toBe(1);
  });
});
