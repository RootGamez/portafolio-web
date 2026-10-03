import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { DeckProvider, useDeck } from "./DeckContext";
import { StageDeck } from "./StageDeck";
import { HEIGHTS, Scene, STAGES, stubStageGeometry } from "@/test/stageGeometry";

// La cortina real dura 420 ms; aqui lo justo para que corra por frames. Es un getter para
// que un test pueda alargarla (con 40 ms, una maquina cargada puede saltarse todos los
// fotogramas intermedios y el test que mira la banda seria una carrera).
const curtain = vi.hoisted(() => ({ ms: 40 }));
vi.mock("@/lib/stage/config", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/stage/config")>()),
  get JUMP_CURTAIN_MS() {
    return curtain.ms;
  },
}));

function ActiveProbe() {
  return <output data-testid="activo">{useDeck().activeIndex}</output>;
}

/**
 * Linea de tiempo de prueba (ver src/test/stageGeometry.tsx):
 * el escenario 1 ("dos") empieza en 1280 y el 2 ("tres") en 3160.
 */
let scrollTo: ReturnType<typeof vi.spyOn>;

function renderWithLinks() {
  return render(
    <DeckProvider>
      <nav>
        <a href="#uno">ir a uno</a>
        <a href="#dos">ir a dos</a>
        <a href="#tres">ir a tres</a>
        <a href="#contenido">saltar</a>
        <a href="https://example.com" target="_blank" rel="noreferrer">
          externo
        </a>
      </nav>
      <StageDeck stages={STAGES} />
    </DeckProvider>,
  );
}

function setScrollY(value: number) {
  Object.defineProperty(window, "scrollY", { configurable: true, value });
  act(() => {
    window.dispatchEvent(new Event("scroll"));
  });
}

describe("navegacion del modo escenarios", () => {
  beforeEach(async () => {
    stubStageGeometry();
    scrollTo = vi.spyOn(window, "scrollTo").mockImplementation(() => {});
    window.history.replaceState(null, "", "/");
    // jsdom entrega algunos `hashchange` de forma asincrona, DESPUES de que acabe
    // el test que cambio el fragmento. Se vacian aqui, cuando nadie escucha: si
    // llegasen con el deck ya montado dispararian un salto (con foco) fantasma.
    // (En un navegador real `pushState`/`replaceState` no emiten hashchange.)
    await new Promise<void>((resolve) => setTimeout(resolve, 20));
  });

  afterEach(() => {
    curtain.ms = 40;
    Object.defineProperty(window, "scrollY", { configurable: true, value: 0 });
    window.history.replaceState(null, "", "/");
  });

  describe("cortina de tinta al saltar", () => {
    const curtainBand = () => document.querySelector('[data-ink-band="jump"]') as HTMLElement;

    it("un clic NO salta al instante: espera a que la tinta cubra, y entonces salta", async () => {
      renderWithLinks();

      fireEvent.click(screen.getByText("ir a dos"));

      expect(scrollTo).not.toHaveBeenCalled();
      await waitFor(() => expect(scrollTo).toHaveBeenCalledWith({ top: 1280, behavior: "auto" }));
    });

    it("el hash se actualiza al instante (es la intencion del usuario); lo que espera es el scroll", () => {
      renderWithLinks();

      fireEvent.click(screen.getByText("ir a dos"));

      expect(window.location.hash).toBe("#dos");
    });

    it("la banda de la cortina se pinta mientras dura y vuelve a ocultarse", async () => {
      curtain.ms = 400;
      renderWithLinks();
      let sawVisible = false;
      const observer = new MutationObserver(() => {
        if (curtainBand().style.visibility === "visible") sawVisible = true;
      });
      observer.observe(curtainBand(), { attributes: true, attributeFilter: ["style"] });

      fireEvent.click(screen.getByText("ir a dos"));

      await waitFor(() => expect(scrollTo).toHaveBeenCalled());
      await waitFor(() => expect(sawVisible).toBe(true));
      await waitFor(() => expect(curtainBand().style.visibility).toBe("hidden"), { timeout: 2000 });
      observer.disconnect();
    });

    it("dos clics seguidos a destinos LEJANOS: la cortina solo cambia de destino y se salta una vez, al ultimo", async () => {
      renderWithLinks();

      fireEvent.click(screen.getByText("ir a dos"));
      fireEvent.click(screen.getByText("ir a tres"));

      await waitFor(() => expect(scrollTo).toHaveBeenCalled());
      await act(() => new Promise<void>((resolve) => setTimeout(resolve, 120)));
      expect(scrollTo).toHaveBeenCalledTimes(1);
      expect(scrollTo).toHaveBeenCalledWith({ top: 3160, behavior: "auto" });
    });

    it("un salto DIRECTO posterior (a donde ya estas) anula el pendiente: lo ultimo manda", async () => {
      // "ir a uno" con la pista en el escenario 0: no hay cortina (nada que tapar), pero
      // el salto pendiente a "dos" no puede acabar ganando al ultimo clic.
      renderWithLinks();

      fireEvent.click(screen.getByText("ir a dos"));
      fireEvent.click(screen.getByText("ir a uno"));

      await waitFor(() => expect(scrollTo).toHaveBeenCalled());
      await act(() => new Promise<void>((resolve) => setTimeout(resolve, 120)));
      expect(scrollTo).toHaveBeenCalledTimes(1);
      expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: "auto" });
    });

    it("atras/adelante (hashchange) salta DIRECTO: el navegador ya repuso el scroll, taparlo no sirve", () => {
      // Con Atras/Adelante el navegador restaura el scroll de esa entrada ANTES de avisar,
      // asi que el usuario ya vio el salto. Una cortina despues solo anadiria un segundo
      // corte (verificado en Chrome). Solo los clics llevan cortina.
      renderWithLinks();

      window.history.replaceState(null, "", "#dos");
      fireEvent(window, new HashChangeEvent("hashchange"));

      expect(scrollTo).toHaveBeenCalledWith({ top: 1280, behavior: "auto" });
      expect(document.querySelector('[data-ink-band="jump"]')).toHaveStyle({ visibility: "hidden" });
    });

    it("saltar a donde YA estas no abre cortina: no hay nada que tapar", () => {
      renderWithLinks();

      fireEvent.click(screen.getByText("ir a uno")); // la pista esta en el escenario 0, scroll 0

      expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: "auto" });
    });

    it("al abrir la pagina con un hash el salto es DIRECTO: sin cortina al cargar", () => {
      window.history.replaceState(null, "", "#dos");

      renderWithLinks();

      expect(scrollTo).toHaveBeenCalledWith({ top: 1280, behavior: "auto" });
    });

    it("al desmontar con un salto en curso no hay scroll fantasma", async () => {
      const { unmount } = renderWithLinks();

      fireEvent.click(screen.getByText("ir a dos"));
      unmount();
      await act(() => new Promise<void>((resolve) => setTimeout(resolve, 120)));

      expect(scrollTo).not.toHaveBeenCalled();
    });
  });

  it("un clic en un ancla interna lleva la pista al inicio de ese escenario", async () => {
    renderWithLinks();

    const notCancelled = fireEvent.click(screen.getByText("ir a dos"));

    expect(notCancelled).toBe(false); // se hizo preventDefault: lo gestiona el sitio
    // El salto espera a que la cortina de tinta cubra la pantalla.
    await waitFor(() => expect(scrollTo).toHaveBeenCalledWith({ top: 1280, behavior: "auto" }));
  });

  it("deja la URL como la dejaria el navegador: hash actualizado", () => {
    renderWithLinks();

    fireEvent.click(screen.getByText("ir a dos"));

    expect(window.location.hash).toBe("#dos");
  });

  it("no toca las anclas que no son un escenario (el skip link a #contenido)", () => {
    renderWithLinks();

    const notCancelled = fireEvent.click(screen.getByText("saltar"));

    expect(notCancelled).toBe(true);
    expect(scrollTo).not.toHaveBeenCalled();
  });

  it("no toca los enlaces externos", () => {
    renderWithLinks();

    const notCancelled = fireEvent.click(screen.getByText("externo"));

    expect(notCancelled).toBe(true);
    expect(scrollTo).not.toHaveBeenCalled();
  });

  it("respeta Ctrl+clic: el usuario pide abrir en otra pestana", () => {
    renderWithLinks();

    const notCancelled = fireEvent.click(screen.getByText("ir a dos"), { ctrlKey: true });

    expect(notCancelled).toBe(true);
    expect(scrollTo).not.toHaveBeenCalled();
  });

  it("atras/adelante del navegador (hashchange) lleva al escenario del hash", () => {
    renderWithLinks();

    window.history.pushState(null, "", "#tres");
    act(() => {
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    });

    expect(scrollTo).toHaveBeenCalledWith({ top: 3160, behavior: "auto" });
  });

  it("un hash que no es un escenario no hace scroll", () => {
    renderWithLinks();

    window.history.pushState(null, "", "#nada");
    act(() => {
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    });

    expect(scrollTo).not.toHaveBeenCalled();
  });

  it("al abrir la pagina con un hash, coloca la pista en ese escenario", () => {
    window.history.replaceState(null, "", "#dos");

    renderWithLinks();

    expect(scrollTo).toHaveBeenCalledWith({ top: 1280, behavior: "auto" });
  });

  it("al abrir con un hash NO roba el foco: solo posiciona", async () => {
    const focusSpy = vi.spyOn(HTMLElement.prototype, "focus");
    window.history.replaceState(null, "", "#dos");

    renderWithLinks();
    setScrollY(1300);
    // Se da margen: si fuese a mover el foco, ya lo habria hecho tras unos frames.
    await act(() => new Promise<void>((resolve) => setTimeout(resolve, 120)));

    // Nadie debe haber llamado a focus() sobre nada. (Se espia la llamada y no se
    // mira solo document.activeElement: asi un fallo dice A QUIEN se enfoco.)
    const focused = focusSpy.mock.contexts.map(
      (element) => `${(element as HTMLElement).tagName}:${(element as HTMLElement).textContent}`,
    );
    expect(focused).toEqual([]);
  });

  it("sin hash, o con un hash desconocido, no hace scroll al abrir", () => {
    window.history.replaceState(null, "", "#nada");

    renderWithLinks();

    expect(scrollTo).not.toHaveBeenCalled();
  });

  it("al llegar por un salto, mueve el foco al titulo del escenario (guia focus-on-route-change)", async () => {
    renderWithLinks();

    fireEvent.click(screen.getByText("ir a dos"));
    setScrollY(1300); // el navegador entrega el scroll: el escenario 1 pasa a ser el activo

    const heading = screen.getByText("titulo dos");
    await waitFor(() => expect(heading).toHaveFocus());
    expect(heading).toHaveAttribute("tabindex", "-1");
  });

  it("si el unico titulo es sr-only y va DESPUES del contenido, el foco va a la seccion, no al final", async () => {
    // "Hablemos" y "Fin": enfocar ese h2 haria que revealFocused subiese el pan
    // hasta el final del escenario y el usuario llegaria sin ver su arranque.
    const stages = STAGES.map((stage, index) =>
      index === 2 ? { ...stage, node: <Scene id={stage.slug} height={HEIGHTS[2]} hiddenHeading /> } : stage,
    );
    render(
      <DeckProvider>
        <a href="#tres">ir a tres</a>
        <StageDeck stages={stages} />
      </DeckProvider>,
    );

    fireEvent.click(screen.getByText("ir a tres"));
    setScrollY(3170); // el escenario 2 pasa a ser el activo

    const section = document.getElementById("tres") as HTMLElement;
    await waitFor(() => expect(section).toHaveFocus());
    expect(section).toHaveAttribute("tabindex", "-1");
    expect(screen.getByText("titulo tres")).not.toHaveFocus();
  });

  it("si el escenario destino ya es el activo, el foco va al titulo", async () => {
    renderWithLinks();

    fireEvent.click(screen.getByText("ir a uno"));

    await waitFor(() => expect(screen.getByText("titulo uno")).toHaveFocus());
  });

  it("un foco pendiente CADUCA: si el salto no llega al escenario esperado, no roba el foco despues", async () => {
    // El scroll de prueba no se mueve: tras el clic el activo sigue siendo el 0 y
    // el foco para el escenario 1 queda pendiente. Si no caducase, un scroll
    // cualquiera del usuario, mucho despues, le moveria el foco al titulo.
    renderWithLinks();
    fireEvent.click(screen.getByText("ir a dos"));

    await act(() => new Promise<void>((resolve) => setTimeout(resolve, 250)));
    setScrollY(1300);
    await act(() => new Promise<void>((resolve) => setTimeout(resolve, 120)));

    expect(screen.getByText("titulo dos")).not.toHaveFocus();
  });

  it("reintenta el foco mientras la capa destino sigue con visibility:hidden (un elemento oculto no admite foco)", async () => {
    // Fallo visto en vivo: tras el salto la capa ya no es inert, pero conserva
    // visibility:hidden hasta el siguiente frame de Motion, y focus() sobre un
    // elemento oculto no hace nada. jsdom no lo comprueba, asi que se emula.
    const realFocus = HTMLElement.prototype.focus;
    let hiddenFor = 3; // los 3 primeros intentos caen con la capa aun oculta
    vi.spyOn(HTMLElement.prototype, "focus").mockImplementation(function (
      this: HTMLElement,
      options?: FocusOptions,
    ) {
      if (hiddenFor > 0) {
        hiddenFor -= 1;
        return;
      }
      realFocus.call(this, options);
    });
    renderWithLinks();

    fireEvent.click(screen.getByText("ir a dos"));
    setScrollY(1300);

    await waitFor(() => expect(screen.getByText("titulo dos")).toHaveFocus());
  });

  describe("restoreIndex (volver desde el modo lineal)", () => {
    function renderRestored(restoreIndex: number) {
      // Como un navegador real: el salto instantaneo mueve el scroll.
      scrollTo.mockImplementation(((options: ScrollToOptions) => {
        Object.defineProperty(window, "scrollY", { configurable: true, value: options.top });
      }) as never);
      return render(
        <DeckProvider>
          <StageDeck stages={STAGES} restoreIndex={restoreIndex} />
          <ActiveProbe />
        </DeckProvider>,
      );
    }

    it("coloca la pista en ese escenario y no mira el hash", () => {
      window.history.replaceState(null, "", "#uno");

      renderRestored(2);

      expect(scrollTo).toHaveBeenCalledTimes(1);
      expect(scrollTo).toHaveBeenCalledWith({ top: 3160, behavior: "auto" });
    });

    it("arranca YA en ese escenario y no pisa el activo compartido con 0", () => {
      // El arbol nuevo no puede escribir su escenario inicial (0) en el estado
      // compartido: eso hacia perder el sitio al volver desde el modo lineal.
      renderRestored(2);

      expect(document.querySelector("[data-stage-track]")).toHaveAttribute(
        "data-stage-active",
        "2",
      );
      expect(screen.getByTestId("activo")).toHaveTextContent("2");
    });

    it("no roba el foco: solo posiciona", async () => {
      renderRestored(2);
      await act(() => new Promise<void>((resolve) => setTimeout(resolve, 120)));

      expect(screen.getByText("titulo tres")).not.toHaveFocus();
    });
  });

  it("tras saltar sincroniza su posicion sin esperar al evento de scroll", async () => {
    // El navegador entrega el evento `scroll` un frame despues; sin sincronizar,
    // ese frame se pintaria con el escenario anterior (un parpadeo del escenario 0).
    // Este scrollTo de prueba NO dispara ningun `scroll`: si el escenario activo
    // cambia, es porque el salto sincronizo `scrollY` por su cuenta.
    scrollTo.mockImplementation(((options: ScrollToOptions) => {
      Object.defineProperty(window, "scrollY", { configurable: true, value: options.top });
    }) as never);
    renderWithLinks();

    fireEvent.click(screen.getByText("ir a dos"));

    await waitFor(() =>
      expect(document.querySelector("[data-stage-track]")).toHaveAttribute("data-stage-active", "1"),
    );
  });

  it("marca html[data-deck] ANTES de colocar la pista, para que el salto no sea suave", () => {
    let deckAtJump: string | undefined;
    scrollTo.mockImplementation((() => {
      deckAtJump = document.documentElement.dataset.deck;
    }) as never);
    window.history.replaceState(null, "", "#dos");

    renderWithLinks();

    expect(deckAtJump).toBe("on");
  });

  it("marca el documento mientras el deck esta montado (para desactivar el smooth scroll de CSS)", () => {
    const { unmount } = renderWithLinks();
    expect(document.documentElement.dataset.deck).toBe("on");

    unmount();

    expect(document.documentElement.dataset.deck).toBeUndefined();
  });

  it("al desmontar deja de interceptar clics", () => {
    const { unmount } = renderWithLinks();
    unmount();

    const link = document.createElement("a");
    link.setAttribute("href", "#dos");
    document.body.appendChild(link);
    const notCancelled = fireEvent.click(link);
    link.remove();

    expect(notCancelled).toBe(true);
  });
});
